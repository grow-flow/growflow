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

export const DEFAULT_PHASES: PhaseTemplate[] = [
  { name: 'Germination', duration_min: 3, duration_max: 7, description: 'Seeds sprouting' },
  { name: 'Seedling', duration_min: 14, duration_max: 21, description: 'First leaves developing' },
  { name: 'Vegetation', duration_min: 21, duration_max: 60, description: 'Rapid growth phase' },
  { name: 'Pre-Flower', duration_min: 7, duration_max: 14, description: 'Transition to flowering' },
  { name: 'Flowering', duration_min: 49, duration_max: 77, description: 'Producing buds' },
  { name: 'Flushing', duration_min: 7, duration_max: 14, description: 'Final flush' },
  { name: 'Drying', duration_min: 7, duration_max: 14, description: 'Drying buds' },
  { name: 'Curing', duration_min: 14, duration_max: 60, description: 'Final curing' }
];
