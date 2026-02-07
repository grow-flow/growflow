import { Router, Request, Response } from 'express';
import { prisma } from '../database';
import { PHASE_PRESETS } from '../types/phase';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { growType, sourceType, strainId } = req.query;
    const where: any = {};
    if (growType) where.growType = growType;
    if (sourceType) where.sourceType = sourceType;
    if (strainId) where.strainId = parseInt(strainId as string);

    const presets = await prisma.phasePreset.findMany({
      where,
      orderBy: { sortOrder: 'asc' }
    });
    res.json(presets);
  } catch (error: any) {
    console.error('🔴 [Presets] Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets', details: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const preset = await prisma.phasePreset.create({
      data: req.body
    });
    res.status(201).json(preset);
  } catch (error: any) {
    console.error('🔴 [Presets] Failed to create preset:', error.message);
    res.status(500).json({ error: 'Failed to create preset', details: error.message });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const preset = await prisma.phasePreset.update({
      where: { id },
      data: req.body
    });
    res.json(preset);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Preset not found' });
    }
    res.status(500).json({ error: 'Failed to update preset' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.phasePreset.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Preset not found' });
    }
    res.status(500).json({ error: 'Failed to delete preset' });
  }
});

router.post('/seed', async (req: Request, res: Response) => {
  try {
    await prisma.$transaction([
      prisma.phasePreset.deleteMany({ where: { strainId: null } }),
      prisma.phasePreset.createMany({ data: PHASE_PRESETS })
    ]);
    const presets = await prisma.phasePreset.findMany({
      where: { strainId: null },
      orderBy: { sortOrder: 'asc' }
    });
    res.json(presets);
  } catch (error: any) {
    console.error('🔴 [Presets] Failed to seed presets:', error.message);
    res.status(500).json({ error: 'Failed to seed presets', details: error.message });
  }
});

export { router as presetRoutes };
