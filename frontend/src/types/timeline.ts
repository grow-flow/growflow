import { PlantPhase } from './models';

export interface PlantPhaseDates {
  [PlantPhase.GERMINATION]: Date | null;
  [PlantPhase.SEEDLING]: Date | null;
  [PlantPhase.VEGETATION]: Date | null;
  [PlantPhase.PRE_FLOWER]: Date | null;
  [PlantPhase.FLOWERING]: Date | null;
  [PlantPhase.FLUSHING]: Date | null;
  [PlantPhase.DRYING]: Date | null;
  [PlantPhase.CURING]: Date | null;
}

export interface StrainSchedule {
  name: string;
  phaseDurations: {
    [PlantPhase.GERMINATION]: number; // days
    [PlantPhase.SEEDLING]: number;
    [PlantPhase.VEGETATION]: number;
    [PlantPhase.PRE_FLOWER]: number;
    [PlantPhase.FLOWERING]: number;
    [PlantPhase.FLUSHING]: number;
    [PlantPhase.DRYING]: number;
    [PlantPhase.CURING]: number;
  };
  autoTransitions: boolean;
}

export interface TimelinePhaseInfo {
  phase: PlantPhase;
  label: string;
  description: string;
  actualStartDate: Date | null;
  actualEndDate: Date | null;
  estimatedStartDate: Date | null;
  estimatedEndDate: Date | null;
  estimatedDuration: number;
  actualDuration: number | null;
  isActive: boolean;
  isCompleted: boolean;
  isPending: boolean;
  isOverdue: boolean;
}

export const DEFAULT_STRAIN_SCHEDULES: Record<string, StrainSchedule> = {
  indica: {
    name: 'Indica',
    phaseDurations: {
      [PlantPhase.GERMINATION]: 7,
      [PlantPhase.SEEDLING]: 14,
      [PlantPhase.VEGETATION]: 35,
      [PlantPhase.PRE_FLOWER]: 7,
      [PlantPhase.FLOWERING]: 56,
      [PlantPhase.FLUSHING]: 14,
      [PlantPhase.DRYING]: 10,
      [PlantPhase.CURING]: 28
    },
    autoTransitions: true
  },
  sativa: {
    name: 'Sativa',
    phaseDurations: {
      [PlantPhase.GERMINATION]: 7,
      [PlantPhase.SEEDLING]: 14,
      [PlantPhase.VEGETATION]: 49,
      [PlantPhase.PRE_FLOWER]: 14,
      [PlantPhase.FLOWERING]: 70,
      [PlantPhase.FLUSHING]: 14,
      [PlantPhase.DRYING]: 10,
      [PlantPhase.CURING]: 28
    },
    autoTransitions: true
  },
  hybrid: {
    name: 'Hybrid',
    phaseDurations: {
      [PlantPhase.GERMINATION]: 7,
      [PlantPhase.SEEDLING]: 14,
      [PlantPhase.VEGETATION]: 42,
      [PlantPhase.PRE_FLOWER]: 10,
      [PlantPhase.FLOWERING]: 63,
      [PlantPhase.FLUSHING]: 14,
      [PlantPhase.DRYING]: 10,
      [PlantPhase.CURING]: 28
    },
    autoTransitions: true
  },
  autoflowering: {
    name: 'Autoflowering',
    phaseDurations: {
      [PlantPhase.GERMINATION]: 7,
      [PlantPhase.SEEDLING]: 14,
      [PlantPhase.VEGETATION]: 21,
      [PlantPhase.PRE_FLOWER]: 7,
      [PlantPhase.FLOWERING]: 42,
      [PlantPhase.FLUSHING]: 7,
      [PlantPhase.DRYING]: 10,
      [PlantPhase.CURING]: 28
    },
    autoTransitions: true
  }
};

export const PHASE_LABELS: Record<PlantPhase, string> = {
  [PlantPhase.GERMINATION]: 'Germination',
  [PlantPhase.SEEDLING]: 'Seedling',
  [PlantPhase.VEGETATION]: 'Vegetation',
  [PlantPhase.PRE_FLOWER]: 'Pre-Flower',
  [PlantPhase.FLOWERING]: 'Flowering',
  [PlantPhase.FLUSHING]: 'Flushing',
  [PlantPhase.DRYING]: 'Drying (Harvest)',
  [PlantPhase.CURING]: 'Curing'
};

export const PHASE_DESCRIPTIONS: Record<PlantPhase, string> = {
  [PlantPhase.GERMINATION]: 'Seeds are sprouting and developing first roots.',
  [PlantPhase.SEEDLING]: 'First leaves are developing, plant is establishing.',
  [PlantPhase.VEGETATION]: 'Rapid growth phase, developing strong structure.',
  [PlantPhase.PRE_FLOWER]: 'Transition phase, showing first signs of flowering.',
  [PlantPhase.FLOWERING]: 'Producing buds, main flowering period.',
  [PlantPhase.FLUSHING]: 'Final weeks, removing nutrients for better taste.',
  [PlantPhase.DRYING]: 'Harvested and drying buds in controlled environment.',
  [PlantPhase.CURING]: 'Final curing process for optimal quality.'
};