-- Catch-up migration: brings the DB from the last formal migration
-- (`add_phase_presets_and_source_type`) up to the current schema. Users
-- whose DB was already at this schema via `prisma db push` get migration
-- #3 marked as applied by scripts/init-db.sh — this SQL never runs for
-- them. So this file only needs to be correct for the migration-history
-- path: starting from the schema produced by migration #2.

-- AlterTable
ALTER TABLE "phase_presets" ADD COLUMN "humidityMax" REAL;
ALTER TABLE "phase_presets" ADD COLUMN "humidityMin" REAL;
ALTER TABLE "phase_presets" ADD COLUMN "lightOnHours" REAL;
ALTER TABLE "phase_presets" ADD COLUMN "tempMax" REAL;
ALTER TABLE "phase_presets" ADD COLUMN "tempMin" REAL;
ALTER TABLE "phase_presets" ADD COLUMN "vpdMax" REAL;
ALTER TABLE "phase_presets" ADD COLUMN "vpdMin" REAL;

-- CreateTable
CREATE TABLE "grow_areas" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'tent',
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lightSchedule" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "area_events" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "areaId" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "data" TEXT,
    "source" TEXT NOT NULL DEFAULT 'manual',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "area_events_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "grow_areas" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_plant_phases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "plantId" INTEGER NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "name" TEXT NOT NULL,
    "durationMin" INTEGER NOT NULL DEFAULT 7,
    "durationMax" INTEGER NOT NULL DEFAULT 14,
    "startDate" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "vpdMin" REAL,
    "vpdMax" REAL,
    "tempMin" REAL,
    "tempMax" REAL,
    "humidityMin" REAL,
    "humidityMax" REAL,
    "lightOnHours" REAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "plant_phases_plantId_fkey" FOREIGN KEY ("plantId") REFERENCES "plants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_plant_phases" ("createdAt", "durationMax", "durationMin", "id", "isActive", "isCompleted", "name", "notes", "plantId", "sortOrder", "startDate") SELECT "createdAt", "durationMax", "durationMin", "id", "isActive", "isCompleted", "name", "notes", "plantId", "sortOrder", "startDate" FROM "plant_phases";
DROP TABLE "plant_phases";
ALTER TABLE "new_plant_phases" RENAME TO "plant_phases";
CREATE TABLE "new_plants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "strainId" INTEGER,
    "sourceType" TEXT NOT NULL DEFAULT 'seed',
    "notes" TEXT DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "areaId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "plants_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "strains" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "plants_areaId_fkey" FOREIGN KEY ("areaId") REFERENCES "grow_areas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_plants" ("createdAt", "id", "isActive", "name", "notes", "sourceType", "strainId", "updatedAt") SELECT "createdAt", "id", "isActive", "name", "notes", "sourceType", "strainId", "updatedAt" FROM "plants";
DROP TABLE "plants";
ALTER TABLE "new_plants" RENAME TO "plants";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "grow_areas_name_key" ON "grow_areas"("name");

-- CreateIndex
CREATE INDEX "area_events_areaId_timestamp_idx" ON "area_events"("areaId", "timestamp");

-- CreateIndex
CREATE INDEX "area_events_areaId_type_idx" ON "area_events"("areaId", "type");
