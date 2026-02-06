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
