import { Plant, PlantPhase } from '../types/models';
import { Strain } from '../types/strain';
import { addDays, differenceInDays } from 'date-fns';

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
  const now = new Date();
  
  // Find the latest phase that has started (actual date is set and <= today)
  for (let i = PHASE_ORDER.length - 1; i >= 0; i--) {
    const phaseDate = getPhaseDate(plant, PHASE_ORDER[i]);
    if (phaseDate && phaseDate <= now) {
      return PHASE_ORDER[i];
    }
  }
  return PlantPhase.GERMINATION;
};

export const validatePhaseDate = (date: Date | null, phase: PlantPhase, plant: Plant): { isValid: boolean; error?: string } => {
  if (!date) return { isValid: true }; // null dates are allowed (clearing dates)
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  
  // No future dates allowed
  if (dateOnly > today) {
    return { isValid: false, error: 'Future dates are not allowed' };
  }
  
  // Check phase order - later phases can't be before earlier phases
  const phaseIndex = PHASE_ORDER.indexOf(phase);
  for (let i = 0; i < phaseIndex; i++) {
    const earlierPhaseDate = getPhaseDate(plant, PHASE_ORDER[i]);
    if (earlierPhaseDate && dateOnly < new Date(earlierPhaseDate.getFullYear(), earlierPhaseDate.getMonth(), earlierPhaseDate.getDate())) {
      return { isValid: false, error: `Date cannot be before ${PHASE_LABELS[PHASE_ORDER[i]]} phase` };
    }
  }
  
  return { isValid: true };
};

export const getStrainSchedule = (strain: Strain | null) => {
  if (!strain) {
    // Fallback to default hybrid schedule if no strain data
    return {
      [PlantPhase.GERMINATION]: 7,
      [PlantPhase.SEEDLING]: 14,
      [PlantPhase.VEGETATION]: 42,
      [PlantPhase.PRE_FLOWER]: 10,
      [PlantPhase.FLOWERING]: 63,
      [PlantPhase.FLUSHING]: 14,
      [PlantPhase.DRYING]: 10,
      [PlantPhase.CURING]: 28
    };
  }
  
  // Convert string keys back to enum keys for timeline calculation
  return {
    [PlantPhase.GERMINATION]: strain.phase_durations['germination'] || 7,
    [PlantPhase.SEEDLING]: strain.phase_durations['seedling'] || 14,
    [PlantPhase.VEGETATION]: strain.phase_durations['vegetation'] || 42,
    [PlantPhase.PRE_FLOWER]: strain.phase_durations['pre_flower'] || 10,
    [PlantPhase.FLOWERING]: strain.phase_durations['flowering'] || 63,
    [PlantPhase.FLUSHING]: strain.phase_durations['flushing'] || 14,
    [PlantPhase.DRYING]: strain.phase_durations['drying'] || 10,
    [PlantPhase.CURING]: strain.phase_durations['curing'] || 28
  };
};

export const generateTimeline = (plant: Plant, strain?: Strain | null): PhaseInfo[] => {
  const schedule = getStrainSchedule(strain || null);
  const currentPhase = getCurrentPhase(plant);
  const now = new Date();
  
  // Calculate estimated dates from germination
  const germinationDate = getPhaseDate(plant, PlantPhase.GERMINATION) || now;
  let estimatedDate = new Date(germinationDate);
  
  return PHASE_ORDER.map((phase, index) => {
    const actualDate = getPhaseDate(plant, phase);
    const duration = schedule[phase];
    const isCurrent = currentPhase === phase;
    const isCompleted = index < PHASE_ORDER.indexOf(currentPhase);
    
    // Calculate estimated date for this phase
    if (index > 0) {
      const prevPhase = PHASE_ORDER[index - 1];
      const prevDuration = schedule[prevPhase];
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