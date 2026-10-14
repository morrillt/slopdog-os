---
name: watcher
description: Run the watcher desk's monitoring cycle every five minutes — reads weekly Claude usage, Slacks Todd once at each notify, warn, and stop rung from sprint-watch.json, stops the sprint at the stop threshold while the hard ceiling still applies, checks unstucker for stuck desks, and tracks self-clear completions. Use when Todd says "watcher", "/slopdog:watcher", "run the watcher", "watch the sprint", "start the watcher", "watcher cycle", or when the Watcher desk is on duty keeping other agents moving.
allowed-tools:
  - Bash
  - Read
---

# watcher — usage rungs, sprint stop, stuck agents, and clear verification

Replaces the manual overwatch prose loop in desks/watcher/CLAUDE.md.

Runs the Watcher desk's 5-minute health cycle across the house: weekly Claude usage rungs and the sprint stop, unstucker for stuck desks, self-clear verification, a stalled-doing pass (inbox to Tyrion), a nudge to Tyrion when ready tickets wait on his idle pane, and a hand-off of any still-open focus batch to Data once the sprint passes its finish-by time. She only runs `watch.mjs` and relays its report — never edits that script.

## Step one — USAGE, THE RUNGS, AND THE STOP

Read weekly Claude usage from the statusline cache (`~/.local/state/slopdog/usage.json`): `seven_day.used_percentage` and the window key `seven_day.resets_at`.

- **Thresholds** are read at run time from `v2/desks/watcher/sprint-watch.json`. The watcher hardcodes none of them. The keys are `notifyPct`, `warnPct`, `stopThresholdPct`, and `hardCeilingPct`, plus `intervalMinutes` for the loop. Whatever numbers those keys hold are the rungs for that cycle.
- **Slack, once per window.** Crossing a rung sends Todd one Slack direct message through `postSlackMessage` and `TODD_SLACK_DM`, both imported from `v2/scripts/openrouter-model-check.mjs`, with `SLACK_BOT_TOKEN` from `~/.config/slack-channel/.env`. One short paragraph: the percentage, what it means for him, and what happens next. No ticket ids. Delivery is remembered in `v2/desks/watcher/usage-rung-state.json`, keyed by the current `seven_day.resets_at`. Each rung fires at most once per window. Two rungs crossed in one cycle send in order (notify, then warn, then stop). A new `resets_at` re-arms all three. A failed send is logged and that rung stays unfired so the next cycle retries it.
- **First cycle of a window** (no state file for this `resets_at`): notify and warn already at or above current usage are marked fired with no Slack, so a deploy does not replay rungs he is already past. A rung still above current usage can fire on the next crossing. Stop keeps writing `SPRINT-STOP` and the desk inboxes. If the stop already fired this window and Slack has not announced it, the stop message goes out once.
- **The stop** (hard ceiling unchanged): when weekly usage is at or past `stopThresholdPct` or `hardCeilingPct`, stop the sprint immediately:
  While the limits switch is paused (`v2/LIMITS-OFF` exists; `v2/scripts/limits-toggle.mjs` or a click on the polybar's `limits on`/`limits off` label flips it), the stop rung writes no `SPRINT-STOP` and the cycle logs `stop=limits paused` instead; usage is still read and the notify and warn rungs still Slack.
  1. Writes `v2/desks/watcher/SPRINT-STOP` with the timestamp, usage %, and reason. It is a code gate (T-729): `dispatch.mjs` refuses every job while it exists, a `hotfix: true` ticket and `--force` included, and the `sprint-stop.mjs` UserPromptSubmit hook refuses every desk's next prompt. Let through: a typed prompt that starts `lift stop` (it deletes the file; a Slack or inbox message never counts), `/clear`, `/slopdog:clear-to-close`, `/slopdog:pickup`, any prompt naming `self-clear.mjs`, and every prompt from the `watcher` and `slack` lanes. A turn already running finishes.
  2. Sends an alert message to Tyrion (`build` desk) and Daphne (`ideas` desk) inboxes.
  3. Logs `stop=fired` (or `stop=already` on subsequent cycles).
  4. Resuming the sprint is Todd typing `lift stop` into a desk pane (or deleting `v2/desks/watcher/SPRINT-STOP`). Nothing deletes the file when the weekly window resets; the stop holds until someone lifts it.
  The hard ceiling is still a stop, not a fourth Slack rung.
- **Trustworthiness**: if weekly usage cannot be read or is stale (>30 minutes old), the watcher reports this loudly in the output and log (`weekly=? UNREADABLE` or `UNTRUSTWORTHY`), rather than guessing or making up numbers. Stale or unreadable usage does not send a rung Slack.

## Step two — STUCK AGENTS

Walk the active desk panes and report any agent that is idle with work in hand, or busy with no output for an unusual stretch.

- Calls `~/slopdog/v2/scripts/unstucker.mjs --dry-run` to detect stuck shapes. Does not implement a redundant second detector.
- The unstucker's on/off switch is `v2/desks/watcher/.unstucker-mode` (`u` on build watch's Main page flips it); off stops its typing runs, while this cycle's `--dry-run` read still works.
- Summarizes the stuck agents count and targets in the cycle log line.

## Step three — CLEARS

Watch agent self-clears specifically:

1. **Known bad states**: captures bad states reported by unstucker:
   - `clear-stalled`: a `/clear` was typed but never took (context never dropped).
   - `cleared-no-pickup`: a cleared pane that never received its pickup line.
2. **Clear completion tracking**: checks `v2/desks/watcher/clear-pending.jsonl` where `self-clear.mjs` tags each clear with `phase: "started"` and `phase: "completed"`. Flags any clear started within the last 20 minutes that has not recorded completion.

## Step four — STALLED DOING

Reads `focus_batches` from `v2/context.yaml`, finds matching `| 🟡 |` rows in `~/slopdog/tasks/task-list.md`, and flags a ticket stalled when **either** there is no live `cursor-agent` on its ticket file for two consecutive cycles **or** ticket activity (git commit, build/progress log line, or matching worktree file mtime) is older than **10 minutes**. Tyrion gets at most one inbox per ticket per hour naming which signal fired. When focus-batch 🔵 or 🔍 work is dispatchable but no `cursor-agent` is running anywhere for two cycles, Tyrion gets an `idle-queue` inbox at most once per 30 minutes.

## Step five — NUDGE TYRION

When ready work waits (the dispatchable focus-batch 🔵/🔍 rows above, plus any 🔵 row on the board whose ticket says `hotfix: true`) and Tyrion's `build` pane is idle at an empty prompt, the cycle writes one `ready-queue` inbox file to the build desk naming the ready tickets; `inbox-delivery-watch` types it into his pane. Tyrion's pane state is read from the same `unstucker.mjs --dry-run` output (`build (…): would nudge (idle)`), not a second detector. At most one nudge per 15 minutes, kept in `v2/desks/watcher/tyrion-nudge.json`. The log line ends `NUDGE tyrion=<sent [ids] | cooldown Nm | tyrion-busy | tyrion-absent | no-ready | would-send>` (`would-send` under `--dry-run`, which sends nothing).

## Step five-b — SPRINT OVERDUE

A sprint finishes in hours, not days (T-740; Todd, 2026-10-11: "if the batch just isn't done the sprint isn't done, we have to let the higher reasoning model step in"). `v2/context.yaml` may carry `finish_by:` (ISO UTC), set by whoever starts the sprint through `/slopdog:set-focus --finish-by`.

- **The check.** Each cycle compares now with `finish_by`. Past it, every focus batch that still has a ticket not 🟩/🟢, not dropped and not ⏸️ paused (a paused ticket was parked on purpose; the ticket read and classification are `v2/scripts/sprint-moving.mjs`'s `loadTickets` and `classify`; an unfinished archived ticket counts as dropped) is open.
- **The hand-off.** Open batches go to Data in one `sprint-overdue` inbox file (`inbox-write.mjs --from watcher --to data`), listing each batch with its open ticket ids and statuses and telling Data: "Sprint past its finish-by time. Take these batches in the trusted lane: read the project and batch, treat tickets as hints, plan, build, verify, close."
- **Once per finish_by.** `v2/desks/watcher/sprint-overdue.json` records the `finish_by` it fired for; a later cycle with the same value sends nothing, and a new `finish_by` re-arms it.
- **The log field.** `OVERDUE <no-finish-by | bad-finish-by | not-yet | all-done | sent | already | would-send> finish_by=<iso> data=[<batches>]`. Under `--dry-run` it reports `would-send` and prints the message it would write, and writes neither the inbox file nor the marker.
- **Trying it without touching the live file.** `--context <file>` reads `focus_batches` and `finish_by` from a scratch copy for the whole cycle: `watch.mjs --dry-run --context /tmp/ctx.yaml`.

## Step six — MEMORY CEILING

One `MEM` field closes every cycle line: `avail=<GB> swap=<pct>% pinned=<desks> alert=<no|rising|FIRED>` (T-less quick task `2026-10-11-memory-ceiling`, Todd's approval of Process Versus Direct report 3.1).

- **Fleet memory and swap** come from `/proc/meminfo`.
- **OOM pin.** The cycle sets `oom_score_adj` to -500 on Tyrion's and the Watcher's own agent processes (cwd `desks/build/tyrion` and `desks/watcher`, a `claude` or `cursor-agent` command) with `sudo -n choom`, the call the Slack listener's unit already uses. It re-applies every cycle, so a restarted session is covered within one cycle (about five minutes). Undo: `sudo choom -n 0 -p <pid>`.
- **Swap alert.** Swap at or above 80% for five minutes sends one inbox note to IT and to Tyrion per episode (`desks/watcher/swap-state.json` holds the episode); it resets when swap drops below 80%.
- **Builder cap.** Not in this script: `dispatch.mjs` refuses a write job when `maxConcurrentBuilders` (in `desks/watcher/sprint-watch.json`, now 3) write jobs already run; `SLOPDOG_MAX_BUILDERS` overrides it.

## Step six-b — TIMEOUTS

One `TIMEOUTS` field ends the cycle line: `TIMEOUTS none (24h)`, or `TIMEOUTS gemini=6,grok=1 (24h)`. It counts job files under any desk's `jobs/` folder (written by `dispatch.mjs`) whose front matter says `exit: 124` and that finished in the last 24 hours, grouped by `engine:`. Each engine with timeouts also gets its own stdout line, `TIMEOUTS engine=<engine> exit124=<n> in 24h`. The ticket side is `dispatch.mjs`: a job that exits 124 leaves a 🔴 Progress note naming the engine on the ticket the moment it closes, and a ticket with five or more unticked steps is refused on the Gemma lane with "shard first" (check 14, A-15).

## Step six-c — TEAM BUDGET

One `BUDGET` field ends the cycle line: `BUDGET slopdog=18/20 projects=0/35 it=0/5 unattributed=0m/715m`, each department's spend against its share as percentages of the week (T-678).

- **The shares** are in `v2/desks/watcher/team-shares.json`: slopdog, projects and it, plus `todd` for Todd's own work, adding to 100, and `warnAtFractionOfShare` (0.8). Todd changes a share by editing that one file.
- **Spend** is the weekly `seven_day.used_percentage` times the department's fraction of the ledger minutes (`v2/reports/usage/ledger.jsonl`) logged this window; a ledger row's department is the `type:` of its ticket's batch. Rows with no batch count in the total but belong to no one.
- **The warning.** At the warn fraction of a share the cycle prints `team-budget: warn <department> <spend>/<share>` and writes one `team-budget-<department>` inbox file to Tyrion (`build`), once per department per window (`v2/desks/watcher/team-budget-state.json`). `--dry-run` prints the line and sends nothing.
- **The refusal** is dispatch's, not the Watcher's: a ticket whose department has spent its share is refused with `refused: <department> has spent its <share>% share` (`dispatchBudgetRefusal` in `v2/scripts/lib/team-budget.mjs`; check one by hand with `node v2/scripts/team-budget.mjs check <department>`). `todd` is never refused, nor is a `hotfix: true` ticket.
- The single `stopThresholdPct` in `sprint-watch.json` still stops everyone at once; the shares only divide the week below it.

## Step six-d — LISTENER RESTARTS

One `RESTARTS` field ends the cycle line: `RESTARTS slack-channel=<n>/1h alert=no|FIRED|would-fire|FAILED`. It counts `Started slack-channel.service` entries in `journalctl --user -u slack-channel.service --since -1h` (the journal, because `NRestarts` resets on a manual restart). Three or more inside the hour send Todd one Slack DM through `postSlackMessage` naming the service and the count, at most once an hour (`v2/desks/watcher/restart-rate.json` holds the last alert time). The post uses the bot's HTTP token, so it goes out while the Socket Mode listener is down. `--dry-run` reports `would-fire` and sends nothing (T-728).

## Step seven — Run the cycle

Run one cycle:

```bash
node $HOME/.claude/skills/slopdog/session/watcher/scripts/watch.mjs --once
```

Run in a 5-minute continuous loop, started with `run_in_background` so your turn ends at once (it never exits, so never wait on it):

```bash
node $HOME/.claude/skills/slopdog/session/watcher/scripts/watch.mjs --loop
```

Dry run (prints output without writing the log, the stop file, rung state, or a Slack message):

```bash
node $HOME/.claude/skills/slopdog/session/watcher/scripts/watch.mjs --dry-run
```

Each cycle writes exactly one line to `v2/desks/watcher/sprint-watch.log`:

```
YYYY-MM-DDTHH:MM:SS.sssZ | USAGE weekly=34% fresh=true age=0m stop=no | STUCK stuck=6 [...] | CLEARS clears bad=0 pending=0 | DOING stalled=0 | QUEUE idle=2 [T-702, T-704] | NUDGE tyrion=sent [T-702, T-704] | OVERDUE not-yet finish_by=2026-10-11T23:00:00.000Z | QUOTA exhausted=[cursor:composer]
```

A human reading the log can tell at a single glance whether any desk or threshold needs attention.
