#!/usr/bin/env bash
# Claude Code PostToolUse hook — lint + format on edited files
# Triggered after Edit/Write tool on code/doc files

set -euo pipefail

file_path=$(echo "$CLAUDE_TOOL_INPUT" | jq -r '.file_path // .filePath // empty')
[ -z "$file_path" ] && exit 0

case "$file_path" in
  *.ts|*.tsx|*.js|*.jsx|*.mjs)
    oxlint -c .oxlintrc.json "$file_path" 2>/dev/null || true
    oxfmt -c .oxfmtrc.json "$file_path" 2>/dev/null || true
    ;;
  *.css|*.md)
    oxfmt -c .oxfmtrc.json "$file_path" 2>/dev/null || true
    ;;
esac
