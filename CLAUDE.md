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

# Fix linting issues automatically
npm run backend:lint -- --fix
npm run frontend:lint -- --fix

# Type checking (backend only - frontend uses react-scripts)
cd backend && npm run build  # TypeScript compilation serves as type check

# Backend specific commands
cd backend && npm run dev     # Start backend dev server (nodemon)
cd backend && npm run build   # Compile TypeScript
cd backend && npm run lint    # ESLint backend code
cd backend && npm test        # Run Jest tests

# Frontend specific commands
cd frontend && npm start      # Start React dev server
cd frontend && npm run build  # Build React app
cd frontend && npm run lint   # ESLint frontend code
cd frontend && npm test       # Run React tests
```

## Architecture Overview

**GrowFlow** is a cannabis plant tracking system designed as a Home Assistant add-on with comprehensive lifecycle management and automation capabilities.

### Backend (Express.js + TypeScript + SQLite)
- **Database**: TypeORM with SQLite (growflow.db) - models in `backend/src/models/`
- **Core Models**: GrowArea, Plant, Strain, Event, Phase, EnvironmentLog
- **Plant Phases**: 9-stage lifecycle (germination → seedling → vegetation → pre_flower → flowering → flushing → harvest → drying → curing)
- **Automation**: VPD-based climate control, automatic light scheduling
- **Integrations**: MQTT for Home Assistant, WebSocket for real-time updates
- **Configuration**: Centralized in `backend/src/config/settings.ts`
- **API**: RESTful endpoints with validation, main routes in `backend/src/routes/`

### Frontend (React + Material-UI + React Query)
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router with pages: Dashboard, Plants, Strains, Grow Area Detail, Plant Detail, Settings
- **Components**: Material-UI components with custom grow area and plant management dialogs
- **API Layer**: Axios-based service in `frontend/src/services/api.ts`
- **Types**: Shared TypeScript interfaces between frontend/backend

### Key Integrations
- **Home Assistant**: REST API integration for sensor data and device control
- **MQTT**: Publish/subscribe for real-time automation and sensor updates (topic: `growflow`)
- **WebSocket**: Real-time frontend updates on port 8080
- **Automation Services**: Cron-based VPD monitoring and light schedule management

### Data Flow
1. GrowAreas contain Plants with specific equipment/sensor mappings
2. Plants progress through 9 lifecycle phases with automatic date tracking
3. Care activities (watering/feeding/observations) are logged per plant
4. Environment data flows from HA sensors → MQTT → Backend → Frontend
5. Automation services adjust climate based on plant phases and VPD targets
6. WebSocket broadcasts real-time updates to connected frontend clients

### Development Notes
- Settings are centralized in `backend/src/config/settings.ts` using environment variables
- Database auto-synchronizes in development (disabled in production)
- Frontend proxies API requests to localhost:8080 (configured in `frontend/package.json`)
- Both backend and frontend use ESLint for code quality with auto-fix available
- TypeScript strict mode enabled across the project
- Backend uses nodemon for hot reloading during development
- Frontend uses React dev server with hot module replacement

### Important File Locations
- **API Layer**: `frontend/src/services/api.ts` - all backend communication
- **Models**: `backend/src/models/` - TypeORM entity definitions
- **Configuration**: `backend/src/config/settings.ts` - environment-based config
- **Types**: Shared interfaces between frontend/backend in respective `types/` directories

### Testing & Quality
- **Linting**: ESLint with TypeScript support for both backend and frontend
- **Backend**: Jest testing framework, run with `npm test` in backend directory
- **Frontend**: React Testing Library with Jest (via react-scripts)
- **Type Safety**: TypeScript strict mode enabled, use `npm run build` for type checking