import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { CONFIG } from '../../config/settings';
import { initializeDatabase } from './database';
import { errorHandler } from './middleware/errorHandler';
import { growboxRoutes } from './controllers/growboxController';
import { plantRoutes } from './controllers/plantController';
import { careRoutes } from './controllers/careController';
import { mqttService } from './services/mqttService';
import { automationService } from './services/automationService';

const app = express();

app.use(helmet());
app.use(cors({ origin: CONFIG.API.CORS_ORIGIN }));
app.use(morgan('combined'));
app.use(express.json());

app.use('/api/growboxes', growboxRoutes);
app.use('/api/plants', plantRoutes);
app.use('/api/care', careRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

const start = async () => {
  try {
    await initializeDatabase();
    
    await mqttService.connect();
    automationService.start();
    
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