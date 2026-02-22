#!/usr/bin/env bash

set -euo pipefail

CONTAINER_NAME="${MINIO_CONTAINER_NAME:-fullstack-forge-minio}"
MINIO_PORT="${MINIO_PORT:-9002}"
MINIO_CONSOLE_PORT="${MINIO_CONSOLE_PORT:-9003}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
MINIO_ROOT_PASSWORD="${MINIO_ROOT_PASSWORD:-minioadmin}"
MINIO_VOLUME_NAME="${MINIO_VOLUME_NAME:-fullstack-forge-minio-data}"
MINIO_DATA_DIR="/data"

wait_for_ready() {
  local retries=30
  local attempt=1

  while [[ "$attempt" -le "$retries" ]]; do
    if curl -sf "http://localhost:${MINIO_PORT}/minio/health/live" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done

  echo "minio is not ready in container: $CONTAINER_NAME"
  exit 1
}

start() {
  if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    echo "minio container ready: $CONTAINER_NAME"
    return 0
  fi

  if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    docker start "$CONTAINER_NAME" >/dev/null
  else
    docker volume create "$MINIO_VOLUME_NAME" >/dev/null 2>&1 || true
    docker run --name "$CONTAINER_NAME" \
      -e MINIO_ROOT_USER="$MINIO_ROOT_USER" \
      -e MINIO_ROOT_PASSWORD="$MINIO_ROOT_PASSWORD" \
      -p "${MINIO_PORT}":9000 \
      -p "${MINIO_CONSOLE_PORT}":9001 \
      -v "$MINIO_VOLUME_NAME":"$MINIO_DATA_DIR" \
      -d minio/minio:latest server "$MINIO_DATA_DIR" --console-address ":9001" >/dev/null
  fi

  wait_for_ready
  echo "minio container ready: $CONTAINER_NAME (API: $MINIO_PORT, Console: $MINIO_CONSOLE_PORT)"
}

health() {
  curl -sf "http://localhost:${MINIO_PORT}/minio/health/live" && echo "minio is healthy"
}

case "${1:-}" in
start)
  start
  ;;
health)
  health
  ;;
*)
  echo "usage: bash scripts/minio-local.sh <start|health>"
  exit 1
  ;;
esac
