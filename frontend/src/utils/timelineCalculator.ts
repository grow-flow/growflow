import { Plant, PlantPhase } from '../types/models';
import { 
  PlantPhaseDates, 
  StrainSchedule, 
  TimelinePhaseInfo, 
  DEFAULT_STRAIN_SCHEDULES,
  PHASE_LABELS,
  PHASE_DESCRIPTIONS
} from '../types/timeline';
import { differenceInDays, addDays } from 'date-fns';

export class TimelineCalculator {
  private plant: Plant;
  private schedule: StrainSchedule;
  private phaseDates: PlantPhaseDates;

  constructor(plant: Plant, customSchedule?: StrainSchedule) {
    this.plant = plant;
    this.schedule = customSchedule || this.getDefaultSchedule(plant.strain);
    this.phaseDates = this.extractPhaseDatesFromPlant(plant);
  }

  private getDefaultSchedule(strain: string): StrainSchedule {
    const strainType = this.determineStrainType(strain);
    return DEFAULT_STRAIN_SCHEDULES[strainType] || DEFAULT_STRAIN_SCHEDULES.hybrid;
  }

  private determineStrainType(strain: string): string {
    const lowerStrain = strain.toLowerCase();
    if (lowerStrain.includes('auto')) return 'autoflowering';
    if (lowerStrain.includes('indica')) return 'indica';
    if (lowerStrain.includes('sativa')) return 'sativa';
    return 'hybrid';
  }

  private extractPhaseDatesFromPlant(plant: Plant): PlantPhaseDates {
    return {
      [PlantPhase.GERMINATION]: plant.germination_date ? new Date(plant.germination_date) : null,
      [PlantPhase.SEEDLING]: plant.germination_date ? addDays(new Date(plant.germination_date), this.schedule.phaseDurations[PlantPhase.GERMINATION]) : null,
      [PlantPhase.VEGETATION]: plant.vegetation_start_date ? new Date(plant.vegetation_start_date) : null,
      [PlantPhase.PRE_FLOWER]: plant.vegetation_start_date ? addDays(new Date(plant.vegetation_start_date), this.schedule.phaseDurations[PlantPhase.VEGETATION]) : null,
      [PlantPhase.FLOWERING]: plant.flowering_start_date ? new Date(plant.flowering_start_date) : null,
      [PlantPhase.FLUSHING]: plant.flowering_start_date ? addDays(new Date(plant.flowering_start_date), this.schedule.phaseDurations[PlantPhase.FLOWERING]) : null,
      [PlantPhase.DRYING]: plant.drying_start_date ? new Date(plant.drying_start_date) : null,
      [PlantPhase.CURING]: plant.drying_start_date ? addDays(new Date(plant.drying_start_date), this.schedule.phaseDurations[PlantPhase.DRYING]) : null
    };
  }

  private calculateEstimatedDates(): PlantPhaseDates {
    const estimatedDates: PlantPhaseDates = {} as PlantPhaseDates;
    let currentDate = this.phaseDates[PlantPhase.GERMINATION] || new Date();

    const phases = Object.values(PlantPhase);
    for (const phase of phases) {
      estimatedDates[phase] = new Date(currentDate);
      currentDate = addDays(currentDate, this.schedule.phaseDurations[phase]);
    }

    return estimatedDates;
  }

  public generateTimeline(): TimelinePhaseInfo[] {
    const estimatedDates = this.calculateEstimatedDates();
    const phases = Object.values(PlantPhase);
    const timeline: TimelinePhaseInfo[] = [];
    const now = new Date();

    for (let i = 0; i < phases.length; i++) {
      const phase = phases[i];
      const nextPhase = phases[i + 1];
      
      const actualStartDate = this.phaseDates[phase];
      const actualEndDate = nextPhase ? this.phaseDates[nextPhase] : null;
      const estimatedStartDate = estimatedDates[phase];
      const estimatedEndDate = estimatedStartDate ? addDays(estimatedStartDate, this.schedule.phaseDurations[phase]) : null;
      
      const actualDuration = actualStartDate && actualEndDate 
        ? differenceInDays(actualEndDate, actualStartDate)
        : actualStartDate ? differenceInDays(now, actualStartDate) : null;

      const isActive = this.plant.current_phase === phase;
      const isCompleted = actualEndDate !== null || (actualStartDate !== null && differenceInDays(now, actualStartDate) > this.schedule.phaseDurations[phase]);
      const isPending = actualStartDate === null;
      const isOverdue = actualStartDate !== null && actualEndDate === null && differenceInDays(now, actualStartDate) > this.schedule.phaseDurations[phase] * 1.2;

      timeline.push({
        phase,
        label: PHASE_LABELS[phase],
        description: PHASE_DESCRIPTIONS[phase],
        actualStartDate,
        actualEndDate,
        estimatedStartDate,
        estimatedEndDate,
        estimatedDuration: this.schedule.phaseDurations[phase],
        actualDuration,
        isActive,
        isCompleted,
        isPending,
        isOverdue
      });
    }

    return timeline;
  }

  public getCurrentPhaseInfo(): TimelinePhaseInfo | null {
    const timeline = this.generateTimeline();
    return timeline.find(phase => phase.isActive) || null;
  }

  public getPhaseProgress(): number {
    const currentPhase = this.getCurrentPhaseInfo();
    if (!currentPhase || !currentPhase.actualStartDate) return 0;

    const daysInPhase = differenceInDays(new Date(), currentPhase.actualStartDate);
    return Math.min((daysInPhase / currentPhase.estimatedDuration) * 100, 100);
  }

  public getTotalProgress(): number {
    const timeline = this.generateTimeline();
    const completedPhases = timeline.filter(p => p.isCompleted).length;
    const currentPhaseProgress = this.getPhaseProgress() / 100;
    
    return ((completedPhases + currentPhaseProgress) / timeline.length) * 100;
  }

  public updatePhaseDate(phase: PlantPhase, date: Date): PlantPhaseDates {
    const updatedDates = { ...this.phaseDates };
    updatedDates[phase] = date;
    
    // Auto-update dependent phases if schedule allows
    if (this.schedule.autoTransitions) {
      this.updateDependentPhases(updatedDates, phase, date);
    }
    
    return updatedDates;
  }

  private updateDependentPhases(dates: PlantPhaseDates, changedPhase: PlantPhase, newDate: Date) {
    const phases = Object.values(PlantPhase);
    const phaseIndex = phases.indexOf(changedPhase);
    
    // Update subsequent phases based on estimated durations
    for (let i = phaseIndex + 1; i < phases.length; i++) {
      const prevPhase = phases[i - 1];
      const currentPhase = phases[i];
      
      const prevDate = dates[prevPhase];
      if (prevDate) {
        dates[currentPhase] = addDays(prevDate, this.schedule.phaseDurations[prevPhase]);
      }
    }
  }

  public getSchedule(): StrainSchedule {
    return this.schedule;
  }

  public updateSchedule(newSchedule: StrainSchedule) {
    this.schedule = newSchedule;
    this.phaseDates = this.extractPhaseDatesFromPlant(this.plant);
  }
}