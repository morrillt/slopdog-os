---

Desk-to-desk ladder: SendMessage first, then inbox-write.mjs, then pane typing as the last resort and only into a named herdr agent pane. Email is for humans and the outside world, not desk to desk. See ~/slopdog/v2/CLAUDE.md (Desk file inbox).
name: clear-to-close
description: Answer "are we clear to close?" — make this session safe to /clear or close by writing, in a desk folder, the desk's PICKUP.md anchored on the ticket in hand (state now, agents in flight, the exact next command, files that matter); noting every open job, distilling memory, pushing every repo, ending the turn until in-flight subagents report, then running pickup-check, showing Todd a table of exactly what went into the pickup, and asking him one yes-or-no question — good to execute? — and running self-clear.mjs itself when he says yes. Use when Todd says "clear to close", "are we clear to close", "can I clear", "safe to close", "safe to clear", "/slopdog:clear-to-close", or asks whether he can close the session without losing anything; a desk runs it on its own before self-clear.mjs (rules/desk-clear.md). Lighter than /slopdog:done — no concerns walkthrough, no closing report. The other half is /slopdog:pickup, which reads what this writes.
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# clear-to-close — make the session safe to clear, then say the word

This skill writes; `/slopdog:pickup` reads. The contract between them: what is written
here is complete enough that pickup needs nothing else, so after the `/clear` one line
starts the right work. Todd, 2026-09-06: "you tell me that everything you need is saved to
a file, any other housekeeping you need to do, and then I close the session." Todd,
2026-09-12: "clear to close should set all the things ready so I can clear, and then
/pickup resumes the session, so I can just trust we are ready to pickup."

One note, one mechanism. In a **desk folder** (one whose path is a `folder` in
`~/slopdog/v2/lanes.json`) the desk's `PICKUP.md` carries the ticket in hand;
`node ~/slopdog/v2/scripts/self-clear.mjs` refuses to clear without a fresh one. This skill
writes the note and `pickup-check.mjs` checks it; apart from the `SessionStart:clear` hook
(`resume.mjs`), nothing else carries across a clear (`~/slopdog/v2/rules/desk-clear.md`).
Outside a desk folder there is no note to write: the skill still does the jobs, memory,
repos and in-flight parts, and says in one line that there is no `PICKUP.md` to write.

**Step 0 — finish what applies first.** A clear is never a reason to skip a skill. If Todd brought an idea this turn that hasn't been through `/slopdog:ideate`, or another skill applies to the work in hand, run it now and write its outcome into the note. The context tiers say "clear at the next breakpoint", and finishing the skill is part of reaching it (Todd, 2026-09-27: "I don't feel like we should start abandoning skills because of clear statuses").

**Step 1 — the desk's `PICKUP.md`.** When the cwd is a desk folder, overwrite
`<desk>/PICKUP.md` in the `~/slopdog/v2/desks/TEMPLATE-PICKUP.md` shape, anchored on the
ticket in hand: who you are; the ticket in hand (`T-nnn`, its status, which steps are
ticked, what is uncommitted, which branch or worktree); what is in flight (every subagent,
dispatch, cron or OS process working on the ticket, and how the next session tells whether
its work landed, since subagents die with the clear); the exact next command, verbatim,
never "continue the work"; **at most five files that matter**, the ones the next reader
would open first, not every file the ticket touched — the ticket's own Progress notes from
Step 2 carry the rest; open questions and who has them. Under 40 lines, overwritten never
appended; it is the state now, not a log. The first `T-nnn` in
it is the ticket in hand, and `self-clear.mjs` and `pickup-check.mjs` both refuse a note
that names none. A desk between tickets names the last one and says the queue is empty.
**Retrospective persistence (T-659).** In the note, tell the desk after clear to append
sprint lessons as they happen via
`node ~/slopdog/v2/scripts/retrospective-append.mjs` (four fields: what, ticket, cost,
prevention — schema in `~/slopdog/v2/retrospective/README.md`). Carry that instruction
into every `PICKUP.md` you write so the habit survives the clear.
Not a desk folder → skip this step and say so in one line.

**Step 2 — the jobs.** Every ticket this session touched in `~/slopdog/tasks` (a row not
🟢 or ✂️): its `## Progress notes` (or `## Pickup` where the ticket has one) ends with a
dated entry written now saying where the work stands, what is running or pending, and the
next command. Paths, ids, what failed and why, what Todd decided. `PICKUP.md` points at the
ticket by id; the ticket carries its own detail. Write the note last, after these entries,
so it is newer than the ticket file it names. Find them:

```bash
grep -l "$(date +%Y-%m-%d)" ~/slopdog/tasks/tickets/*.md
```

**Step 3 — memory.** Anything this session learned that a future session would need, such
as a gotcha, a decision of Todd's or a correction to your own working, goes in this
folder's file-based memory (`~/.claude/projects/<slugified-cwd>/memory/`, indexed in its
`MEMORY.md`). Zero entries is a valid answer; say so.

**Step 4 — repos.**

```bash
node ~/.claude/skills/slopdog/session/done/scripts/repo-sweep.mjs
```

Run the tidy script first, from the desk folder; it commits the desk's own folder and the shared tree
above it (v2/rules, scripts, the repo root; never another desk's folder) by path, merges origin, pushes, and costs no Claude tokens; the commit subject comes from
the scribe desk (Luwin, GLM on OpenRouter) and `--no-ai` skips even that:

```bash
node ~/slopdog/v2/plugins/pickup/scripts/git-tidy.mjs
```

Exit 0 is clean. Exit 1 means it held back a file (a secret, a file over 50 MB, machine
state) or hit a merge conflict or a rejected push; on a conflict it has already aborted
cleanly and flagged Daphne in her inbox, so name that in the report and move on. Then, for
every `NOT CLEAN` this session caused that the script does not cover (another repo, say):
commit and push by hand, one commit per working state, unless the desk's rules say not to
commit (a builder reports instead and names the uncommitted files in `PICKUP.md`). Dirt that
isn't yours: name it and leave it.

**Step 5 — let what is in flight land, then the process report.** A subagent still
running dies with the clear and its half-written files are the next session's mess, so
the verdict and the clear wait until this session's own subagents have reported: while any
is still running, end the turn there (start no new ones) and pick up at this step when its
task notification wakes you; never hold the turn open waiting on it. Then print one table of everything still in
motion, so the reader knows what survives the clear and what dies with the session:

```bash
pgrep -fl "node|python|ffmpeg|dispatch.mjs" | grep -v -E "Claude|Helper|cmux|runner" | cut -c1-90
```

plus this session's crons and background tasks (those die with the session; OS processes
do not). One row per item:

```
| what | state | survives the clear? | ready for pickup? | where the pickup instruction lives |
```

"Ready for pickup" means `PICKUP.md` or the ticket's Progress notes name the item, its
output path, and the command to continue it. A row that is not ready gets fixed before the
verdict.

**Step 6 — the checker.** The mechanical half of the contract:

```bash
node ~/.claude/skills/slopdog/bin/pickup-check.mjs --dir "$PWD"
```

In a desk folder it exits 0 when `PICKUP.md` is at most ten minutes old, names a ticket,
and is newer than that ticket's file; it exits 1 naming each thing that is not. Outside a
desk folder with no `PICKUP.md` it passes with a note. A failure is fixed in Step 1 terms
and the checker run again; the verdict is never given over a failing check.

**Step 7 — show him what went into the pickup.** Todd, 2026-09-26: "I never know what goes
in the pickup, but I'm always curious." So the reply always ends with a table of the notes
this run wrote, one row per note, before the question. This table and the Step 5 one are
the two places the three-paragraph reply cap does not apply; everything else in the reply
still obeys it.

```
| note | what it is | state now, one line | the next command it names |
```

- One row per file written: the desk's `PICKUP.md` first, then each ticket whose Progress
  notes were updated.
- **State now** is one sentence in his words, not a summary of the file's headings: the
  ticket in hand and whether it is moving, or what is waiting on whom.
- **The next command** is quoted from the note, verbatim and short. If a row's next command
  reads "continue the work", the note is wrong; fix it before the table.
- A row whose note names a question for him says so in the state column, with the ticket id
  the question sits on, since he answers those on the board and not here.

**Step 8 — ask, then clear.** First, run the decision script to decide whether to ask Todd or skip straight to the clear:

```bash
node ~/slopdog/v2/plugins/slopdog/bin/clear-asks.mjs $ARGUMENTS
```

If the script outputs `skip: <reason>`, skip asking, print the table and run `self-clear.mjs` in the same turn.

If the script outputs `ask: <reason>`, ask Todd. Todd, 2026-09-26: "when I say, you know, you just ask me if
everything looks good and are we good to execute, yes or no, and then I say yes or no and
then you just run the script if I say yes." Directly under the table, one
`AskUserQuestion` with one decision and two options:

- **Question:** "Everything above is written and pushed. Good to execute the clear?"
- **(a) Yes, clear now (Recommended)** — "Runs self-clear.mjs: it types /clear into this
  pane and picks the note back up automatically."
- **(b) No, not yet** — "Nothing is cleared; say what to fix and the notes are rewritten."

**Yes** → run it in the same turn, nothing else first:

```bash
node ~/slopdog/v2/scripts/self-clear.mjs
```

**No** → clear nothing, print `Not yet: <the one thing he named>`, fix it, and come back to
Step 6.

Two carve-outs. This is the one question this skill asks, and the one place a desk whose
rules send questions to the board (the Ideas desk) still asks in the terminal, because it
is session control rather than anything that belongs on a ticket — there is no ticket for
"may I clear you". And a **desk clearing itself** — no Todd in the loop, the batch is done,
invoked with `unattended`, in an unattended lane, or when the context gauge said so (`rules/desk-clear.md`) — does not ask: `clear-asks.mjs` reports `skip`, it prints the table and
runs `self-clear.mjs` in the same turn. The question is for when the session is his.

If the checker failed, none of this happens: print
`Not yet: <the one thing missing, and whether you are fixing it or need him>.` and stop.

## Don't

- Don't print the ready line with a `PICKUP.md` that is stale, names no ticket, or is
  older than the ticket file it names; the checker catches those. A note missing the next
  command or what is in flight is yours to catch.
- Don't declare clear with a job whose last Progress note predates today's work.
- Don't leave a running process out of the report because it was started by a subagent;
  if it is running, it is in the table.
- Don't run `self-clear.mjs` before he has answered, or after he has said no. On a yes it is
  this skill that runs it, in the same turn, with nothing in between.
- Don't replace the table with prose, and don't shorten it to the file names: the columns
  are what he asked for, and a table he cannot read the state off is the same as no table.
- Don't ask anything else in that turn. One decision, two options, nothing bundled with it.
- Don't open anything on screen.
