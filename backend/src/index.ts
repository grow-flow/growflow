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
// Care events are now handled via plant routes: POST /api/plants/:id/events
app.use('/api/strains', strainRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown',
        mqtt: 'unknown',
        automation: 'unknown'
      }
    };

    // Check database connection
    try {
      const { AppDataSource } = await import('./database');
      health.services.database = AppDataSource.isInitialized ? 'ok' : 'disconnected';
    } catch (error) {
      health.services.database = 'error';
    }

    // Check MQTT connection
    health.services.mqtt = mqttService.isConnected() ? 'ok' : 'disconnected';
    
    // Check automation service
    health.services.automation = automationService.getStatus() ? 'ok' : 'stopped';

    const allServicesOk = Object.values(health.services).every(status => status === 'ok');
    if (!allServicesOk) {
      health.status = 'degraded';
      res.status(503);
    }

    res.json(health);
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      timestamp: new Date().toISOString(),
      error: 'Health check failed'
    });
  }
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