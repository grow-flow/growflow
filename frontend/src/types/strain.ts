import { PlantPhase } from './models';

export interface Strain {
  id: number;
  name: string;
  abbreviation?: string; // max 4 chars for short labels like "WW", "GG", "AK"
  type: 'indica' | 'sativa' | 'hybrid' | 'autoflowering';
  is_autoflower: boolean;
  flowering_time_min: number; // days
  flowering_time_max: number; // days
  description?: string;
  breeder?: string;
  thc_content?: number; // percentage
  cbd_content?: number; // percentage
  created_at: Date;
  updated_at: Date;
  
  // Phase schedule  
  phase_durations: {
    [key: string]: number;
  };
}

export interface CreateStrainData {
  name: string;
  abbreviation?: string;
  type: 'indica' | 'sativa' | 'hybrid' | 'autoflowering';
  is_autoflower: boolean;
  flowering_time_min: number;
  flowering_time_max: number;
  description?: string;
  breeder?: string;
  thc_content?: number;
  cbd_content?: number;
  phase_durations?: Partial<Strain['phase_durations']>;
}

export interface UpdateStrainData extends Partial<CreateStrainData> {
  id: number;
}

export const DEFAULT_PHASE_DURATIONS = {
  indica: {
    [PlantPhase.GERMINATION]: 7,
    [PlantPhase.SEEDLING]: 14,
    [PlantPhase.VEGETATION]: 35,
    [PlantPhase.PRE_FLOWER]: 7,
    [PlantPhase.FLOWERING]: 56,
    [PlantPhase.FLUSHING]: 14,
    [PlantPhase.DRYING]: 10,
    [PlantPhase.CURING]: 28
  },
  sativa: {
    [PlantPhase.GERMINATION]: 7,
    [PlantPhase.SEEDLING]: 14,
    [PlantPhase.VEGETATION]: 49,
    [PlantPhase.PRE_FLOWER]: 14,
    [PlantPhase.FLOWERING]: 70,
    [PlantPhase.FLUSHING]: 14,
    [PlantPhase.DRYING]: 10,
    [PlantPhase.CURING]: 28
  },
  hybrid: {
    [PlantPhase.GERMINATION]: 7,
    [PlantPhase.SEEDLING]: 14,
    [PlantPhase.VEGETATION]: 42,
    [PlantPhase.PRE_FLOWER]: 10,
    [PlantPhase.FLOWERING]: 63,
    [PlantPhase.FLUSHING]: 14,
    [PlantPhase.DRYING]: 10,
    [PlantPhase.CURING]: 28
  },
  autoflowering: {
    [PlantPhase.GERMINATION]: 7,
    [PlantPhase.SEEDLING]: 14,
    [PlantPhase.VEGETATION]: 21,
    [PlantPhase.PRE_FLOWER]: 7,
    [PlantPhase.FLOWERING]: 42,
    [PlantPhase.FLUSHING]: 7,
    [PlantPhase.DRYING]: 10,
    [PlantPhase.CURING]: 28
  }
};