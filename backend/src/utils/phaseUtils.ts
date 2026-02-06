import { PlantPhaseInstance, PhaseTemplate, DEFAULT_PHASES } from '../types/phase';
import { v4 as uuidv4 } from 'uuid';

export const createPlantPhasesFromStrain = (
  strainPhaseTemplates: PhaseTemplate[],
  isAutoflower: boolean = false
): PlantPhaseInstance[] => {
  const templates = strainPhaseTemplates.length > 0 ? strainPhaseTemplates : DEFAULT_PHASES;

  return templates.map((template, index) => ({
    id: uuidv4(),
    name: template.name,
    start_date: index === 0 ? new Date().toISOString() : undefined,
    duration_min: template.duration_min,
    duration_max: template.duration_max,
    description: template.description,
    is_active: false,
    is_completed: false,
  }));
};

export const getCurrentPhase = (phases: PlantPhaseInstance[]): PlantPhaseInstance | null => {
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].start_date) return phases[i];
  }
  return null;
};