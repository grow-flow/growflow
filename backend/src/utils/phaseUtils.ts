import { PlantPhaseInstance, PhaseTemplate, PHOTOPERIOD_PHASES, AUTOFLOWER_PHASES } from '../models/Phase';
import { v4 as uuidv4 } from 'uuid';

export const createPlantPhasesFromStrain = (
  strainPhaseTemplates: PhaseTemplate[],
  isAutoflower: boolean = false
): PlantPhaseInstance[] => {
  const templates = strainPhaseTemplates.length > 0 
    ? strainPhaseTemplates 
    : (isAutoflower ? AUTOFLOWER_PHASES : PHOTOPERIOD_PHASES);

  return templates.map((template, index) => ({
    id: uuidv4(),
    name: template.name,
    start_date: index === 0 ? new Date().toISOString() : undefined,
    duration_min: template.duration_min,
    duration_max: template.duration_max,
    description: template.description,
    is_active: index === 0,
    is_completed: false,
    automation_settings: template.automation_settings
  }));
};

export const getCurrentPhase = (phases: PlantPhaseInstance[]): PlantPhaseInstance | null => {
  return phases.find(phase => phase.is_active) || null;
};

export const getNextPhase = (phases: PlantPhaseInstance[], currentPhaseId: string): PlantPhaseInstance | null => {
  const currentIndex = phases.findIndex(phase => phase.id === currentPhaseId);
  return currentIndex >= 0 && currentIndex < phases.length - 1 
    ? phases[currentIndex + 1] 
    : null;
};

export const advanceToNextPhase = (phases: PlantPhaseInstance[], currentPhaseId: string): PlantPhaseInstance[] => {
  const currentIndex = phases.findIndex(phase => phase.id === currentPhaseId);
  
  if (currentIndex === -1 || currentIndex >= phases.length - 1) {
    return phases;
  }

  return phases.map((phase, index) => {
    if (index === currentIndex) {
      return { ...phase, is_active: false, is_completed: true };
    }
    if (index === currentIndex + 1) {
      return { ...phase, is_active: true, start_date: new Date().toISOString() };
    }
    return phase;
  });
};

export const updatePhaseStartDate = (
  phases: PlantPhaseInstance[], 
  phaseId: string, 
  startDate: string | null
): PlantPhaseInstance[] => {
  return phases.map(phase => 
    phase.id === phaseId 
      ? { ...phase, start_date: startDate || undefined }
      : phase
  );
};

export const calculatePhaseProgress = (phase: PlantPhaseInstance): number => {
  if (!phase.start_date) return 0;
  
  const startDate = new Date(phase.start_date);
  const now = new Date();
  const daysElapsed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  
  return Math.min((daysElapsed / phase.duration_max) * 100, 100);
};

export const getEstimatedHarvestDate = (phases: PlantPhaseInstance[]): Date | null => {
  const firstPhase = phases.find(phase => phase.start_date);
  if (!firstPhase) return null;
  
  const totalDays = phases.reduce((sum, phase) => sum + phase.duration_max, 0);
  const harvestPhaseIndex = phases.findIndex(phase => 
    phase.name.toLowerCase().includes('flush') || 
    phase.name.toLowerCase().includes('flower')
  );
  
  if (harvestPhaseIndex === -1) return null;
  
  const daysToHarvest = phases.slice(0, harvestPhaseIndex + 1)
    .reduce((sum, phase) => sum + phase.duration_max, 0);
  
  const startDate = new Date(firstPhase.start_date!);
  return new Date(startDate.getTime() + daysToHarvest * 24 * 60 * 60 * 1000);
};