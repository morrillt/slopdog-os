---
name: ideate
description: >-
  The Ideas desk's alignment loop — sorts rambles into threads, routes each to one outcome (do now, shaping, parked, question), runs the eight-out-of-ten loop on shaping threads, then defers to `desks/ideas/intake/` with department front matter (no tickets) or runs ticket-add immediately on hotfix per vocabulary.md. Use for "ideation", "/slopdog:ideate", and asks where Todd uses the word "ticket"; any other ask is a quick task for the desk that received it (rules/critical-rules.md rule 2). Hotfix or explicit ticket-now uses ticket-add; default is defer to sprint planning. On other desks, ticket-add step 0 relays to Ideas. Not for obvious one-point changes.
contract:
  inputs: "A ramble from Todd, typed, relayed from Slack, or a voice recording that voice-bloom turns into branches first."
  outputs: "One outcome per thread (done now, an intake idea for sprint planning, a parked line, or a question), with shaping threads tracked in ideas.json."
  starts: "Todd rambles to the Ideas desk or says ideation, or uses the word ticket."
  ends: "Every thread has an outcome and the run closes with the one-line outcome ledger."
---

# ideate — a ramble in, one outcome per thread out

The Ideas desk's "Talk & Align" rail (`~/slopdog/v2/desks/ideas/CLAUDE.md`, and
`principles.md`, "Eight out of ten before the work") as numbered steps, so Todd can
see which step a thread is on instead of trusting the prose. Todd goes one project at a
time: ideation is the front half of that path and `/slopdog:sprint-planning` the back half
(see "One project at a time" below).

## Mission and directives (read first)

Before sorting threads, read the house mission and the three department directives (local
mirrors, no Notion call): `~/slopdog/v2/rules/mission.md`, and under
`~/slopdog/v2/rules/directives/` the files `slopdog.md` (The Harness), `projects.md` (also
the directive for influencer projects) and `it.md`. When scoring, routing, or comparing
options, ask which thread is more aligned with the mission and with the directive for the
department that would own the work.

**The default is defer, not ticket (T-624).** Any ask that implies building runs through this
skill first; at 8/10 it lands in `intake/` for that department's sprint planning unless hotfix or
Todd explicitly says ticket it now.
**The one-point exception stays an exception.** A one-line ask that is an obvious
one-point change (one file, one verifiable change, no design call) gets a one-line
score and goes straight to a named subagent, per the desk CLAUDE.md. Don't run this
skill on it, and don't add steps to it.

**Say that it ran.** The reply opens with one visible line, `Ideating: n/10 — <main concern>`, so Todd can see ideate ran without knowing how to trigger it. A pending clear or high context never skips this skill (Todd, 2026-09-27).

## Deferred capture vs hotfix (T-624)

**Default: defer, do not ticket.** After the alignment loop reaches 8/10 on a shaping thread,
capture the original transcript (Todd's words plus your restatement) into
`~/slopdog/v2/desks/ideas/intake/` — the same folder ad-hoc intake already uses. Tag every
affected **department** (`slopdog` is The Harness, then `projects`, `it`; the
taxonomy is department, project, feature, batch, ticket, in `~/slopdog/v2/rules/vocabulary.md`) and set `planning_state: waiting`. Do **not**
launch `ticket-add`, run `ideas.mjs status … ticketed`, or write under `~/slopdog/tasks/tickets/`.
That department's `/slopdog:sprint-planning` step 1 picks it up in batch.

**Hotfix bypasses deferral.** When Todd marks the thread hotfix, or the ask cannot wait for the
next planning meeting (`hotfix: true` in vocabulary), finish the loop and launch `ticket-add` as
before — no intake capture required, though you may still file a note in intake if Todd asks.

**Capture command (the one writer besides pain-point fixtures):**

```bash
node $HOME/.claude/skills/slopdog/session/ideate/scripts/capture-idea.mjs \
  --title "<short title>" \
  --departments slopdog,projects \
  --feature voice-ideation \
  --body-file /tmp/idea-body.md
```

`--feature` takes the slug confirmed in the loop, or `none`; add `--feature2 <slug>` only for a
dual-purpose idea. The script refuses a third slug, warns (and still writes) on a slug outside
the registry, and warns when `--feature` is missing. The same `feature` / `feature2` fields go on
an `idea-inbox/*.md` capture written by hand (`desks/ideas/idea-capture-schema.md`), and the board's
Ideas tab shows them on each row, or `untagged` when a capture has none.

Use `--hotfix` only when the vocabulary escape hatch applies; that flag sets `hotfix: true` and
`planning_state: hotfix` so sprint planning lists it under hotfix immediate processing.

**Not before a date (T-640).** When Todd says when an idea should come up — "next sprint", "two
sprints", "in 3 sprints", or a date — pass it as `--not-before "<his words>"`. The script writes
`not_before: YYYY-MM-DD` right after `departments` and prints the date so you can read it back to
him. "Next sprint" is the idea's department's next planning day strictly after today (Slopdog
Friday, Projects Saturday, IT treated as Friday while it has no day); each further sprint adds a
week; with several departments the earliest day wins. A date he gives is kept as given. A phrase
the script cannot read exits 2 and writes nothing, so ask him for a date rather than guess. No
sprint numbers or counters, only the date.

**Departments on every deferred capture.** If Todd did not name a department, ask in the routing
menu (step 2) before capture. An idea with no department must never be silently dropped; the
capture script refuses empty `--departments`.

**Capture stores (T-660).** One job per store — do not mix them up:

| Store | Who writes | Who reads |
| --- | --- | --- |
| `desks/ideas/idea-inbox/*.md` | Voice saves, Slack relays, and other markdown captures (front matter per `desks/ideas/idea-capture-schema.md`) | The runner board **Ideas** tab (read-only, grouped by department) |
| `desks/ideas/intake/` | `capture-idea.mjs` after a deferred 8/10 shaping thread (T-624) | `/slopdog:sprint-planning` step 1 per department |
| `desks/ideas/ideas.json` | `ideas.mjs` during the live alignment loop (scores, concerns, ticket ids) | The Ideas desk during ideation — **not** the board tab after T-660 |

## One project at a time

Todd takes one project from idea to sprint at a time. Ask which project the ramble is about
when he has not said; show it on every restate line beside the feature slug. A project keeps
about five features and never more than eight (`vocabulary.md`), so the feature slug is how
sprint planning later finds the project's ideas: a thread that would need a ninth feature is
a question for Todd, not a new slug. Capture every thread of that project, then run
`/slopdog:sprint-planning` for its department and name the project at its start.

**Asking for a list of features or projects: use plain chat text, never a multi-select
menu.** A multi-select for a feature list came back blank in a live session (2026-10-12).

**A reply that says a question is pending carries the question.** Never write "waiting on your
answer" without the question itself, with its options, in the same reply (2026-10-12: Daphne
said one was pending and showed nothing).

## The four outcomes

Every thread ends in exactly one. These are the words Todd reads in the ledger.

| Outcome | What it means | What happens |
| --- | --- | --- |
| **do now** | A one-point item | Done now, no ticket |
| **shaping** | An idea heading toward work | The alignment loop; at 8/10 either `capture-idea.mjs` (deferred) or `ticket-add` (hotfix / ticket now) |
| **parked** | Not now | Noted with a reason; no ticket |
| **question** | Needs a product call from Todd before it can move at all | Held as a chat menu, since no ticket exists yet to carry it |

## Step 0 — a recording is bloomed first

**In:** a recording, or a ramble that is already text · **Out:** a numbered list of branches

A recording is turned into numbered branches by `/slopdog:voice-bloom` before anything else, and those branches are the threads; a ramble that is already text skips this step.

**When the ramble arrives as a recording rather than as conversation** (an audio or video
file, an emailed voice memo, a path under `~/Downloads`, or a voice note shared to the Slop Dog
Slack DM, which the listener has already saved under `voice-blooms/` and named in the pane
message), run `/slopdog:voice-bloom` on it first and treat its numbered `branches.md` as the
threads; never read the transcript into this desk's context. Then carry on from step 2 with
those branches. A Slack one also gets the list back in its thread through `reply`.

## Step 1 — sort the ramble into threads

**In:** the ramble, or the branch list from step 0 · **Out:** named threads, with the second reader's flags

The ramble is split into one-idea threads, each named in a few words, and a second reader checks the whole ramble against the board and the principles.

Read the ramble for intent (it is dictated; it arrives garbled). Split it into
threads, one idea each, and name each in a few words. Run the second reader once
over the whole ramble against the board and the principles:

```bash
$HOME/.claude/skills/slopdog/session/wtf/scripts/second-opinion.mjs --session "${CLAUDE_SESSION_ID}" "<the ramble>"
```

Its flags (collisions with a planned ticket, principle clashes) are
input to the steps below; consider them, don't recite them.

**Scan every ramble for bugs (Todd, 2026-09-27).** A thread that reports something broken ("I keep getting…", "it's always the same…", "it's probably an error") is a bug, not an idea: run `/slopdog:bug` on it at once, even when it's simple, and name it in the ledger as `bug: <what> (filed)`.

## Step 2 — route each thread to one outcome

**In:** the named threads · **Out:** one proposed outcome per thread, confirmed by Todd

Say the threads back to Todd in one short list, each with the outcome you propose.
If the routing itself is a product call, that is one `AskUserQuestion` menu, one
decision per question, your recommendation first and marked "(Recommended)".

## Step 3 — do now

**In:** a thread routed to do now · **Out:** the thing done, with no ticket

Do it, or launch the named subagent per the one-point exception.

## Step 4 — shaping: the alignment loop, until 8 or better

**In:** a shaping thread · **Out:** a score of 8 or more and a capture, a ticket, or the thread still open at its score

Each round restates the thread, scores it, lists its concerns and asks the open decisions;
rounds repeat until the score is 8 or better.

For each shaping thread, one round is:

1. **Restate** it in one line, in Todd's terms, name its project, and **propose its feature slug** (T-658):
   the one Slopdog feature the thread touches, from the slug list in the registry that
   `~/slopdog/notes/INDEX.md` points at (`Slopdog/How Slopdog Works/Slopdog Features.md`,
   front matter `slugs:`), the same `feature:` slug a ticket carries. One primary slug, a
   second only when the thread is genuinely dual-purpose, never a third; `none` when it
   touches no feature, rather than forcing the nearest slug. Show it on the restate line
   (`feature: voice-ideation`) as a suggestion Todd can correct in the pane; his correction
   wins and is what gets written. Pass it on every write below as `--feature <slug>`
   (and `--feature2 <slug>`).
2. **Score** it out of 10, and **grade how concrete it is** out of 10: could someone
   picture exactly what gets built and how Todd would use it?
   **Use the whole scale (Todd, 2026-09-27: "way too many eight out of tens... more sevens, eights and nines").** 8 is the ticket gate, so never round up to it. 7 means one named gap is left; 8 means no gap, only open details; 9 means ready to build as written. Every score says what would move it up one point, which becomes the next question.
3. **Concerns**, at least one: what it collides with on the board
   (`~/slopdog/tasks/task-list.md`, the second reader's flags), what is cheaper,
   what it assumes, and any relevant research: grep
   `~/slopdog/v2/desks/research/digest.md` for the thread's keywords and cite a
   matching report by its path. If the digest is missing, skip the research
   check and say so in one clause; never fail on it.
4. **One `AskUserQuestion` menu per open decision**, recommendation first.

One card per thread, always (Todd, 2026-09-27): a new thread that arrives mid-conversation gets its own card even when it extends another; a thread folded into an existing ticket updates that ticket's card instead. Each shaping thread is a card on the board's Ideas view: as its score, concern or open choice changes, run `$HOME/.claude/skills/slopdog/session/ideate/scripts/ideas.mjs upsert i-<slug> --title "<title>" --asked "<Todd's words>" --score N --concern "<concern>" --feature <slug> --choice-json '{"question":"…","options":["(a) …","(b) …"]}'` (a corrected slug is one more `upsert i-<slug> --feature <new>`; `ideas.mjs list` shows the slug in its fourth column), and a parked thread runs `ideas.mjs status i-<slug> parked`; the script is the file's one writer.

Repeat until the score is 8 or better. Below 8 after Todd's answers, keep talking;
if he stops, the thread goes in the ledger as shaping at its score.

**When a thread is not concrete, offer a framing report.** If the concreteness grade
is below 7, or Todd says the idea is not concrete yet, say the thread is not concrete enough
to score honestly and offer a framing report instead of another round (the threshold is
Todd's answer to T-416 q1). A framing report is a designed report with diagrams whose only
job is to make one aspect of the idea concrete; it is the exception for a big thread, not
a report for every thread. When Todd accepts, stop working the thread in chat and run
`/slopdog:file-report` with the thread's restatement, its concerns and Todd's words as the
brief, saying in the report's first line that it is a framing report (a dedicated framing
subtype does not exist yet). Todd and the desk iterate on the report itself until it reads
clearly to both, then the loop resumes from it: restate, score, grade and concerns again,
citing the report by its path.

At 8 or better:

1. **Deferred (default).** Write the transcript body to a temp file, run `capture-idea.mjs`
   with the thread's title and comma-separated departments. Say the intake filename and
   departments in the ledger (`deferred: <file>, departments slopdog+it`). Do not open a ticket.
2. **Hotfix or explicit ticket-now.** Launch the `ticket-add` subagent
   (`~/slopdog/v2/.claude/agents/ticket-add.md`) with the brief: Todd's exact words, title,
   the confirmed feature slug (the ticket's `feature:`), project and batch if known, score and concern, steps sketch, aligned or not. It runs
   `ticket-add`, estimates, tags `meta` or `work`, and returns one line. Send that line to the
   named desk by SendMessage. Questions go on the ticket (`questions.items`), not in chat.
3. **Hotfix or any "from now on" change to how the house works: place it.** Read
   `~/slopdog/v2/rules/system-change-rubric.md` and say where the change goes in one line. If it
   changes how a ticket would be written (a desk, a lane, a path, an engine policy, who builds
   what), append `{"id":"A-<next n>","date","change","terms":[<regex>],"truth"}` to
   `~/slopdog/tasks/assumptions.jsonl`, run `node ~/slopdog/v2/scripts/assumption-sweep.mjs --write`,
   and name the flagged tickets in the ledger (`swept A-n: T-nnn, T-nnn`).
4. **Project or batch shaping.** Any project creation or modification launches the `writer` agent (Agent tool, `subagent_type` `writer`), which invokes `/slopdog:project-writer`; batch creation and batch modification launch the same agent with `/slopdog:batch-writer` and `/slopdog:batch-refine` respectively; never a general-purpose agent or a hand edit (Todd, 2026-10-12). Tell the `writer` in its prompt to invoke the skill through the Skill tool and not to read its SKILL.md instead (a session on 2026-10-12 read the files, and the skill never ran). The why / what / how tips it writes are each one tweet plus two to five supporting bullets, never a clipped one-liner (`principles.md`, "Interlocking icebergs").

## Step 5 — parked and question

**In:** a thread routed to parked or question · **Out:** a parked line with its reason, or a menu waiting for Todd

**Parked:** one line with the reason (and the ticket it waits on, if
any). Nothing is written.

**Question:** the `AskUserQuestion` menu for the product call. Once answered,
route the thread again (step 2). Unanswered, it stays a question in the ledger.

## Step 6 — close with the outcome ledger

**In:** every thread's outcome · **Out:** one ledger line

The run closes with a single line that names each thread's outcome, so Todd can read the whole result at once.

The ledger line has one entry per thread, in this shape:

```
3 threads: fixed the lightbox title (do now) · shaping: copy digest, at 6/10 · parked: public bot (T-286).
```

Do-now entries name what was done, shaping entries the score (or the new ticket id
once `ticket-add` returns it), parked entries the reason, question entries the
decision still open.

## Don't

- Don't run the loop on a one-line ask (see the top).
- Don't write a ticket yourself or run `/ticket-add` inline except on the hotfix / ticket-now path; deferred shaping uses `capture-idea.mjs` only.
- Don't build anything from the Ideas desk pane.
