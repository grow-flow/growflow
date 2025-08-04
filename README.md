# GrowFlow Home Assistant Add-on Repository

[![GitHub Release][releases-shield]][releases]
[![GitHub Activity][commits-shield]][commits]
[![License][license-shield]](LICENSE)

![Supports amd64 Architecture][amd64-shield]
![Supports aarch64 Architecture][aarch64-shield]
![Supports armv7 Architecture][armv7-shield]

_Plant tracking system with comprehensive lifecycle management and automation._

## About

GrowFlow is a comprehensive Home Assistant add-on for plant growth management. It provides complete lifecycle tracking from germination to harvest with automated climate control, detailed analytics, and seamless Home Assistant integration.

## Installation

1. Navigate in your Home Assistant frontend to **Supervisor** → **Add-on Store**
2. Click the 3-dots menu at upper right **...** → **Repositories**
3. Add this repository URL: `https://github.com/moritzheine/growflow`
4. Find "GrowFlow" in the add-on store and click it
5. Click "Install" and wait for installation to complete
6. Configure the add-on (see configuration section below)
7. Start the add-on
8. Access the web interface at `http://your-ha-ip:8080`

## Configuration

Add-on configuration:

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

### Option: `mqtt_broker`

The MQTT broker hostname or IP address. Use `core-mosquitto` if using the Mosquitto broker add-on.

### Option: `mqtt_port`

The MQTT broker port (default: 1883).

### Option: `ha_url`

Home Assistant URL for API access (default: `http://supervisor/core`).

### Option: `ha_token`

Home Assistant long-lived access token for API authentication.

### Option: `log_level`

Controls the level of log output. Valid values are `trace`, `debug`, `info`, `warn`, `error`, and `fatal`.

## Features

- 🌱 **Complete Plant Lifecycle**: Track plants through 9 growth phases
- 📊 **Grow Area Management**: Equipment and sensor mapping to HA entities
- 🌡️ **VPD Automation**: Automated climate control based on plant phases
- 💡 **Light Scheduling**: Automatic light cycle management
- 💧 **Care Tracking**: Log watering, feeding, and observations
- 📈 **Analytics**: Environmental data and growth charts
- 📡 **MQTT Integration**: Auto-discovery for sensors and devices
- 🔄 **Real-time Updates**: WebSocket support for live data

## Support

For help with this add-on, please create an issue in this GitHub repository.

## Contributing

This is an active open-source project. We are always open to people who want to
use the code or contribute to it.

## License

MIT License

Copyright (c) 2025 GrowFlow

[amd64-shield]: https://img.shields.io/badge/amd64-yes-green.svg
[aarch64-shield]: https://img.shields.io/badge/aarch64-yes-green.svg
[armv7-shield]: https://img.shields.io/badge/armv7-yes-green.svg
[commits-shield]: https://img.shields.io/github/commit-activity/y/moritzheine/growflow.svg
[commits]: https://github.com/moritzheine/growflow/commits/main
[license-shield]: https://img.shields.io/github/license/moritzheine/growflow.svg
[releases-shield]: https://img.shields.io/github/release/moritzheine/growflow.svg
[releases]: https://github.com/moritzheine/growflow/releases
