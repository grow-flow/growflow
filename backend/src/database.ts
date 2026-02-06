import { PrismaClient } from '@prisma/client';
import { CONFIG } from './config/settings';

export const prisma = new PrismaClient({
  log: CONFIG.LOG_LEVEL === 'debug' ? ['query', 'info', 'warn', 'error'] : ['error']
});

export const initializeDatabase = async () => {
  try {
    console.log('🔵 [DB] Initializing Prisma...');
    console.log('🔵 [DB] Path:', CONFIG.DATABASE.PATH);
    await prisma.$connect();
    console.log('🟢 [DB] Initialized successfully');
  } catch (error) {
    console.error('🔴 [DB] Initialization failed:', error);
    throw error;
  }
};
