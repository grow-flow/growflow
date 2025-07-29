#!/usr/bin/with-contenv bashio

# Get configuration from Home Assistant
export MQTT_BROKER=$(bashio::config 'mqtt_broker')
export MQTT_PORT=$(bashio::config 'mqtt_port')
export MQTT_USERNAME=$(bashio::config 'mqtt_username')
export MQTT_PASSWORD=$(bashio::config 'mqtt_password')
export HA_URL=$(bashio::config 'ha_url')
export HA_TOKEN=$(bashio::services 'http' 'supervisor_token')
export LOG_LEVEL=$(bashio::config 'log_level')
export BACKUP_ENABLED=$(bashio::config 'backup_enabled')
export BACKUP_INTERVAL_HOURS=$(bashio::config 'backup_interval_hours')

# Set database path
export DB_PATH=/data/growflow.db

# Start the application
bashio::log.info "Starting GrowFlow Cannabis Tracker..."
cd /app && npm start