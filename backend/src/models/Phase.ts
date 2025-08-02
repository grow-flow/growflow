export interface PhaseTemplate {
  name: string;
  duration_min: number;
  duration_max: number;
  description?: string;
  automation_settings?: {
    light_schedule?: string;
    vpd_target?: number;
  };
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
  automation_settings?: {
    light_schedule?: string;
    vpd_target?: number;
  };
}

export const PHOTOPERIOD_PHASES: PhaseTemplate[] = [
  {
    name: 'Germination',
    duration_min: 5,
    duration_max: 10,
    description: 'Seeds sprouting and developing first roots',
    automation_settings: { vpd_target: 0.8 }
  },
  {
    name: 'Seedling',
    duration_min: 10,
    duration_max: 21,
    description: 'First leaves developing, plant establishing',
    automation_settings: { light_schedule: '18/6', vpd_target: 0.9 }
  },
  {
    name: 'Vegetation',
    duration_min: 21,
    duration_max: 60,
    description: 'Rapid growth phase, developing strong structure',
    automation_settings: { light_schedule: '18/6', vpd_target: 1.0 }
  },
  {
    name: 'Pre-Flower',
    duration_min: 7,
    duration_max: 14,
    description: 'Transition phase, showing first signs of flowering',
    automation_settings: { light_schedule: '12/12', vpd_target: 1.1 }
  },
  {
    name: 'Flowering',
    duration_min: 49,
    duration_max: 77,
    description: 'Producing buds, main flowering period',
    automation_settings: { light_schedule: '12/12', vpd_target: 1.2 }
  },
  {
    name: 'Flushing',
    duration_min: 7,
    duration_max: 21,
    description: 'Final weeks, removing nutrients for better taste',
    automation_settings: { light_schedule: '12/12', vpd_target: 1.1 }
  },
  {
    name: 'Drying',
    duration_min: 7,
    duration_max: 14,
    description: 'Drying buds in controlled environment',
    automation_settings: { vpd_target: 0.6 }
  },
  {
    name: 'Curing',
    duration_min: 14,
    duration_max: 60,
    description: 'Final curing process for optimal quality'
  }
];

export const AUTOFLOWER_PHASES: PhaseTemplate[] = [
  {
    name: 'Germination',
    duration_min: 5,
    duration_max: 10,
    description: 'Seeds sprouting and developing first roots',
    automation_settings: { light_schedule: '20/4', vpd_target: 0.8 }
  },
  {
    name: 'Seedling',
    duration_min: 7,
    duration_max: 14,
    description: 'First leaves developing, plant establishing',
    automation_settings: { light_schedule: '20/4', vpd_target: 0.9 }
  },
  {
    name: 'Vegetation',
    duration_min: 14,
    duration_max: 28,
    description: 'Rapid growth phase, developing strong structure',
    automation_settings: { light_schedule: '20/4', vpd_target: 1.0 }
  },
  {
    name: 'Flowering',
    duration_min: 35,
    duration_max: 49,
    description: 'Auto-flowering phase, producing buds',
    automation_settings: { light_schedule: '20/4', vpd_target: 1.2 }
  },
  {
    name: 'Flushing',
    duration_min: 7,
    duration_max: 14,
    description: 'Final weeks, removing nutrients for better taste',
    automation_settings: { light_schedule: '20/4', vpd_target: 1.1 }
  },
  {
    name: 'Drying',
    duration_min: 7,
    duration_max: 14,
    description: 'Drying buds in controlled environment',
    automation_settings: { vpd_target: 0.6 }
  },
  {
    name: 'Curing',
    duration_min: 14,
    duration_max: 60,
    description: 'Final curing process for optimal quality'
  }
];