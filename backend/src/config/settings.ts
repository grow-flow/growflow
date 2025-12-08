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
    PATH: process.env.DB_PATH || './data/growflow.db',
    SYNC: process.env.NODE_ENV === 'production'
      ? process.env.FORCE_DB_SYNC === 'true'
      : process.env.DISABLE_DB_SYNC !== 'true'
  },

  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};