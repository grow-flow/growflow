# AGENTS.md

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
- **Plant**: name, strain?, sourceType (seed|clone), isActive, notes, areaId?
- **PlantPhase**: name, durationMin/Max, startDate?, isActive, isCompleted, plus `PhaseEnvTargets` (vpdMin/Max, tempMin/Max, humidityMin/Max, lightOnHours — all nullable). Cascade delete with plant.
- **PlantEvent**: type (watering|observation|training|harvest|transplant), title, data (JSON string) — cascade delete with plant, SetNull on phase delete
- **PhasePreset**: templates per growType × sourceType, optional strainId for strain-specific overrides. Carries the same `PhaseEnvTargets` fields. Unique on [name, growType, sourceType, strainId]
- **GrowArea**: name (unique), type, lightSchedule, plants[]; **AreaEvent**: type (light_schedule|environment|equipment|note), data (JSON)

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
- **Phase ↔ area environment**: `PlantPhase` carries the contract via `PhaseEnvTargets`. The single evaluator `frontend/src/utils/plantEnvironment.ts` (`evaluatePlantHappiness`) is the **only** place that compares phase targets to area readings — every UI surface consumes it. Never branch on phase name (e.g. `name === 'Flowering'`, `VEG_PHASES.has(...)`): renames and custom phases break it silently. If a phase needs new behavior, add a target field; don't add a name lookup.
- **Phase target resolution**: built-in defaults live in `backend/src/types/phase.ts`; `phaseUtils.resolvePhasePresets` cascades strain → generic preset → built-in **per field** (a stored `null` for one target falls back to the next layer for that field, not the whole row).
- **Docker / migrations**: Runtime startup uses `backend/scripts/init-db.sh`, which runs Prisma migrations and bootstraps migration history for legacy installs that were previously synced with `db push`. Do not reintroduce `prisma db push` in shipped startup paths. Before any non-additive schema change, generate a migration and verify legacy-data preservation.
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
