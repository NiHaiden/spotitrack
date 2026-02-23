#!/bin/sh
set -e

echo "Waiting for database to be ready..."

# Extract host and port from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -e 's/.*@\([^:]*\):.*/\1/')
DB_PORT=$(echo $DATABASE_URL | sed -e 's/.*:\([0-9]*\)\/.*/\1/')

# Wait for database to be available
MAX_RETRIES=30
RETRY_COUNT=0

until pg_isready -h "$DB_HOST" -p "$DB_PORT" -q; do
  RETRY_COUNT=$((RETRY_COUNT + 1))
  if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
    echo "Database not available after $MAX_RETRIES attempts, exiting..."
    exit 1
  fi
  echo "Database not ready yet, waiting... (attempt $RETRY_COUNT/$MAX_RETRIES)"
  sleep 2
done

echo "Database is ready!"

echo "Running database migrations..."
npx tsx scripts/migrate.ts

echo "Starting application..."
exec node .output/server/index.mjs
