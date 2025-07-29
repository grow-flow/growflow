# GrowFlow - Cannabis Plant Tracker

Home Assistant Add-on für professionelles Cannabis-Anbau-Management mit vollständiger Lifecycle-Tracking und Automation.

## Features

- **Growbox Management**: Equipment & Sensor-Mapping zu HA Entities
- **Plant Lifecycle**: 9 Wachstumsphasen mit automatischem Tracking
- **VPD Automation**: Phasenbasierte Klimasteuerung
- **Light Schedules**: Automatische Lichtzyklen (18/6 → 12/12)
- **Care Tracking**: Bewässerung, Düngung, Beobachtungen
- **Analytics**: Umgebungsdaten, Growth Charts, Strain-Vergleiche
- **MQTT Integration**: Auto-Discovery für alle Sensoren

## Installation

1. Repository zur Home Assistant Add-on Store hinzufügen
2. Add-on installieren und konfigurieren
3. MQTT Broker und HA API Token einrichten
4. Erste Growbox erstellen

## Konfiguration

```yaml
mqtt_broker: core-mosquitto
mqtt_port: 1883
ha_url: http://supervisor/core
log_level: info
backup_enabled: true
```

## Tech Stack

- **Backend**: Express.js + TypeScript + SQLite
- **Frontend**: React + Material-UI
- **Integration**: MQTT + HA REST API
- **Automation**: Cron-basierte VPD/Light Control

## Development

```bash
npm install
npm run dev
```

## Lizenz

MIT