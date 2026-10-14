#!/usr/bin/env bash
# rename-card — name this session's cmux workspace card after the session title.
#
#   rename-card.sh <title>
#
# The card in the sidebar is where this session's subject shows; the Stop hook
# (turn-log.py) names it after the title the first turn produced. Best-effort: never fails a caller, never
# renames anything when it cannot prove which workspace is ours, and only writes
# when the title has actually CHANGED since we last set it — so a card renamed
# by hand in the sidebar stays renamed.
set -uo pipefail
CMUX="${CMUX_CLAUDE_TEAMS_CMUX_BIN:-${CMUX_CLAUDE_HOOK_CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}}"
[ -x "$CMUX" ] || exit 0

title="${1:-}"
[ -n "$title" ] || exit 0
# Placeholders from a session that has not been named yet are not a card title.
case "$title" in Untitled\ session|"("*) exit 0 ;; esac

# Explicit workspace, always. `rename-workspace` with no --workspace falls back
# to whatever is FOCUSED, and the hook's worker is detached — it would rename
# the card Todd happens to be looking at instead of its own.
ws="${CMUX_WORKSPACE_ID:-}"
if [ -z "$ws" ]; then
    ws="$("$CMUX" identify 2>/dev/null \
          | grep -o '"workspace_ref" : "workspace:[0-9]*"' | head -1 \
          | grep -o 'workspace:[0-9]*')"
fi
[ -n "$ws" ] || exit 0

# Remembered per session, the same key session-dir.sh uses: a pane is 1:1 with a
# session and both the skill and the hook's worker can see it.
key="$(printf '%s' "${CMUX_PANE_ID:-$ws}" | tr -c 'A-Za-z0-9' '_')"
stamp="$HOME/.cache/slopdog-wtf/$key.card"
mkdir -p "$(dirname "$stamp")"
[ -f "$stamp" ] && [ "$(cat "$stamp")" = "$title" ] && exit 0

"$CMUX" rename-workspace --workspace "$ws" -- "$title" >/dev/null 2>&1 || exit 0
printf '%s' "$title" > "$stamp"
printf '%s\n' "$title"
