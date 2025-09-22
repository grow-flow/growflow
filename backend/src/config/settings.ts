export const CONFIG = {
  API: {
    PORT: process.env.PORT || 8080,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  DATABASE: {
    PATH: process.env.DB_PATH || './data/growflow.db',
    SYNC: process.env.NODE_ENV !== 'production' || process.env.FORCE_DB_SYNC === 'true'
  },
  
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};