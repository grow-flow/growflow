// One-shot startup tasks that run after the DB is migrated. Idempotent: each
// is safe to re-run on every boot. Together they ensure a freshly-upgraded
// install has populated phase env targets without the user needing to run
// any manual scripts.

import { prisma } from '../database';
import { PHASE_PRESETS, pickEnvTargets, mergeEnvTargets, PhaseEnvTargets } from '../types/phase';

const isUnset = (t: PhaseEnvTargets) =>
  t.vpdMin == null && t.vpdMax == null &&
  t.tempMin == null && t.tempMax == null &&
  t.humidityMin == null && t.humidityMax == null &&
  t.lightOnHours == null;

const presetKey = (p: { name: string; growType: string; sourceType: string }) =>
  `${p.name}:${p.growType}:${p.sourceType}`;

const hasTargetDiff = (a: PhaseEnvTargets, b: PhaseEnvTargets) =>
  a.vpdMin !== b.vpdMin || a.vpdMax !== b.vpdMax ||
  a.tempMin !== b.tempMin || a.tempMax !== b.tempMax ||
  a.humidityMin !== b.humidityMin || a.humidityMax !== b.humidityMax ||
  a.lightOnHours !== b.lightOnHours;

const builtinTargetsFor = (name: string, growType: string, sourceType: string): PhaseEnvTargets | null => {
  const builtin = PHASE_PRESETS.find(p => p.name === name && p.growType === growType && p.sourceType === sourceType)
    ?? PHASE_PRESETS.find(p => p.name === name && p.growType === growType)
    ?? PHASE_PRESETS.find(p => p.name === name);
  return builtin ? pickEnvTargets(builtin) : null;
};

// Populate built-in generic preset target columns without replacing rows.
// Existing users may have customized durations/descriptions, so this only
// fills missing env target fields on known built-ins.
export const ensurePhasePresetsSeeded = async (): Promise<void> => {
  const genericPresets = await prisma.phasePreset.findMany({
    where: { strainId: null },
  });
  const existing = new Map(genericPresets.map(p => [presetKey(p), p]));
  let created = 0;
  let updated = 0;

  for (const preset of PHASE_PRESETS) {
    const builtinTargets = pickEnvTargets(preset);
    const row = existing.get(presetKey(preset));

    if (!row) {
      await prisma.phasePreset.create({
        data: {
          name: preset.name,
          sortOrder: preset.sortOrder,
          growType: preset.growType,
          sourceType: preset.sourceType,
          durationMin: preset.durationMin,
          durationMax: preset.durationMax,
          description: preset.description ?? null,
          ...builtinTargets,
        },
      });
      created++;
      continue;
    }

    const current = pickEnvTargets(row);
    const targets = mergeEnvTargets(current, builtinTargets);
    if (hasTargetDiff(current, targets)) {
      await prisma.phasePreset.update({
        where: { id: row.id },
        data: targets,
      });
      updated++;
    }
  }

  if (created || updated) {
    console.log(`🟢 [Startup] Phase preset targets ready (${updated} updated, ${created} created)`);
  }
};

// Backfill plant_phases.target columns from the strain → generic → built-in
// cascade for phases that don't yet have any target set. Runs in O(N) where
// N is the number of phases with all-null targets — typically only happens
// once after upgrade.
export const backfillPhaseTargets = async (): Promise<void> => {
  const phases = await prisma.plantPhase.findMany({
    where: {
      AND: [
        { vpdMin: null }, { vpdMax: null },
        { tempMin: null }, { tempMax: null },
        { humidityMin: null }, { humidityMax: null },
        { lightOnHours: null },
      ],
    },
  });

  if (phases.length === 0) return;

  console.log(`🟡 [Startup] Backfilling targets for ${phases.length} phase rows`);

  let filled = 0;
  for (const phase of phases) {
    const plant = await prisma.plant.findUnique({
      where: { id: phase.plantId },
      select: { sourceType: true, strainId: true, strain: { select: { type: true } } },
    });
    if (!plant) continue;

    const growType = plant.strain?.type ?? 'photoperiod';
    const sourceType = plant.sourceType;
    let targets = builtinTargetsFor(phase.name, growType, sourceType);

    const generic = await prisma.phasePreset.findFirst({
      where: { name: phase.name, growType, sourceType, strainId: null },
    });
    if (generic) {
      const genericTargets = pickEnvTargets(generic);
      targets = targets ? mergeEnvTargets(genericTargets, targets) : genericTargets;
    }

    if (plant.strainId) {
      const strainPreset = await prisma.phasePreset.findFirst({
        where: { name: phase.name, growType, sourceType, strainId: plant.strainId },
      });
      if (strainPreset) {
        const strainTargets = pickEnvTargets(strainPreset);
        targets = targets ? mergeEnvTargets(strainTargets, targets) : strainTargets;
      }
    }

    if (targets && !isUnset(targets)) {
      await prisma.plantPhase.update({ where: { id: phase.id }, data: targets });
      filled++;
    }
  }

  console.log(`🟢 [Startup] Backfilled ${filled}/${phases.length} phase rows`);
};

export const runStartupTasks = async (): Promise<void> => {
  try {
    await ensurePhasePresetsSeeded();
    await backfillPhaseTargets();
  } catch (err: any) {
    // P2022/P2021 = schema mismatch (column/table missing). That means
    // migrations didn't apply — surface loudly, don't bury as "non-fatal".
    if (err?.code === 'P2022' || err?.code === 'P2021') {
      console.error('🔴🔴🔴 [Startup] SCHEMA MISMATCH — migrations did not apply:', err.message);
      console.error('   The DB is missing columns/tables the app expects. Check init-db.sh output above.');
      console.error('   Server will continue running, but features depending on these columns will fail.');
      return;
    }
    console.error('🔴 [Startup] task failure (non-fatal):', err);
  }
};
