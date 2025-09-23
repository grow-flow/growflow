import { DataSource } from 'typeorm';
import { CONFIG } from './config/settings';
import { Plant, Strain } from './models';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: CONFIG.DATABASE.PATH,
  synchronize: CONFIG.DATABASE.SYNC,
  logging: CONFIG.LOG_LEVEL === 'debug',
  entities: [Plant, Strain],
});

export const initializeDatabase = async () => {
  try {
    await AppDataSource.initialize();
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
};