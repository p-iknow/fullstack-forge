#!/usr/bin/env bash

set -euo pipefail

CONTAINER_NAME="${REDIS_CONTAINER_NAME:-fullstack-forge-redis}"
REDIS_PORT="${REDIS_PORT:-6379}"

start() {
  if docker ps --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    echo "redis container ready: $CONTAINER_NAME"
    return 0
  fi

  if docker ps -a --format '{{.Names}}' | grep -qx "$CONTAINER_NAME"; then
    docker start "$CONTAINER_NAME" >/dev/null
  else
    docker run --name "$CONTAINER_NAME" -p "$REDIS_PORT":6379 -d redis:7-alpine >/dev/null
  fi

  ping
  echo "redis container ready: $CONTAINER_NAME"
}

ping() {
  docker exec -i "$CONTAINER_NAME" redis-cli PING
}

case "${1:-}" in
start)
  start
  ;;
ping)
  ping
  ;;
*)
  echo "usage: bash scripts/redis-local.sh <start|ping>"
  exit 1
  ;;
esac
