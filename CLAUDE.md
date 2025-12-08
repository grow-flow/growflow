# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Local Development
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

# Debugging & Development
FORCE_DB_SYNC=true npm run dev   # Force database schema sync in development
npm run docker:health            # Check if Docker container is responding
curl http://localhost:8080/api/health  # Manual health check

# Backend specific commands
cd backend && npm run dev     # Start backend dev server (nodemon on port 8080)
cd backend && npm run build   # Compile TypeScript to dist/
cd backend && npm run start   # Run compiled JS from dist/
cd backend && npm run lint    # ESLint backend code
cd backend && npm test        # Run Jest tests

# Frontend specific commands
cd frontend && npm start      # Start Vite dev server (port 3000, proxies to backend)
cd frontend && npm run build  # Build React app for production with Vite
cd frontend && npm run lint   # ESLint frontend code

# Docker Deployment

# Docker commands for standalone deployment
npm run docker:build            # Build Docker image locally
npm run docker:run              # Run container with volume mounting
npm run docker:health           # Check if application is responding
npm run docker:logs             # View container logs
npm run docker:stop             # Stop running container
npm run docker:clean            # Remove built image

# Releases (automated via GitHub Actions)
# Use git tags to trigger automated builds and releases
git tag v0.3.0 && git push --tags  # Automated multi-arch build + addon update

# Docker Compose deployment (recommended for production)
docker-compose up -d             # Start application in background
docker-compose logs -f           # View logs (follow mode)
docker-compose pull && docker-compose up -d  # Update to latest image
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

### Frontend (React + Material-UI + React Query + Vite)

- **Build Tool**: Vite for fast development and optimized production builds
- **State Management**: React Query (@tanstack/react-query) for server state
- **Routing**: React Router with pages: Dashboard, Plants, Strains, Plant Detail, Settings
- **Components**: Material-UI components with custom plant management dialogs
- **API Layer**: Axios-based service in `frontend/src/services/api.ts` with Home Assistant Ingress support
- **Types**: Shared TypeScript interfaces between frontend/backend
- **Path Alias**: `@/` maps to `frontend/src/` (configured in [vite.config.ts](frontend/vite.config.ts))
- **Build Optimization**: Vendor chunks split into react-vendor, mui-vendor, query-vendor for optimal caching

### Core Features

- **Plant Timeline Tracking**: Complete documentation of plant lifecycle from germination to harvest
- **Grow Area Management**: Organize plants by location and track dimensions
- **Care Event Logging**: Record watering, feeding, training, observations, and harvests
- **Strain Management**: Track genetics, breeding info, and phase templates
- **Phase Progression**: Automatic and manual phase transitions with date tracking

### Data Flow

1. Plants progress through 9 lifecycle phases with date tracking
2. Care activities (watering/feeding/training/observations/harvests) are logged as events per plant
3. All plant data persists in SQLite database for historical tracking
4. Frontend displays real-time plant status and complete grow timeline
5. Home Assistant Ingress routing automatically detected via URL path (`/api/hassio_ingress/*`)
6. API base path dynamically adjusted in `frontend/src/services/api.ts` based on URL detection

### Development Notes

- **Settings**: Centralized in `backend/src/config/settings.ts` using environment variables
- **Database**: Auto-synchronizes by default for ease of use (set `DISABLE_DB_SYNC=true` to disable)
- **Dev Proxy**: Frontend proxies API requests to localhost:8080 (configured in [vite.config.ts](frontend/vite.config.ts))
- **Local Docker**: Set `DISABLE_HTTPS_UPGRADE=true` for HTTP-only development (avoids Mixed Content CSP errors)
- **Code Quality**: ESLint with auto-fix available via `npm run lint:fix`
- **Type Safety**: TypeScript strict mode enabled, compilation serves as type check
- **Hot Reload**: Backend uses nodemon, frontend uses Vite HMR
- **Ingress Support**: Automatic path detection and dynamic base URL adjustment
- **Path Alias**: `@/` resolves to `frontend/src/` for cleaner imports
- **Build Output**: Backend compiles to `backend/dist/`, frontend to `frontend/build/`

### Docker Deployment Strategy

**Production-optimized multi-stage build:**

- **Build Stage**: Compiles TypeScript backend and React frontend inside container
- **Production Stage**: Lightweight Node.js Alpine image with only runtime dependencies
- **Layer Caching**: System deps and npm packages cached separately from source code
- **Optimized .dockerignore**: Excludes unnecessary files for faster build context
- **Health Checks**: Built-in endpoint monitoring for container orchestration

### Important File Locations

- **API Layer**: `frontend/src/services/api.ts` - Axios client with Ingress detection
- **Models**: `backend/src/models/` - TypeORM entity definitions (Plant, Strain, Event, Phase)
- **Controllers**: `backend/src/controllers/` - Express route handlers (plantController, strainController)
- **Configuration**: `backend/src/config/settings.ts` - Environment-based config (PORT, DB_PATH, CORS, etc.)
- **Types**: Shared TypeScript interfaces in `frontend/src/types/` and `backend/src/types/`
- **Frontend Entry**: `frontend/src/index.tsx` - React app initialization
- **Backend Entry**: `backend/src/index.ts` - Express server startup

### Testing & Quality

- **Linting**: ESLint with TypeScript support for both backend and frontend
- **Backend**: Jest testing framework, run with `npm test` in backend directory
- **Type Safety**: TypeScript strict mode enabled, use `npm run build` for type checking

## Docker Compose Deployment

### Environment Variables

- **NODE_ENV**: Set to `production` for optimal performance
- **DB_PATH**: Database file location (default: `./data/growflow.db`)
- **LOG_LEVEL**: Control logging verbosity (`trace`, `debug`, `info`, `warn`, `error`)
- **DISABLE_DB_SYNC**: Disable automatic database schema synchronization (`true` or `false`, default: false)
- **TRUST_PROXY**: Enable proxy trust for reverse proxy setups (`true` or `false`)
- **ALLOWED_FRAME_ANCESTORS**: CSP frame ancestors for iframe embedding (comma-separated, default: `'self',*`)
- **PORT**: API server port (default: `8080`)
- **CORS_ORIGIN**: CORS origin configuration (default: `*`)

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

### Automated Release Workflow

**Single Command Release**: `git tag v0.3.0 && git push --tags`

This triggers a fully automated release process:
1. Builds multi-arch Docker images (amd64, arm64, arm/v7)
2. Pushes to GitHub Container Registry: `ghcr.io/grow-flow/growflow`
3. Automatically updates addon repository with new version
4. Synchronizes versions across all configuration files

### GitHub Actions

- **Release Workflow** ([.github/workflows/docker.yml](.github/workflows/docker.yml)): Automated releases on tag push
  - Trigger: Git tags matching `v*` pattern (e.g., `v0.3.0`)
  - Multi-architecture builds (amd64, arm64, arm/v7)
  - Pushes to GitHub Container Registry: `ghcr.io/grow-flow/growflow`
  - Build cache optimization using GitHub Actions cache
  - Tags: Version-specific tags + `:latest`
  - Triggers addon repository update via `repository_dispatch`

- **Addon Automation**: Separate [growflow-addon](https://github.com/grow-flow/growflow-addon) repository
  - Auto-updates config.yaml, Dockerfile, CHANGELOG.md
  - Creates matching git tags
  - Zero manual intervention required

### Release Process

```bash
# Create and push a version tag
git tag v0.3.0
git push --tags

# Monitor progress
# - Main repo: Builds and pushes Docker images (~10 min)
# - Addon repo: Auto-updates and tags (~2 min)
```

### Required Secrets

- **ADDON_REPO_TOKEN**: Personal Access Token with `repo` scope
  - Required for triggering addon repository updates
  - Add to main repo secrets at Settings → Secrets and variables → Actions
