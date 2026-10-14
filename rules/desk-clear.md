# A desk clears itself and picks up from a note

Three parts, one mechanism. `/slopdog:clear-to-close` **writes** the note: in a desk folder it
overwrites `PICKUP.md` (`desks/TEMPLATE-PICKUP.md` is the shape) anchored on the ticket in hand,
pushes what it may, runs `plugins/slopdog/bin/pickup-check.mjs`, and ends with a table of every note
it wrote. In Todd's session it then asks him one yes-or-no question, good to execute, and runs
`scripts/self-clear.mjs` on a yes; a desk clearing itself asks nothing and runs it in the same turn.
`self-clear.mjs` **clears**: it types `/clear` into the desk's own pane, and a detached watcher types
`/slopdog:pickup <folder>/PICKUP.md` once the pane is cleared. `/slopdog:pickup` **reads**: the note,
then the ticket's board status, then carries on with the ticket, asking nothing. The script refuses
when the note is older than ten minutes or names no ticket; `--dry-run` shows what it would send.

**Pickup first.** After a clear the first thing a desk does is the pickup (Todd, 2026-10-03).
`self-clear.mjs` writes `.pickup-pending` before it types `/clear`; while that marker is under fifteen
minutes old the inbox hook, the backstop and turn-commit's failure note all wait.

**When.** At the end of a batch, when Tyrion says so, or when the context gauge says so. Clear at a
landed step, never mid-step. `plugins/slopdog/hooks/context-rot.mjs` names one of three tiers on every
prompt (nudge, ceiling, hard) and prints the command to run; the numbers live in
`plugins/slopdog/hooks/context-tiers.json`. At the hard tier only a clearing prompt goes through
unless Todd OKs a run-on. Run-on, the weekly sprint stop and `lift stop` are in
`plugins/slopdog/hooks/README.md`; a stalled clear and what carries across a clear are in the vault note
`Slopdog/How Slopdog Works/Desk Runtime and Session Lifecycle.md`.

**What `PICKUP.md` holds:** who you are, one line; the ticket in hand and its exact state (steps
ticked, what is uncommitted, which branch or worktree); the next command; the files that matter; open
questions and who has them. It must name a ticket (between tickets, the last one and "queue empty"; a
desk with no board tickets names the `tasks/<name>.md` in hand). Under 40 lines, overwritten, never
appended. It ends with the line "when you resume, message Todd unprompted to confirm you're back", so
the resumed desk does it in a normal turn (Todd, 2026-10-03).
