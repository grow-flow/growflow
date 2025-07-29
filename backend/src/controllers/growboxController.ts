import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Growbox } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const growboxes = await AppDataSource.getRepository(Growbox).find({
      relations: ['plants']
    });
    res.json(growboxes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch growboxes' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const growbox = await AppDataSource.getRepository(Growbox).findOne({
      where: { id },
      relations: ['plants', 'environment_logs']
    });
    
    if (!growbox) {
      return res.status(404).json({ error: 'Growbox not found' });
    }
    
    res.json(growbox);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch growbox' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const growboxRepo = AppDataSource.getRepository(Growbox);
    const growbox = growboxRepo.create(req.body);
    const saved = await growboxRepo.save(growbox);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create growbox' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const growboxRepo = AppDataSource.getRepository(Growbox);
    
    await growboxRepo.update(id, req.body);
    const updated = await growboxRepo.findOne({ where: { id } });
    
    if (!updated) {
      return res.status(404).json({ error: 'Growbox not found' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update growbox' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const result = await AppDataSource.getRepository(Growbox).delete(id);
    
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Growbox not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete growbox' });
  }
});

export { router as growboxRoutes };