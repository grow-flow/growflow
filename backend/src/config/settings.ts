export const CONFIG = {
  API: {
    PORT: parseInt(process.env.PORT || '8080', 10),
    CORS_ORIGIN: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'development' ? '*' : 'http://localhost:3000')
  },
  
  DATABASE: {
    PATH: process.env.DB_PATH || './data/growflow.db',
    SYNC: process.env.NODE_ENV !== 'production' || process.env.FORCE_DB_SYNC === 'true'
  },
  
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};