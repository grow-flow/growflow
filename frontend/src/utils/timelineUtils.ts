import { Plant, PlantPhase } from '../types/models';
import { addDays, differenceInDays } from 'date-fns';
import { DEFAULT_STRAIN_SCHEDULES } from '../types/timeline';

export interface PhaseInfo {
  phase: PlantPhase;
  label: string;
  actualDate: Date | null;
  estimatedDate: Date | null;
  duration: number;
  daysElapsed: number;
  isCurrent: boolean;
  isCompleted: boolean;
  isOverdue: boolean;
}

export const PHASE_ORDER = [
  PlantPhase.GERMINATION,
  PlantPhase.SEEDLING,
  PlantPhase.VEGETATION,
  PlantPhase.PRE_FLOWER,
  PlantPhase.FLOWERING,
  PlantPhase.FLUSHING,
  PlantPhase.DRYING,
  PlantPhase.CURING
];

const PHASE_LABELS = {
  [PlantPhase.GERMINATION]: 'Germination',
  [PlantPhase.SEEDLING]: 'Seedling',
  [PlantPhase.VEGETATION]: 'Vegetation',
  [PlantPhase.PRE_FLOWER]: 'Pre-Flower',
  [PlantPhase.FLOWERING]: 'Flowering',
  [PlantPhase.FLUSHING]: 'Flushing',
  [PlantPhase.DRYING]: 'Drying (Harvest)',
  [PlantPhase.CURING]: 'Curing'
};

export const getPhaseDate = (plant: Plant, phase: PlantPhase): Date | null => {
  switch (phase) {
    case PlantPhase.GERMINATION:
      return plant.germination_date ? new Date(plant.germination_date) : null;
    case PlantPhase.SEEDLING:
      return plant.seedling_start_date ? new Date(plant.seedling_start_date) : null;
    case PlantPhase.VEGETATION:
      return plant.vegetation_start_date ? new Date(plant.vegetation_start_date) : null;
    case PlantPhase.PRE_FLOWER:
      return plant.pre_flower_start_date ? new Date(plant.pre_flower_start_date) : null;
    case PlantPhase.FLOWERING:
      return plant.flowering_start_date ? new Date(plant.flowering_start_date) : null;
    case PlantPhase.FLUSHING:
      return plant.flushing_start_date ? new Date(plant.flushing_start_date) : null;
    case PlantPhase.DRYING:
      return plant.drying_start_date ? new Date(plant.drying_start_date) : null;
    case PlantPhase.CURING:
      return plant.curing_start_date ? new Date(plant.curing_start_date) : null;
    default:
      return null;
  }
};

export const getCurrentPhase = (plant: Plant): PlantPhase => {
  for (let i = PHASE_ORDER.length - 1; i >= 0; i--) {
    if (getPhaseDate(plant, PHASE_ORDER[i])) {
      return PHASE_ORDER[i];
    }
  }
  return PlantPhase.GERMINATION;
};

export const getStrainSchedule = (strain: string) => {
  const lowerStrain = strain.toLowerCase();
  if (lowerStrain.includes('auto')) return DEFAULT_STRAIN_SCHEDULES.autoflowering;
  if (lowerStrain.includes('indica')) return DEFAULT_STRAIN_SCHEDULES.indica;
  if (lowerStrain.includes('sativa')) return DEFAULT_STRAIN_SCHEDULES.sativa;
  return DEFAULT_STRAIN_SCHEDULES.hybrid;
};

export const generateTimeline = (plant: Plant): PhaseInfo[] => {
  const schedule = getStrainSchedule(plant.strain);
  const currentPhase = getCurrentPhase(plant);
  const now = new Date();
  
  // Calculate estimated dates from germination
  const germinationDate = getPhaseDate(plant, PlantPhase.GERMINATION) || now;
  let estimatedDate = new Date(germinationDate);
  
  return PHASE_ORDER.map((phase, index) => {
    const actualDate = getPhaseDate(plant, phase);
    const duration = schedule.phaseDurations[phase];
    const isCurrent = currentPhase === phase;
    const isCompleted = index < PHASE_ORDER.indexOf(currentPhase);
    
    // Calculate estimated date for this phase
    if (index > 0) {
      const prevPhase = PHASE_ORDER[index - 1];
      const prevDuration = schedule.phaseDurations[prevPhase];
      estimatedDate = addDays(estimatedDate, prevDuration);
    }
    
    // Calculate actual days elapsed
    let daysElapsed = 0;
    if (actualDate) {
      if (isCompleted) {
        // For completed phases, calculate from start of this phase to start of next phase
        const nextPhase = PHASE_ORDER[index + 1];
        const nextPhaseDate = nextPhase ? getPhaseDate(plant, nextPhase) : null;
        if (nextPhaseDate) {
          daysElapsed = differenceInDays(nextPhaseDate, actualDate);
        } else {
          // If no next phase date, use current time
          daysElapsed = differenceInDays(now, actualDate);
        }
      } else {
        // For current phase, calculate from start to now
        daysElapsed = differenceInDays(now, actualDate);
      }
    }
    
    const isOverdue = actualDate && daysElapsed > duration * 1.2;
    
    return {
      phase,
      label: PHASE_LABELS[phase],
      actualDate,
      estimatedDate: new Date(estimatedDate),
      duration,
      daysElapsed,
      isCurrent,
      isCompleted,
      isOverdue: !!isOverdue
    };
  });
};

export const getUpdateFieldForPhase = (phase: PlantPhase): keyof Plant => {
  switch (phase) {
    case PlantPhase.GERMINATION:
      return 'germination_date';
    case PlantPhase.SEEDLING:
      return 'seedling_start_date';
    case PlantPhase.VEGETATION:
      return 'vegetation_start_date';
    case PlantPhase.PRE_FLOWER:
      return 'pre_flower_start_date';
    case PlantPhase.FLOWERING:
      return 'flowering_start_date';
    case PlantPhase.FLUSHING:
      return 'flushing_start_date';
    case PlantPhase.DRYING:
      return 'drying_start_date';
    case PlantPhase.CURING:
      return 'curing_start_date';
    default:
      return 'germination_date';
  }
};

export const getNextPhase = (currentPhase: PlantPhase): PlantPhase | null => {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  return currentIndex < PHASE_ORDER.length - 1 ? PHASE_ORDER[currentIndex + 1] : null;
};

export const isPhaseReadyForNext = (phaseInfo: PhaseInfo): boolean => {
  return !!(phaseInfo.actualDate && phaseInfo.daysElapsed >= phaseInfo.duration);
};