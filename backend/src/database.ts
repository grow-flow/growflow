import { DataSource } from 'typeorm';
import { CONFIG } from './config/settings';
import { Plant, Strain } from './models';
import { InitialSchema1733666000000 } from './migrations/1733666000000-InitialSchema';
import { UpdateStrainType1733667000000 } from './migrations/1733667000000-UpdateStrainType';

export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: CONFIG.DATABASE.PATH,
  synchronize: false,
  logging: CONFIG.LOG_LEVEL === 'debug',
  entities: [Plant, Strain],
  migrations: [InitialSchema1733666000000, UpdateStrainType1733667000000],
  migrationsRun: true,
});

export const initializeDatabase = async () => {
  try {
    console.log('🔵 [DB] Initializing database...');
    console.log('🔵 [DB] Path:', CONFIG.DATABASE.PATH);
    console.log('🔵 [DB] Auto-migrations: enabled');
    await AppDataSource.initialize();
    console.log('🟢 [DB] Initialized successfully');
  } catch (error) {
    console.error('🔴 [DB] Initialization failed:', error);
    throw error;
  }
};