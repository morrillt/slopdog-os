---
name: goal
description: Change what each desk's ticket panel shows — the header and the flat ticket list under the Claude pane — by editing goal.mjs and restarting the live panes. Use when Todd says "/slopdog:goal", "desk panel", "goal pane", "goal.mjs", or when a ticket step says to open a panel change with edit-skill and points at the desk panel renderer.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
disable-model-invocation: true
---

# goal — the desk ticket panel (`goal.mjs`)

Each slopdog desk has a short pane under its Claude that lists that desk's tickets in
work order. `~/slopdog/v2/scripts/goal.mjs` renders it; `goal-panes.mjs` and `herdr-swarm.mjs`
keep a long-lived node process running it per lane.

**Step 1 — edit the renderer.**

Open and change:

`~/slopdog/v2/scripts/goal.mjs`

Lane names and inbox folders come from `~/slopdog/v2/lanes.json`. One frame without a live
pane:

```bash
node ~/slopdog/v2/scripts/goal.mjs <lane> --once
```

**Step 2 — reload live panes** after any change on disk (the running node does not pick up
the file):

```bash
node ~/slopdog/v2/scripts/goal-panes.mjs --restart
```

On herdr-only layouts, restart the goal pane for that lane the same way the swarm built it
(`herdr-swarm.mjs` runs the same `goal.mjs` loop). Never kill the `sh` restart loop — only
restart through `goal-panes.mjs --restart` or by killing the `node …/goal.mjs` child so the
loop respawns it.

**Step 3 — say what you checked.** Note the lane, whether `--once` showed the expected
header (including inbox `✉ N` when messages wait in that desk's `inbox/`), and that
`goal-panes.mjs --restart` ran if panes were up.
