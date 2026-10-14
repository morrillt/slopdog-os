---
name: bug
description: "Open a bug ticket in the Bug shape (What Todd saw / Cause / Fix to look into) with no questions back. Use for \"bug\", \"that's a bug\", \"file a bug\", \"something broke\", \"this is broken\"."
argument-hint: "<what Todd saw, in his words>"
---

# bug — his words in, a bug ticket out

Todd says "bug" and something. That something is the ticket. Ask nothing up front:
a missing cause is written as not yet found, never asked for. The worked example is
**T-434**, `~/slopdog/tasks/tickets/playwright-focus-workspace-8.md`, the first ticket
written in this shape; read its `## Bug` section before writing yours if the shape is not
already in your context.

1. **Write the ticket with `/ticket-add`.** `$ARGUMENTS` (or the words after "bug" in his
   message) is the ask. Title it as the broken behaviour seen from Todd's side, in one
   sentence, never "Bug: …". Let `ticket-add` do everything it does (id, slug, project,
   batch, tags, estimate, the Asked-for quote, the hand-off to Tyrion). Do not open its
   tag menu on his behalf: when none of its five tags fits, take `plumbing`.
2. **Tag it `bug`.** After the file exists, add `- bug` to the front matter `tags:` list and
   `#bug` after the other tag chips in its `task-list.md` row. `ticket-add` never invents a
   tag, so this one is the skill's to add, on top of what `ticket-add` chose.
3. **Insert the `## Bug` section** right after `## What` (after the Asked-for line, before
   `## Steps`), three bold-lead paragraphs in full sentences:

   ```
   ## Bug

   **What Todd saw.** <His report, as one or two full sentences with the date and where he said it. Keep his words where they carry it.>

   **Cause.** <What you found, with the file and line when you looked. If you have not looked or found nothing: "Not yet found."  Say what you checked, if anything.>

   **Fix to look into.** <The fix that follows from the cause, one or two sentences; when the cause is not yet found, the first thing to check.>
   ```

   A quick look for the cause is fine when it costs a grep or one file read; anything more
   is the ticket's own work, not this skill's.
4. **Make AC-1 a failing repro, if reasonably possible.** Todd, 2026-10-04: "if reasonable
   possible make a bug that fails and do tdd bug testing" (T-557). When the bug can be shown
   by a test or command that fails on today's code, rewrite AC-1 as
   `[unit, test-first]` (or `[e2e, test-first]`) naming that repro and its boundary, so the
   builder writes the failing check first and fixes against it. When a repro is not
   reasonably possible (only Todd's eyes or phone show it, or it needs hardware), add one line
   at the end of `## Bug`: `**No repro test.** <why, in one sentence>`. Never refuse or hold
   the ticket for lacking a repro: `check-ticket.mjs` only warns
   (`bug ticket: no failing repro`), and so does this skill. If a repro you try passes when it
   should fail, say so under **Cause** and stop rather than guess a fix.
5. **Say one line back**: the id, the title, whether the cause is found or not yet found,
   and whether AC-1 is a failing repro or why not. Nothing else; the ticket is on the board.

Don't: ask him for severity, steps to reproduce or a priority; check for duplicates;
start fixing it (a failing repro is a check, not a fix). That process comes later, per Todd (2026-09-26): "it can just be
scaffolding for now... and then we'll kind of move towards a process."
