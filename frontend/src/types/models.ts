export interface PhaseTemplate {
  name: string;
  duration_min: number;
  duration_max: number;
  description?: string;
}

export interface PlantPhaseInstance {
  id: string;
  name: string;
  start_date?: string;
  duration_min: number;
  duration_max: number;
  description?: string;
  is_active: boolean;
  is_completed: boolean;
  notes?: string;
}

export interface PlantEvent {
  id: string;
  timestamp: string;
  type: 'watering' | 'observation' | 'training' | 'harvest' | 'transplant' | 'custom';
  title: string;
  description?: string;
  data?: {
    amount_ml?: number;
    ph_level?: number;
    ec_ppm?: number;
    water_temperature?: number;
    runoff_ph?: number;
    runoff_ec?: number;
    nutrients?: Array<{ name: string; amount_ml: number; npk_ratio?: string }>;
    observation_type?: 'health' | 'training' | 'deficiency' | 'pest' | 'general';
    severity?: 'low' | 'medium' | 'high';
    resolved?: boolean;
    training_method?: string;
    wet_weight?: number;
    dry_weight?: number;
    photos?: string[];
    custom_fields?: { [key: string]: any };
  };
  notes?: string;
  phase_id?: string;
}

export interface Plant {
  id: number;
  name: string;
  strain: string;
  start_method: 'seed' | 'clone';
  plant_type: 'autoflower' | 'photoperiod';
  phases: PlantPhaseInstance[];
  events: PlantEvent[];
  notes?: string;
  is_active: boolean;
  is_mother_plant: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface Strain {
  id: number;
  name: string;
  abbreviation?: string;
  type: string;
  description?: string;
  breeder?: string;
  created_at: Date;
  updated_at: Date;
}
