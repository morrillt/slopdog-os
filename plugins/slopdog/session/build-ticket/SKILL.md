---
name: build-ticket
description: The one build order every builder follows on a house ticket in ~/slopdog/tasks/tickets — Composer, Grok, Gemini (Gemma), OpenRouter and LaForge alike. Preflight and halt, a code-aware plan checked by plan-check.mjs, then per step a Plan line, the step's files only, its Verify line, and one commit through build-step.mjs; then every automated acceptance criterion run with Red/Green written into Hand-off; then a fixed report. A verifier is pointed at the one verify brief. Use when you are handed a ticket to build ("build T-nnn", "Follow … build-ticket/SKILL.md for this ticket", "/slopdog:build-ticket"), or are verifying one a builder handed off.
---

# build-ticket — step through a ticket, leave notes, never guess

Plain markdown on purpose: Cursor, agy and Claude all read it the same way. Every command
below is a shell command; run it as written. `<ticket>` is the ticket's path or its id
(`T-123`). The scripts:

- `node ~/.claude/skills/slopdog/session/build-ticket/scripts/build-log.mjs <ticket> <Plan|Implementation|Debug|Decision|Assumption|Blocker> "<one line>"`
  appends `- YYYY-MM-DD HH:MM: [Tag] …` under the ticket's `## Build log`.
- `node ~/.claude/skills/slopdog/session/build-ticket/scripts/build-step.mjs <ticket> <N> "<what this step did>" --why "<one line>" [--decision "<choice> — <alternative rejected>"]... [--lane <lane>] -- <files…>`
  logs the step, ticks step N, lists the files under Hand-off with the why, and commits
  exactly those files plus the ticket as `<lane> T-<id> step <N>: <what>` with `Why:` and
  `Decision:` lines in the body. The lane comes from `--lane`, `$DISPATCH_LANE`,
  `$DISPATCH_ENGINE`, or a `v2/.worktrees/<lane>/` path. It refuses, writing nothing, when
  the step is already ticked, no files are named, a named file is unchanged, or no lane
  resolves.
- `node ~/.claude/skills/slopdog/session/build-ticket/scripts/red-check.mjs <ticket> <AC-n> --cmd "<command>" [--why "<one line>"] [--lane <lane>] -- <check files…>`
  runs the failing check you wrote for a criterion. It refuses when the command exits 0 (it
  tests nothing new) or cannot run (126/127); otherwise it commits exactly those files as
  `<lane> T-<id>: red check for AC-n` and writes `Red-check: AC-n · <command> · <hash>` under
  the ticket's `## Hand-off`. That commit is the first one for each automated criterion.
- `node ~/.claude/skills/slopdog/session/build-ticket/scripts/plan-check.mjs <ticket>`
  reads the ticket after you append one `[Plan] AC-n · Given … When … Then …` line per
  automated criterion under `## Build log`. Exit 0 means the plan is complete; exit 1 prints
  one line per problem (missing criterion, placeholder, or over the 1,600-token cap — split).

## Hard rules

- **Never guess.** Anything the ticket does not settle (which file, which behaviour, what a
  Verify line means) is a halt: write a `[Blocker]` line with `build-log.mjs`, put
  `QUESTION:` on its own line in your reply, then one full sentence, then the options as
  (a) and (b), one line each, your recommendation marked "(Recommended)". Then stop.
  A small call that the ticket leaves to you and that is easy to undo is a `[Decision]`
  or `[Assumption]` line, not a halt.
- **Log as you go.** At least a `[Plan]` line and the `[Implementation]` line build-step
  writes for every step; a `[Debug]` line for every dead end or surprise, naming the file or
  command, at the moment it happens.
- **Never tick an Acceptance Criteria box.** That is the verifier's.
- **Stage by path only.** Never `git add -A`, never `git pull --autostash`, never check out a
  branch in the shared `~/slopdog` tree. build-step.mjs does the staging for you.
- **Tests before hand-off.** A failing automated criterion means the ticket is not handed off.

## Step 1 — preflight, halt on any failure

1. Read the whole ticket.
2. Run `node ~/slopdog/tasks/bin/check-ticket.mjs <ticket path>`. Non-zero exit: each line
   it prints is a reason. Write it into `## Concerns`, set the status line (the
   `T-nnn · …` line under the title) to `🔴 blocked`, edit nothing but the ticket, stop.
3. Front matter: `readiness.state: ready` counts only with `readiness.by: tickets-validate`
   beside it. Missing: same as above, reason "not validated by tickets-validate", stop.
   (A ticket grandfathered before T-552, where `readiness.updated` predates the stamp, gets a
   `[Decision]` line saying so and carries on; the dispatch brief tells you when.)
4. Every step under `## Steps` must have a `Verify:` line and `(AC: …)`. One without either
   is a `[Blocker]` and a halt.
5. Find the first unticked `- [ ]` step. None left: go to Step 4.

## Step 2 — code-aware plan, halt on any failure

After preflight passes and before the first build step:

1. Read the code at each automated criterion's `boundary:` and map the files this ticket will
   touch.
2. For every `## Acceptance Criteria` item typed `unit`, `e2e`, `logger` or `live`, append one
   line with `build-log.mjs <ticket> Plan "AC-n · Given … When … Then …"` — real Given/When/Then
   from the code, no placeholders (`<…>`, `TBD`, `TODO`, `…`).
3. Run `node ~/.claude/skills/slopdog/session/build-ticket/scripts/plan-check.mjs <ticket>`.
   Non-zero exit: each stdout line is a reason. Log `[Blocker]` with `build-log.mjs`, put the
   reasons in `## Concerns`, set the status line to `🔴 blocked`, edit nothing but the ticket,
   stop. When the cap says `split`, split the ticket instead of building.
4. Do not tick any `## Steps` checkbox or change product code until `plan-check.mjs` exits 0.

## Step 3 — the loop, one step at a time

For each unticked step N, in order:

1. `build-log.mjs <ticket> Plan "Step N: <what you will do, which files>"`.
2. **Red first.** For each automated criterion (`unit`, `e2e`, `logger`, `live`) in the
   step's `(AC: …)` that has no `Red-check:` line under `## Hand-off` yet: read the code at
   the criterion's `boundary:`, write the check there, and commit it with
   `red-check.mjs <ticket> AC-n --cmd "<the command that runs it>" -- <check files>`. The
   ticket gives the observable behaviour and the seam; the command is yours, written with the
   code in view. A refusal means the check passes already: make it test the new behaviour.
   A criterion opted out with `no test-first: <reason>` skips this.
3. Do the work. Touch only the files the step names; a step that needs another file is a
   `[Decision]` line saying which and why, or a halt if that is a real scope change.
4. Run the step's `Verify:` line exactly: a command as written, or, for a line that states
   the behaviour at its boundary, the red-check command, which must now pass. It fails: fix and log `[Debug]`; still failing
   after a real attempt, `[Blocker]` and halt.
5. `build-step.mjs <ticket> N "<what this step did>" --why "<why it was needed>" -- <files>`.
   One commit per step. Name each real choice you made with `--decision`.
6. Next step.

## Step 4 — run every automated criterion

For each `## Acceptance Criteria` item typed `unit`, `e2e`, `logger` or `live`: run its
command, which is the one on its `Red-check:` line (a criterion opted out with `no
test-first:` carries its own). Under `## Hand-off`, below the `**Files changed:**` list
build-step wrote, add one block per criterion; the Red line cites the hash red-check.mjs
recorded, so the verifier can check out that commit and see it fail:

```
**AC-n · <command>**
Red: <hash from the Red-check: line> — <output at that commit>
Green: <output at pass>
```

Any criterion still red: fix it and log `[Debug]`, or halt with a `[Blocker]`. `manual`
criteria are Todd's; leave them alone. Commits after the loop (a fix, the Hand-off text)
stage by path and keep the house shape: subject `<lane> T-<id> step <M>: <what>` where M is
the last step, body `Why: <one line>`:

```
git add -- <paths> && git commit -m "<lane> T-<id> step <M>: hand-off evidence" -m "Why: <one line>" -- <paths>
```

## Step 5 — hand off

1. If you were started by `dispatch.mjs`, it sets the status line and writes the Progress
   note from your reply: do neither. Otherwise set the status line to `🔍 verifying` and add
   one `## Progress notes` line, `- YYYY-MM-DD HH:MM · <your name> · built, <n>/<m> steps,
   <k> automated ACs green.` (time from `date -u +"%Y-%m-%d %H:%M"`, UTC like every Progress note). Commit the ticket the same way.
2. Reply in exactly this shape, nothing before it:

```
T-<id> · built | halted at step <N>
Steps: <n>/<m> ticked · ACs green: <k>/<automated count> · commits: <short hashes>
PO: <one or two sentences: what a user can now do, and what Todd should look at>
Tech lead: <key decisions, risks, anything that cost a correction>
Files: <repo-relative paths>
QUESTION: <only when halted on something only Todd can decide, in the shape above>
```

## For the verifier

The verifier's half is the one verify brief, `~/slopdog/v2/scripts/lib/verify-brief.mjs`: print it for the ticket and follow it, and record a failed check with this skill's `scripts/verify-fail.mjs`.
