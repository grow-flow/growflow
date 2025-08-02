import { PlantPhaseInstance, PlantEvent } from '../types/models';
import { differenceInDays, addDays, format } from 'date-fns';

export interface DynamicPhaseInfo {
  phase: PlantPhaseInstance;
  actualDate: Date | null;
  estimatedDate: Date | null;
  estimatedEndDate: Date | null;
  daysElapsed: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isFuture: boolean;
  isOverdue: boolean;
  progressPercentage: number;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export class PlantTimeline {
  private phases: PlantPhaseInstance[];
  private currentDate: Date;
  private events: PlantEvent[];

  constructor(phases: PlantPhaseInstance[], events: PlantEvent[] = [], currentDate = new Date()) {
    this.phases = [...phases]; // Create a copy to avoid mutations
    this.events = [...events];
    this.currentDate = currentDate;
  }

  // Computed Properties
  get currentPhaseIndex(): number {
    let lastStartedIndex = -1;
    
    for (let i = 0; i < this.phases.length; i++) {
      if (this.phases[i].start_date) {
        lastStartedIndex = i;
      }
    }
    
    return lastStartedIndex;
  }

  get currentPhase(): PlantPhaseInstance | null {
    const index = this.currentPhaseIndex;
    return index >= 0 ? this.phases[index] : null;
  }

  get timeline(): DynamicPhaseInfo[] {
    // Find the first phase with a start date to calculate estimated dates
    const firstStartedPhase = this.phases.find(phase => phase.start_date);
    let estimatedDate = firstStartedPhase?.start_date ? new Date(firstStartedPhase.start_date) : this.currentDate;
    
    return this.phases.map((phase, index) => {
      const actualDate = phase.start_date ? new Date(phase.start_date) : null;
      const isCurrent = index === this.currentPhaseIndex;
      const isCompleted = this.isPhaseCompleted(index);
      const isFuture = this.isPhaseFuture(index);
      
      // Calculate estimated dates
      if (index > 0) {
        const prevPhase = this.phases[index - 1];
        estimatedDate = addDays(estimatedDate, prevPhase.duration_max);
      }
      
      const estimatedEndDate = addDays(estimatedDate, phase.duration_max);
      
      // Calculate days elapsed
      let daysElapsed = 0;
      if (actualDate) {
        if (isCompleted) {
          // For completed phases, calculate from start to next phase start or now
          const nextPhase = this.phases[index + 1];
          const endDate = nextPhase?.start_date ? new Date(nextPhase.start_date) : this.currentDate;
          daysElapsed = differenceInDays(endDate, actualDate);
        } else if (isCurrent) {
          // For current phase, calculate from start to now
          daysElapsed = differenceInDays(this.currentDate, actualDate);
        }
      }
      
      const isOverdue = actualDate && isCurrent && daysElapsed > phase.duration_max;
      const progressPercentage = actualDate && isCurrent 
        ? Math.min((daysElapsed / phase.duration_max) * 100, 100) 
        : isCompleted ? 100 : 0;
      
      return {
        phase,
        actualDate,
        estimatedDate: new Date(estimatedDate),
        estimatedEndDate,
        daysElapsed,
        isCurrent,
        isCompleted,
        isFuture,
        isOverdue: !!isOverdue,
        progressPercentage
      };
    });
  }

  get totalProgress(): number {
    const timeline = this.timeline;
    const completedPhases = timeline.filter(p => p.isCompleted).length;
    const currentPhase = timeline.find(p => p.isCurrent);
    const currentProgress = currentPhase ? currentPhase.progressPercentage / 100 : 0;
    
    return ((completedPhases + currentProgress) / timeline.length) * 100;
  }

  get daysUntilHarvest(): number | null {
    const timeline = this.timeline;
    const floweringPhaseIndex = timeline.findIndex(phase => 
      phase.phase.name.toLowerCase() === 'flowering'
    );
    
    if (floweringPhaseIndex === -1) return null;
    
    const floweringPhase = timeline[floweringPhaseIndex];
    // Use current time for accurate calculation
    const now = new Date();
    const daysUntil = differenceInDays(floweringPhase.estimatedEndDate!, now);
    return Math.max(0, daysUntil);
  }

  get daysUntilNextPhase(): number | null {
    const currentPhase = this.timeline.find(p => p.isCurrent);
    if (!currentPhase || !currentPhase.actualDate) return null;
    
    // Calculate days elapsed using current time, not cached time
    const now = new Date();
    const daysSinceStart = differenceInDays(now, currentPhase.actualDate);
    const minDuration = currentPhase.phase.duration_min;
    const daysUntilEligible = Math.max(0, minDuration - daysSinceStart);
    
    return daysUntilEligible;
  }

  // Phase State Methods
  isPhaseCompleted(phaseIndex: number): boolean {
    return phaseIndex < this.currentPhaseIndex;
  }

  isPhaseActive(phaseIndex: number): boolean {
    return phaseIndex === this.currentPhaseIndex;
  }

  isPhaseFuture(phaseIndex: number): boolean {
    return phaseIndex > this.currentPhaseIndex;
  }

  isPhaseOverdue(phaseIndex: number): boolean {
    const phase = this.phases[phaseIndex];
    if (!phase.start_date || !this.isPhaseActive(phaseIndex)) return false;
    
    const startDate = new Date(phase.start_date);
    const daysElapsed = differenceInDays(this.currentDate, startDate);
    return daysElapsed > phase.duration_max;
  }

  isPhaseReadyForNext(phaseIndex: number): boolean {
    const phase = this.phases[phaseIndex];
    if (!phase.start_date || !this.isPhaseActive(phaseIndex)) return false;
    
    const startDate = new Date(phase.start_date);
    const daysElapsed = differenceInDays(this.currentDate, startDate);
    return daysElapsed >= phase.duration_min;
  }

  // Date Validation Methods
  getMinDateForPhase(phaseIndex: number): Date | null {
    if (phaseIndex === 0) return null; // First phase has no minimum date
    
    const previousPhase = this.phases[phaseIndex - 1];
    return previousPhase.start_date ? new Date(previousPhase.start_date) : null;
  }

  getMaxDateForPhase(phaseIndex: number): Date | null {
    if (phaseIndex >= this.phases.length - 1) return null; // Last phase has no maximum date
    
    const nextPhase = this.phases[phaseIndex + 1];
    return nextPhase.start_date ? new Date(nextPhase.start_date) : null;
  }

  validatePhaseDate(phaseIndex: number, newDate: Date): ValidationResult {
    const minDate = this.getMinDateForPhase(phaseIndex);
    const maxDate = this.getMaxDateForPhase(phaseIndex);
    
    if (minDate && newDate < minDate) {
      return {
        isValid: false,
        error: `Date cannot be earlier than previous phase start date (${format(minDate, 'dd/MM/yyyy')})`
      };
    }
    
    if (maxDate && newDate > maxDate) {
      return {
        isValid: false,
        error: `Date cannot be later than next phase start date (${format(maxDate, 'dd/MM/yyyy')})`
      };
    }
    
    return { isValid: true };
  }

  // Timeline Manipulation Methods
  updatePhaseStartDate(phaseId: string, date: Date | null): PlantTimeline {
    const updatedPhases = this.phases.map(phase => 
      phase.id === phaseId 
        ? { ...phase, start_date: date?.toISOString() || undefined }
        : phase
    );
    
    return new PlantTimeline(updatedPhases, this.events, this.currentDate);
  }

  canAdvanceToNextPhase(): boolean {
    const currentIndex = this.currentPhaseIndex;
    return currentIndex >= 0 && 
           currentIndex < this.phases.length - 1 && 
           this.isPhaseReadyForNext(currentIndex);
  }

  getNextAdvanceablePhase(): PlantPhaseInstance | null {
    const currentIndex = this.currentPhaseIndex;
    return this.canAdvanceToNextPhase() ? this.phases[currentIndex + 1] : null;
  }

  // Utility Methods
  getPhaseById(phaseId: string): PlantPhaseInstance | null {
    return this.phases.find(phase => phase.id === phaseId) || null;
  }

  getPhaseIndex(phaseId: string): number {
    return this.phases.findIndex(phase => phase.id === phaseId);
  }

  formatPhaseDate(date: Date | null): string {
    if (!date) return 'Not started';
    return format(date, 'dd/MM/yy');
  }

  getPhaseEvents(phaseId: string): PlantEvent[] {
    return this.events.filter(event => event.phase_id === phaseId);
  }

  getDaysSinceLastEvent(phaseId: string, eventType: PlantEvent['type']): number | null {
    const phaseEvents = this.getPhaseEvents(phaseId);
    const eventsOfType = phaseEvents.filter(event => event.type === eventType);
    
    if (eventsOfType.length === 0) return null;

    const lastEvent = eventsOfType.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )[0];

    const daysDiff = Math.floor(
      (this.currentDate.getTime() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysDiff;
  }
}

// Factory function for easy instantiation
export const createPlantTimeline = (
  phases: PlantPhaseInstance[], 
  events: PlantEvent[] = [], 
  currentDate = new Date()
): PlantTimeline => {
  return new PlantTimeline(phases, events, currentDate);
};

// Helper functions for backward compatibility
export const getEventIcon = (type: PlantEvent['type']): string => {
  const icons = {
    watering: '💧',
    feeding: '🌱',
    observation: '👁️',
    training: '✂️',
    harvest: '🌾',
    transplant: '🪴',
    custom: '📝'
  };
  return icons[type] || '📝';
};

export const getEventColor = (type: PlantEvent['type']): string => {
  const colors = {
    watering: '#2196F3',
    feeding: '#4CAF50',
    observation: '#FF9800',
    training: '#9C27B0',
    harvest: '#795548',
    transplant: '#607D8B',
    custom: '#616161'
  };
  return colors[type] || '#616161';
};