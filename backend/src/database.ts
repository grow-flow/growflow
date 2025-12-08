import { DataSource } from 'typeorm';
import { CONFIG } from './config/settings';
import { Plant, Strain } from './models';
import { InitialSchema1733666000000 } from './migrations/1733666000000-InitialSchema';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: CONFIG.DATABASE.PATH,
  synchronize: CONFIG.DATABASE.SYNC,
  logging: CONFIG.LOG_LEVEL === 'debug',
  entities: [Plant, Strain],
  migrations: [InitialSchema1733666000000],
  migrationsRun: true,
});

export const initializeDatabase = async () => {
  try {
    console.log('🔵 [DB] Initializing database...');
    console.log('🔵 [DB] Database path:', CONFIG.DATABASE.PATH);
    console.log('🔵 [DB] Synchronize:', CONFIG.DATABASE.SYNC);
    console.log('🔵 [DB] Migrations enabled: true');
    await AppDataSource.initialize();
    console.log('🟢 [DB] Database initialized successfully');
    console.log('🟢 [DB] Is initialized:', AppDataSource.isInitialized);
  } catch (error) {
    console.error('🔴 [DB] Database initialization failed:', error);
    throw error;
  }
};