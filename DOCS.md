# GrowFlow Documentation

## Overview

GrowFlow is a comprehensive plant tracking system designed as a Home Assistant add-on. It provides complete lifecycle management from germination to harvest with automated climate control and detailed analytics.

## Features

- **Complete Plant Lifecycle**: Track plants through 9 growth phases
- **Grow Area Management**: Equipment and sensor mapping to Home Assistant entities
- **VPD Automation**: Automated climate control based on plant phases
- **Light Scheduling**: Automatic light cycle management (18/6 → 12/12)
- **Care Tracking**: Log watering, feeding, and observations
- **Analytics**: Environmental data, growth charts, and strain comparisons
- **MQTT Integration**: Auto-discovery for all sensors and devices

## Installation

1. Add this repository to your Home Assistant Add-on Store
2. Install the GrowFlow add-on
3. Configure the add-on with your MQTT broker settings
4. Start the add-on
5. Access the web interface at `http://your-ha-ip:8080`

## Configuration

### Basic Configuration

```yaml
mqtt_broker: core-mosquitto
mqtt_port: 1883
mqtt_username: ""
mqtt_password: ""
ha_url: http://supervisor/core
ha_token: ""
log_level: info
backup_enabled: true
```

### MQTT Settings

The add-on requires an MQTT broker to communicate with Home Assistant. If you're using the Mosquitto broker add-on, use `core-mosquitto` as the broker address.

### Home Assistant API

Configure the Home Assistant URL and long-lived access token for sensor data retrieval and device control.

## Usage

### Setting Up Your First Grow Area

1. Navigate to the Plants section
2. Create a new grow area with your equipment mappings
3. Map your sensors (temperature, humidity, etc.) to Home Assistant entities
4. Configure your devices (lights, fans, pumps) for automation

### Adding Plants

1. Create or select a strain
2. Add a new plant to your grow area
3. The system will automatically track the plant through its lifecycle phases
4. Log care activities as you tend to your plants

### Automation

GrowFlow automatically:

- Calculates VPD (Vapor Pressure Deficit) based on current conditions
- Adjusts climate settings based on plant growth phase
- Manages light schedules (vegetative vs flowering)
- Sends alerts for care activities

## API Endpoints

The add-on exposes a REST API for advanced integrations:

- `GET /api/plants` - List all plants
- `GET /api/grow-areas` - List all grow areas
- `GET /api/strains` - List all strains
- `POST /api/plants` - Create new plant
- `PUT /api/plants/:id` - Update plant
- `DELETE /api/plants/:id` - Delete plant

## Troubleshooting

### Add-on Won't Start

1. Check the add-on logs for error messages
2. Verify MQTT broker is running and accessible
3. Ensure Home Assistant API token is valid

### Sensors Not Updating

1. Verify MQTT broker configuration
2. Check entity names in grow area settings
3. Ensure entities exist in Home Assistant

### Web Interface Not Loading

1. Check if port 8080 is accessible
2. Verify add-on is running without errors
3. Try accessing via different browser

## Support

For issues and feature requests, please visit the GitHub repository or Home Assistant Community Forum.
