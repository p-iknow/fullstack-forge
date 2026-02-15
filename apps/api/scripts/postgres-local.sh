#!/usr/bin/env bash

set -euo pipefail

CONTAINER_NAME="${POSTGRES_CONTAINER_NAME:-fullstack-forge-postgres}"
DB_USER="${POSTGRES_USER:-postgres}"
DB_PASSWORD="${POSTGRES_PASSWORD:-postgres}"
DB_NAME="${POSTGRES_DB:-fullstack_forge_commerce_dev}"
DB_PORT="${POSTGRES_PORT:-5432}"
DB_VOLUME_NAME="${POSTGRES_VOLUME_NAME:-fullstack-forge-postgres-data}"
DB_DATA_DIR="/var/lib/postgresql/data"

wait_for_ready() {
  local container_name="${1:-$CONTAINER_NAME}"
  local retries=30
  local attempt=1

  while [[ "$attempt" -le "$retries" ]]; do
    if docker exec -i "$container_name" pg_isready -h localhost -p 5432 -U "$DB_USER" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done

  echo "postgres is not ready in container: $container_name"
  exit 1
}

ensure_database() {
  local container_name="${1:-$CONTAINER_NAME}"
  local db_exists
  db_exists=$(docker exec -i "$container_name" psql -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")
  if [[ "$db_exists" != "1" ]]; then
    docker exec -i "$container_name" psql -U "$DB_USER" -d postgres -c "CREATE DATABASE \"$DB_NAME\";" >/dev/null
    echo "created database: $DB_NAME"
  fi
}

current_data_mount() {
  local container_name="${1:-$CONTAINER_NAME}"
  docker inspect -f '{{range .Mounts}}{{if eq .Destination "'"$DB_DATA_DIR"'"}}{{.Type}}:{{.Name}}{{end}}{{end}}' "$container_name"
}

migrate_container_to_volume() {
  local source_container="${1:-$CONTAINER_NAME}"
  local dump_file=""
  local db_exists

  echo "migrating container '$source_container' to persistent volume: $DB_VOLUME_NAME"
  docker start "$source_container" >/dev/null || true
  wait_for_ready "$source_container"

  db_exists=$(docker exec -i "$source_container" psql -U "$DB_USER" -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'")
  if [[ "$db_exists" == "1" ]]; then
    dump_file=$(mktemp "/tmp/${DB_NAME}.XXXXXX.dump")
    docker exec -i "$source_container" pg_dump -Fc -U "$DB_USER" "$DB_NAME" >"$dump_file"
  fi

  docker stop "$source_container" >/dev/null
  docker rm "$source_container" >/dev/null
  docker volume create "$DB_VOLUME_NAME" >/dev/null

  docker run --name "$CONTAINER_NAME" \
    -e POSTGRES_PASSWORD="$DB_PASSWORD" \
    -e POSTGRES_DB="$DB_NAME" \
    -p "$DB_PORT":5432 \
    -v "$DB_VOLUME_NAME":"$DB_DATA_DIR" \
    -d postgres:16 >/dev/null

  wait_for_ready
  ensure_database

  if [[ -n "$dump_file" ]]; then
    docker exec -i "$CONTAINER_NAME" pg_restore -U "$DB_USER" -d "$DB_NAME" --clean --if-exists <"$dump_file"
    rm -f "$dump_file"
    echo "restored database from migration dump"
  fi
}

start() {
  local mount_info
  local target_exists

  target_exists=false
  if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    target_exists=true
  fi

  if [[ "$target_exists" == "true" ]]; then
    mount_info=$(current_data_mount)
    if [[ "$mount_info" != "volume:$DB_VOLUME_NAME" ]]; then
      migrate_container_to_volume
    else
      docker start "$CONTAINER_NAME" >/dev/null
    fi
  else
    docker run --name "$CONTAINER_NAME" \
      -e POSTGRES_PASSWORD="$DB_PASSWORD" \
      -e POSTGRES_DB="$DB_NAME" \
      -p "$DB_PORT":5432 \
      -v "$DB_VOLUME_NAME":"$DB_DATA_DIR" \
      -d postgres:16 >/dev/null
  fi
  wait_for_ready
  ensure_database
  echo "postgres container ready: $CONTAINER_NAME"
}

ready() {
  docker exec -i "$CONTAINER_NAME" pg_isready -h localhost -p 5432 -U "$DB_USER"
}

case "${1:-}" in
start)
  start
  ;;
ready)
  ready
  ;;
*)
  echo "usage: bash scripts/postgres-local.sh <start|ready>"
  exit 1
  ;;
esac
