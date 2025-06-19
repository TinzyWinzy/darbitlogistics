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

if [ ! -f "$SQL_FILE" ]; then
  echo "Migration file not found: $SQL_FILE"
  exit 1
fi

echo "Applying migrations from $SQL_FILE to $DATABASE_URL..."
psql "$DATABASE_URL" -f "$SQL_FILE"
echo "Migration complete." 