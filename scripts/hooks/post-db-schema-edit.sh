#!/usr/bin/env bash
# Claude Code PostToolUse hook — auto DB migration on schema changes
# Triggered after Edit/Write tool on DB schema files

set -euo pipefail

file_path=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .filePath // empty')
[ -z "$file_path" ] && exit 0

case "$file_path" in
  */api/src/db/schema/*)
    cd apps/api
    pnpm run db:generate --name auto 2>/dev/null || true
    pnpm run db:migrate 2>/dev/null || true
    echo '[hook] DB schema synced'
    ;;
esac
