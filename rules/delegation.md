# Delegation — the dispatcher's rules

Todd, 2026-10-05, after every builder sat idle for three and a half hours while 37 tickets were
marked ready: "there needs to be something that continuously is feeding the dispatcher… and then
there's just delegation rules, and his delegation script, and a report that happens at the end, and
make sure he's updating things a certain way and following certain protocol."

Loaded by the dispatcher desk's `CLAUDE.md`. The dispatcher is the only desk these rules govern.

## The queue is the only source of what to dispatch

`node ~/slopdog/v2/scripts/ready-queue.mjs` answers "what can be dispatched", and nothing else
does. A ticket qualifies only when it is not paused, its row is 🔵, its `readiness.state` is ready,
its `readiness.by` is `tickets-validate` (any other name, `ideas` included, is a writer asserting itself), its `depends_on` have
landed, and its `project` is the sprint in hand (`SPRINT_PROJECT`, or `--project <name>`;
`--any-project` drops the rule). A ticket with `hotfix: true` is exempt from every limit: the sprint
rule, the focus-batch gate, the two-batch cap below (it neither waits on the cap nor holds a slot)
and verify-sweep's five-per-run cap, because a hotfix does not wait (`rules/vocabulary.md`; Todd,
2026-10-08: "there is no longer a limit"). The one exception is the weekly `SPRINT-STOP` (T-729): dispatch refuses every job, hotfixes included, until Todd types `lift stop`. The safety rules still hold it (readiness, validator,
`depends_on`, holds, path collisions), and hotfixes sort to the top of the queue, marked `!`. `--why <ticket>` says why one is excluded; `--loose` drops only the validator rule, and is
for looking, not for dispatching. At most **two batches** may be in flight (any ticket in a batch
past 🔵 and not yet 🟢 keeps that batch open, except that a batch whose every ticket is 🟩 or 🟢 is
built and waits only on Todd's batch review, so it frees its slot); starting a third batch is refused until one closes
or Todd OKs `tasks/.over-batch/<project--batch>` with who allowed it in the file (same escape shape
as a desk's `.over-ceiling`).

**Never dispatch a ticket that is not in the queue.** On 2026-10-04, 27 of 37 tickets marked ready
carried no validator stamp, and that population failed validation fourteen times out of fifteen.
A thin queue means validation is behind — say so, rather than reaching past the rules.

## Start a batch with one command, and keep going

`node ~/slopdog/v2/scripts/start-batch.mjs <batch> --go` names the next ticket and sets you going;
`--loop`, started with `run_in_background` and never in the foreground (it nudges you only while your turn is idle), keeps you fed while the batch has ready tickets; with no batch it lists the batches that
have any. The point is that you do not wait to be asked.

- **Two builders loaded, always**, whenever the queue is not empty.
- **A bounce does not stop the batch.** When a ticket fails validation, take the next one from the
  queue immediately. Report the gaps in batches, not one ticket at a time, and never idle while
  waiting for the Ideas desk to answer.
- **No builder waits on Todd.** A ticket needing his answer goes 🟠 and leaves the queue; the next
  ticket goes out in its place.

## Cheapest rung first

The build ladder (who builds, who verifies, when a ticket escalates) is Todd's call and lives in one file: `v2/config/build-ladder.md` explains it, `v2/config/build-ladder.json` holds it. A ticket starts on the builder and moves up only after its strikes, and the move records why. When a
lane refuses — a quota, an authentication failure, an instant exit 3 — try the next lane rather
than the next rung, and say which lane refused.

## The protocol for updating a ticket

Every hand-off leaves one line under the ticket's `## Progress notes`, bottom of the file:
`- <YYYY-MM-DD HH:MM> · <name> · <what happened>.` with the time from `date -u`, never estimated.

- **Dispatching:** the note names the builder lane and the verifier.
- **A result:** the note says what the builder reported and what you verified yourself. A builder's
  report is not a verification. Run the ticket's own Verify lines before you believe it.
- **Marks:** 🟡 while a builder has it, 🔍 while it is being verified, 🟩 when it passed, 🔴 with
  the gaps written into `readiness.gaps`, 🟠 when it waits on Todd's answer. Todd reviews batches,
  not tickets: a batch is ready for his review once every ticket in it is 🟩, and his approval of
  the batch on the board takes all of its tickets to 🟢 at once (`v2/scripts/batch-review.mjs`).
  Nobody else gives 🟢, and no single ticket waits on Todd for it.
- **Never mark a ticket built on a branch that is not merged.** Green-but-unmerged is not green.
- A job that wrote a ticket is not a job that built one; if a tool marks a writing job as built,
  undo the mark and say so.

## A batch ends with a report

When the last ticket of a batch leaves the queue, write one short report and tell Todd it is there:
what landed, what bounced and why, what waits on him, how many correction rounds each ticket took,
and which lane did the work. The ledger line per job is
`builder=<lane> · minutes=<n> · correction rounds=<n> · verify minutes=<n> · passed first time=<y|n>`.
`/slopdog:file-report` files it. One report per batch, not per ticket.

## Only the validator writes `readiness.by`

A writing job stamped `readiness.by: tickets-validate` on two tickets it had just written on
2026-10-05, calling itself validated in its own Progress note, with no validation having run. The
feeder trusts that one field, so one of those tickets was a step away from reaching a builder with
four open gaps in it.

So: **a ticket writer never sets `readiness.by`, and never writes the word validated about its own
work.** The field is the validator's signature and nothing else may write it. A brief that asks for
a ticket says so explicitly. If you are reading a ticket and `readiness.by` is set, check that a
validation note from the dispatcher sits under its Progress notes; a stamp with no note beside it
is a forgery and the ticket goes back.
