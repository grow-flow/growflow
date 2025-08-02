export interface PlantEvent {
  id: string;
  timestamp: string;
  type: 'watering' | 'feeding' | 'observation' | 'training' | 'harvest' | 'transplant' | 'custom';
  title: string;
  description?: string;
  data?: {
    // Watering data
    amount_ml?: number;
    ph_level?: number;
    ec_ppm?: number;
    water_temperature?: number;
    runoff_ph?: number;
    runoff_ec?: number;
    
    // Feeding data
    nutrients?: Array<{
      name: string;
      amount_ml: number;
      npk_ratio?: string;
    }>;
    
    // Observation data
    observation_type?: 'health' | 'training' | 'deficiency' | 'pest' | 'general';
    severity?: 'low' | 'medium' | 'high';
    resolved?: boolean;
    
    // Training data
    training_method?: string;
    
    // Harvest data
    wet_weight?: number;
    dry_weight?: number;
    
    // Photos for any event type
    photos?: string[];
    
    // Custom data for extensibility
    custom_fields?: { [key: string]: any };
  };
  notes?: string;
  phase_id?: string; // Link to which phase this event occurred in
}

export const EVENT_TYPES = {
  watering: {
    icon: '💧',
    color: '#2196F3',
    title: 'Watering',
    fields: ['amount_ml', 'ph_level', 'ec_ppm', 'water_temperature', 'runoff_ph', 'runoff_ec']
  },
  feeding: {
    icon: '🌱',
    color: '#4CAF50',
    title: 'Feeding',
    fields: ['nutrients', 'ph_level', 'ec_ppm']
  },
  observation: {
    icon: '👁️',
    color: '#FF9800',
    title: 'Observation',
    fields: ['observation_type', 'severity', 'resolved', 'photos']
  },
  training: {
    icon: '✂️',
    color: '#9C27B0',
    title: 'Training',
    fields: ['training_method', 'photos']
  },
  harvest: {
    icon: '🌾',
    color: '#795548',
    title: 'Harvest',
    fields: ['wet_weight', 'dry_weight', 'photos']
  },
  transplant: {
    icon: '🪴',
    color: '#607D8B',
    title: 'Transplant',
    fields: ['photos']
  },
  custom: {
    icon: '📝',
    color: '#616161',
    title: 'Custom Event',
    fields: ['custom_fields']
  }
} as const;

export const QUICK_EVENT_TEMPLATES = {
  watering: [
    { title: 'Regular Watering', data: { amount_ml: 500 } },
    { title: 'Light Watering', data: { amount_ml: 250 } },
    { title: 'Deep Watering', data: { amount_ml: 1000 } }
  ],
  feeding: [
    { title: 'Veg Nutrients', data: { nutrients: [{ name: 'Veg NPK', amount_ml: 10 }] } },
    { title: 'Bloom Nutrients', data: { nutrients: [{ name: 'Bloom NPK', amount_ml: 15 }] } },
    { title: 'Cal-Mag', data: { nutrients: [{ name: 'Cal-Mag', amount_ml: 5 }] } }
  ],
  observation: [
    { title: 'Healthy Growth', data: { observation_type: 'health' as const, severity: 'low' as const } },
    { title: 'Pest Check', data: { observation_type: 'pest' as const } },
    { title: 'Deficiency Spotted', data: { observation_type: 'deficiency' as const, severity: 'medium' as const } }
  ],
  training: [
    { title: 'LST', data: { training_method: 'Low Stress Training' } },
    { title: 'Topping', data: { training_method: 'Topping' } },
    { title: 'Defoliation', data: { training_method: 'Defoliation' } }
  ]
};