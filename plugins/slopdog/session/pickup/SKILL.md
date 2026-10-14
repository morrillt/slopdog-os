---
name: pickup
description: Resume a session after /clear from what /slopdog:clear-to-close wrote — run the report script, hand the deep read to a subagent so the calling desk never opens PICKUP.md, its files, or the ticket file itself, then carry on from the subagent's one-line summary without asking anything unless it names a question for Todd; with no PICKUP.md it says so and waits for Todd's direction. Use when Todd says "/slopdog:pickup", "pickup", "pick up", "pick it back up", "resume", "where were we", "carry on", or as the first thing after a /clear; self-clear.mjs types it for a desk. With the argument `report` it restates and stops, so it can be run headless; a path argument names the PICKUP.md to read.
---

# pickup — the reading half of clear-to-close

`/slopdog:clear-to-close` writes; this skill reads. The contract: what clear-to-close wrote
is complete enough that pickup needs nothing else. Todd, 2026-09-12: "clear to close
should set all the things ready so I can clear, and then /pickup resumes the session, so
I can just trust we are ready to pickup." Todd, 2026-09-26: on a pickup that burned 33% of
a desk's context window reading `PICKUP.md` and the ticket file directly before any real
work began, "get that a little bit shorter and faster." Three steps: run the script, read
in a subagent, resume.

One note, one reader. A **desk** (a folder named in `~/slopdog/v2/lanes.json`) has
`PICKUP.md`: the ticket in hand, its exact state, the next command. The first `T-nnn` in
the note is the ticket in hand. The rule is `~/slopdog/v2/rules/desk-clear.md`.

**Step 1 — restate.**

```bash
node ~/.claude/skills/slopdog/session/pickup/scripts/pickup-report.mjs --dir "$PWD"
```

`$ARGUMENTS` ending in `PICKUP.md` is the note to use: pass its folder as `--dir` instead
of `$PWD` (`self-clear.mjs` types `/slopdog:pickup <desk>/PICKUP.md` after a desk clears).
The script prints, in order, the desk's standing file `current-focus.md` verbatim when the
desk has one (the same file `mode.mjs` prints on every prompt), `retro: on` when the desk's
`.retro-mode` file holds `on`, then `desk:`, `answer:` (any board answer the desk missed),
`ticket:` (the board's status for it now) and `resume:`. Reply with those lines verbatim,
nothing above them. With no `PICKUP.md` it prints `no PICKUP.md` and exits 2: say in one line that
there is nothing to resume, and wait for Todd's direction. A note another desk wrote into
this folder prints `CROSSED NOTE:` and exits 3: resume nothing from it, tell Todd in one line
whose note it is, and wait (Herdr.md D4). `$ARGUMENTS` is `report` → stop
here, having printed the lines; this is the headless test of the round trip and resumes
nothing. This is where the old separate "`report` stops here" step went: the check is now
part of restating, not a step of its own.

**Step 2 — read in a subagent.** Launch one `general-purpose` (or `Explore`) agent and give
it nothing more than the note's path, the ticket id from the `ticket:` line, and this job:
read `PICKUP.md` whole (who you are, the ticket in hand, what was in flight, the next
command, the files that matter, the open questions); read the ticket file's latest
`## Progress notes` entry, since the board's status can have moved past the note (the note
says 🟡 and the board says 🟩, 🔍, 🟠, or another worker — the board wins); check whether
what was in flight already landed (usually one `git log` over the paths the note names,
never re-spawning what already landed); then return exactly:

```
summary: <one line — the ticket's real state now, board included>
next: <the exact next command, verbatim, never "continue the work">
question: <the question for Todd from the note or the ticket, or "none">
```

The calling desk never opens `PICKUP.md`, a file it names, or the ticket file itself — the
subagent's three lines are the whole of what crosses back. This is what the old separate
"read the note", "check the board", and half of "the only question" steps folded into: one
launch, one summary, because a stranger reading the note and the ticket is exactly what a
subagent is for.

**Retrospective persistence (T-659).** When `PICKUP.md` or the ticket says a lesson still
needs capturing, append it before resuming work:

```bash
node ~/slopdog/v2/scripts/retrospective-append.mjs \
  --ticket T-nnn \
  --what "..." \
  --cost "..." \
  --prevention "..." \
  [--tag <theme>]
```

Schema and file naming: `~/slopdog/v2/retrospective/README.md`. The write-side reminder
to carry that into `PICKUP.md` lives in `/slopdog:clear-to-close` (Step 1).

**Retro step, only when Step 1 printed `retro: on` (T-711).** Before resuming, run a short
retro over the team's focus batches (`~/slopdog/v2/context.yaml`), in a subagent so the reading
stays out of the desk: what closed since the last pickup, what is stuck and why. Say one or two
suggestions to Todd in at most three lines, and append any real lesson with
`retrospective-append.mjs` (below). The aim is at least one focus batch closed every three to
five pickups; say when that is slipping. No `retro:` line means retro mode is off: skip this.
Todd flips it with the Retro toggle in the slopdog-tools pane (`/slopdog-tools`), which writes
`on` or `off` into `<desk>/.retro-mode`.

**Step 3 — resume.** Open with `Picked up <T-nnn>: <the subagent's next line>`. A
`question:` other than `none` is asked now, as one `AskUserQuestion` menu (one decision,
recommendation first) unless your desk's rules route questions elsewhere (a builder sends
it to the dispatcher, a ticket question goes on the board) — ask nothing else, not "shall I
continue". An unattended lane (`UNATTENDED_LANES` in `plugins/slopdog/bin/clear-asks.mjs`)
never opens a menu, since nobody is there to answer it: a ticket question goes on the board
through `/slopdog:ask-todd`, anything else goes to Tyrion with `inbox-write.mjs --to build`,
and the desk carries on. Then run the next command under your normal rules. The note is rewritten in
place at the next `/slopdog:clear-to-close`.

## Don't

- Don't resume from memory of an earlier session; the note is the state. With no
  `PICKUP.md` there is nothing to resume: say so in one line and wait for Todd.
- Don't read `PICKUP.md`, a file it names, or the ticket file yourself — that reading is
  the subagent's job in Step 2; the desk only ever holds its three-line return.
- Don't mark a ticket 🟩; that is the work's outcome and someone else's word.
- Don't open anything on screen.
