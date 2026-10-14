---
name: sprint-planning
description: Run one department's sprint planning meeting as eleven steps, three of them signed by Todd — ideation queue, load the mission and directive, review the last retrospective, research and the architecture choice, shape the project, shape the batch, shard tickets into Notion, verify traceability, add the batch's cross-cutting checks, spot-check and hand the sprint to Tyrion, then file the run report. Also the back half of taking one project at a time from idea to sprint. Use when Todd says "/slopdog:sprint-planning", "sprint planning", "plan the sprint", "run sprint planning", or to run a department's planning meeting.
contract:
  inputs: "One department's waiting intake ideas, the mission and that department's directive, and last sprint's retrospective."
  outputs: "A shaped project and batch, sized tickets traced to the batch, the batches in focus_batches with Tyrion told, a sprint record and a filed run report."
  starts: "That department's planning day comes round (The Harness Friday, Projects Saturday) or Todd says plan the sprint."
  ends: "Todd signs the spot-check, Tyrion has the batches, and the run report is on the Reports screen."
---

# sprint-planning — nine gated steps for one department

Governed by T-626. The pipeline is eleven steps, run for one department at a time, on a meeting a
day: **The Harness (`slopdog`) on Friday and always first**, Projects on Saturday (influencer
projects plan there too, no longer on their own Sunday), IT unscheduled
(`~/slopdog/v2/rules/vocabulary.md`).

**Three gates Todd signs, the rest the machine checks.** His judgment is needed at the
architecture choice (step 4), the batch's shape (step 6), and the hand-off (step 10). The other
eight pass themselves when their own checks pass, and record that they did. Gates that need him batch
into that department's single daily session rather than interrupting him one at a time.
**Default-forward is the backstop:** anything still unanswered by the next day's meeting proceeds
on a recorded, flagged assumption rather than stalling the sprint. The assumption is written on
the batch, and a batch shows how many it is carrying.

## One project at a time

Todd runs one project from idea to sprint rather than a whole department's backlog. Start the
meeting by naming the project. Step 1 then works only the picked ideas whose feature slug belongs
to that project (a project keeps about five features and never more than eight), and says in the
meeting record which picked files it left for a later meeting; those stay `waiting`, they are not
dropped. Steps 5 and 6 shape that project's next batch, and step 10 hands that batch to Tyrion.
This is the same eleven steps scoped to one project, not a separate mode. When Todd asks for a
list of projects or features, ask in plain chat text: a multi-select menu came back blank in a
live session (2026-10-12).

**A reply that says a question is pending carries the question.** Never write "waiting on your
answer" without the question and its options in the same reply (2026-10-12: Daphne said one was
pending and showed nothing).

**Context runway.** A planning run warns at 50 per cent of the window and hard-closes at 60, well
above the house thresholds, so a clear never lands mid-step. These values live in this run's own
configuration or the `SLOPDOG_CONTEXT_*` overrides — **never** in
`plugins/slopdog/hooks/context-tiers.json`, which `/slopdog:pickup-resize` rewrites every Monday.

**Clearing.** Always clear at a human gate, since that is a wait of up to a day and the context
would rot sitting there. Otherwise clear between steps when the gauge says so, not at every
boundary. Each clear writes the pickup, and the pickup carries the gate state and any assumption
defaulted forward, not only the ticket — a step resumed after a day must know what was decided in
its absence.

## Step 1 — Ideation and layered threads

**In:** the intake folder and the department (and the project, when Todd named one) · **Out:** the queue report and the picked ideas, each with its layers

Work the department's unhandled ideas. An idea is a markdown file in
`~/slopdog/v2/desks/ideas/intake/`: the original transcript plus front matter tracking how
processed it is (`planning_state`, `departments` or legacy `department`, optional `hotfix`).
Never rewrite the transcript; append layers — spin-out threads and open questions — with
`session/sprint-planning/scripts/ideation-layer.mjs`.

**Queue report first (required, T-624).** Before layering, run the intake scanner **as its own
command, never inside a compound one-liner** (a pipe or `&&` hides its exit code), and paste its
full output into the meeting record. It names counts for picked, deferred-by-not-before-date,
deferred-to-other-department, already-processed, missing-department, legacy-not-queue and
hotfix-immediate — silent skipping is not allowed.

```bash
node $HOME/.claude/skills/slopdog/session/sprint-planning/scripts/intake-queue.mjs \
  --department <slopdog|projects|it>
```

**Expected exit code is 0**, with or without picks; 1 means `--department` was missing and 2 means
a bad `--today`, and either is a real failure. **`skipped_not_queue` is not a problem and not a
queue of waiting ideas:** it counts older intake notes (batch drafts, writing-desk handoffs) that
never had department queue front matter, so the scanner lists and ignores them. Say that in one
line when reporting the count, and act on it only if one of those files is meant to be an idea,
in which case add its `departments` and `planning_state: waiting` front matter.

Work every file in **Picked up for this meeting** through ideation layering, then shaping and
ticket steps later in this skill. Files listed under **missing department** stay visible until
Todd or the Ideas desk fixes front matter — do not drop them. **Hotfix** rows process immediately
(per `~/slopdog/v2/rules/vocabulary.md`), not at the next meeting. An idea whose `not_before:` date
is after today (T-640) is listed under **Deferred — not before a later date** and left for a later
meeting; the report's `Not-before check` line states how many were skipped, and that count goes
into the meeting record with the rest. An idea dated today or earlier is picked as normal. Pass
`--today YYYY-MM-DD` only to rehearse a meeting on another day.

Output: the queue report (with counts), then ideas sorted, each with its layers.

## Step 2 — Load the mission and the directives

**In:** the department · **Out:** the mission and division mirrors loaded, with any staleness warning in the meeting record

The mission and the department's directive are read from the local mirrors, never from Notion, so every later step can test its choices against them.

Read, from the local mirrors in `~/slopdog/v2/rules/mission/` and **never** by a live Notion call:

- `mission.md`, the always-on tier: the why, the what, the how and the eight principles.
- The division tier. The mirror files keep their Notion page names (`meta.md`, `features.md`,
  `influencer.md`, `it.md`; `rules/mission/README.md`), so a **Harness run (`slopdog`) or a Projects run loads
  both** `meta.md` (the Harness division) **and** `features.md` (the Projects division), because
  product work touches the harness and harness work exists to make the products faster. A Projects
  run that holds `project_type: influencer` projects also loads `influencer.md`. An IT run loads
  `it.md`.
- `edge-plugin-strategy.md`, hard-imported where that division references it.

A **missing** mirror refuses this step and names the absent document. Before reading the files, run
the local staleness check and nothing else:

```bash
node ~/slopdog/v2/scripts/notion-listen-daemon.ts --staleness-check
```

That command reads the mirrors on disk. When any `fetched` date is older than 7 days it prints
one warning line naming each stale mirror and its age, then exits 0. Copy that single line into
the meeting record and proceed on the stale copy. It does not call Notion. A set inside the bound
prints nothing. Nothing planning-related proceeds before this step. After any clear, the fresh
window reloads all of it — a clean context starts with no mission in it.

**Every later step runs the live test:** *which work is more aligned with the mission and this
division's directive?* — and **records its answer as one line naming the alternative it rejected
and why.* A step that records nothing has not run the test.

## Step 3 — Review the previous sprint retrospective

**In:** the department's newest retrospective file dated before today · **Out:** each active lesson summarised in the meeting record, or the run stopped with `RETROSPECTIVE_EMPTY_OR_MISSING`

Before research or shaping new work, read the last sprint's lessons for this department.
Append new lessons during the sprint with `~/slopdog/v2/scripts/retrospective-append.mjs`
(schema: `~/slopdog/v2/retrospective/README.md`). This step is the read side at planning time.

**Resolve the file** for the target department (`slopdog`, `projects`, or `it` — the
same slug passed to this run):

1. List `~/slopdog/v2/retrospective/*-<department>.md`.
2. Sort by the `YYYY-MM-DD` prefix descending.
3. Take the newest file whose date is **strictly before today's calendar date** in the runner's
   timezone. If every file is dated today or later, there is no previous sprint file.

**Active lessons** are `##` headings above the `### Addressed` subsection (if present). The file
header and boilerplate lines do not count.

**When the file is missing or has no active lessons**, stop the planning run immediately. Do not
continue to Step 4. Print this exact error code on its own line so logs and scripts can grep it:

```
RETROSPECTIVE_EMPTY_OR_MISSING
```

Then one sentence naming the department and the path you expected.

**When lessons exist**, summarize each active entry for Todd in the meeting record (title, ticket,
cost, prevention) and quote the underlying bullets before proceeding to Step 4.

## Step 4 — Research and the architecture choice · Todd signs

**In:** the picked ideas and the lessons · **Out:** a research report with a preferred option, or a one-line record when there is only one way to build it

Where a project could plausibly be built more than one way, write a report exploring three
options, name the preferred one and why. Each option must state what it costs, what it forecloses,
and one condition under which it would beat the preferred option; an option that cannot carry
those three is a strawman and the report is refused. A project with one plausible build gets a
one-line record, not three invented options. The report lives at a stable path and every ticket
sharded later cites it, so the architecture is inherited rather than re-decided.

## Step 5 — Shape the project

**In:** the picked ideas, the architecture choice and the mission · **Out:** a project file in `~/slopdog/tasks/projects/`

A `writer` agent drafts or revises the project file by invoking `/slopdog:project-writer`; nobody edits a project file by hand.

Launch the `writer` agent (Agent tool, `subagent_type` `writer`) for any project creation or modification, and say in its prompt: "invoke `/slopdog:project-writer` with the Skill tool; do not read its SKILL.md instead." A general-purpose agent or a hand edit to a project file is wrong (Todd, 2026-10-12; a live session read the SKILL.md files and the skills never ran). The project's why / what / how tips are each one tweet plus two to five supporting bullets, never a clipped one-liner (`principles.md`, "Interlocking icebergs"). Template: `~/slopdog/v2/plugins/slopdog/writing/project-writer/template.md`; worked example: `~/slopdog/tasks/projects/shaping-and-delivery.md`.

## Step 6 — Shape the batch · Todd signs

**In:** the project file and the picked ideas · **Out:** a batch file with user stories, requirements, acceptance criteria and one `feature:` line

A `writer` agent drafts the batch by invoking `/slopdog:batch-writer` (or `/slopdog:batch-refine` for an existing one), a second model validates it, and Todd signs its shape.

Launch the same `writer` agent for a new batch (prompt: "invoke `/slopdog:batch-writer` with the Skill tool") or, for a batch that already exists and is being changed with Todd, "invoke `/slopdog:batch-refine`", which settles the tips with Todd first. Never a general-purpose agent or a hand edit (Todd, 2026-10-12). The tips follow the same rule as step 5: one tweet plus two to five supporting bullets. The creation skill runs the multi-model validation pass: a different model from the
author reviews the batch against its user stories and functional requirements and appends
acceptance criteria for happy and unhappy paths. Draft the batch's end-to-end check here, since it
is only the batch's own user stories in sequence; it is ticketed at step 9.

Name the batch's feature on its `feature:` line, beside `type:`: exactly one slug from
`~/slopdog/notes/Slopdog/How Slopdog Works/Slopdog Features.md`, or `feature: none` when no Slopdog
feature is honestly true of the batch (T-657). Never invent a slug or split a batch to fit one. A project keeps about five features and never more than eight, so a batch that would add a ninth is a question for Todd.

## Step 7 — Shard tickets by batch

**In:** the signed batch · **Out:** real tickets in Notion, sized at three points or more, and the folding report

Loop the batch's functional requirements and **create the real tickets in Notion**. The sharder for a signed batch is ticket-shaper (T-595), the same skill ticket-add names: read and follow `~/slopdog/v2/desks/writing/.agents/skills/ticket-shaper/SKILL.md` and draft each ticket from `~/slopdog/v2/desks/writing/templates/ticket-shaper/template.md`, so each use-case row becomes one requirement and one Happy/Unhappy criterion. Read the size
floor and folding rules at `~/slopdog/tasks/.claude/skills/ticket-add/SKILL.md` step 4: the floor is
three points and small tips fold together first. **Report the folding as an output** — how many
tips folded and into which tickets — so the floor is evidenced, not a rule a writer can skip.
Never invent or reserve an id in prose; take it from the real ticket list.

## Step 8 — Traceability verification · depends on step 7

**In:** the batch's requirements and its tickets · **Out:** a traceability matrix checked from both ends, or the batch refused naming the offending rows

Refuse to run until step 7 has completed for the batch: a requirement's ticket cannot be confirmed
to exist in Notion before the tickets exist. Then confirm a matrix exists; every requirement has
at least one ticket; every cited id is a real ticket; and each resolves in Notion. **Assert the
mapping from both ends** — each ticket's front matter names the requirement it serves, and the
matrix is compared against those back-references, so a ticket attached to a requirement it does
not implement is visible rather than silent. The local ticket file is the source of truth for
existence; the Notion resolution is cached to a stated staleness bound, so an outage degrades the
check to unverified-and-recorded rather than stalling the sprint. Refuse the batch naming the
offending rows.

## Step 9 — The batch's cross-cutting verification tickets

**In:** the batch and its tickets · **Out:** the few batch-level check tickets that apply

The batch gets the few checks no single ticket proves, picked by what the batch contains.

Add the few checks that belong to the batch as a whole, chosen by what the batch contains, not all
of them every time:

- **Always** an end-to-end run of the batch's user stories in sequence against real data, nothing
  stubbed — the one thing no single ticket proves.
- A **shared-contract** check when two or more tickets write the same file, schema or table.
- A **retirement** check when the batch names something it turns off.
- A **concurrent-load** check when the batch adds parallel or long-running work.

## Step 10 — Spot-check and hand to Tyrion · Todd signs

**In:** the signed, ready batches · **Out:** the batches in `focus_batches`, Tyrion told, the feature page revised and the sprint record written

He spot-checks a few tickets, approves, and the set is marked ready. Daphne's part of the
sprint ends here: the hand-off is a message to Tyrion naming the batches (at most three at
once, enforced by `/slopdog:set-focus --batches`), and from then on Tyrion runs the sprint
(dispatch, verification, progress, a short retro over the focus batches every couple of hours).

**The feature page (T-657).** For each batch accepted, in order:

1. Read the batch's `feature:` slug. `none` skips the rest of this list.
2. Open that feature's page under `~/slopdog/notes/Slopdog/How Slopdog Works/` (the How it works
   column of `Slopdog Features.md` names it).
3. Revise its planned section in place so it names the batch and what the batch will change, per
   `~/slopdog/CLAUDE.md` "A feature's reference doc is part of the feature": rewrite, never append.
   When the batch lands, `/task-verify` checks the page was revised again to read as built.

**The sprint record and the leftover (T-679).** With the hand-off, write the department's sprint
record: `node ~/slopdog/v2/scripts/sprint-record.mjs write --team <slopdog|projects|it> --tickets
<the ids handed over>`. It writes `v2/sprints/<date>-<department>.md` naming the department's
share of the week (from `v2/desks/watcher/team-shares.json`) and the tickets it took.

- **Friday's Slopdog run** also computes the week's leftover, before noon New York time:
  `node ~/slopdog/v2/scripts/sprint-record.mjs leftover` writes `v2/sprints/leftover-<date>.json`,
  each department's share minus its spend, added up.
- **A draw needs Todd's recorded authorisation.** No department spends the leftover until Todd
  says so: `node ~/slopdog/v2/scripts/sprint-record.mjs authorise --by todd --note "<his words>"`,
  run by him or on his word only. Then `sprint-record.mjs draw <department> --pct <n>` records the
  draw, and the team budget check (`v2/scripts/team-budget.mjs`) counts it as part of that
  department's share for the week.
  Without the authorisation a draw is refused.

## Step 11 — Sprint planning run report

**In:** this run's per-step notes, assumptions and open questions · **Out:** one filed report on the Reports screen

After the hand-off, write the run's own record so it is on the Reports screen rather than
only in the meeting's context.

Run `/slopdog:sprint-planning-report --run-record <department>`, which writes the record from
its run-record template and worked example, then file it through
`node ~/.claude/skills/slopdog/reports/file-report/scripts/file-report.mjs` into
`~/slopdog/tasks/reports/index.jsonl` with `--project` set to the project the run served.
A run that stopped early still files its record, naming the step it stopped at.

## Don't

- Don't fetch the mission or a directive from Notion at run time; read the mirror.
- Don't run step 8 before step 7, or mark a cell green that nothing tested.
- Don't stall on a question: make the call, flag the assumption on the batch, keep going, and
  raise it afterward for the next iteration.
