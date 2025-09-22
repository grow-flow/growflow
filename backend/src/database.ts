import { DataSource } from 'typeorm';
import { CONFIG } from './config/settings';
import { GrowArea, Plant, Strain } from './models';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: CONFIG.DATABASE.PATH,
  synchronize: CONFIG.DATABASE.SYNC,
  logging: CONFIG.LOG_LEVEL === 'debug',
  entities: [
    GrowArea,
    Plant,
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
        dimensions: { length: 120, width: 60, height: 180 }
      });
      
      await growAreaRepo.save(defaultGrowArea);
      console.log('Created default grow area');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};