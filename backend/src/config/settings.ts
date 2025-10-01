export const CONFIG = {
  API: {
    PORT: parseInt(process.env.PORT || '8080', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'development' ? '*' : '*')
  },

  SECURITY: {
    ALLOWED_FRAME_ANCESTORS: process.env.ALLOWED_FRAME_ANCESTORS?.split(',') || ["'self'", "*"],
    TRUST_PROXY: process.env.TRUST_PROXY === 'true' || false
  },

  DATABASE: {
    PATH: process.env.DB_PATH || './data/growflow.db',
    // Auto-sync enabled by default for ease of use (new installs + updates)
    // Set DISABLE_DB_SYNC=true to disable for advanced users with migrations
    SYNC: process.env.DISABLE_DB_SYNC !== 'true'
  },

  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};