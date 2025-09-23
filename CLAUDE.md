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

# Docker Deployment

# Docker commands for standalone deployment
npm run docker:build            # Build Docker image
npm run docker:run              # Run container with volume mounting
npm run docker:health           # Check if application is responding
npm run docker:logs             # View container logs
npm run docker:stop             # Stop running container
npm run docker:clean            # Remove built image

# Docker Compose deployment (recommended for production)
docker-compose up -d             # Start application in background
docker-compose logs              # View logs
docker-compose down              # Stop application

# Manual Docker commands
docker build -t growflow:latest .                        # Build image manually
docker run -d -p 8080:8080 -v ./data:/app/data growflow  # Run with data persistence
```

## Architecture Overview

**GrowFlow** is a standalone plant tracking system designed for documenting the complete grow process from start to finish, with comprehensive lifecycle management and timeline tracking capabilities.

### Backend (Express.js + TypeScript + SQLite)

- **Database**: TypeORM with SQLite (growflow.db) - models in `backend/src/models/`
- **Core Models**: GrowArea, Plant, Strain, Event, Phase
- **Plant Phases**: 9-stage lifecycle (germination → seedling → vegetation → pre_flower → flowering → flushing → harvest → drying → curing)
- **Plant Timeline**: Complete tracking of plant lifecycle progression and care events
- **Configuration**: Centralized in `backend/src/config/settings.ts`
- **API**: RESTful endpoints with validation, main routes in `backend/src/controllers/`

### Frontend (React + Material-UI + React Query)

- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router with pages: Dashboard, Plants, Strains, Grow Area Detail, Plant Detail, Settings
- **Components**: Material-UI components with custom grow area and plant management dialogs
- **API Layer**: Axios-based service in `frontend/src/services/api.ts`
- **Types**: Shared TypeScript interfaces between frontend/backend

### Core Features

- **Plant Timeline Tracking**: Complete documentation of plant lifecycle from germination to harvest
- **Grow Area Management**: Organize plants by location and track dimensions
- **Care Event Logging**: Record watering, feeding, training, observations, and harvests
- **Strain Management**: Track genetics, breeding info, and phase templates
- **Phase Progression**: Automatic and manual phase transitions with date tracking

### Data Flow

1. GrowAreas contain Plants with dimensional tracking and organization
2. Plants progress through 9 lifecycle phases with date tracking
3. Care activities (watering/feeding/observations) are logged as timeline events per plant
4. All plant data persists in SQLite database for historical tracking
5. Frontend displays real-time plant status and complete grow timeline

### Development Notes

- Settings are centralized in `backend/src/config/settings.ts` using environment variables
- Database auto-synchronizes in development (disabled in production)
- Frontend proxies API requests to localhost:8080 (configured in `frontend/package.json`)
- Both backend and frontend use ESLint for code quality with auto-fix available
- TypeScript strict mode enabled across the project
- Backend uses nodemon for hot reloading during development
- Frontend uses React dev server with hot module replacement

### Docker Deployment Strategy

**Production-optimized multi-stage build:**

- **Build Stage**: Compiles TypeScript backend and React frontend inside container
- **Production Stage**: Lightweight Node.js Alpine image with only runtime dependencies
- **Layer Caching**: System deps and npm packages cached separately from source code
- **Optimized .dockerignore**: Excludes unnecessary files for faster build context
- **Health Checks**: Built-in endpoint monitoring for container orchestration

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

## Docker Compose Deployment

### Synology NAS Setup

- **Docker Package**: Install Docker package from Package Center
- **File Station**: Create project directory (e.g., `/docker/growflow/`)
- **Configuration**: Place `docker-compose.yml` in project directory
- **Data Persistence**: Volume mounts to `./data` for database storage
- **Network Access**: Application accessible on port 8080

### Environment Variables

- **NODE_ENV**: Set to `production` for optimal performance
- **DB_PATH**: Database file location (`/app/data/growflow.db`)
- **LOG_LEVEL**: Control logging verbosity (`info`, `debug`, `error`)

### Deployment Commands

```bash
# Start application
docker-compose up -d

# View logs
docker-compose logs -f

# Update to latest image
docker-compose pull && docker-compose up -d

# Stop application
docker-compose down
```

## CI/CD Pipeline

### GitHub Actions

- **Build Workflow** (`.github/workflows/docker-publish.yml`): Automated Docker builds on push/PR
  - Multi-architecture builds (amd64, arm64) for broad compatibility
  - Pushes to DockerHub: `moritz03/growflow`
  - Build cache optimization using GitHub Actions cache
  - Semantic versioning with tags
