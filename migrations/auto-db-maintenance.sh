#!/bin/bash
set -e

# Configurable variables
DB_NAME="morres"
ARCHIVE_DIR="./db_archives"
MODE="$1"

# Usage instructions
usage() {
  echo "Usage: $0 {reset|archive|dump}"
  echo "  reset   - Truncate all main tables (dev/test only)"
  echo "  archive - Move deliveries older than 90 days to deliveries_archive, then delete from main table"
  echo "  dump    - Backup the full DB to $ARCHIVE_DIR with timestamp"
  exit 1
}

# Ensure mode is provided
if [ -z "$MODE" ]; then
  usage
fi

case $MODE in
  reset)
    echo "[DB RESET] Truncating all main tables..."
    psql $DB_NAME -c "TRUNCATE TABLE deliveries, parent_bookings, users RESTART IDENTITY CASCADE;"
    echo "[DB RESET] Seeding default users..."
    psql $DB_NAME -f ./seed-dev-users.sql
    echo "[DB RESET] Done."
    ;;
  archive)
    echo "[ARCHIVE] Archiving deliveries older than 90 days..."
    # Create archive table if not exists
    psql $DB_NAME -c "CREATE TABLE IF NOT EXISTS deliveries_archive (LIKE deliveries INCLUDING ALL);"
    # Move old deliveries
    psql $DB_NAME -c "INSERT INTO deliveries_archive SELECT * FROM deliveries WHERE created_at < NOW() - INTERVAL '90 days';"
    psql $DB_NAME -c "DELETE FROM deliveries WHERE created_at < NOW() - INTERVAL '90 days';"
    echo "[ARCHIVE] Done."
    ;;
  dump)
    mkdir -p $ARCHIVE_DIR
    FILE="$ARCHIVE_DIR/db_dump_$(date +%Y%m%d_%H%M%S).sql"
    echo "[DUMP] Dumping DB to $FILE ..."
    pg_dump $DB_NAME > "$FILE"
    echo "[DUMP] Done."
    ;;
  *)
    usage
    ;;
esac 