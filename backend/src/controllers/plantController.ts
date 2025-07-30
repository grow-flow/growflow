import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Plant, PlantPhase, WateringLog, FeedingLog, ObservationLog } from '../models';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const plants = await AppDataSource.getRepository(Plant).find({
      relations: ['grow_area'],
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
      relations: ['grow_area', 'watering_logs', 'feeding_logs', 'observation_logs']
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
    console.log('Creating plant with data:', JSON.stringify(req.body, null, 2));
    
    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = plantRepo.create({
      ...req.body,
      current_phase: PlantPhase.GERMINATION
    });
    
    console.log('Plant entity created:', JSON.stringify(plant, null, 2));
    
    const saved = await plantRepo.save(plant);
    const savedPlant = Array.isArray(saved) ? saved[0] : saved;
    
    console.log('Plant saved successfully:', savedPlant.id);
    res.status(201).json(savedPlant);
  } catch (error: any) {
    console.error('Failed to create plant:', {
      error: error.message,
      stack: error.stack,
      code: error.code,
      requestBody: req.body
    });
    res.status(500).json({ 
      error: 'Failed to create plant',
      details: error.message 
    });
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
    console.log(`Updating plant ${id} with data:`, JSON.stringify(req.body, null, 2));
    
    const plantRepo = AppDataSource.getRepository(Plant);
    
    await plantRepo.update(id, req.body);
    const updated = await plantRepo.findOne({ where: { id } });
    
    if (!updated) {
      console.warn(`Plant ${id} not found for update`);
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    console.log(`Plant ${id} updated successfully`);
    res.json(updated);
  } catch (error: any) {
    console.error(`Failed to update plant ${req.params.id}:`, {
      error: error.message,
      stack: error.stack,
      requestBody: req.body
    });
    res.status(500).json({ 
      error: 'Failed to update plant',
      details: error.message 
    });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    // Start a transaction to ensure all deletions happen atomically
    await AppDataSource.transaction(async manager => {
      // Check if plant exists
      const plant = await manager.findOne(Plant, { where: { id } });
      if (!plant) {
        throw new Error('Plant not found');
      }
      
      // Delete all related logs first
      await manager.delete(WateringLog, { plant_id: id });
      await manager.delete(FeedingLog, { plant_id: id });
      await manager.delete(ObservationLog, { plant_id: id });
      
      // Finally delete the plant
      await manager.delete(Plant, { id });
    });
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete plant error:', error);
    if (error instanceof Error && error.message === 'Plant not found') {
      return res.status(404).json({ error: 'Plant not found' });
    }
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});

export { router as plantRoutes };