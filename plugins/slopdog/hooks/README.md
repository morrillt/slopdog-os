> Moved 2026-09-01 from `~/slopdog/.claude/hooks/` into the slopdog plugin (`hooks/hooks.json`); since T-149 every hook but the librarian is gated by **scoped.mjs** to sessions under `~/slopdog` or `~/.claude`. Plugin hooks load on `/reload-plugins` or a new session.

**resume.mjs** (SessionStart `startup|clear`): three jobs. On `/clear` it deletes the desk's `.over-ceiling` (Todd's OK to run past the hard context limit is spent by the clear, T-277), and moves the lane's pin in `~/slopdog/v2/.slopdog-sessions.json` to the new session id (T-314), so the launcher's next build resumes the post-clear conversation. On every start it prints the team focus from `~/slopdog/v2/context.yaml` and, when the folder holds a `PICKUP.md`, points at it for `/slopdog:pickup`.


**scoped.mjs** (the wrapper every command in `hooks.json` goes through, ported from v1 by T-149): `~/.claude/skills/slopdog` is a symlink to this plugin, so it auto-loads as a personal skills-dir plugin and these hooks reach *every* session on the machine, including unrelated repos. `scoped.mjs <script> [args…]` buffers the payload off stdin, `realpath`s its `cwd`, and only runs the wrapped script when that cwd is under `realpath(~/slopdog)` or `realpath(~/.claude)` — otherwise exit 0, no output. In scope it re-feeds the same buffered stdin to the script and exits with the script's code. **`librarian-catch.mjs` is deliberately not wrapped**: the librarian should catch a work product written in any repo, and its own path filter already bounds what it records.

**`~/slopdog/bin/sync-check.mjs --hook`** (SessionStart `startup|clear`, T-134): is this machine in step with the other one. The script lives in the glue repo's `bin/`, not here, because it is also a command anyone runs by hand (`node ~/slopdog/bin/sync-check.mjs`, every line, exit 1 on a conflict file). As a hook it prints only problems: a Syncthing folder in error, behind, or with a `*.sync-conflict-*` file outside `.stversions`; a repo on `main` that is behind or ahead of its last-fetched upstream (dirty repos and feature branches are left out, and `dev/peak.pre-v1` is quiet on purpose). Nothing when clean, so zero context. Conflict copies never sync, which is why it runs on both machines. Always exits 0, since SessionStart stdout reaches the session only on 0. It does no fetch, so it takes about a second.

**context-rot.mjs** (UserPromptSubmit, ported from v1 by T-153, three tiers since T-277): the context gauge. Reads the last assistant `usage` from the session transcript (input + cache read + cache creation) and names one tier of the 1M window. The tiers live in `context-tiers.json` (Todd's 2026-10-06 floor: nudge 260k, ceiling 300k, hard 400k; `/slopdog:pickup-resize` may raise but never lower them each Monday); the `SLOPDOG_CONTEXT_NUDGE`/`_CEILING`/`_HARD` env vars override the file, and one desk may move its own tiers with a `<desk folder>/.context-tiers.json` holding any of `nudge`, `ceiling`, `hard` (the Captain clears at 500k). Past the nudge: "aim to clear by" the ceiling. Past the ceiling: "over target, clear at the next breakpoint". At the hard limit: exit 2, so the prompt is refused with "run /slopdog:clear-to-close unattended then self-clear.mjs, or ask Todd to OK it"; **context-refusal-notify.mjs** (T-618) logs `context_refusal` on the activity feed, drops a note in Tyrion's inbox at most once per ten minutes per desk, and replies in the Slack thread when the refused prompt is from Slack. A prompt that is `/slopdog:clear-to-close`, `/slopdog:pickup` or `/clear`, or mentions `self-clear.mjs`, still goes through. Silent below the nudge, and silent at every size while the limits switch is paused (`v2/LIMITS-OFF` exists; `v2/scripts/limits-toggle.mjs` and the polybar's `limits on`/`limits off` label flip it). Rule: `v2/rules/desk-clear.md`.

**Run on (T-644).** Todd OKs a desk to run past its ceiling by typing a prompt that starts `run on` into its pane: context-rot.mjs writes `.over-ceiling` in the desk's folder (`desks/<key>/`, the deepest folder with a CLAUDE.md, so `desks/build/laforge/` for LaForge) and lets that prompt through, even at the hard limit. Only a typed prompt counts; a Slack or inbox message arrives wrapped and never does. On his word Tyrion can also write the file by hand (ticket id and reason), and the Prototyper desk writes its own. While the file is there the hook only warns, and **resume.mjs** deletes it on the next `SessionStart:clear`.

**agent-model-guard.mjs** (PreToolUse on `Agent`, registered in `~/.claude/settings.json` with `"matcher": "Agent"`; Todd, 2026-10-13): refuses an `Agent` call that names no `model` (exit 2, one line naming `/slopdog:spawn-subagent` and the card `v2/config/subagent-tiers.md`), because an unnamed subagent inherits the launching desk's model. A fork (`subagent_type: fork`) and any call that names a model pass. Every call it lets through appends one JSON line `{at, cwd, model, effort, subagent_type, description}` to `v2/reports/usage/subagent-launches.jsonl`, the description starting with the tier the delegator picked (`hard: review T-742 diff`) so the log carries the choice; the log is a temporary audit trail ("maybe we take this out later"), it never blocks a launch (try/catch, exit 0 on any failure), and `SLOPDOG_SUBAGENT_LOG` redirects it for a test. Unreadable input passes: only exit 2 blocks. Test: `agent-model-guard.test.mjs`.

**sprint-stop.mjs** (UserPromptSubmit, T-729): the Watcher's stop as a code gate. While `v2/desks/watcher/SPRINT-STOP` exists it refuses every prompt (exit 2, a one-line reason naming the file); `dispatch.mjs` refuses every job on the same file, hotfix, `--force` and `--dry-run` included. Let through: a typed prompt that starts `lift stop` (it deletes the file; only a typed prompt counts, a Slack or inbox message never does), `/clear`, `/slopdog:clear-to-close`, `/slopdog:pickup`, a prompt naming `self-clear.mjs`, and every prompt from the `watcher` and `slack` lanes. A turn already running finishes; nothing deletes the file when the weekly window resets. Its refusal names the way out: Todd types `lift stop`, and meanwhile a desk saves its state with `/slopdog:clear-to-close` then `self-clear.mjs`, which still pass. The stop is separate from the context tiers and applies whatever a desk's context. While the limits switch is paused (`v2/LIMITS-OFF` exists, flipped by `v2/scripts/limits-toggle.mjs` or a click on the polybar's `limits on`/`limits off` label) the hook passes every prompt and dispatch skips this refusal and the team-budget one; dispatch's `maxConcurrentBuilders` memory cap still holds. Rule: `v2/plugins/slopdog/session/watcher/SKILL.md`.


**mode.mjs** (SessionStart `startup|resume|clear|compact`, UserPromptSubmit; T-264, T-711): the crew mode, plus the desk's standing focus. Reads `~/slopdog/v2/mode.json` (`{mode, until, set_by, note}`, one file, one fact; `SLOPDOG_MODE_FILE` overrides it for tests) and prints one sentence per mode into context: `spend` while `until` is still ahead (take initiative, never block on Todd), `conserve` (short replies, one agent at a time, ask before spawning), and `normal` (standard house delegation), which is also the default for a missing, expired or unknown mode. When `~/.local/state/slopdog/usage.json` is under ten minutes old, the sentence ends "; five-hour window at N%": `~/.claude/statusline.py` writes the `rate_limits` object it receives there on every refresh. Then, when the session's desk folder (found from stdin `cwd` the way context-rot.mjs finds it) holds a `current-focus.md`, that file's text is printed after the mode line, so a desk's standing orders survive every clear, pickup and compact; only that desk sees them (the Ideas desk's was the first, verified 2026-10-08 by running the hook with cwd set to the Ideas and Research desks; Tyrion's carries the every-couple-of-hours retro of the running sprint, verified 2026-10-10 with cwd set to his folder). Plain stdout, exit 0 always. Todd flips the mode with `/slopdog:mode`; the board's header shows it.

**activity-log.mjs** (UserPromptSubmit, PreToolUse `Skill`, PreToolUse `Agent`, SubagentStop, Stop; T-192, project activity-view): the activity feed's writer. Appends one JSON line per event to `~/slopdog/logs/activity/<YYYY-MM-DD>.jsonl` (`ts, session, agent, lane, event, name, ticket, text`; `event` is `prompt`, `skill`, `agent`, `agent_done` or `stop`) with no model call: `lane` is the `lanes.json` key whose folder contains the cwd, `ticket` is the last `T-nnn` a prompt of that session named, sticky across the session's later lines, `text` is the prompt or `last_assistant_message` cut at 200 characters. Bash, Read, Edit and Write are skipped on purpose, as are the turn-log summariser's own `claude -p` runs (`BROZ_TURNLOG` set) and a `<task-notification>` prompt. The board's Activity view tails the file through `GET /api/runner/activity` (T-193, T-194). Fail silent, exit 0 always. Note: `notes/Slopdog/How Slopdog Works/Activity View.md` (T-197).

**stale-hook-wiring.mjs** (SessionStart `startup|resume|clear` with `record-loaded`, UserPromptSubmit and Stop; T-559-3): when `v2/plugins/slopdog/hooks/hooks.json` was committed after this desk's claude process started, types `/reload-plugins` into its own pane once idle (`scripts/lib/desk-pane.mjs`, herdr or tmux). `record-loaded` on session start stores the commit hash plugins just loaded; later turns compare git's last commit time on that file to the process start time and skip when this process has already reloaded for that hash (`~/.local/state/slopdog-hook-wiring/<claude-pid>.json`). A detached `--watch` child polls until the prompt is empty, like `self-clear.mjs`. Headless `claude -p`, background jobs and `BROZ_TURNLOG` runs exit at once.

**inbox-watch.mjs** (SessionStart `startup|resume|clear` and Stop, both `asyncRewake` with `timeout: 604800`, since Claude Code kills a command hook at its timeout, 600 s by default, asyncRewake included; T-276): the desk file inbox's wake-up; the convention is in `v2/CLAUDE.md` (Desk file inbox). Claude Code runs it in the background. It finds the desk by the longest `lanes.json` folder containing the cwd, polls that folder's `inbox/` every 3 s, and when a `YYYY-MM-DD-HHMM-from-<lane>-<slug>` file is there it moves every such file to `inbox-archive/`, writes their text to stderr and exits 2, which wakes an idle desk and hands it the text; Stop re-arms it after the turn. Any other file in `inbox/` (the publish desk's video ideas) is ignored. One watcher per desk (lock `~/.local/state/slopdog-inbox/<lane>.json`, taken atomically; a stale one is replaced); a file it cannot move to `inbox-archive/` is not delivered, so it can't wake the desk on every turn; it exits when its claude process is gone, and a headless `claude -p` (argv `-p`/`--print`, or `BROZ_TURNLOG`) exits at once so a summariser or dispatch job never takes a desk's mail. Stdout is always empty: zero context when the inbox is empty. `SLOPDOG_INBOX_DIR`/`SLOPDOG_INBOX_LANE` override the folder for tests. Verified 2026-09-25 on throwaway sessions: an idle session woke 4 to 6 s after a drop, twice in a row, through this plugin's hooks.json. Running desks pick it up on `/reload-plugins` or a restart.

**lane-lock.mjs** (PreToolUse `Edit|Write|NotebookEdit`, and Stop with `--release`; born in v1 2026-09-08, wired here by T-293): stops two desks editing one file blind. Before an edit it looks for a lock on the target in `~/slopdog/v2/.locks/` (gitignored); if another session holds one younger than 30 minutes it exits 2 and the edit is refused with "lane-lock: <desk> has <path> — took it at HH:MM"; otherwise it takes or refreshes the lock. Stop drops every lock the session holds, so a lock lasts for the holder's turn, and the 30-minute expiry covers a desk that crashed mid-turn. Scope is files under `~/slopdog/v2` only; `tasks/`, `dev/` and `notes/` are not locked, and edits made through Bash (sed, python) never pass this hook. The desk name is the `lanes.json` key whose folder holds the cwd (`desks/build/laforge` is `laforge`), `slopdog` outside every desk; the block itself keys on `session_id`. It lives in this folder, not `v2/scripts/`, because Node resolves `${CLAUDE_PLUGIN_ROOT}/../..` lexically through the `~/.claude/skills/slopdog` symlink, and a missing script exits 1, which Claude Code treats as allow. Verified 2026-09-26 on live desks (T-293): after `/reload-plugins`, Research's Edit of a file Scotty held was refused with the lane-lock message, its Write to another file went through, and its lock was released when its turn ended. To see who holds what: `ls ~/slopdog/v2/.locks/`; to force-clear one, delete its file.

**Which files a session writes is keyed on Claude's `session_id`.** The turn-log hook passes the payload's id to `session-dir.sh --session`; the skills pass `${CLAUDE_SESSION_ID}`. The cmux workspace key is used only to pick which sidebar card to rename.


# Turn log

Keeps a running record of what each turn in this session did, so you can read one file
instead of scrolling back.

> The log's files and the scripts it shares with `/slopdog:wtf` are documented in
> **`../session/wtf/README.md`**. Read that before changing any of it. This file is just the
> hook's half.

| Hook | Script | Job |
|---|---|---|
| `Stop` | `turn-log.sh` → `turn-log.py` | prepend one line to `turns.md`, draft an `open` entry in `concerns.md` when the summariser names one (T-285), rename the sidebar card |

## When it fires

On **every turn**, the moment Claude stops talking, never while it is working.

## What happens

**Turn 1** names the session. The summariser reads the opening exchange and invents a
title; the log directory is renamed from its provisional `…-session` name to that title, the
cmux sidebar card is renamed to match, and the turn is logged.

**Turn 2 and every turn after** reads only what is new since last time and writes one
tweet-sized past-tense line about what got done. When the summariser names a concern, it is
prepended to `concerns.md` as `open`, tagged with the turn number, and never filed twice.

**Skipped:** a turn with no prompt from Todd in it (a subagent finishing, a compaction).
Nothing is lost; the next real turn picks that stretch up too.

## Where it lands

`~/slopdog/logs/conversations/<month>/<session>/`, one directory per Claude session:

- `turns.md`: one dated line per turn, newest on top
- `concerns.md`: what could still bite
- `.session`: the session id, written at creation only

The workspace's **sidebar card** is renamed whenever the session title changes, so the
session is identifiable at a glance, and a card you rename by hand is left alone until the
title moves. That runs through `~/.claude/skills/slopdog/session/wtf/scripts/rename-card.sh`,
which always targets `$CMUX_WORKSPACE_ID`; a bare `cmux rename-workspace` would rename
whichever workspace is focused when the detached worker fires.

## The one thing to know

The hook bails immediately when `BROZ_TURNLOG` is set: the summariser is itself a `claude -p`
run in this project, so it fires the hook too, and without the guard `Stop` would fork-bomb.

The Stop worker runs **detached**. Your turn never waits on it; the line shows up a few
seconds after the turn ends.
