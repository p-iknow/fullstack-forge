#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/../../../infra/fauxqs/docker-compose.yml"
FAUXQS_PORT="${FAUXQS_PORT:-4566}"

wait_for_ready() {
  local retries=30
  local attempt=1

  while [[ "$attempt" -le "$retries" ]]; do
    if curl -sf "http://localhost:${FAUXQS_PORT}/health" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
    attempt=$((attempt + 1))
  done

  echo "fauxqs is not ready on port: $FAUXQS_PORT"
  exit 1
}

start() {
  docker compose -f "$COMPOSE_FILE" up -d
  wait_for_ready
  echo "fauxqs ready: http://localhost:${FAUXQS_PORT}"
}

health() {
  curl -sf "http://localhost:${FAUXQS_PORT}/health" && echo "fauxqs is healthy"
}

stop() {
  docker compose -f "$COMPOSE_FILE" down
  echo "fauxqs stopped"
}

case "${1:-}" in
start)
  start
  ;;
health)
  health
  ;;
stop)
  stop
  ;;
*)
  echo "usage: bash scripts/fauxqs-local.sh <start|health|stop>"
  exit 1
  ;;
esac
