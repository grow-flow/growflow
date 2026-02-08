export const CONFIG = {
  NODE_ENV: process.env.NODE_ENV || 'development',

  API: {
    PORT: parseInt(process.env.PORT || '8080', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
  },

  SECURITY: {
    ALLOWED_FRAME_ANCESTORS: process.env.ALLOWED_FRAME_ANCESTORS?.split(',') || ["'self'", "*"],
    DISABLE_HTTPS_UPGRADE: process.env.DISABLE_HTTPS_UPGRADE === 'true'
  },

  DATABASE: {
    PATH: process.env.DB_PATH || './data/growflow.db'
  },

  UPLOADS: {
    PATH: process.env.UPLOADS_PATH || './data/uploads',
    MAX_SIZE_MB: parseInt(process.env.UPLOADS_MAX_SIZE_MB || '10', 10),
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'],
    MAX_PER_EVENT: 10
  },

  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};