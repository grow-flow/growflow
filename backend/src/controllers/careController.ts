import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database';
import { WateringLog, FeedingLog, ObservationLog } from '../models';

const router = Router();

router.post('/water', async (req: Request, res: Response) => {
  try {
    const wateringRepo = AppDataSource.getRepository(WateringLog);
    const log = wateringRepo.create(req.body);
    const saved = await wateringRepo.save(log);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log watering' });
  }
});

router.post('/feed', async (req: Request, res: Response) => {
  try {
    const feedingRepo = AppDataSource.getRepository(FeedingLog);
    const log = feedingRepo.create(req.body);
    const saved = await feedingRepo.save(log);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log feeding' });
  }
});

router.post('/observation', async (req: Request, res: Response) => {
  try {
    const observationRepo = AppDataSource.getRepository(ObservationLog);
    const log = observationRepo.create(req.body);
    const saved = await observationRepo.save(log);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: 'Failed to log observation' });
  }
});

router.get('/:plantId/history', async (req: Request, res: Response) => {
  try {
    const plantId = parseInt(req.params.plantId);
    
    const watering = await AppDataSource.getRepository(WateringLog).find({
      where: { plant_id: plantId },
      order: { timestamp: 'DESC' },
      take: 50
    });
    
    const feeding = await AppDataSource.getRepository(FeedingLog).find({
      where: { plant_id: plantId },
      order: { timestamp: 'DESC' },
      take: 50
    });
    
    const observations = await AppDataSource.getRepository(ObservationLog).find({
      where: { plant_id: plantId },
      order: { timestamp: 'DESC' },
      take: 50
    });
    
    res.json({ watering, feeding, observations });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch care history' });
  }
});

export { router as careRoutes };