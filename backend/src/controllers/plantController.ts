import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { Plant, Strain } from '../models';
import { createPlantPhasesFromStrain, getCurrentPhase, advanceToNextPhase, updatePhaseStartDate } from '../utils/phaseUtils';
import { createEvent, addEventToPlant, updateEvent, deleteEvent } from '../utils/eventUtils';

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
    const strainRepo = AppDataSource.getRepository(Strain);
    
    // Get strain to copy phase templates
    let strain = null;
    if (req.body.strain) {
      strain = await strainRepo.findOne({ where: { name: req.body.strain } });
    }
    
    // Create phases from strain templates or defaults
    const phases = createPlantPhasesFromStrain(
      strain?.phase_templates || [],
      strain?.is_autoflower || false
    );
    
    const plant = plantRepo.create({
      ...req.body,
      phases,
      current_phase_id: phases[0]?.id
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

router.put('/:id/advance-phase', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    
    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    if (!plant.current_phase_id) {
      return res.status(400).json({ error: 'No current phase to advance from' });
    }
    
    const updatedPhases = advanceToNextPhase(plant.phases, plant.current_phase_id);
    const newCurrentPhase = getCurrentPhase(updatedPhases);
    
    plant.phases = updatedPhases;
    plant.current_phase_id = newCurrentPhase?.id;
    
    const saved = await plantRepo.save(plant);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to advance plant phase' });
  }
});

router.put('/:id/phase/:phaseId/start-date', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { phaseId } = req.params;
    const { startDate } = req.body;
    
    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    plant.phases = updatePhaseStartDate(plant.phases, phaseId, startDate);
    
    const saved = await plantRepo.save(plant);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update phase start date' });
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
    const plantRepo = AppDataSource.getRepository(Plant);
    
    const result = await plantRepo.delete(id);
    if (result.affected === 0) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    res.status(204).send();
  } catch (error) {
    console.error('Delete plant error:', error);
    res.status(500).json({ error: 'Failed to delete plant' });
  }
});

// Event management endpoints
router.post('/:id/events', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { type, title, data, notes } = req.body;
    
    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    // Get current phase ID for event linking
    const currentPhase = getCurrentPhase(plant.phases);
    const newEvent = createEvent(type, title, data, notes, currentPhase?.id);
    
    plant.events = addEventToPlant(plant.events, newEvent);
    
    const saved = await plantRepo.save(plant);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

router.put('/:id/events/:eventId', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { eventId } = req.params;
    
    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    plant.events = updateEvent(plant.events, eventId, req.body);
    
    const saved = await plantRepo.save(plant);
    res.json(saved);
  } catch (error) {
    console.error('Failed to update event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

router.delete('/:id/events/:eventId', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { eventId } = req.params;
    
    const plantRepo = AppDataSource.getRepository(Plant);
    const plant = await plantRepo.findOne({ where: { id } });
    
    if (!plant) {
      return res.status(404).json({ error: 'Plant not found' });
    }
    
    plant.events = deleteEvent(plant.events, eventId);
    
    const saved = await plantRepo.save(plant);
    res.json(saved);
  } catch (error) {
    console.error('Failed to delete event:', error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
});

export { router as plantRoutes };