---
name: clear-prototyper
description: The Prototyper desk's own short clear — four steps, replacing /slopdog:clear-to-close for that desk. Use when Todd says "clear to close", "are we clear to close", "safe to clear", or "/slopdog:clear-prototyper" in the Prototyper desk. It writes desks/prototyper/PICKUP.md anchored on the quick task in hand, commits and pushes by path, runs pickup-check.mjs, then asks one yes-or-no question and runs self-clear.mjs on a yes. Any other desk uses /slopdog:clear-to-close.
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# clear-prototyper — the Prototyper desk's four-step clear

This desk has no board tickets, no jobs table, no verifier and no dispatcher, so the long
`/slopdog:clear-to-close` fan-out does not apply here. Four steps, nothing else. The
mechanism behind them is `~/slopdog/v2/rules/desk-clear.md`; `/slopdog:pickup` reads what
step 1 writes.

## Step 1 — write `PICKUP.md`

Overwrite `~/slopdog/v2/desks/prototyper/PICKUP.md` (never append; it is the state
now, not a log), in the `~/slopdog/v2/desks/TEMPLATE-PICKUP.md` shape, under 40 lines,
anchored on the **quick task in hand** by its real path under `~/slopdog/v2/quick-tasks/`
— this desk writes no board tickets, so the task file is the anchor. It holds:

- **Who** — Prototyper, the prototyper desk; Todd brings the work to this pane himself.
- **Task in hand** — the `v2/quick-tasks/<file>.md` path, its title and status, which steps
  are ticked and which are not, what is uncommitted, which branch or worktree.
- **Next command** — the exact command, verbatim. Never "continue the work".
- **Files that matter** — at most five, the ones the next reader opens first.
- **Open questions** — each with who has it: Todd, or nobody yet.
- **Retrospective** — carry the capture instruction in (`~/slopdog/v2/CLAUDE.md` requires
  it in every note): append lessons as they happen with
  `node ~/slopdog/v2/scripts/retrospective-append.mjs --ticket <id> --what … --cost … --prevention …`
  (schema `~/slopdog/v2/retrospective/README.md`).
- The closing line, verbatim: **"when you resume, message Todd unprompted to confirm you're
  back"** — plus the task in hand, its real state now, and the one thing you are doing next.

## Step 2 — commit and push by path

Shared-tree rules: stage only the paths this session changed, never `git add -A`, never
check out a branch and never stash in `~/slopdog`.

```bash
cd ~/slopdog && git add <paths> && git commit -m "prototyper: <what changed>" -- <paths> && git push origin main
```

The message follows `~/slopdog/v2/rules/commits.md`: lane `prototyper`, and a `Why:` line.
Dirt that is not yours: name it in one line and leave it.

## Step 3 — run the checker

```bash
node ~/slopdog/v2/plugins/slopdog/bin/pickup-check.mjs
```

It exits 0 when `PICKUP.md` is at most ten minutes old, names the task in hand, and is
newer than the file it names; it exits 1 naming each thing that is not. Fix whatever it
names in Step 1 terms and run it again. Never go to Step 4 over a failing check — print
`Not yet: <the one thing missing>` and stop.

## Step 4 — ask once, then clear

One `AskUserQuestion`, one decision, two options, nothing else in the turn:

- **Question:** "Everything is written and pushed. Good to execute the clear?"
- **(a) Yes, clear now (Recommended)** — "Runs self-clear.mjs: it types /clear into this
  pane and picks the note back up automatically."
- **(b) No, not yet** — "Nothing is cleared; say what to fix and the note is rewritten."

**Yes** → run it in the same turn, nothing in between:

```bash
node ~/slopdog/v2/scripts/self-clear.mjs
```

**No** → clear nothing, print `Not yet: <the one thing he named>`, fix it, go back to Step 3.

## Don't

- No ticket Progress notes — this desk has no board tickets.
- No jobs table, no board, no verifier, no dispatcher hand-off.
- No process report, no memory-distillation step, no closing report.
- Don't open anything on screen.
- Don't run `self-clear.mjs` before he answers, or after a no.
- Don't ask anything else in that turn.
- Don't add a fifth step.
