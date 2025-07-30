import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CONFIG } from './config/settings';
import { initializeDatabase } from './database';
import { errorHandler } from './middleware/errorHandler';
import { growAreaRoutes } from './controllers/growAreaController';
import { plantRoutes } from './controllers/plantController';
import { careRoutes } from './controllers/careController';
import { strainRoutes } from './controllers/strainController';
import { mqttService } from './services/mqttService';
import { automationService } from './services/automationService';

const app = express();

app.use(helmet());
app.use(cors({ origin: CONFIG.API.CORS_ORIGIN }));
app.use(morgan('combined'));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  
  if (req.method === 'POST' || req.method === 'PUT') {
    console.log(`[${timestamp}] Request body:`, JSON.stringify(req.body, null, 2));
  }
  
  const originalSend = res.json;
  res.json = function(body) {
    if (res.statusCode >= 400) {
      console.error(`[${timestamp}] Error response ${res.statusCode}:`, body);
    }
    return originalSend.call(this, body);
  };
  
  next();
});

app.use('/api/grow-areas', growAreaRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/care', careRoutes);
app.use('/api/strains', strainRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const start = async () => {
  try {
    await initializeDatabase();
    
    await mqttService.connect();
    await automationService.start();
    
    app.listen(CONFIG.API.PORT, () => {
      console.log(`Server running on port ${CONFIG.API.PORT}`);
      mqttService.publishStatus('online');
    });

    process.on('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      mqttService.publishStatus('offline');
      automationService.stop();
      mqttService.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();