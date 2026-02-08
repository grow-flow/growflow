# CLAUDE.md

GrowFlow — Home Assistant Add-on for cannabis cultivation with full lifecycle tracking.

## Code Style
- Compact, elegant code — extend existing patterns
- Centralize config in `backend/src/config/settings.ts`
- Minimal comments, save tokens

## Development Commands

```bash
npm run dev                       # Start backend + frontend concurrently
npm run build                     # Build both
npm run lint                      # Lint both

cd backend && npm run dev         # Backend only (nodemon, port 8080)
cd backend && npm run build       # TypeScript compile to dist/
cd backend && npm test            # Jest tests
cd backend && npm run lint:fix    # Auto-fix lint

cd frontend && npm start          # Vite dev server (port 3000, proxies /api → 8080)
cd frontend && npm run build      # Production build
cd frontend && npm run lint:fix   # Auto-fix lint

FORCE_DB_SYNC=true npm run dev    # Force DB schema sync
make build                        # Docker buildx local build
make push VERSION=v0.3.0          # Multi-arch push to registry
git tag v0.3.0 && git push --tags # Trigger automated release
```

## Architecture

```
React (Vite, :3000) ↔ Express API (:8080) ↔ SQLite (Prisma)
```

### Backend: Express + TypeScript + Prisma + SQLite

- **Schema**: `backend/prisma/schema.prisma` — source of truth for all models
- **Config**: `backend/src/config/settings.ts` — centralized CONFIG object from env vars
- **Controllers**: `backend/src/controllers/` — REST handlers (plant, strain, preset, upload)
- **Utils**: `backend/src/utils/phaseUtils.ts` — phase resolution logic (strain-specific → generic → hardcoded defaults)
- **Types**: `backend/src/types/` — phase presets per grow/source type, event data structures
- **Middleware**: `backend/src/middleware/errorHandler.ts` — global error → HTTP status mapping
- **Uploads**: `backend/data/uploads/` — plant photo storage, served statically via `/api/uploads/files`
- **Entry**: `backend/src/index.ts`

### Frontend: React + Material-UI + React Query + Vite

- **Pages**: Dashboard, PlantsOverview, PlantDetail (tabs: Timeline/Events/Stats), StrainsOverview, Settings
- **Hooks**: `frontend/src/hooks/` — usePlants, useStrains (React Query wrappers with mutations)
- **API**: `frontend/src/services/api.ts` — Axios client with HA Ingress auto-detection, getPhotoUrl helper
- **Types**: `frontend/src/types/models.ts` — mirrors Prisma models
- **Utils**: `frontend/src/utils/PlantTimeline.ts` — progress calc; `formatDuration.ts` — duration display
- **Components**: CreatePlantDialog, EditPlantDialog, PlantHeader, EventDialog/EventCard, ImageUpload, PhotoGallery, Navbar, ErrorBoundary
- **Timeline**: `frontend/src/components/timeline/` — TimelineStepper, PhaseConfigDialog, PhaseEditDialog
- **Event Forms**: `frontend/src/components/events/` — WateringForm, TrainingForm
- **Path alias**: `@/` → `frontend/src/`
- **Theme**: Dark mode, primary #4caf50, secondary #ff9800

## Data Model (Prisma)

```
Strain (1) ←→ (N) Plant (1) ←→ (N) PlantPhase (1) ←→ (N) PlantEvent
Strain (1) ←→ (N) PhasePreset
```

- **Strain**: name (unique), type (photoperiod|autoflower)
- **Plant**: name, strain?, sourceType (seed|clone), isActive, notes
- **PlantPhase**: name, durationMin/Max, startDate?, isActive, isCompleted — cascade delete with plant
- **PlantEvent**: type (watering|observation|training|harvest|transplant), title, data (JSON string) — cascade delete with plant, SetNull on phase delete
- **PhasePreset**: templates per growType × sourceType, optional strainId for strain-specific overrides. Unique on [name, growType, sourceType, strainId]

### Phase Lifecycle

Plant creation → phases auto-generated from presets (4 combos: photoperiod/autoflower × seed/clone) → first phase auto-started → manual transitions via UI → events linked to active phase → PlantTimeline calculates progress

## API Endpoints

- `GET/POST /api/plants`, `GET/PUT/DELETE /api/plants/:id`
- `PUT /api/plants/:id/phases` — bulk phase update
- `POST/PUT/DELETE /api/plants/:id/events(/:eventId)`
- `GET/POST/PUT/DELETE /api/strains(/:id)`
- `GET/POST/PUT/DELETE /api/presets(/:id)`, `POST /api/presets/seed`
- `POST /api/uploads/:plantId` — photo upload (multipart), `DELETE /api/uploads/:filename`
- `GET /api/uploads/files/:filename` — static photo serving

## Key Patterns

- **Server state**: React Query hooks with 5min stale time, cache invalidation on mutations
- **Error handling**: Global middleware maps errors to HTTP status codes (validation→400, not found→404)
- **HA Ingress**: URL path `/api/hassio_ingress/{token}` auto-detected, base path adjusted in api.ts and router basename
- **Docker**: Multi-stage build, `prisma db push` in CMD before server start
- **CI/CD**: Tag push → GitHub Actions → multi-arch Docker build → GHCR push → addon repo auto-update

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| PORT | 8080 | API port |
| DB_PATH | ./data/growflow.db | SQLite location |
| NODE_ENV | development | Environment |
| CORS_ORIGIN | * | CORS config |
| LOG_LEVEL | info | Logging level |
| DISABLE_HTTPS_UPGRADE | false | HTTP-only dev mode |
| ALLOWED_FRAME_ANCESTORS | 'self',* | CSP frame ancestors |
| TRUST_PROXY | false | Reverse proxy support |
