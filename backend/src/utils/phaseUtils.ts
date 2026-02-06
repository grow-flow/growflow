import { DEFAULT_PHASES, PhaseTemplate } from '../types/phase';

export interface PlantPhaseCreateInput {
  name: string;
  durationMin: number;
  durationMax: number;
  startDate: Date | null;
  isActive: boolean;
  isCompleted: boolean;
  notes: string | null;
}

export const createPlantPhasesFromStrain = (
  strainPhaseTemplates: PhaseTemplate[],
  _isAutoflower: boolean = false
): PlantPhaseCreateInput[] => {
  const templates = strainPhaseTemplates.length > 0 ? strainPhaseTemplates : DEFAULT_PHASES;

  return templates.map((template, index) => ({
    name: template.name,
    durationMin: template.duration_min,
    durationMax: template.duration_max,
    startDate: index === 0 ? new Date() : null,
    isActive: index === 0,
    isCompleted: false,
    notes: null,
  }));
};

export interface PlantPhaseDb {
  id: number;
  startDate: Date | null;
  isActive: boolean;
}

export const getCurrentPhase = (phases: PlantPhaseDb[]): PlantPhaseDb | null => {
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].startDate || phases[i].isActive) return phases[i];
  }
  return null;
};
