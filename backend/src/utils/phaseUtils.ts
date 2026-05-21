import { PHASE_PRESETS, PhaseTemplate, PhaseEnvTargets, pickEnvTargets } from '../types/phase';
import { prisma } from '../database';

export interface PlantPhaseCreateInput extends PhaseEnvTargets {
  name: string;
  sortOrder: number;
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
  const started = phases
    .filter(p => p.startDate)
    .sort((a, b) => new Date(b.startDate!).getTime() - new Date(a.startDate!).getTime());
  return started[0] || null;
};

// Build a PhaseTemplate from a stored PhasePreset row, merging in defaults for
// any null target fields by falling back to the matching built-in by name.
const templateFromRow = (
  row: { name: string; sortOrder: number; durationMin: number; durationMax: number; description?: string | null } & Partial<PhaseEnvTargets>,
  growType: string,
  sourceType: string,
  fallbackTargets: PhaseEnvTargets,
): PhaseTemplate => {
  const rowTargets = pickEnvTargets(row);
  // Field-wise fallback: stored null → built-in default for that field.
  const targets: PhaseEnvTargets = {
    vpdMin: rowTargets.vpdMin ?? fallbackTargets.vpdMin,
    vpdMax: rowTargets.vpdMax ?? fallbackTargets.vpdMax,
    tempMin: rowTargets.tempMin ?? fallbackTargets.tempMin,
    tempMax: rowTargets.tempMax ?? fallbackTargets.tempMax,
    humidityMin: rowTargets.humidityMin ?? fallbackTargets.humidityMin,
    humidityMax: rowTargets.humidityMax ?? fallbackTargets.humidityMax,
    lightOnHours: rowTargets.lightOnHours ?? fallbackTargets.lightOnHours,
  };
  return {
    name: row.name,
    sortOrder: row.sortOrder,
    growType: growType as PhaseTemplate['growType'],
    sourceType: sourceType as PhaseTemplate['sourceType'],
    durationMin: row.durationMin,
    durationMax: row.durationMax,
    description: row.description ?? undefined,
    ...targets,
  };
};

const findBuiltinTargets = (name: string, growType: string, sourceType: string): PhaseEnvTargets => {
  const builtin = PHASE_PRESETS.find(p => p.name === name && p.growType === growType && p.sourceType === sourceType)
    ?? PHASE_PRESETS.find(p => p.name === name && p.growType === growType)
    ?? PHASE_PRESETS.find(p => p.name === name);
  return pickEnvTargets(builtin ?? {});
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
        ? genericPresets.map(p => templateFromRow(p, growType, sourceType, findBuiltinTargets(p.name, growType, sourceType)))
        : PHASE_PRESETS.filter(p => p.growType === growType && p.sourceType === sourceType);

      const strainMap = new Map(strainPresets.map(p => [p.name, p]));
      return base.map((p, i) => {
        const override = strainMap.get(p.name);
        if (override) {
          // Strain override wins per-field; falls back to base (generic or built-in) per-field.
          return templateFromRow(override, growType, sourceType, pickEnvTargets(p));
        }
        return { ...p, sortOrder: p.sortOrder ?? i };
      });
    }
  }

  if (genericPresets.length > 0) {
    return genericPresets.map(p => templateFromRow(p, growType, sourceType, findBuiltinTargets(p.name, growType, sourceType)));
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
    sortOrder: t.sortOrder,
    durationMin: t.durationMin,
    durationMax: t.durationMax,
    startDate: i === 0 ? new Date() : null,
    isActive: i === 0,
    isCompleted: false,
    notes: null,
    ...pickEnvTargets(t),
  }));
};
