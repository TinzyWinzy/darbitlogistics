#!/bin/bash
# Auto-migrate script for Morres Logistics (PostgreSQL)
# Usage: ./auto-migrate.sh

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/postgresql-schema.sql"
ADDON_SCHEMA_FILE="$SCRIPT_DIR/add_subscription_schema.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Migration file not found: $SQL_FILE"
  exit 1
fi

# Apply main schema
echo "Applying migrations from $SQL_FILE to $DATABASE_URL..."
psql "$DATABASE_URL" -f "$SQL_FILE"
echo "Migration complete."

# Apply add_subscription_schema.sql if present
if [ -f "$ADDON_SCHEMA_FILE" ]; then
  echo "Applying add-on subscription migrations from $ADDON_SCHEMA_FILE..."
  psql "$DATABASE_URL" -f "$ADDON_SCHEMA_FILE"
  echo "Add-on subscription migration complete."
fi

# Apply add_notifications_table.sql if present
NOTIFICATIONS_SCHEMA_FILE="$SCRIPT_DIR/add_notifications_table.sql"
if [ -f "$NOTIFICATIONS_SCHEMA_FILE" ]; then
  echo "Applying notifications table migration from $NOTIFICATIONS_SCHEMA_FILE..."
  psql "$DATABASE_URL" -f "$NOTIFICATIONS_SCHEMA_FILE"
  echo "Notifications table migration complete."
fi

# Ensure ENUM patch for 'pending' status is applied (in both SQL files)
# Run data-fix.sql if present
DATA_FIX_FILE="$SCRIPT_DIR/data-fix.sql"
if [ -f "$DATA_FIX_FILE" ]; then
  echo "Applying data fixes from $DATA_FIX_FILE..."
  psql "$DATABASE_URL" -f "$DATA_FIX_FILE"
  echo "Data fix complete."
fi 