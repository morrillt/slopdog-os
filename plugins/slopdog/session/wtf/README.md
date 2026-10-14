# /slopdog:wtf — how it works

Two things live here: the "what's going on" answer, which the skill runs on demand, and the
per-session log, which the `Stop` hook keeps on every turn. This file is the wiring;
**`SKILL.md` is the instruction sheet Claude follows** (the answer's shape and the
`concerns.md` format). Change behaviour there, change wiring here.

## The split

| Trigger | Runs | Job |
|---|---|---|
| `/slopdog:wtf` (this skill) | `scripts/wtf-loader.mjs` → Claude → `scripts/wtf-lightbox.mjs` | the "what's going on" answer in a lightbox (T-443) |
| `Stop` hook (every turn) | `../../hooks/turn-log.sh` → `turn-log.py` | prepend one line to `turns.md`, draft an `open` entry in `concerns.md` when the summariser names one, rename the sidebar card |

The desk panel is not kept here. It is a flat ticket list derived on demand by
`~/slopdog/v2/scripts/goal.mjs`, which reads the board and writes nothing.

## The files

```
~/slopdog/logs/conversations/<YYYY-MM>/<YYYY-MM-DD-HHMM>-<slug>/
    turns.md      one line per turn, newest on top   (hook only)
    concerns.md   what could still bite              (hook drafts, desk closes)
    .session      the session id, written at creation only
```

**One directory per Claude session**, keyed on `session_id`. The cmux workspace key
answers one question only: which sidebar card `rename-card.sh` renames.

The directory is born `…-session`, because the session has no subject yet, and turn 1
renames it via `session-dir.sh --retitle` once the summariser has produced a title. A
directory that already has a real name is never renamed again.

## The scripts

| Script | Does |
|---|---|
| `wtf-loader.mjs --hours <N>` | print every ticket touched in the window, with status, worker, open questions and in-window Progress notes, then archived tickets and changed projects and batches. The skill's whole context. |
| `wtf-lightbox.mjs <answer.json>` | render the answer, plus the team focus from `context.yaml`, in a detached Chromium `--app` window titled "What's going on". |
| `gist-writer.mjs "<question>" [--hours 6]` | the fast path (T-448): loads the same context, has Haiku write the answer through `claude -p`, and pops the lightbox, so the desk spends none of its own context. |
| `session-dir.sh [--session <id>] [title]` / `--retitle <title>` | resolve (and create, or rename) this session's log directory, with `turns.md` and `concerns.md`. **The only thing that knows the path.** |
| `rename-card.sh <title>` | name the cmux sidebar card after the session title, **only when it changed**, so a hand-renamed card survives. |
| `second-opinion.mjs` | a cheap second reader (Gemini, then Haiku) that checks a piece of Todd's wording against one fixed checklist; `/slopdog:ideate` calls it. |
| `md-catppuccin.mjs <file.md> [--open] [--watch]` | render a markdown file as Catppuccin Mocha HTML and keep it in step with the file on disk. |

## Invariants

- **Files key on `session_id`; the sidebar card keys on `CMUX_WORKSPACE_ID`.** Hooks get the
  id from their stdin payload; the skill gets it as `${CLAUDE_SESSION_ID}`. A caller with no
  resolvable id gets a directory unique to its own process, never a shared bucket.
- **The hook bails when `SLOPDOG_TURNLOG` is set.** The turn summariser is a `claude -p` run in
  this project, so it fires the `Stop` hook too; without the guard it fork-bombs.
- **Never call `cmux rename-workspace` or `cmux identify` bare** from a hook. Both fall back
  to whatever is focused, and the `Stop` worker is detached, so it would rename the
  workspace Todd happens to be looking at.
- State lives in `~/.cache/slopdog-wtf/` (session pointers and the last card title) and
  `~/.cache/slopdog-turnlog/` (the worker's log in `worker.log`, crashes in `worker.err`). All
  of it is a cache: delete it and the next run rebuilds.

## Changing it

Plugin hooks load on `/reload-plugins` or a new session. Skill edits (`SKILL.md`, the
scripts it calls) are live in the current one.

To test without touching the live sidebar, point the cmux binary at nothing
(`CMUX_CLAUDE_TEAMS_CMUX_BIN=/nonexistent CMUX_WORKSPACE_ID=TESTKEY`); the scripts exercise
all their file logic and rename nothing.
