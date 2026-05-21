export interface PhaseEnvTargets {
  vpdMin: number | null;
  vpdMax: number | null;
  tempMin: number | null;
  tempMax: number | null;
  humidityMin: number | null;
  humidityMax: number | null;
  lightOnHours: number | null;
}

export interface PhaseTemplate extends PhaseEnvTargets {
  name: string;
  sortOrder: number;
  growType: 'photoperiod' | 'autoflower';
  sourceType: 'seed' | 'clone';
  durationMin: number;
  durationMax: number;
  description?: string;
}

// Built-in agronomic defaults. All fields nullable: a `null` means
// "this phase doesn't constrain that dimension" (e.g. cure ignores light).
// This file is the single source for default target ranges — every other
// place that needs them resolves through the preset cascade in phaseUtils.
export const PHASE_PRESETS: PhaseTemplate[] = [
  // photoperiod + seed
  { name: 'Germination', sortOrder: 0, growType: 'photoperiod', sourceType: 'seed', durationMin: 3,  durationMax: 7,
    vpdMin: 0.4, vpdMax: 0.8, tempMin: 22, tempMax: 26, humidityMin: 70, humidityMax: 85, lightOnHours: 18 },
  { name: 'Seedling',    sortOrder: 1, growType: 'photoperiod', sourceType: 'seed', durationMin: 14, durationMax: 21,
    vpdMin: 0.6, vpdMax: 1.0, tempMin: 22, tempMax: 26, humidityMin: 65, humidityMax: 75, lightOnHours: 18 },
  { name: 'Vegetation',  sortOrder: 2, growType: 'photoperiod', sourceType: 'seed', durationMin: 21, durationMax: 60,
    vpdMin: 0.8, vpdMax: 1.2, tempMin: 22, tempMax: 28, humidityMin: 55, humidityMax: 70, lightOnHours: 18 },
  { name: 'Flowering',   sortOrder: 3, growType: 'photoperiod', sourceType: 'seed', durationMin: 56, durationMax: 91,
    vpdMin: 1.0, vpdMax: 1.5, tempMin: 20, tempMax: 26, humidityMin: 40, humidityMax: 55, lightOnHours: 12 },
  { name: 'Drying',      sortOrder: 4, growType: 'photoperiod', sourceType: 'seed', durationMin: 7,  durationMax: 14,
    vpdMin: null, vpdMax: null, tempMin: 18, tempMax: 21, humidityMin: 55, humidityMax: 65, lightOnHours: null },
  { name: 'Curing',      sortOrder: 5, growType: 'photoperiod', sourceType: 'seed', durationMin: 14, durationMax: 60,
    vpdMin: null, vpdMax: null, tempMin: 18, tempMax: 21, humidityMin: 58, humidityMax: 65, lightOnHours: null },

  // photoperiod + clone — clones start in veg-like conditions but want higher humidity early
  { name: 'Vegetation',  sortOrder: 0, growType: 'photoperiod', sourceType: 'clone', durationMin: 14, durationMax: 45,
    vpdMin: 0.6, vpdMax: 1.0, tempMin: 22, tempMax: 26, humidityMin: 65, humidityMax: 75, lightOnHours: 18 },
  { name: 'Flowering',   sortOrder: 1, growType: 'photoperiod', sourceType: 'clone', durationMin: 56, durationMax: 91,
    vpdMin: 1.0, vpdMax: 1.5, tempMin: 20, tempMax: 26, humidityMin: 40, humidityMax: 55, lightOnHours: 12 },
  { name: 'Drying',      sortOrder: 2, growType: 'photoperiod', sourceType: 'clone', durationMin: 7,  durationMax: 14,
    vpdMin: null, vpdMax: null, tempMin: 18, tempMax: 21, humidityMin: 55, humidityMax: 65, lightOnHours: null },
  { name: 'Curing',      sortOrder: 3, growType: 'photoperiod', sourceType: 'clone', durationMin: 14, durationMax: 60,
    vpdMin: null, vpdMax: null, tempMin: 18, tempMax: 21, humidityMin: 58, humidityMax: 65, lightOnHours: null },

  // autoflower + seed — autos stay on long photoperiod throughout flowering
  { name: 'Germination', sortOrder: 0, growType: 'autoflower', sourceType: 'seed', durationMin: 3,  durationMax: 7,
    vpdMin: 0.4, vpdMax: 0.8, tempMin: 22, tempMax: 26, humidityMin: 70, humidityMax: 85, lightOnHours: 18 },
  { name: 'Seedling',    sortOrder: 1, growType: 'autoflower', sourceType: 'seed', durationMin: 10, durationMax: 14,
    vpdMin: 0.6, vpdMax: 1.0, tempMin: 22, tempMax: 26, humidityMin: 65, humidityMax: 75, lightOnHours: 18 },
  { name: 'Vegetation',  sortOrder: 2, growType: 'autoflower', sourceType: 'seed', durationMin: 14, durationMax: 28,
    vpdMin: 0.8, vpdMax: 1.2, tempMin: 22, tempMax: 28, humidityMin: 55, humidityMax: 70, lightOnHours: 18 },
  { name: 'Flowering',   sortOrder: 3, growType: 'autoflower', sourceType: 'seed', durationMin: 56, durationMax: 77,
    vpdMin: 1.0, vpdMax: 1.5, tempMin: 20, tempMax: 26, humidityMin: 40, humidityMax: 55, lightOnHours: 18 },
  { name: 'Drying',      sortOrder: 4, growType: 'autoflower', sourceType: 'seed', durationMin: 7,  durationMax: 14,
    vpdMin: null, vpdMax: null, tempMin: 18, tempMax: 21, humidityMin: 55, humidityMax: 65, lightOnHours: null },
  { name: 'Curing',      sortOrder: 5, growType: 'autoflower', sourceType: 'seed', durationMin: 14, durationMax: 60,
    vpdMin: null, vpdMax: null, tempMin: 18, tempMax: 21, humidityMin: 58, humidityMax: 65, lightOnHours: null },

  // autoflower + clone
  { name: 'Vegetation',  sortOrder: 0, growType: 'autoflower', sourceType: 'clone', durationMin: 14, durationMax: 21,
    vpdMin: 0.6, vpdMax: 1.0, tempMin: 22, tempMax: 26, humidityMin: 65, humidityMax: 75, lightOnHours: 18 },
  { name: 'Flowering',   sortOrder: 1, growType: 'autoflower', sourceType: 'clone', durationMin: 56, durationMax: 77,
    vpdMin: 1.0, vpdMax: 1.5, tempMin: 20, tempMax: 26, humidityMin: 40, humidityMax: 55, lightOnHours: 18 },
  { name: 'Drying',      sortOrder: 2, growType: 'autoflower', sourceType: 'clone', durationMin: 7,  durationMax: 14,
    vpdMin: null, vpdMax: null, tempMin: 18, tempMax: 21, humidityMin: 55, humidityMax: 65, lightOnHours: null },
  { name: 'Curing',      sortOrder: 3, growType: 'autoflower', sourceType: 'clone', durationMin: 14, durationMax: 60,
    vpdMin: null, vpdMax: null, tempMin: 18, tempMax: 21, humidityMin: 58, humidityMax: 65, lightOnHours: null },
];

export const DEFAULT_PHASES = PHASE_PRESETS.filter(p => p.growType === 'photoperiod' && p.sourceType === 'seed');

// Pull just the env-target subset out of any shape that has them.
export const pickEnvTargets = (src: Partial<PhaseEnvTargets>): PhaseEnvTargets => ({
  vpdMin: src.vpdMin ?? null,
  vpdMax: src.vpdMax ?? null,
  tempMin: src.tempMin ?? null,
  tempMax: src.tempMax ?? null,
  humidityMin: src.humidityMin ?? null,
  humidityMax: src.humidityMax ?? null,
  lightOnHours: src.lightOnHours ?? null,
});

export const mergeEnvTargets = (
  primary: Partial<PhaseEnvTargets>,
  fallback: Partial<PhaseEnvTargets>,
): PhaseEnvTargets => {
  const p = pickEnvTargets(primary);
  const f = pickEnvTargets(fallback);
  return {
    vpdMin: p.vpdMin ?? f.vpdMin,
    vpdMax: p.vpdMax ?? f.vpdMax,
    tempMin: p.tempMin ?? f.tempMin,
    tempMax: p.tempMax ?? f.tempMax,
    humidityMin: p.humidityMin ?? f.humidityMin,
    humidityMax: p.humidityMax ?? f.humidityMax,
    lightOnHours: p.lightOnHours ?? f.lightOnHours,
  };
};
