import { PlantPhase, PlantEvent } from '../types/models';
import { differenceInDays, addDays, format } from 'date-fns';

export interface DynamicPhaseInfo {
  phase: PlantPhase;
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
  private phases: PlantPhase[];
  private currentDate: Date;

  constructor(phases: PlantPhase[], _events: PlantEvent[] = [], currentDate = new Date()) {
    this.phases = [...phases].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
    this.currentDate = currentDate;
  }

  get currentPhaseIndex(): number {
    for (let i = this.phases.length - 1; i >= 0; i--) {
      if (this.phases[i].startDate) return i;
    }
    return -1;
  }

  get currentPhase(): PlantPhase | null {
    const idx = this.currentPhaseIndex;
    return idx >= 0 ? this.phases[idx] : null;
  }

  get flatTimeline(): DynamicPhaseInfo[] {
    const firstStarted = this.phases.find(p => p.startDate);
    let estimatedDate = firstStarted?.startDate ? new Date(firstStarted.startDate) : this.currentDate;

    return this.phases.map((phase, index) => {
      const actualDate = phase.startDate ? new Date(phase.startDate) : null;
      const isCurrent = index === this.currentPhaseIndex;
      const isCompleted = index < this.currentPhaseIndex;
      const isFuture = index > this.currentPhaseIndex;

      if (index > 0) {
        estimatedDate = addDays(estimatedDate, this.phases[index - 1].durationMax);
      }

      const estimatedEndDate = addDays(actualDate || estimatedDate, phase.durationMax);

      let daysElapsed = 0;
      if (actualDate) {
        if (isCompleted) {
          const nextPhase = this.phases[index + 1];
          const endDate = nextPhase?.startDate ? new Date(nextPhase.startDate) : this.currentDate;
          daysElapsed = differenceInDays(endDate, actualDate) + 1;
        } else if (isCurrent) {
          daysElapsed = differenceInDays(this.currentDate, actualDate) + 1;
        }
      }

      const progress = actualDate && isCurrent
        ? Math.min((daysElapsed / phase.durationMax) * 100, 100)
        : isCompleted ? 100 : 0;

      return {
        phase,
        actualDate,
        estimatedDate: new Date(estimatedDate),
        estimatedEndDate,
        daysElapsed: actualDate ? daysElapsed : 0,
        isCurrent,
        isCompleted,
        isFuture,
        isOverdue: !!(actualDate && isCurrent && daysElapsed > phase.durationMax),
        progressPercentage: progress,
      };
    });
  }

  get totalProgress(): number {
    const timeline = this.flatTimeline;
    if (timeline.length === 0) return 0;
    const completed = timeline.filter(p => p.isCompleted).length;
    const current = timeline.find(p => p.isCurrent);
    const currentProgress = current ? current.progressPercentage / 100 : 0;
    return ((completed + currentProgress) / timeline.length) * 100;
  }

  getMinDateForPhase(phaseId: number): Date | null {
    const idx = this.phases.findIndex(p => p.id === phaseId);
    if (idx <= 0) return null;
    const prev = this.phases[idx - 1];
    return prev.startDate ? new Date(prev.startDate) : null;
  }

  getMaxDateForPhase(phaseId: number): Date | null {
    const idx = this.phases.findIndex(p => p.id === phaseId);
    if (idx < 0 || idx >= this.phases.length - 1) return null;
    const next = this.phases[idx + 1];
    return next.startDate ? new Date(next.startDate) : null;
  }

  validatePhaseDate(phaseId: number, newDate: Date): ValidationResult {
    const minDate = this.getMinDateForPhase(phaseId);
    const maxDate = this.getMaxDateForPhase(phaseId);

    if (minDate && newDate < minDate) {
      return { isValid: false, error: `Date cannot be earlier than ${format(minDate, 'dd/MM/yyyy')}` };
    }
    if (maxDate && newDate > maxDate) {
      return { isValid: false, error: `Date cannot be later than ${format(maxDate, 'dd/MM/yyyy')}` };
    }
    return { isValid: true };
  }

  canAdvanceToNextPhase(): boolean {
    const idx = this.currentPhaseIndex;
    if (idx < 0 || idx >= this.phases.length - 1) return false;
    const phase = this.phases[idx];
    if (!phase.startDate) return false;
    const daysElapsed = differenceInDays(this.currentDate, new Date(phase.startDate)) + 1;
    return daysElapsed >= phase.durationMin;
  }
}

export const createPlantTimeline = (
  phases: PlantPhase[],
  events: PlantEvent[] = [],
  currentDate = new Date()
): PlantTimeline => new PlantTimeline(phases, events, currentDate);
