import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Plant, PlantPhase } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const plants = await AppDataSource.getRepository(Plant).find({
      relations: ['growbox'],
      where: { is_active: true }
    });
    res.json(plants);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plants' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const plant = await AppDataSource.getRepository(Plant).findOne({
      where: { id },
      relations: ['growbox', 'watering_logs', 'feeding_logs', 'observation_logs']
    });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(plant);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch plant' });
  }
});

router.post('/', async (req: Request, res: Response) => {
  try {
    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = plantRepo.create({
      ...req.body,
      current_phase: PlantPhase.GERMINATION
    });
    const saved = await plantRepo.save(plant);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create plant' });
  }
});

router.put('/:id/phase', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { phase } = req.body;
    
    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    plant.current_phase = phase;
    
    if (phase === PlantPhase.VEGETATION && !plant.vegetation_start_date) {
      plant.vegetation_start_date = new Date();
    }
    if (phase === PlantPhase.FLOWERING && !plant.flowering_start_date) {
      plant.flowering_start_date = new Date();
    }
    if (phase === PlantPhase.DRYING && !plant.drying_start_date) {
      plant.drying_start_date = new Date();
    }
    
    const saved = await plantRepo.save(plant);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plant phase' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const plantRepo = AppDataSource.getRepository(Plant);
    
    await plantRepo.update(id, req.body);
    const updated = await plantRepo.findOne({ where: { id } });
    
    if (!updated) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update plant' });
  }
});

export { router as plantRoutes };