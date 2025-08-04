# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Local Development (outside Home Assistant)
npm run dev                   # Start both backend and frontend in development mode
npm run build                 # Build both backend and frontend
npm run test                  # Run tests for both backend and frontend
npm run lint                  # Run linting for both backend and frontend

# Fix linting issues automatically (run from respective directories)
cd backend && npm run lint:fix
cd frontend && npm run lint:fix

# Type checking
cd backend && npm run build   # TypeScript compilation serves as type check
cd frontend && npm run build  # React TypeScript compilation

# Backend specific commands
cd backend && npm run dev     # Start backend dev server (nodemon on port 8080)
cd backend && npm run build   # Compile TypeScript to dist/
cd backend && npm run start   # Run compiled JS from dist/
cd backend && npm run lint    # ESLint backend code
cd backend && npm test        # Run Jest tests

# Frontend specific commands  
cd frontend && npm start      # Start React dev server (port 3000, proxies to backend)
cd frontend && npm run build  # Build React app for production
cd frontend && npm run lint   # ESLint frontend code  
cd frontend && npm test       # Run React tests with react-scripts

# Home Assistant Add-on Development

# Quick add-on testing (build + run + health check)
npm run test:addon               # Build, run, and test add-on container

# Individual Docker commands
npm run docker:build            # Build local dev image (fast: ~6 seconds with pre-built files)
npm run docker:build:ha         # Build Home Assistant image (full: ~2-3 minutes, builds from source)
npm run docker:run              # Run add-on container in background
npm run docker:dev              # Run in development mode (interactive)
npm run docker:health           # Check if add-on is responding
npm run docker:logs             # View add-on logs
npm run docker:stop             # Stop running container
npm run docker:clean            # Remove built image

# Manual Docker commands (if needed)
docker build -t local/growflow:test .              # Build with cache optimization
docker run --rm -p 8080:8080 local/growflow:test   # Test container manually
```

## Architecture Overview

**GrowFlow** is a plant tracking system designed as a Home Assistant add-on with comprehensive lifecycle management and automation capabilities.

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

### Docker Build Optimization

**Two build strategies for different use cases:**

1. **Local Development** (Dockerfile.local): 
   - Pre-compiles TypeScript and React locally
   - Copies built files to container (~6 seconds)
   - Command: `npm run docker:build`

2. **Home Assistant Deployment** (Dockerfile):
   - Multi-stage build compiles everything inside container  
   - Builds from source (required for HA add-on store)
   - Command: `npm run docker:build:ha` (~2-3 minutes)

**Shared optimizations:**
- **Layer caching**: System deps and npm packages cached separately from source code
- **Optimized .dockerignore**: Excludes unnecessary files for faster context transfer
- **Development workflow**: `npm run test:addon` for complete build/test cycle

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

## Home Assistant Add-on Specific

### Add-on Structure
- **Base Image**: Uses `ghcr.io/hassio-addons/base` with s6-overlay and bashio
- **Service Management**: s6-overlay service in `rootfs/etc/services.d/growflow/`
- **Configuration**: Home Assistant config schema in `config.yaml`
- **Icon**: 128x128px PNG icon for add-on store
- **Health Check**: HTTP endpoint at `/api/health` for container health monitoring

### Configuration Integration
- Configuration values are read via bashio: `bashio::config 'key'`
- Supervisor token automatically available: `bashio::services 'http' 'supervisor_token'`
- Environment variables set in s6 service: `rootfs/etc/services.d/growflow/run`
- Database persists to `/data/` directory (mapped from Home Assistant)

### Home Assistant Integration Patterns
- **MQTT Service Discovery**: Declares `mqtt:want` service dependency
- **Supervisor API**: Automatic access to Home Assistant REST API via supervisor
- **Ingress Support**: Web UI accessible through Home Assistant ingress proxy
- **Logging**: Uses bashio logging: `bashio::log.info`, `bashio::log.error`
- **Data Persistence**: SQLite database stored in `/data/growflow.db`

### Debugging Add-on Issues
- Check add-on logs in Home Assistant: Supervisor → Add-ons → GrowFlow → Logs
- Test configuration: `bashio::config.exists 'key'` and `bashio::config 'key'`
- Verify service startup: Check s6-overlay service status
- Database access: Ensure `/data` directory is properly mounted and writable
- MQTT connectivity: Verify MQTT broker configuration and network access
