export interface PhaseTemplate {
  name: string;
  sortOrder: number;
  growType: 'photoperiod' | 'autoflower';
  sourceType: 'seed' | 'clone';
  durationMin: number;
  durationMax: number;
  description?: string;
}

export const PHASE_PRESETS: PhaseTemplate[] = [
  // photoperiod + seed
  { name: 'Germination', sortOrder: 0, growType: 'photoperiod', sourceType: 'seed', durationMin: 3, durationMax: 7 },
  { name: 'Seedling', sortOrder: 1, growType: 'photoperiod', sourceType: 'seed', durationMin: 14, durationMax: 21 },
  { name: 'Vegetation', sortOrder: 2, growType: 'photoperiod', sourceType: 'seed', durationMin: 21, durationMax: 60 },
  { name: 'Pre-Flower', sortOrder: 3, growType: 'photoperiod', sourceType: 'seed', durationMin: 7, durationMax: 14 },
  { name: 'Flowering', sortOrder: 4, growType: 'photoperiod', sourceType: 'seed', durationMin: 49, durationMax: 77 },
  { name: 'Flushing', sortOrder: 5, growType: 'photoperiod', sourceType: 'seed', durationMin: 7, durationMax: 14 },
  { name: 'Drying', sortOrder: 6, growType: 'photoperiod', sourceType: 'seed', durationMin: 7, durationMax: 14 },
  { name: 'Curing', sortOrder: 7, growType: 'photoperiod', sourceType: 'seed', durationMin: 14, durationMax: 60 },

  // photoperiod + clone
  { name: 'Vegetation', sortOrder: 0, growType: 'photoperiod', sourceType: 'clone', durationMin: 14, durationMax: 45 },
  { name: 'Pre-Flower', sortOrder: 1, growType: 'photoperiod', sourceType: 'clone', durationMin: 7, durationMax: 14 },
  { name: 'Flowering', sortOrder: 2, growType: 'photoperiod', sourceType: 'clone', durationMin: 49, durationMax: 77 },
  { name: 'Flushing', sortOrder: 3, growType: 'photoperiod', sourceType: 'clone', durationMin: 7, durationMax: 14 },
  { name: 'Drying', sortOrder: 4, growType: 'photoperiod', sourceType: 'clone', durationMin: 7, durationMax: 14 },
  { name: 'Curing', sortOrder: 5, growType: 'photoperiod', sourceType: 'clone', durationMin: 14, durationMax: 60 },

  // autoflower + seed
  { name: 'Germination', sortOrder: 0, growType: 'autoflower', sourceType: 'seed', durationMin: 3, durationMax: 7 },
  { name: 'Seedling', sortOrder: 1, growType: 'autoflower', sourceType: 'seed', durationMin: 10, durationMax: 14 },
  { name: 'Vegetation', sortOrder: 2, growType: 'autoflower', sourceType: 'seed', durationMin: 14, durationMax: 28 },
  { name: 'Flowering', sortOrder: 3, growType: 'autoflower', sourceType: 'seed', durationMin: 49, durationMax: 63 },
  { name: 'Flushing', sortOrder: 4, growType: 'autoflower', sourceType: 'seed', durationMin: 7, durationMax: 14 },
  { name: 'Drying', sortOrder: 5, growType: 'autoflower', sourceType: 'seed', durationMin: 7, durationMax: 14 },
  { name: 'Curing', sortOrder: 6, growType: 'autoflower', sourceType: 'seed', durationMin: 14, durationMax: 60 },

  // autoflower + clone
  { name: 'Vegetation', sortOrder: 0, growType: 'autoflower', sourceType: 'clone', durationMin: 14, durationMax: 21 },
  { name: 'Flowering', sortOrder: 1, growType: 'autoflower', sourceType: 'clone', durationMin: 49, durationMax: 63 },
  { name: 'Flushing', sortOrder: 2, growType: 'autoflower', sourceType: 'clone', durationMin: 7, durationMax: 14 },
  { name: 'Drying', sortOrder: 3, growType: 'autoflower', sourceType: 'clone', durationMin: 7, durationMax: 14 },
  { name: 'Curing', sortOrder: 4, growType: 'autoflower', sourceType: 'clone', durationMin: 14, durationMax: 60 },
];

export const DEFAULT_PHASES = PHASE_PRESETS.filter(p => p.growType === 'photoperiod' && p.sourceType === 'seed');
