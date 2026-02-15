#!/usr/bin/env bash

set -euo pipefail

CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-fullstack-forge-postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_NAME="${POSTGRES_DB:-fullstack_forge_commerce_dev}"
BACKUP_DIR="${BACKUP_DIR:-./backups}"
BACKUP_FILE="${BACKUP_FILE:-$BACKUP_DIR/${DB_NAME}_latest.dump}"
APP_HEALTH_URL="${APP_HEALTH_URL:-http://localhost:8080/health}"

dump_db() {
  mkdir -p "$BACKUP_DIR"
  docker exec -i "$CONTAINER_NAME" pg_dump -Fc -U "$DB_USER" "$DB_NAME" >"$BACKUP_FILE"
  echo "backup created: $BACKUP_FILE"
}

rehearse_restore() {
  if [[ ! -f "$BACKUP_FILE" ]]; then
    echo "missing backup file: $BACKUP_FILE"
    exit 1
  fi

  docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "DROP DATABASE IF EXISTS \"$DB_NAME\";"
  docker exec -i "$CONTAINER_NAME" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\" TEMPLATE template0;"
  docker exec -i "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists <"$BACKUP_FILE"

  curl -fsS "$APP_HEALTH_URL" >/dev/null
  echo "restore rehearsal succeeded and health check passed"
}

case "${1:-}" in
dump)
  dump_db
  ;;
rehearse)
  rehearse_restore
  ;;
*)
  echo "usage: bash scripts/db-backup-restore.sh <dump|rehearse>"
  exit 1
  ;;
esac
