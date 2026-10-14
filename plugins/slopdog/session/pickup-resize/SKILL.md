---
name: pickup-resize
description: Re-size the desks' clear tiers (nudge, suggest, force) from real usage — reads the last 14 days of desk transcripts, measures the median context when a /slopdog:pickup finishes, replays the traffic under a sweep of ceilings, and writes the cheapest as the three numbers context-rot.mjs reads. Runs weekly from cron; also on demand. Use when Todd says "/slopdog:pickup-resize", "resize the tiers", "re-size the clear ceiling", "are the clear tiers still right", or asks what the clear numbers should be now. `--dry-run` prints and writes nothing.
disable-model-invocation: true
---

# pickup-resize — the clear tiers, sized from real usage

The clear tiers (T-277) are the three numbers `hooks/context-rot.mjs` warns and refuses at. The
cheapest ceiling depends on how big a desk is right after pickup: the research report
`~/slopdog/v2/desks/research/reports/2026-09-25-clear-ceiling-cost.md` §2a (The sweet spot) puts
it at about two and a half to three times that size. This skill measures that size from the
transcripts and moves the tiers to match. The script does all the work; the method and its
limits are in `README.md` beside this file.

## Run it

```
node ~/slopdog/v2/plugins/slopdog/session/pickup-resize/scripts/pickup-resize.mjs $ARGUMENTS
```

- `--dry-run`: prints the three suggested numbers and the cost delta against the tiers in force,
  and writes nothing. Run this first when Todd asks what the numbers should be.
- No flag: also writes the numbers to
  `~/slopdog/v2/plugins/slopdog/hooks/context-tiers.json` (the hook reads it on the next
  prompt; `SLOPDOG_CONTEXT_*` env vars still override it) and appends one line to
  `~/slopdog/v2/desks/research/experiments/clear-ceiling/resize-log.jsonl`.
- The force tier (`hard`, the one that refuses prompts) is kept at what the tiers file holds,
  350k if none; the output shows what `--resize-hard` would set it to. `--resize-hard` sets it to
  1.4 times the new ceiling. Off until Todd answers q1 on T-278: do not pass it before then.
- `--days N` changes the 14-day window.

Report the script's three output lines as they are. When a `--resize-hard` run drops the force
number, say so in the first sentence: a lower force tier refuses prompts at desks already past it.

## Weekly

A crontab line on the ThinkPad runs the script every Monday at 09:10, after the docs mirror,
logging to `~/.local/state/pickup-resize.log`. It passes no flags, so it never moves the force tier. Check it with `crontab -l | grep pickup-resize`.
