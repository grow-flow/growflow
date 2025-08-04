export const CONFIG = {
  API: {
    PORT: process.env.PORT || 8080,
    CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000'
  },
  
  DATABASE: {
    PATH: process.env.DB_PATH || './data/growflow.db',
    SYNC: process.env.NODE_ENV !== 'production' || process.env.FORCE_DB_SYNC === 'true'
  },
  
  HOME_ASSISTANT: {
    URL: process.env.HA_URL || 'http://localhost:8123',
    TOKEN: process.env.HA_TOKEN || '',
    TIMEOUT: 5000
  },
  
  MQTT: {
    BROKER: process.env.MQTT_BROKER || 'localhost',
    PORT: parseInt(process.env.MQTT_PORT || '1883'),
    USERNAME: process.env.MQTT_USERNAME || '',
    PASSWORD: process.env.MQTT_PASSWORD || '',
    TOPIC_PREFIX: 'growflow'
  },
  
  AUTOMATION: {
    VPD_CHECK_INTERVAL: 60000, // 1 minute
    LIGHT_CHECK_INTERVAL: 30000, // 30 seconds
    SENSOR_UPDATE_INTERVAL: 30000 // 30 seconds
  },
  
  BACKUP: {
    ENABLED: process.env.BACKUP_ENABLED === 'true',
    INTERVAL_HOURS: parseInt(process.env.BACKUP_INTERVAL_HOURS || '24'),
    RETAIN_COUNT: 7
  },
  
  LOG_LEVEL: process.env.LOG_LEVEL || 'info'
};