#!/bin/bash
set -e

# Source bashio if available
if [ -f "/usr/lib/bashio/bashio.sh" ]; then
    source /usr/lib/bashio/bashio.sh
fi

# Function to check if running in Home Assistant Supervisor
is_hassio() {
    [ -f "/data/options.json" ] || [ -n "${SUPERVISOR_TOKEN:-}" ]
}

# Function to get config value using bashio (if available) or fallback
get_config() {
    local key="$1"
    local default="$2"
    
    if is_hassio && command -v bashio >/dev/null 2>&1; then
        bashio::config "$key" 2>/dev/null || echo "$default"
    else
        echo "$default"
    fi
}

# Function to log messages
log_info() {
    if is_hassio && command -v bashio >/dev/null 2>&1; then
        bashio::log.info "$1" 2>/dev/null || echo "[INFO] $1"
    else
        echo "[INFO] $1"
    fi
}

log_error() {
    if is_hassio && command -v bashio >/dev/null 2>&1; then
        bashio::log.error "$1" 2>/dev/null || echo "[ERROR] $1" >&2
    else
        echo "[ERROR] $1" >&2
    fi
}

# Wait for data directory if running in Home Assistant
if is_hassio; then
    while [ ! -d "/data" ]; do
        log_info "Waiting for data directory..."
        sleep 1
    done
fi

# Set up environment variables
if is_hassio; then
    log_info "Running in Home Assistant Supervisor mode"
    
    export MQTT_BROKER=$(get_config 'mqtt_broker' 'core-mosquitto')
    export MQTT_PORT=$(get_config 'mqtt_port' '1883')
    export MQTT_USERNAME=$(get_config 'mqtt_username' '')
    export MQTT_PASSWORD=$(get_config 'mqtt_password' '')
    export HA_URL=$(get_config 'ha_url' 'http://supervisor/core')
    export HA_TOKEN="${SUPERVISOR_TOKEN}"
    export LOG_LEVEL=$(get_config 'log_level' 'info')
    export BACKUP_ENABLED=$(get_config 'backup_enabled' 'true')
    export BACKUP_INTERVAL_HOURS=$(get_config 'backup_interval_hours' '24')
    export DB_PATH="/data/growflow.db"
else
    log_info "Running in standalone mode"
    
    # Use environment variables or defaults
    export MQTT_BROKER="${MQTT_BROKER:-localhost}"
    export MQTT_PORT="${MQTT_PORT:-1883}"
    export MQTT_USERNAME="${MQTT_USERNAME:-}"
    export MQTT_PASSWORD="${MQTT_PASSWORD:-}"
    export HA_URL="${HA_URL:-http://localhost:8123}"
    export HA_TOKEN="${HA_TOKEN:-}"
    export LOG_LEVEL="${LOG_LEVEL:-info}"
    export BACKUP_ENABLED="${BACKUP_ENABLED:-false}"
    export BACKUP_INTERVAL_HOURS="${BACKUP_INTERVAL_HOURS:-24}"
    export DB_PATH="${DB_PATH:-./data/growflow.db}"
fi

# Set production environment
export NODE_ENV=production

# Log configuration
log_info "Starting GrowFlow Plant Tracker..."
log_info "MQTT Broker: ${MQTT_BROKER}:${MQTT_PORT}"
log_info "Home Assistant URL: ${HA_URL}"
log_info "Database path: ${DB_PATH}"
log_info "Log level: ${LOG_LEVEL}"

# Change to app directory
cd /app || {
    log_error "Could not change directory to /app"
    exit 1
}

# Start the application directly from compiled backend
log_info "Starting Node.js application..."
cd /app/backend || {
    log_error "Could not change directory to /app/backend"
    exit 1
}
exec node dist/index.js