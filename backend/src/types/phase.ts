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
  { name: 'Flowering', sortOrder: 3, growType: 'photoperiod', sourceType: 'seed', durationMin: 56, durationMax: 91 },
  { name: 'Drying', sortOrder: 4, growType: 'photoperiod', sourceType: 'seed', durationMin: 7, durationMax: 14 },
  { name: 'Curing', sortOrder: 5, growType: 'photoperiod', sourceType: 'seed', durationMin: 14, durationMax: 60 },

  // photoperiod + clone
  { name: 'Vegetation', sortOrder: 0, growType: 'photoperiod', sourceType: 'clone', durationMin: 14, durationMax: 45 },
  { name: 'Flowering', sortOrder: 1, growType: 'photoperiod', sourceType: 'clone', durationMin: 56, durationMax: 91 },
  { name: 'Drying', sortOrder: 2, growType: 'photoperiod', sourceType: 'clone', durationMin: 7, durationMax: 14 },
  { name: 'Curing', sortOrder: 3, growType: 'photoperiod', sourceType: 'clone', durationMin: 14, durationMax: 60 },

  // autoflower + seed (flush merged into flowering duration)
  { name: 'Germination', sortOrder: 0, growType: 'autoflower', sourceType: 'seed', durationMin: 3, durationMax: 7 },
  { name: 'Seedling', sortOrder: 1, growType: 'autoflower', sourceType: 'seed', durationMin: 10, durationMax: 14 },
  { name: 'Vegetation', sortOrder: 2, growType: 'autoflower', sourceType: 'seed', durationMin: 14, durationMax: 28 },
  { name: 'Flowering', sortOrder: 3, growType: 'autoflower', sourceType: 'seed', durationMin: 56, durationMax: 77 },
  { name: 'Drying', sortOrder: 4, growType: 'autoflower', sourceType: 'seed', durationMin: 7, durationMax: 14 },
  { name: 'Curing', sortOrder: 5, growType: 'autoflower', sourceType: 'seed', durationMin: 14, durationMax: 60 },

  // autoflower + clone (flush merged into flowering duration)
  { name: 'Vegetation', sortOrder: 0, growType: 'autoflower', sourceType: 'clone', durationMin: 14, durationMax: 21 },
  { name: 'Flowering', sortOrder: 1, growType: 'autoflower', sourceType: 'clone', durationMin: 56, durationMax: 77 },
  { name: 'Drying', sortOrder: 2, growType: 'autoflower', sourceType: 'clone', durationMin: 7, durationMax: 14 },
  { name: 'Curing', sortOrder: 3, growType: 'autoflower', sourceType: 'clone', durationMin: 14, durationMax: 60 },
];

export const DEFAULT_PHASES = PHASE_PRESETS.filter(p => p.growType === 'photoperiod' && p.sourceType === 'seed');
