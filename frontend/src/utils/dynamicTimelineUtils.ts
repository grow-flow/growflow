import { Plant, PlantPhaseInstance, PlantEvent } from '../types/models';
import { differenceInDays, addDays, format } from 'date-fns';

export interface DynamicPhaseInfo {
  phase: PlantPhaseInstance;
  actualDate: Date | null;
  estimatedDate: Date | null;
  estimatedEndDate: Date | null;
  duration: number;
  daysElapsed: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isOverdue: boolean;
  progressPercentage: number;
}

export const getCurrentPhase = (plant: Plant): PlantPhaseInstance | null => {
  return plant.phases.find(phase => phase.is_active) || null;
};

export const getNextPhase = (plant: Plant): PlantPhaseInstance | null => {
  const currentIndex = plant.phases.findIndex(phase => phase.is_active);
  return currentIndex >= 0 && currentIndex < plant.phases.length - 1 
    ? plant.phases[currentIndex + 1] 
    : null;
};

export const generateDynamicTimeline = (plant: Plant): DynamicPhaseInfo[] => {
  const now = new Date();
  
  // Find the first phase with a start date to calculate estimated dates
  const firstStartedPhase = plant.phases.find(phase => phase.start_date);
  let estimatedDate = firstStartedPhase?.start_date ? new Date(firstStartedPhase.start_date) : now;
  
  return plant.phases.map((phase, index) => {
    const actualDate = phase.start_date ? new Date(phase.start_date) : null;
    const isCurrent = phase.is_active;
    const isCompleted = phase.is_completed;
    
    // Calculate estimated dates
    if (index > 0) {
      const prevPhase = plant.phases[index - 1];
      estimatedDate = addDays(estimatedDate, prevPhase.duration_max);
    }
    
    const estimatedEndDate = addDays(estimatedDate, phase.duration_max);
    const duration = Math.round((phase.duration_min + phase.duration_max) / 2);
    
    // Calculate days elapsed
    let daysElapsed = 0;
    if (actualDate) {
      if (isCompleted) {
        // For completed phases, calculate from start to next phase start or now
        const nextPhase = plant.phases[index + 1];
        const endDate = nextPhase?.start_date ? new Date(nextPhase.start_date) : now;
        daysElapsed = differenceInDays(endDate, actualDate);
      } else if (isCurrent) {
        // For current phase, calculate from start to now
        daysElapsed = differenceInDays(now, actualDate);
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
      duration: phase.duration_max,
      daysElapsed,
      isCurrent,
      isCompleted,
      isOverdue: !!isOverdue,
      progressPercentage
    };
  });
};

export const isPhaseReadyForNext = (phaseInfo: DynamicPhaseInfo): boolean => {
  return !!(phaseInfo.actualDate && phaseInfo.daysElapsed >= phaseInfo.phase.duration_min);
};

export const calculateTotalProgress = (timeline: DynamicPhaseInfo[]): number => {
  const completedPhases = timeline.filter(p => p.isCompleted).length;
  const currentPhase = timeline.find(p => p.isCurrent);
  const currentProgress = currentPhase ? currentPhase.progressPercentage / 100 : 0;
  
  return ((completedPhases + currentProgress) / timeline.length) * 100;
};

export const getEstimatedHarvestDate = (timeline: DynamicPhaseInfo[]): Date | null => {
  const harvestPhaseIndex = timeline.findIndex(phase => 
    phase.phase.name.toLowerCase().includes('flush') || 
    (phase.phase.name.toLowerCase().includes('flower') && !phase.phase.name.toLowerCase().includes('pre'))
  );
  
  if (harvestPhaseIndex === -1) return null;
  
  const harvestPhase = timeline[harvestPhaseIndex];
  return harvestPhase.estimatedEndDate;
};

export const getDaysUntilHarvest = (timeline: DynamicPhaseInfo[]): number | null => {
  const harvestDate = getEstimatedHarvestDate(timeline);
  if (!harvestDate) return null;
  
  const now = new Date();
  const daysUntil = differenceInDays(harvestDate, now);
  return Math.max(0, daysUntil);
};

export const getDaysUntilNextPhase = (timeline: DynamicPhaseInfo[]): number | null => {
  const currentPhase = timeline.find(p => p.isCurrent);
  if (!currentPhase || !currentPhase.actualDate) return null;
  
  const daysSinceStart = currentPhase.daysElapsed;
  const minDuration = currentPhase.phase.duration_min;
  const daysUntilEligible = Math.max(0, minDuration - daysSinceStart);
  
  return daysUntilEligible;
};

export const formatPhaseDate = (date: Date | null): string => {
  if (!date) return 'Not started';
  return format(date, 'dd/MM/yy');
};

export const getPhaseEvents = (
  phase: PlantPhaseInstance,
  allEvents: PlantEvent[] = []
): PlantEvent[] => {
  return allEvents.filter(event => event.phase_id === phase.id);
};

export const getEventsInDateRange = (
  events: PlantEvent[],
  startDate: Date,
  endDate: Date
): PlantEvent[] => {
  return events.filter(event => {
    const eventDate = new Date(event.timestamp);
    return eventDate >= startDate && eventDate <= endDate;
  });
};

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

export const getDaysSinceLastEvent = (
  events: PlantEvent[],
  type: PlantEvent['type']
): number | null => {
  const eventsOfType = events.filter(event => event.type === type);
  if (eventsOfType.length === 0) return null;

  const lastEvent = eventsOfType.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  )[0];

  const daysDiff = Math.floor(
    (Date.now() - new Date(lastEvent.timestamp).getTime()) / (1000 * 60 * 60 * 24)
  );
  return daysDiff;
};