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
  type: 'watering' | 'observation' | 'training' | 'harvest' | 'transplant';
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
  };
}

export interface Plant {
  id: number;
  name: string;
  strainId?: number;
  strain?: Strain;
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
  notes?: string;
  phases?: Omit<PlantPhase, 'id' | 'plantId'>[];
}

export interface CreateEventRequest {
  type: PlantEvent['type'];
  title: string;
  timestamp?: string;
  notes?: string;
  data?: PlantEvent['data'];
}
