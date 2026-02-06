import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { CONFIG } from './config/settings';
import { initializeDatabase } from './database';
import { errorHandler } from './middleware/errorHandler';
import { plantRoutes } from './controllers/plantController';
import { strainRoutes } from './controllers/strainController';

const app = express();

// Trust proxy for reverse proxy setups (Home Assistant, nginx, etc)
// This makes req.protocol respect X-Forwarded-Proto header
app.set('trust proxy', 1);

// Dynamic security headers based on protocol
app.use((req, res, next) => {
  const isHTTPS = req.protocol === 'https';
  const shouldUpgradeHTTPS = !CONFIG.SECURITY.DISABLE_HTTPS_UPGRADE && isHTTPS;

  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "data:", "https:", "http:"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:", "http:"],
        imgSrc: ["'self'", "data:", "blob:", "https:", "http:"],
        fontSrc: ["'self'", "data:", "https:", "http:"],
        frameAncestors: CONFIG.SECURITY.ALLOWED_FRAME_ANCESTORS,
        frameSrc: ["'self'"],
        connectSrc: ["'self'", "https:", "http:", "ws:", "wss:"],
        workerSrc: ["'self'", "blob:"],
        childSrc: ["'self'", "blob:"],
        upgradeInsecureRequests: shouldUpgradeHTTPS ? [] : null
      }
    },
    hsts: isHTTPS ? { maxAge: 15552000, includeSubDomains: true } : false,
    frameguard: false,
    crossOriginEmbedderPolicy: false
  })(req, res, next);
});
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
  const isIngress = req.url.includes('/api/hassio_ingress') || ingressPath;

  if (isIngress || CONFIG.LOG_LEVEL === 'debug') {
    console.log(`🔵 [Request] ${req.method} ${req.url}`);
    console.log(`   Headers: x-ingress-path=${ingressPath}, host=${req.headers.host}`);
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

    try {
      const { prisma } = await import('./database');
      await prisma.$queryRaw`SELECT 1`;
      health.services.database = 'ok';
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

// Catch-all handler for React Router (SPA routing)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendPath, 'index.html');
  console.log(`📄 [HTML] Serving index.html for: ${req.url}`);
  res.sendFile(indexPath);
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