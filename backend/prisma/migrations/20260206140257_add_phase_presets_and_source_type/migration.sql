-- CreateTable
CREATE TABLE "phase_presets" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "growType" TEXT NOT NULL DEFAULT 'photoperiod',
    "sourceType" TEXT NOT NULL DEFAULT 'seed',
    "durationMin" INTEGER NOT NULL DEFAULT 7,
    "durationMax" INTEGER NOT NULL DEFAULT 14,
    "description" TEXT,
    "strainId" INTEGER,
    CONSTRAINT "phase_presets_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "strains" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_plants" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "strainId" INTEGER,
    "sourceType" TEXT NOT NULL DEFAULT 'seed',
    "notes" TEXT DEFAULT '',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "plants_strainId_fkey" FOREIGN KEY ("strainId") REFERENCES "strains" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_plants" ("createdAt", "id", "isActive", "name", "notes", "strainId", "updatedAt") SELECT "createdAt", "id", "isActive", "name", "notes", "strainId", "updatedAt" FROM "plants";
DROP TABLE "plants";
ALTER TABLE "new_plants" RENAME TO "plants";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "phase_presets_name_growType_sourceType_strainId_key" ON "phase_presets"("name", "growType", "sourceType", "strainId");
