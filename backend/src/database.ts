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
    console.log('🔵 [DB] Initializing database...');
    console.log('🔵 [DB] Database path:', CONFIG.DATABASE.PATH);
    console.log('🔵 [DB] Synchronize:', CONFIG.DATABASE.SYNC);
    await AppDataSource.initialize();
    console.log('🟢 [DB] Database initialized successfully');
    console.log('🟢 [DB] Is initialized:', AppDataSource.isInitialized);
  } catch (error) {
    console.error('🔴 [DB] Database initialization failed:', error);
    throw error;
  }
};