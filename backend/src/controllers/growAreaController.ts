import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { GrowArea } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const growAreas = await AppDataSource.getRepository(GrowArea).find({
      relations: ['plants']
    });
    res.json(growAreas);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grow areas' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const growArea = await AppDataSource.getRepository(GrowArea).findOne({
      where: { id },
      relations: ['plants', 'environment_logs']
    });
    
    if (!growArea) {
      return res.status(404).json({ error: 'Grow area not found' });
    }
    
    res.json(growArea);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch grow area' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const growAreaRepo = AppDataSource.getRepository(GrowArea);
    const growArea = growAreaRepo.create(req.body);
    const saved = await growAreaRepo.save(growArea);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create grow area' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const growAreaRepo = AppDataSource.getRepository(GrowArea);
    
    await growAreaRepo.update(id, req.body);
    const updated = await growAreaRepo.findOne({ where: { id } });
    
    if (!updated) {
      return res.status(404).json({ error: 'Grow area not found' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update grow area' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await AppDataSource.getRepository(GrowArea).delete(id);
    
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Grow area not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete grow area' });
  }
});

export { router as growAreaRoutes };