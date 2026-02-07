import { PHASE_PRESETS, PhaseTemplate } from '../types/phase';
import { prisma } from '../database';

export interface PlantPhaseCreateInput {
  name: string;
  durationMin: number;
  durationMax: number;
  startDate: Date | null;
  isActive: boolean;
  isCompleted: boolean;
  notes: string | null;
}

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

export const resolvePhasePresets = async (
  growType: string,
  sourceType: string,
  strainId?: number
): Promise<PhaseTemplate[]> => {
  const genericPresets = await prisma.phasePreset.findMany({
    where: { growType, sourceType, strainId: null },
    orderBy: { sortOrder: 'asc' },
  });

  if (strainId) {
    const strainPresets = await prisma.phasePreset.findMany({
      where: { growType, sourceType, strainId },
      orderBy: { sortOrder: 'asc' },
    });

    if (strainPresets.length > 0) {
      const base = genericPresets.length > 0
        ? genericPresets
        : PHASE_PRESETS.filter(p => p.growType === growType && p.sourceType === sourceType);

      const strainMap = new Map(strainPresets.map(p => [p.name, p]));
      return base.map((p, i) => {
        const override = strainMap.get(p.name);
        return override
          ? { name: override.name, sortOrder: override.sortOrder, growType, sourceType, durationMin: override.durationMin, durationMax: override.durationMax, description: override.description ?? undefined } as PhaseTemplate
          : { name: p.name, sortOrder: p.sortOrder ?? i, growType, sourceType, durationMin: p.durationMin, durationMax: p.durationMax, description: p.description ?? undefined } as PhaseTemplate;
      });
    }
  }

  if (genericPresets.length > 0) {
    return genericPresets.map(p => ({
      name: p.name, sortOrder: p.sortOrder, growType, sourceType,
      durationMin: p.durationMin, durationMax: p.durationMax, description: p.description ?? undefined,
    } as PhaseTemplate));
  }

  return PHASE_PRESETS.filter(p => p.growType === growType && p.sourceType === sourceType);
};

export const createPlantPhases = async (
  growType: string,
  sourceType: string,
  strainId?: number
): Promise<PlantPhaseCreateInput[]> => {
  const templates = await resolvePhasePresets(growType, sourceType, strainId);
  return templates.map((t, i) => ({
    name: t.name,
    durationMin: t.durationMin,
    durationMax: t.durationMax,
    startDate: i === 0 ? new Date() : null,
    isActive: i === 0,
    isCompleted: false,
    notes: null,
  }));
};
