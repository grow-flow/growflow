-- Adds the sortOrder column on plant_phases. This column was previously
-- only ever applied via `prisma db push` (the Prisma schema had it but no
-- migration carried it), so legacy db-push installs already have the
-- column. init-db.sh detects that and marks this migration as applied
-- for those users without re-running the ALTER.

ALTER TABLE "plant_phases" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
