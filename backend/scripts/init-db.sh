#!/bin/sh
# DB init for GrowFlow. Replaces the previous `prisma db push --accept-data-loss`
# CMD with a real migration flow that preserves user data.
#
# Cases handled (no data loss in any of them):
#
#   A) Fresh install                 — DB file doesn't exist
#                                      → migrate deploy creates everything
#
#   B) Legacy db-push install        — DB has app tables but no
#                                      _prisma_migrations table
#                                      → introspect schema, mark already-
#                                        applied migrations as applied,
#                                        then migrate deploy any leftovers
#
#   C) Already-migrated install      — _prisma_migrations exists
#                                      → migrate deploy
#
# The state-detection in Case B is the load-bearing part: previous Docker
# images shipped `prisma db push`, so existing prod users have a schema
# that's at HEAD (or an intermediate db push state) but no migration
# history. Marking the wrong migrations applied = silent schema drift, so
# we introspect actual columns/tables before deciding.

set -e

DB_FILE="${DB_PATH:-./data/growflow.db}"
PRISMA="./node_modules/.bin/prisma"
export RUST_LOG="${PRISMA_RUST_LOG:-info}"

mkdir -p "$(dirname "$DB_FILE")"

echo "🔵 [init-db] DB=$DB_FILE"

if [ ! -x "$PRISMA" ]; then
  echo "🔴 [init-db] Prisma CLI not found at $PRISMA"
  echo "   Install the prisma package in production dependencies before starting."
  exit 1
fi

# -------- Case A: fresh install --------
if [ ! -f "$DB_FILE" ]; then
  echo "🔵 [init-db] Fresh install — applying all migrations"
  $PRISMA migrate deploy
  exit 0
fi

# -------- Case detection helpers --------
has_table() {
  count=$(sqlite3 "$DB_FILE" "SELECT count(*) FROM sqlite_master WHERE type='table' AND name='$1'" 2>/dev/null || echo "0")
  [ "$count" -gt "0" ]
}

has_column() {
  # $1 = table, $2 = column
  count=$(sqlite3 "$DB_FILE" "SELECT count(*) FROM pragma_table_info('$1') WHERE name='$2'" 2>/dev/null || echo "0")
  [ "$count" -gt "0" ]
}

# -------- Case C: already migrated --------
if has_table "_prisma_migrations"; then
  echo "🔵 [init-db] Migration history present — running migrate deploy"
  $PRISMA migrate deploy
  exit 0
fi

# -------- Case B: legacy db-push install — bootstrap migration history --------
echo "🟡 [init-db] Legacy db-push install detected. Bootstrapping migration history..."

# Migration #1 (normalize_schema): if `strains` table exists, schema #1 is
# already in place.
if has_table "strains"; then
  echo "   → marking 20260206093936_normalize_schema as applied"
  $PRISMA migrate resolve --applied "20260206093936_normalize_schema"
fi

# Migration #2 (add_phase_presets_and_source_type): added the phase_presets
# table and the sourceType column on plants.
if has_table "phase_presets" && has_column "plants" "sourceType"; then
  echo "   → marking 20260206140257_add_phase_presets_and_source_type as applied"
  $PRISMA migrate resolve --applied "20260206140257_add_phase_presets_and_source_type"
fi

# Migration #2b (add_plant_phase_sort_order): formalizes the sortOrder column
# that legacy db-push installs already received via schema sync.
if has_column "plant_phases" "sortOrder"; then
  echo "   → marking 20260206140258_add_plant_phase_sort_order as applied"
  $PRISMA migrate resolve --applied "20260206140258_add_plant_phase_sort_order"
fi

# Migration #3 (add_areas_and_phase_targets): added grow_areas + target
# columns on plant_phases. The schema is "already at HEAD via db push" only
# if BOTH grow_areas exists AND plant_phases.vpdMin exists. If only one is
# true (intermediate db push state), we can't safely skip — so we let
# migrate deploy run, and accept that it may fail with "table already
# exists" or similar. In practice, the only shipped intermediate state is
# "has sortOrder, no areas, no targets" — for which migrate deploy applies
# cleanly because target columns are added via table redefine and areas
# tables are new.
if has_table "grow_areas" && has_column "plant_phases" "vpdMin"; then
  echo "   → marking 20260428000000_add_areas_and_phase_targets as applied"
  $PRISMA migrate resolve --applied "20260428000000_add_areas_and_phase_targets"
fi

echo "🔵 [init-db] Running migrate deploy for any remaining migrations"
$PRISMA migrate deploy
