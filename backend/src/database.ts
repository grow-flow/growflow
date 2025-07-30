import { DataSource } from 'typeorm';
import { CONFIG } from './config/settings';
import { GrowArea, Plant, WateringLog, FeedingLog, ObservationLog, EnvironmentLog, Strain } from './models';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: CONFIG.DATABASE.PATH,
  synchronize: CONFIG.DATABASE.SYNC,
  logging: CONFIG.LOG_LEVEL === 'debug',
  entities: [
    GrowArea,
    Plant,
    WateringLog,
    FeedingLog,
    ObservationLog,
    EnvironmentLog,
    Strain
  ],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database initialized successfully');
    
    // Create default grow area if none exists
    const growAreaRepo = AppDataSource.getRepository(GrowArea);
    const count = await growAreaRepo.count();
    
    if (count === 0) {
      const defaultGrowArea = growAreaRepo.create({
        name: 'Main Grow Area',
        type: 'indoor',
        dimensions: { length: 120, width: 60, height: 180 },
        equipment: { lights: [], fans: [] },
        sensors: { temperature: '', humidity: '' },
        automation_enabled: false,
        target_vpd_by_phase: {
          germination: 0.6,
          seedling: 0.8,
          vegetation: 1.0,
          flowering: 1.2
        }
      });
      
      await growAreaRepo.save(defaultGrowArea);
      console.log('Created default grow area');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};