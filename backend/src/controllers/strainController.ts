import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Strain } from '../models/Strain';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const strains = await AppDataSource.getRepository(Strain).find({
      order: { name: 'ASC' }
    });
    res.json(strains);
  } catch (error) {
    console.error('🔴 [Strains] Error fetching strains:', error);
    res.status(500).json({ error: 'Failed to fetch strains' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const strain = await AppDataSource.getRepository(Strain).findOne({
      where: { id }
    });
    
    if (!strain) {
      return res.status(404).json({ error: 'Strain not found' });
    }
    
    res.json(strain);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch strain' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const strainRepo = AppDataSource.getRepository(Strain);
    const strain = strainRepo.create(req.body);

    const saved = await strainRepo.save(strain);
    const savedStrain = Array.isArray(saved) ? saved[0] : saved;

    res.status(201).json(savedStrain);
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
    const strainRepo = AppDataSource.getRepository(Strain);
    
    await strainRepo.update(id, req.body);
    const updated = await strainRepo.findOne({ where: { id } });
    
    if (!updated) {
      return res.status(404).json({ error: 'Strain not found' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update strain' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const strainRepo = AppDataSource.getRepository(Strain);
    
    const result = await strainRepo.delete(id);
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Strain not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete strain' });
  }
});

export { router as strainRoutes };