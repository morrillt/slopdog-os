#!/usr/bin/env bash
# Print THIS session's log directory, creating it and its two files if they
# do not exist yet.
#
#   session-dir.sh [--session <claude-session-id>] ["Title for the slug"]
#   session-dir.sh [--session <id>] --retitle "Real Title"   rename a not-yet-named dir
#
# One directory per CLAUDE SESSION:
#   turns.md     one dated line per turn          (written by the Stop hook, turn-log.py)
#   concerns.md  open concerns, newest first      (written by the Stop hook)
#
# The directory can be created before the conversation has produced anything to
# name it after, so it is born provisional
# (`…-session`) and `--retitle` gives it the real name once the first turn has
# produced one. After that the paths never move again.
#
# ── Which session am I? ────────────────────────────────────────────────────────
# The directory is keyed on Claude's own `session_id` — unique per session,
# stable across `--resume`. Until 2026-09-01 it was keyed on CMUX_WORKSPACE_ID,
# which meant two sessions in one cmux workspace shared one log. The cmux keys
# survive ONLY for rename-card.sh — never for files.
#
# The id is resolved, in order:
#   1. --session <id>            the hooks all get it in their stdin payload
#   2. $CLAUDE_SESSION_ID        substituted into a skill body by Claude Code
#   3. the SessionStart pointer  ~/.cache/slopdog-wtf/lookup/<workspace>_<pane>.session,
#      then <workspace>.session. A caller with no payload finds the
#      breadcrumb a hooked call left. Workspace+pane is a safe lookup
#      key: two sessions cannot share one pane. The workspace-only key is the
#      last resort and, with two sessions in one workspace, names whichever
#      started most recently.
#   4. nothing resolvable        →  a bucket unique to this PROCESS. Never a
#      shared name; the old literal `default` bucket was one board every
#      hookless context wrote into.
#
# Migration (2026-09-01, one shot per workspace): a session that finds no
# pointer of its own adopts the old workspace-keyed pointer if it still points
# at a board touched in the last 12 hours, then retires that pointer to
# `.dir.migrated` so exactly one session can ever claim it. Old pointers left
# over from earlier days simply go inert; no session directory is ever deleted.
set -uo pipefail

CACHE="$HOME/.cache/slopdog-wtf"
SESSIONS="$CACHE/sessions"
LOOKUP="$CACHE/lookup"
mkdir -p "$SESSIONS" "$LOOKUP"

sanitize() { printf '%s' "$1" | tr -c 'A-Za-z0-9' '_'; }

# A session id that never made it through substitution ("${CLAUDE_SESSION_ID}")
# would otherwise become a shared bucket across every session on the machine.
valid_sid() {
    case "${1:-}" in
        "" | *'$'* | *'{'* | *'}'* | unknown | none | null) return 1 ;;
    esac
    return 0
}

mtime() { stat -f %m "$1" 2>/dev/null || stat -c %Y "$1" 2>/dev/null; }

slugify() {
    printf '%s' "$1" | tr '[:upper:]' '[:lower:]' \
        | sed -e 's/[^a-z0-9]\{1,\}/-/g' -e 's/^-//' -e 's/-$//' | cut -c1-48
}

sid=""; retitle=0; title=""
while [ $# -gt 0 ]; do
    case "$1" in
        --session)   sid="${2:-}"; shift; [ $# -gt 0 ] && shift ;;
        --session=*) sid="${1#--session=}"; shift ;;
        --retitle)   retitle=1; shift ;;
        *)           [ -z "$title" ] && title="$1"; shift ;;
    esac
done

ws_key=""
[ -n "${CMUX_WORKSPACE_ID:-}" ] && ws_key="$(sanitize "$CMUX_WORKSPACE_ID")"
pane_key=""
[ -n "${CMUX_PANE_ID:-}" ] && pane_key="$(sanitize "$CMUX_PANE_ID")"

# 1 / 2: told to us, first-hand.
authoritative=0
if valid_sid "$sid"; then
    authoritative=1
elif valid_sid "${CLAUDE_SESSION_ID:-}"; then
    sid="$CLAUDE_SESSION_ID"; authoritative=1
elif [ -n "$ws_key" ]; then
    # 3: the breadcrumb left at session start, most specific key first.
    for lk in "${ws_key}_${pane_key}" "$ws_key"; do
        [ -f "$LOOKUP/$lk.session" ] || continue
        cand="$(cat "$LOOKUP/$lk.session" 2>/dev/null)"
        if valid_sid "$cand"; then sid="$cand"; break; fi
    done
fi

# 4: unique to this process rather than shared with every other hookless caller.
valid_sid "$sid" || { sid="proc-$$-$(date +%s)"; authoritative=0; }

key="$(sanitize "$sid")"
pointer="$SESSIONS/$key.dir"

# Leave the breadcrumb the skill reads — only when we were told the id first-hand,
# so a lookup can never feed itself.
if [ "$authoritative" = 1 ] && [ -n "$ws_key" ]; then
    [ -n "$pane_key" ] && printf '%s' "$sid" > "$LOOKUP/${ws_key}_${pane_key}.session"
    printf '%s' "$sid" > "$LOOKUP/$ws_key.session"
fi

dir=""
[ -f "$pointer" ] && dir="$(cat "$pointer")"

if [ -z "$dir" ] || [ ! -d "$dir" ]; then
    dir=""
    # One-shot migration off the old workspace-keyed pointer.
    if [ -n "$ws_key" ] && [ -f "$CACHE/$ws_key.dir" ]; then
        legacy="$CACHE/$ws_key.dir"
        ldir="$(cat "$legacy" 2>/dev/null)"
        if [ -n "$ldir" ] && [ -d "$ldir" ] && [ -f "$ldir/turns.md" ]; then
            m="$(mtime "$ldir/turns.md")"
            if [ -n "$m" ] && [ "$(( $(date +%s) - m ))" -lt 43200 ]; then
                dir="$ldir"
            fi
        fi
        # Retire it either way: only the first session to look may claim it.
        mv "$legacy" "$legacy.migrated" 2>/dev/null || rm -f "$legacy"
    fi
    if [ -z "$dir" ]; then
        slug="$(slugify "$title")"; slug="${slug:-session}"
        base="$HOME/slopdog/logs/conversations/$(date +%Y-%m)/$(date +%Y-%m-%d-%H%M)-$slug"
        # Two sessions starting in the same minute produce the same name — and
        # both are born provisional `…-session`, so that is the common case, not
        # the rare one. Never move into a directory another session has claimed.
        dir="$base"; n=2
        while [ -d "$dir" ] && [ "$(cat "$dir/.session" 2>/dev/null)" != "$sid" ]; do
            dir="$base-$n"; n=$((n + 1))
        done
        mkdir -p "$dir"
    fi
    printf '%s' "$dir" > "$pointer"
    printf '%s' "$sid" > "$dir/.session"
elif [ "$retitle" = 1 ] && [ -n "$title" ]; then
    # Only a directory still carrying the provisional name is ever renamed — a
    # named one is the archive's record of what the session was called.
    slug="$(slugify "$title")"
    case "$(basename "$dir")" in
        *-session | *-session-[0-9]*)
            if [ -n "$slug" ]; then
                new="$(dirname "$dir")/$(basename "$dir" | sed -E 's/-session(-[0-9]+)?$//')-$slug"
                if [ ! -e "$new" ] && mv "$dir" "$new" 2>/dev/null; then
                    dir="$new"
                    printf '%s' "$dir" > "$pointer"
                fi
            fi
            ;;
    esac
fi

# Create them if they do not exist.
[ -f "$dir/turns.md" ]    || printf '# Turns\n\n*Nothing logged yet — the Stop hook writes here.*\n' > "$dir/turns.md"
[ -f "$dir/concerns.md" ] || printf '# Concerns\n\n*None open.*\n' > "$dir/concerns.md"

printf '%s\n' "$dir"
