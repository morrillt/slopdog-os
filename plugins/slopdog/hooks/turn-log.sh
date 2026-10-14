#!/usr/bin/env bash
# Stop hook — hand the payload to the turn-log worker and get out of the way.
# Detached on purpose: the turn must never wait on a summariser.
set -uo pipefail
# The summariser is itself a `claude -p` run in this project, so it fires this
# same Stop hook. Without this guard that recurses into a fork bomb.
[ -n "${SLOPDOG_TURNLOG:-}" ] && exit 0

# Skip under openrouter engine to conserve free-tier quota (T-546)
if [ -n "${OPENROUTER_ENGINE:-}" ] || [ "${DISPATCH_ENGINE:-}" = "openrouter" ] || [[ "${ANTHROPIC_BASE_URL:-}" == *"openrouter"* ]]; then
  echo "$(date -u +'%Y-%m-%d %H:%M:%S') [turn-log] skipped under openrouter engine" >> "$HOME/.cache/slopdog-turnlog/worker.log"
  exit 0
fi

DIR="$(cd "$(dirname "$0")" && pwd)"
mkdir -p "$HOME/.cache/slopdog-turnlog"
payload="$(cat)"
printf '%s' "$payload" | nohup "$DIR/turn-log.py" \
    >>"$HOME/.cache/slopdog-turnlog/worker.log" 2>&1 &
disown 2>/dev/null || true
exit 0
