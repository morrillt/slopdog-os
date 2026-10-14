---
name: sprint-moving
description: Answer "is the sprint moving?" from files, with no model in the loop. Runs sprint-moving.mjs, which reads the focus batches in context.yaml, their tickets' statuses and Progress notes, recent commits naming those tickets, Tyrion's inbox and the watcher's state, and prints a verdict (moving, slow or stalled) with one line per batch and the evidence. Use when Todd says "is the sprint moving", "is it moving", "/slopdog:sprint-moving", "is the sprint stuck", "are we making progress", "is anything happening", or any status question about whether the running sprint is progressing; also "how much is left in batch N" or "what remains", through its --batch view. The Slopdog captain desk's first tool.
allowed-tools:
  - Bash
---

# sprint-moving — is the sprint moving?

Deterministic retrieval before reading anything by hand. The verdict comes from one number, the
time since the newest build movement on a focus ticket (a dated Progress note or a commit naming it;
Daphne's planning notes and the Sweep script's notes do not count, and are shown apart).

1. **Run it.** One call:

   ```bash
   node ~/slopdog/v2/scripts/sprint-moving.mjs
   ```

   Flags: `--hours N` (window for the recent counts, default 3), `--moving-min` and `--stalled-min`
   (verdict thresholds in minutes, default 60 and 180), `--json` for a machine reader.
   `--batch <tag>`, repeatable, swaps the verdict for the remaining-work view of any batch, focus
   or not (`--batch 3-seeing-the-work --batch 6-sprint-holder`): done, awaiting Todd, open and
   blocked, with the ticket ids, counted straight from the ticket files and their archive, dropped
   tickets set apart. Use it before stating how much of a batch is left; a remembered baseline is
   how a report once counted 23 finished tickets as still to do.
2. **Answer in the reply cap.** Verdict first, from its first line, then the one or two lines that
   explain it: the stuck or silent tickets and anything under "Worth knowing" (a stale watcher, a
   present SPRINT-STOP, unread mail at Tyrion, an engine out of quota). Times in the output are UTC.
3. **Say what is stale.** A watcher log that stopped yesterday is a finding, not a footnote.
4. **Go deeper only on request.** Read the named ticket's Progress notes or the owning desk's
   `PICKUP.md`; for the wider picture use `/slopdog:wtf`. Never dispatch, nudge or edit a ticket
   from here: tell the owning desk (Tyrion runs the sprint) in Todd's words.

The script, its parsing and its tests are `~/slopdog/v2/scripts/sprint-moving.mjs` and
`sprint-moving.test.mjs`.
