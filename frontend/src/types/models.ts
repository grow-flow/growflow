export interface Strain {
  id: number;
  name: string;
  type: 'autoflower' | 'photoperiod';
  createdAt: string;
  updatedAt: string;
}

export interface PlantPhase {
  id: number;
  plantId: number;
  sortOrder: number;
  name: string;
  durationMin: number;
  durationMax: number;
  startDate?: string;
  isActive: boolean;
  isCompleted: boolean;
  notes?: string;
}

export interface PlantEvent {
  id: number;
  plantId: number;
  phaseId?: number;
  type: 'watering' | 'note' | 'training' | 'harvest' | 'observation' | 'transplant' | 'custom';
  title: string;
  timestamp: string;
  notes?: string;
  data?: {
    amount_ml?: number;
    ph_level?: number;
    ec_ppm?: number;
    training_method?: string;
    wet_weight?: number;
    dry_weight?: number;
    photos?: string[];
  };
}

export interface PhasePreset {
  id: number;
  name: string;
  sortOrder: number;
  growType: 'photoperiod' | 'autoflower';
  sourceType: 'seed' | 'clone';
  durationMin: number;
  durationMax: number;
  description?: string;
  strainId?: number;
}

export interface Plant {
  id: number;
  name: string;
  strainId?: number;
  strain?: Strain;
  sourceType: 'seed' | 'clone';
  notes?: string;
  isActive: boolean;
  phases: PlantPhase[];
  events: PlantEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantRequest {
  name: string;
  strainId?: number;
  sourceType?: 'seed' | 'clone';
  notes?: string;
}

export interface CreateEventRequest {
  type: PlantEvent['type'];
  title: string;
  timestamp?: string;
  notes?: string;
  data?: PlantEvent['data'];
}
