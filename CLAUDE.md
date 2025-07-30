# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Start both backend and frontend in development mode
npm run dev

# Build both backend and frontend
npm run build

# Run tests for both backend and frontend
npm run test

# Run linting for both backend and frontend
npm run lint

# Backend specific commands
cd backend && npm run dev     # Start backend dev server (nodemon)
cd backend && npm run build   # Compile TypeScript
cd backend && npm run lint    # ESLint backend code

# Frontend specific commands
cd frontend && npm start      # Start React dev server
cd frontend && npm run build  # Build React app
cd frontend && npm run lint   # ESLint frontend code
```

## Architecture Overview

**GrowFlow** is a cannabis plant tracking system designed as a Home Assistant add-on with comprehensive lifecycle management and automation capabilities.

### Backend (Express.js + TypeScript + SQLite)
- **Database**: TypeORM with SQLite (growflow.db)
- **Core Models**: Growbox, Plant, WateringLog, FeedingLog, ObservationLog, EnvironmentLog
- **Plant Phases**: 9-stage lifecycle (germination → seedling → vegetation → pre_flower → flowering → flushing → harvest → drying → curing)
- **Automation**: VPD-based climate control, automatic light scheduling
- **Integrations**: MQTT for Home Assistant, WebSocket for real-time updates
- **Configuration**: Centralized in `backend/src/config/settings.ts`

### Frontend (React + Material-UI + React Query)
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router with pages: Dashboard, Plants, Strains, Growbox Detail, Plant Detail, Settings
- **Components**: Material-UI components with custom growbox and plant management dialogs
- **API Layer**: Axios-based service in `frontend/src/services/api.ts`
- **Types**: Shared TypeScript interfaces between frontend/backend

### Key Integrations
- **Home Assistant**: REST API integration for sensor data and device control
- **MQTT**: Publish/subscribe for real-time automation and sensor updates
- **Automation Services**: Cron-based VPD monitoring and light schedule management

### Data Flow
1. Growboxes contain Plants with specific equipment/sensor mappings
2. Plants progress through 9 lifecycle phases with automatic date tracking
3. Care activities (watering/feeding/observations) are logged per plant
4. Environment data flows from HA sensors → MQTT → Backend → Frontend
5. Automation services adjust climate based on plant phases and VPD targets

### Development Notes
- Settings are centralized in `backend/src/config/settings.ts` using environment variables
- Database auto-synchronizes in development (disabled in production)
- Frontend proxies API requests to localhost:8080
- Both backend and frontend use ESLint for code quality
- TypeScript strict mode enabled across the project