#!/bin/bash
# Auto-migrate script for Dar Logistics (PostgreSQL)
# Usage: ./auto-migrate.sh
#
# Migration Order:
#   1. postgresql-schema.sql (core tables/enums/triggers)
#   2. add_subscription_schema.sql (subscriptions, invoices, addons)
#   3. add_notifications_table.sql (notifications)
#   4. add_refresh_tokens_table.sql (refresh token support)
#   5. data-fix.sql (patches/fixes)
#
# Each script must be idempotent. Only core logic in postgresql-schema.sql; all features in modular scripts.
#
# NOTE: Seeders are not run by default. See README for dev seeding.

set -e

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL environment variable not set."
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_FILE="$SCRIPT_DIR/postgresql-schema.sql"
ADDON_SCHEMA_FILE="$SCRIPT_DIR/add_subscription_schema.sql"
NOTIFICATIONS_SCHEMA_FILE="$SCRIPT_DIR/add_notifications_table.sql"
REFRESH_TOKENS_SCHEMA_FILE="$SCRIPT_DIR/add_refresh_tokens_table.sql"

if [ ! -f "$SQL_FILE" ]; then
  echo "Migration file not found: $SQL_FILE"
  exit 1
fi

# Apply main schema
echo "[MIGRATION] Applying core schema from $SQL_FILE ..."
psql "$DATABASE_URL" -f "$SQL_FILE"
echo "[MIGRATION] Core schema migration complete."

# Apply add_subscription_schema.sql if present
echo "[MIGRATION] Checking for add-on subscription schema ..."
if [ -f "$ADDON_SCHEMA_FILE" ]; then
  echo "[MIGRATION] Applying add-on subscription migrations from $ADDON_SCHEMA_FILE ..."
  psql "$DATABASE_URL" -f "$ADDON_SCHEMA_FILE"
  echo "[MIGRATION] Add-on subscription migration complete."
fi

# Apply add_notifications_table.sql if present
echo "[MIGRATION] Checking for notifications schema ..."
if [ -f "$NOTIFICATIONS_SCHEMA_FILE" ]; then
  echo "[MIGRATION] Applying notifications table migration from $NOTIFICATIONS_SCHEMA_FILE ..."
  psql "$DATABASE_URL" -f "$NOTIFICATIONS_SCHEMA_FILE"
  echo "[MIGRATION] Notifications table migration complete."
fi

# Apply add_refresh_tokens_table.sql if present
echo "[MIGRATION] Checking for refresh tokens schema ..."
if [ -f "$REFRESH_TOKENS_SCHEMA_FILE" ]; then
  echo "[MIGRATION] Applying refresh tokens table migration from $REFRESH_TOKENS_SCHEMA_FILE ..."
  psql "$DATABASE_URL" -f "$REFRESH_TOKENS_SCHEMA_FILE"
  echo "[MIGRATION] Refresh tokens table migration complete."
fi

# Run data-fix.sql if present
DATA_FIX_FILE="$SCRIPT_DIR/data-fix.sql"
if [ -f "$DATA_FIX_FILE" ]; then
  echo "[MIGRATION] Applying data fixes from $DATA_FIX_FILE ..."
  psql "$DATABASE_URL" -f "$DATA_FIX_FILE"
  echo "[MIGRATION] Data fix complete."
fi 