export interface Growbox {
  id: number;
  name: string;
  type: 'indoor' | 'outdoor';
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  equipment: {
    lights: string[];
    fans: string[];
    humidifier?: string;
    dehumidifier?: string;
    heater?: string;
  };
  sensors: {
    temperature: string;
    humidity: string;
    co2?: string;
    light_intensity?: string;
  };
  automation_enabled: boolean;
  target_vpd_by_phase: {
    germination: number;
    seedling: number;
    vegetation: number;
    flowering: number;
  };
  created_at: Date;
  updated_at: Date;
  plants?: Plant[];
}

export enum PlantPhase {
  GERMINATION = 'germination',
  SEEDLING = 'seedling',
  VEGETATION = 'vegetation',
  PRE_FLOWER = 'pre_flower',
  FLOWERING = 'flowering',
  FLUSHING = 'flushing',
  HARVEST = 'harvest',
  DRYING = 'drying',
  CURING = 'curing'
}

export interface Plant {
  id: number;
  growbox_id: number;
  name: string;
  strain: string;
  breeder?: string;
  phenotype?: string;
  germination_date: Date;
  vegetation_start_date?: Date;
  flowering_start_date?: Date;
  harvest_date?: Date;
  current_phase: PlantPhase;
  light_schedule: {
    vegetation: string;
    flowering: string;
  };
  medium: 'soil' | 'hydro' | 'coco' | 'dwc';
  pot_size_liters: number;
  training_methods: string[];
  notes?: string;
  is_active: boolean;
  is_mother_plant: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface WateringLog {
  id: number;
  plant_id: number;
  timestamp: Date;
  amount_ml: number;
  ph_level?: number;
  ec_ppm?: number;
  water_temperature?: number;
  runoff_ph?: number;
  runoff_ec?: number;
  notes?: string;
}

export interface FeedingLog {
  id: number;
  plant_id: number;
  timestamp: Date;
  nutrients: Array<{
    name: string;
    amount_ml: number;
    npk_ratio?: string;
  }>;
  ph_level?: number;
  ec_ppm?: number;
  notes?: string;
}

export interface ObservationLog {
  id: number;
  plant_id: number;
  timestamp: Date;
  observation_type: 'health' | 'training' | 'deficiency' | 'pest' | 'general';
  description: string;
  severity?: 'low' | 'medium' | 'high';
  photos?: string[];
  resolved: boolean;
}