# pickup-resize

Re-sizes the three clear tiers that `hooks/context-rot.mjs` enforces (T-277: nudge, suggest,
force) from the desks' own transcripts. Built by T-278; the method is the clear-ceiling
experiment's (`~/slopdog/v2/desks/research/experiments/clear-ceiling/`, report
`desks/research/reports/2026-09-25-clear-ceiling-cost.md` §2a and §6).

## What the script does

`scripts/pickup-resize.mjs` reads every main-thread request from the last 14 days of the desks'
transcripts (`~/.claude/projects/-home-<user>-slopdog-v2-desks-*`). It measures the context at the
end of each pickup: the turn starts at a prompt that is the `/slopdog:pickup` command and the
pickup ends at the restatement, the first sizeable text reply after a tool call. The end of the
whole turn is not used, because the pickup skill carries on into the ticket in the same turn. The
median of those sizes is the fresh-start size, `BASE`.

It then replays the traffic as `simulate.mjs` does (sessions joined per desk and model, only the
clears moved, the one-hour cache priced in) at ceilings from 100k to 500k in 25k steps, and takes
the cheapest as the suggest tier. Nudge is 0.8 times it, rounded to 10k. The force tier (`hard`,
which refuses prompts) stays at what `context-tiers.json` holds, 350k if nothing, because lowering
it refuses prompts at desks already past the new line. `--resize-hard` sets it to 1.4 times the
new ceiling instead, the shape of Todd's 200k / 250k / 350k; the flag stays off until Todd answers
q1 on T-278, and every run prints what it would give. The cost delta is the same replay at the
ceiling in force now.

Without `--dry-run` it writes `hooks/context-tiers.json` (read by the hook first; the
`SLOPDOG_CONTEXT_NUDGE`, `_CEILING` and `_HARD` env vars override it; the hook's `DEFAULTS` line
is the fallback when the file is missing) and appends one JSON line per run to
`desks/research/experiments/clear-ceiling/resize-log.jsonl`. It does not touch the experiment's
`requests.jsonl`.

## One model, for now

The script prices every desk at one model, the one with the most requests in the window, and
writes one set of tiers for every desk. The tiers really vary by model: Fable's price per token
moves the cheapest ceiling, and a desk's fresh start differs by desk (Tyrion restarts heavier
than the others). Tuning them per-model, and per desk, is a later step; the hook would have to
read the model from the transcript first (report §6).

## Weekly job

Crontab on the ThinkPad, Monday 09:10, five minutes after the docs mirror, with no flags (the force tier stays put):

```
10 9 * * 1 ~/.local/bin/node ~/slopdog/v2/plugins/slopdog/session/pickup-resize/scripts/pickup-resize.mjs >> ~/.local/state/pickup-resize.log 2>&1
```
