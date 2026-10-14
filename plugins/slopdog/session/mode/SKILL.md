---
name: mode
description: Flip the crew between spend, normal, and conserve — writes ~/slopdog/v2/mode.json (the one fact every desk's mode hook reads on its next prompt), commits it, and tells every live desk in one line. Use when Todd says "/slopdog:mode", "spend mode", "normal mode", "conserve mode", "token maximization mode", "we have budget", "save tokens", "spend freely", "back to normal", or "back to careful". Prints the five-hour budget and a suggestion; never flips on its own.
disable-model-invocation: true
allowed-tools:
  - Bash
---

# mode — one word puts every desk in spend, normal, or conserve

The mode is one file, `~/slopdog/v2/mode.json` (T-264, T-643). The `hooks/mode.mjs` hook reads it
on every prompt and tells each desk which mode it is in; this skill is the only writer. Unconfigured,
missing, or expired modes read as **normal** on the next prompt.

**Step 1 — run it.** `$ARGUMENTS` is `spend|normal|conserve [hours] [--dry-run] [note…]`; hours
default to 4.

```bash
node "$HOME/.claude/skills/slopdog/session/mode/scripts/mode.mjs" $ARGUMENTS
```

The script writes the file, commits only that path in `~/slopdog` and pushes, then sends one
line, typed through `scripts/lib/desk-pane.mjs`, to every pane of a desk in `lanes.json` (the herdr agent `herdr-<lane>`, tmux `@peak_lane` only as a fallback), skipping
the pane it runs in. With `--dry-run` it prints the JSON it would write and the panes it would
message, and touches nothing. It ends with the five-hour window from
`~/.local/state/slopdog/usage.json` when that file is under ten minutes old, plus a
suggestion (under 50% used says spend, 70% and up says conserve). The suggestion is advice:
the mode only changes when Todd names one.

**Step 2 — relay.** One line back: the mode, the `until` time, which desks were told, and the
budget line. Nothing else.

## Don't

- Don't set the mode from the percentage yourself; Todd names the mode.
- Don't run it without `--dry-run` while testing: it messages every live desk.
- Don't stage anything but `v2/mode.json`; the script already does only that.
