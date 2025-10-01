import { PhaseTemplate } from './models';

export interface Strain {
  id: number;
  name: string;
  abbreviation?: string; // max 4 chars for short labels like "WW", "GG", "AK"
  type: 'autoflower' | 'photoperiod';
  description?: string;
  breeder?: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateStrainData {
  name: string;
  abbreviation?: string;
  type: 'autoflower' | 'photoperiod';
  description?: string;
  breeder?: string;
}

export interface UpdateStrainData extends Partial<CreateStrainData> {
  id: number;
}

export type StartMethod = 'seed' | 'clone';


// Base Phasen abhängig von Start-Methode (Samen vs. Klon)
export const BASE_PHASE_TEMPLATES = {
  seed: [
    { name: 'Germination', duration_min: 3, duration_max: 7, description: 'Seeds sprouting and developing first roots' },
    { name: 'Seedling', duration_min: 14, duration_max: 21, description: 'First leaves developing, plant establishing' }
  ] as PhaseTemplate[],
  clone: [
    { name: 'Rooting', duration_min: 7, duration_max: 14, description: 'Clone developing roots' },
    { name: 'Seedling', duration_min: 7, duration_max: 14, description: 'Clone establishing as young plant' }
  ] as PhaseTemplate[]
};

// Standard Strain-spezifische Phasen (die typischerweise angepasst werden)
export const STRAIN_PHASE_TEMPLATES = {
  photoperiod: [
    { name: 'Vegetation', duration_min: 28, duration_max: 60, description: 'Rapid growth phase, developing strong structure' },
    { name: 'Pre-Flower', duration_min: 7, duration_max: 14, description: 'Transition phase, showing first signs of flowering' },
    { name: 'Flowering', duration_min: 56, duration_max: 84, description: 'Producing buds, main flowering period' }
  ] as PhaseTemplate[],
  autoflower: [
    { name: 'Vegetation', duration_min: 14, duration_max: 28, description: 'Rapid growth phase, developing strong structure' },
    { name: 'Flowering', duration_min: 35, duration_max: 56, description: 'Auto-flowering phase, producing buds' }
  ] as PhaseTemplate[]
};

// End Phasen (immer gleich)
export const END_PHASE_TEMPLATES = [
  { name: 'Flushing', duration_min: 7, duration_max: 14, description: 'Final weeks, removing nutrients for better taste' },
  { name: 'Harvest', duration_min: 1, duration_max: 3, description: 'Cutting and initial processing' },
  { name: 'Drying', duration_min: 7, duration_max: 14, description: 'Drying buds in controlled environment' },
  { name: 'Curing', duration_min: 14, duration_max: 60, description: 'Final curing process for optimal quality' }
] as PhaseTemplate[];


// Modulare Phasen-Zusammenstellung
export function composePhaseTemplates(
  plantType: 'autoflower' | 'photoperiod',
  startMethod: StartMethod
): PhaseTemplate[] {
  const basePhasen = BASE_PHASE_TEMPLATES[startMethod];
  const strainSpecificPhases = STRAIN_PHASE_TEMPLATES[plantType];
  const endPhasen = END_PHASE_TEMPLATES;

  return [
    ...basePhasen,
    ...strainSpecificPhases,
    ...endPhasen
  ];
}

