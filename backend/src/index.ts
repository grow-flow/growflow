import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { CONFIG } from './config/settings';
import { initializeDatabase } from './database';
import { errorHandler } from './middleware/errorHandler';
import { plantRoutes } from './controllers/plantController';
import { strainRoutes } from './controllers/strainController';

const app = express();

// Trust proxy for reverse proxy setups (Home Assistant, nginx, etc)
if (CONFIG.SECURITY.TRUST_PROXY) {
  app.set('trust proxy', 1);
}

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      frameAncestors: CONFIG.SECURITY.ALLOWED_FRAME_ANCESTORS,
      frameSrc: ["'self'"],
      connectSrc: ["'self'"]
    }
  },
  frameguard: false,
  crossOriginEmbedderPolicy: false
}));
app.use(cors({ origin: CONFIG.API.CORS_ORIGIN, credentials: true }));
app.use(morgan('combined'));
app.use(express.json());

// Request logging middleware (only errors in production)
app.use((req, res, next) => {
  if (CONFIG.LOG_LEVEL === 'debug') {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.path}`);

    if (req.method === 'POST' || req.method === 'PUT') {
      console.log(`[${timestamp}] Request body:`, JSON.stringify(req.body, null, 2));
    }
  }

  const originalSend = res.json;
  res.json = function(body) {
    if (res.statusCode >= 400) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Error response ${res.statusCode}:`, body);
    }
    return originalSend.call(this, body);
  };

  next();
});

// Ingress detection middleware (no path stripping needed - Ingress does it)
app.use((req, res, next) => {
  const ingressPath = req.headers['x-ingress-path'] as string;

  if (ingressPath && CONFIG.LOG_LEVEL === 'debug') {
    console.log(`🟢 [Ingress] Request via Ingress: ${req.method} ${req.url} (Base: ${ingressPath})`);
  }

  next();
});

app.use('/api/plants', plantRoutes);
// Care events are now handled via plant routes: POST /api/plants/:id/events
app.use('/api/strains', strainRoutes);

app.get('/api/health', async (req, res) => {
  try {
    const health = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'unknown'
      }
    };

    // Check database connection
    try {
      const { AppDataSource } = await import('./database');
      health.services.database = AppDataSource.isInitialized ? 'ok' : 'disconnected';
    } catch (error) {
      health.services.database = 'error';
    }

    if (health.services.database !== 'ok') {
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

// Serve React frontend static files
const frontendPath = path.join(__dirname, '../../frontend/build');

app.use(express.static(frontendPath, {
  index: false // Don't serve index.html automatically
}));

// Catch-all handler for React Router with Ingress support
// Serve index.html for all non-API, non-file requests (SPA routing)
app.get('*', (req, res) => {
  const ingressPath = req.headers['x-ingress-path'] as string || '';
  const indexPath = path.join(frontendPath, 'index.html');

  if (ingressPath) {
    // Inject base tag for Ingress routing
    let html = fs.readFileSync(indexPath, 'utf8');
    html = html.replace('<head>', `<head><base href="${ingressPath}/">`);
    res.send(html);
  } else {
    // Normal serving without modifications
    res.sendFile(indexPath);
  }
});

app.use(errorHandler);

const start = async () => {
  try {
    await initializeDatabase();
    
    app.listen(CONFIG.API.PORT, '0.0.0.0', () => {
      console.log(`GrowFlow server running on port ${CONFIG.API.PORT}`);
    });

    process.on('SIGTERM', () => {
      console.log('Shutting down gracefully...');
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();