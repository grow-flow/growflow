export interface Strain {
  id: number;
  name: string;
  type: 'autoflower' | 'photoperiod';
  createdAt: string;
  updatedAt: string;
}

export interface PhaseEnvTargets {
  vpdMin: number | null;
  vpdMax: number | null;
  tempMin: number | null;
  tempMax: number | null;
  humidityMin: number | null;
  humidityMax: number | null;
  lightOnHours: number | null;
}

export interface PlantPhase extends PhaseEnvTargets {
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

export interface PhasePreset extends PhaseEnvTargets {
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
  areaId?: number | null;
  area?: GrowArea;
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
  areaId?: number | null;
}

export type AreaType = 'tent' | 'room' | 'outdoor' | 'closet' | 'custom';

export type AreaEventType = 'light_schedule' | 'environment' | 'equipment' | 'note';

export interface AreaEventData {
  // light_schedule
  schedule?: string;
  previous_schedule?: string;
  light_on?: string;
  light_off?: string;
  intensity_percent?: number;
  // environment
  temperature_c?: number;
  humidity_percent?: number;
  co2_ppm?: number;
  light_ppfd?: number;
  // equipment
  equipment_type?: string;
  action?: 'installed' | 'removed' | 'adjusted';
  details?: string;
}

export interface AreaEvent {
  id: number;
  areaId: number;
  type: AreaEventType;
  title: string;
  timestamp: string;
  notes?: string;
  data?: AreaEventData;
  source: 'manual' | 'ha_sensor' | 'ha_mqtt';
  createdAt: string;
}

export interface GrowArea {
  id: number;
  name: string;
  type: AreaType;
  description?: string;
  isActive: boolean;
  lightSchedule?: string;
  plants?: Plant[];
  plantCount?: number;
  events?: AreaEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateAreaRequest {
  name: string;
  type?: AreaType;
  description?: string;
  lightSchedule?: string;
}

export interface CreateAreaEventRequest {
  type: AreaEventType;
  title: string;
  timestamp?: string;
  notes?: string;
  data?: AreaEventData;
}

export interface CreateEventRequest {
  type: PlantEvent['type'];
  title: string;
  timestamp?: string;
  notes?: string;
  data?: PlantEvent['data'];
}
