#!/bin/bash
set -e

# Configurable variables
DB_NAME="darlog"
ARCHIVE_DIR="./db_archives"
MODE="$1"

# Use DATABASE_URL if set (for Render/cloud), else fallback to local DB_NAME
if [ -n "$DATABASE_URL" ]; then
  DB_CONN="$DATABASE_URL"
else
  DB_CONN="$DB_NAME"
fi

# Usage instructions
usage() {
  echo "Usage: $0 {reset|archive|dump}"
  echo "  reset   - Truncate all main tables (dev/test only)"
  echo "  archive - Move deliveries older than 90 days to deliveries_archive, then delete from main table"
  echo "  dump    - Backup the full DB to $ARCHIVE_DIR with timestamp"
  echo "  "
  echo "  For cloud DBs (Render), set DATABASE_URL before running:"
  echo "    export DATABASE_URL=postgresql://user:pass@host:port/dbname"
  exit 1
}

# Ensure mode is provided
if [ -z "$MODE" ]; then
  usage
fi

case $MODE in
  reset)
    echo "[DB RESET] Truncating all main tables..."
    psql "$DB_CONN" -c "TRUNCATE TABLE deliveries, parent_bookings, users RESTART IDENTITY CASCADE;"
    echo "[DB RESET] Seeding default users..."
    psql "$DB_CONN" -f ./seed-dev-users.sql
    echo "[DB RESET] Done."
    ;;
  archive)
    echo "[ARCHIVE] Archiving deliveries older than 90 days..."
    psql "$DB_CONN" -c "CREATE TABLE IF NOT EXISTS deliveries_archive (LIKE deliveries INCLUDING ALL);"
    psql "$DB_CONN" -c "INSERT INTO deliveries_archive SELECT * FROM deliveries WHERE created_at < NOW() - INTERVAL '90 days';"
    psql "$DB_CONN" -c "DELETE FROM deliveries WHERE created_at < NOW() - INTERVAL '90 days';"
    echo "[ARCHIVE] Done."
    ;;
  dump)
    mkdir -p $ARCHIVE_DIR
    FILE="$ARCHIVE_DIR/db_dump_$(date +%Y%m%d_%H%M%S).sql"
    echo "[DUMP] Dumping DB to $FILE ..."
    if [ -n "$DATABASE_URL" ]; then
      pg_dump "$DATABASE_URL" > "$FILE"
    else
      pg_dump $DB_NAME > "$FILE"
    fi
    echo "[DUMP] Done."
    ;;
  *)
    usage
    ;;
esac 