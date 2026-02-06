import { Router, Request, Response } from 'express';
import { prisma } from '../database';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const strains = await prisma.strain.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(strains);
  } catch (error: any) {
    console.error('🔴 [Strains] Error fetching strains:', error);
    res.status(500).json({ error: 'Failed to fetch strains', details: error.message });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const strain = await prisma.strain.create({
      data: req.body
    });
    res.status(201).json(strain);
  } catch (error: any) {
    console.error('🔴 [Strains] Failed to create strain:', error.message);
    res.status(500).json({
      error: 'Failed to create strain',
      details: error.message
    });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const strain = await prisma.strain.update({
      where: { id },
      data: req.body
    });
    res.json(strain);
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Strain not found' });
    }
    res.status(500).json({ error: 'Failed to update strain' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await prisma.strain.delete({
      where: { id }
    });
    res.status(204).send();
  } catch (error: any) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Strain not found' });
    }
    res.status(500).json({ error: 'Failed to delete strain' });
  }
});

export { router as strainRoutes };
