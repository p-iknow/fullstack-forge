#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

check_or_start() {
  local name="$1"
  local health_cmd="$2"
  local start_cmd="$3"

  if eval "$health_cmd" >/dev/null 2>&1; then
    echo "✓ $name already running"
  else
    echo "→ starting $name..."
    eval "$start_cmd"
  fi
}

check_or_start "postgres" \
  "docker exec -i fullstack-forge-postgres pg_isready -h localhost -p 5432 -U postgres" \
  "bash '$SCRIPT_DIR/postgres-local.sh' start"

check_or_start "redis" \
  "docker exec -i fullstack-forge-redis redis-cli PING" \
  "bash '$SCRIPT_DIR/redis-local.sh' start"

check_or_start "minio" \
  "curl -sf http://localhost:9002/minio/health/live" \
  "bash '$SCRIPT_DIR/minio-local.sh' start"

check_or_start "fauxqs" \
  "curl -sf http://localhost:4566/health" \
  "bash '$SCRIPT_DIR/fauxqs-local.sh' start"

echo ""
echo "all infra ready — starting api dev server..."
echo ""

exec pnpm run dev
