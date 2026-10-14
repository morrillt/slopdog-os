---
type: slopdog
project: shaping-and-delivery
desk: ideas
status: active
status_note: active; the six batch documents were written on 2026-10-03 for the sprint planning meeting, and two questions are open — the department names and what belongs in the sprint holder
owner: Todd
updated: 2026-10-03
---

# Slopdog shaping and delivery

> **Status:** `Active` | **Desk:** `ideas` | **Priority:** `High` | **Owner:** `Todd` | **Ready for shards:** `false`

## Why

The work about Slopdog itself has no single plan, so a ticket about shaping, a ticket about
which builder runs a job, and a ticket about where Todd reads the result all sit beside each
other on the board with no project, no order and no way to say which of them matters more.
Todd's words on 2026-10-02: "we're going to organize all the meta tickets, we're going to put
them into one or two projects with a couple of batches each, we're going to prioritize a
couple of batches and then we're going to run the two batches."

- Competing templates and guidebooks still produce tickets that fail validation or that
  belong to no project and no batch.
- Builder experiments burned quota and machine memory without a recorded rule for when a
  ticket escalates from a cheap builder to an expensive one.
- Todd still cannot prioritise in Notion, read the house reports in one library, or scan what
  each desk is doing without duplicate mirrors and cluttered panels.

## What

This project unifies how a piece of work is shaped, who builds it, and where Todd sees it,
and it gives the crew four teams that each own a share of the week's budget.

- One shaping system writes a project, its batches and its tickets from one skill, one
  template and one worked example each, and stamps every ticket ready before dispatch.
- A two-ring delegation ladder runs the cheap builders first and escalates to the expensive
  ones only on a recorded reason, with a ledger Todd can open.
- Reports, a Notion-first mirror, a documentation site and flat desk panels let Todd
  prioritise and read the work, and four named teams each hold a percentage of the weekly
  usage limit.

## How

- The shaping work lands under the writing desk, the delegation ladder lands in the dispatch
  scripts and the herdr panes, and the seeing work lands in Notion, the reports library and
  the board.
- Each batch is written as a small project in its own right — its own why, what, how,
  requirements, questions and appendix — so that a batch can be read, agreed and run on its
  own without the whole project being re-read.
- Nothing new is counted as finished until the thing it replaces is named and turned off,
  which is the fourth key thing below and the reason the retirement table exists.

## Decisions made rather than asking

1. Each batch keeps its own file under `tasks/batches/shaping-and-delivery/` rather than being
   embedded as a section of this project page. The file is what a batch document needs to be
   readable on its own, and the Notion batch rows already model batches this way. Reversible:
   embedding them later is a mechanical move. The question of whether Todd prefers the other
   way is q2 of the shaping batch.
2. The requirement numbers from the fifth draft of this plan (`FR-1` through `FR-16`) are kept
   exactly as Todd read them, and the requirements written since continue the same sequence
   from `FR-17`. Renumbering would break every reference Todd has already read.
3. The batch documents name no ticket ids that do not already exist. Ticket ids are assigned
   when a ticket is written, because an id reserved on paper gets handed to the next ticket
   anyone writes. The member list in each batch file is owned by `bin/render-batches.mjs`.

## Key things

Each key thing is one essential aspect of this project, and each is delivered by one batch,
with the single stated exception of the sprint holder.

1. **One shaping system, from a rough idea to a stamped ticket.** A project, its batches and
   its tickets each have one skill, one template and one worked example, and a ticket cannot
   leave shaping without a readiness stamp. *Decision:* the writing desk's project-shaper
   structure is the shape, applied at the batch level as well as the project level.
   *Concern:* two ticket writers existing at once is how the current failures happen, so the
   legacy shaping paths have to be folded, not left beside the new one.
   Delivered by [Batch 1 — Shaping](../batches/shaping-and-delivery/1-shaping.md), with its ticket template and checks in [Batch 7](../batches/shaping-and-delivery/7-ticket-template-and-checks.md) and its idea and feature end in [Batch 8](../batches/shaping-and-delivery/8-ideas-and-features.md), split from Batch 1 on 2026-10-06 under the ten-ticket batch cap.
2. **A delegation ladder whose escalations can be read.** The cheap builders run first, an
   escalation to an expensive builder writes a row saying why, and the ThinkPad is never
   asked to run more builds at once than its memory allows. *Decision:* email is the primary
   channel between desks and typing into a pane is the last resort. *Concern:* quota
   exhaustion mid-job is the common failure, so a hand-off happens only after a clean commit.
   Delivered by batches [2a — Rings and builders](../batches/shaping-and-delivery/2a-rings-and-builders.md), [2b — Cost and the dispatch gate](../batches/shaping-and-delivery/2b-cost-and-the-dispatch-gate.md), [2c — Registry and desk identity](../batches/shaping-and-delivery/2c-registry-and-desk-identity.md), [2d — Desk messaging](../batches/shaping-and-delivery/2d-desk-messaging.md), and [2e — Desk configuration and chairs](../batches/shaping-and-delivery/2e-desk-configuration-and-chairs.md), split from the former `2-delegation-ladder` on 2026-10-06 under the ten-ticket batch cap.
3. **Todd can see the work without hunting for it.** One reports library with a schema and an
   index, a Notion view that says which desk holds which ticket under its project and batch,
   a documentation site, and desk panels that are a flat list rather than a goal stack.
   *Decision:* the three surfaces that show desk state run in parallel on purpose and the
   choice between them is made at a Friday sprint close, not in this plan. *Concern:* the
   comparison is impossible while a surface shows some desks and not others, which is why the
   no-gaps requirement is first-wave work.
   Delivered by [Batch 3 — Seeing the work](../batches/shaping-and-delivery/3-seeing-the-work.md).
4. **Every new system names what it turns off.** The house has been accumulating deprecated
   systems beside their replacements, so a batch is not ready while a system it replaces is
   unnamed. *Note:* this is the one key thing no single batch delivers; it is owned by this
   project page and enforced on every batch through the retirement table below.
5. **Four teams, each with a share of the week.** IT, Meta, the team that builds product and
   the team that makes people aware Slopdog exists, each a herdr space with a scrum master, a
   dispatcher and builders, each holding a percentage of the weekly usage limit, planned on a
   fixed Friday-and-Saturday rhythm, and each working under one mission with a directive of
   its own. *Decision:* leftover budget is released only on Todd's explicit authorisation.
   *Concern:* the department names in Todd's own list and the team names in this plan do not
   agree, which is the open question on that batch.
   Delivered by [Batch 5 — Teams and the weekly budget](../batches/shaping-and-delivery/5-teams-and-the-weekly-budget.md).
6. **Herdr becomes a screen shaped for Slopdog.** The agent rows carry the ticket in hand, the
   sidebar carries a mark per desk, and the two changes herdr itself does not allow today
   become the open-source contribution Todd wants to make from this laptop. *Note:* Todd
   named this one himself and called it low priority, so it never runs ahead of the others.
   Delivered by [Batch 4 — Customizing Herdr for Slopdog](../batches/shaping-and-delivery/4-customizing-herdr.md).

## Features

Every batch below names exactly one of these on its `feature:` line (rules/vocabulary.md,
"Feature"). None is new: all seven are canonical slugs in
`notes/Slopdog/How Slopdog Works/Slopdog Features.md`.

- **Ticket, Batch and Project Shaping** (`ticket-shaping`): the three writing skills, the ticket
  template and the checks that stamp a ticket ready. Batches 1 and 7.
- **Swarm Dispatch and Multi-Engine Builders** (`swarm-engine`): the build rings and cheap
  builders, what a job costs and what dispatch refuses, and each team's share of the weekly
  budget. Batches 2a, 2b and 5.
- **Desk Runtime and Session Lifecycle** (`desk-runtime`): the registry of desks and durable pane
  identity, per-desk modes and chairs, and the sprint holder's vocabulary and commit work.
  Batches 2c, 2e and 6.
- **Omnichannel Comms, Slack and Email** (`comms-bridge`): email in and out of the desks and the
  messaging ladder that makes pane typing last. Batch 2d.
- **The Ticket Runner Board** (`runner-board`): the reports library and BuildWatch as the one
  surface for who holds what. Batch 3.
- **Herdr Cockpit and Multi-Pane Surveillance** (`herdr-cockpit`): the herdr screen shaped for
  Slopdog, and the upstream contribution. Batch 4.
- **Voice Blooms and the Ideation Loop** (`voice-ideation`): ideas captured with a department and
  a not-before date, the idea board, and feature tags on each idea. Batch 8.

## Batches

1. [`1-shaping`](../batches/shaping-and-delivery/1-shaping.md) — **initial shaping**: one system
   of three dovetailing skills, each with its template and examples, with every older shaping
   path folded into the recent lineage. Refinement shaping — taking an existing document round
   again — is a separate kind of work, done one-off today with `/slopdog:batch-refine`, and
   would become its own batch if it ever carries tickets.
2. [`2a-rings-and-builders`](../batches/shaping-and-delivery/2a-rings-and-builders.md) — ring one
   and ring two, cheap builders, dispatch routes and the build loop each builder runs.
3. [`2b-cost-and-the-dispatch-gate`](../batches/shaping-and-delivery/2b-cost-and-the-dispatch-gate.md)
   — usage ledger, turn budget, dispatch-time validation gate and per-criterion verify.
4. [`2c-registry-and-desk-identity`](../batches/shaping-and-delivery/2c-registry-and-desk-identity.md)
   — one registry of people, desks and chairs, durable herdr pane identity and shared lookup.
5. [`2d-desk-messaging`](../batches/shaping-and-delivery/2d-desk-messaging.md) — email in and
   out, the messaging ladder, hookless inbox delivery and context refusal.
6. [`2e-desk-configuration-and-chairs`](../batches/shaping-and-delivery/2e-desk-configuration-and-chairs.md)
   — working modes, per-desk thresholds and standing context, cloud and dispatcher chairs.
7. [`3-seeing-the-work`](../batches/shaping-and-delivery/3-seeing-the-work.md) — one reports
   library, a Notion view that carries project context, a documentation site, and desk panels
   that are a flat list.
8. [`4-customizing-herdr`](../batches/shaping-and-delivery/4-customizing-herdr.md) — the herdr
   screen shaped for Slopdog, including the two changes that need an upstream contribution.
   Low priority, by Todd's own instruction.
9. [`5-teams-and-the-weekly-budget`](../batches/shaping-and-delivery/5-teams-and-the-weekly-budget.md)
   — four teams, each with a scrum master, a dispatcher, builders, a share of the weekly limit
   and a directive, planning on a fixed Friday-and-Saturday rhythm.
10. [`6-sprint-holder`](../batches/shaping-and-delivery/6-sprint-holder.md) — the holder for
   work Todd wants in this sprint that belongs to no other batch. It delivers no single key
   thing, and says so.
11. [`7-ticket-template-and-checks`](../batches/shaping-and-delivery/7-ticket-template-and-checks.md)
   — one sized ticket template, the checks behind it and an unforgeable readiness stamp. Split
   from batch 1.
12. [`8-ideas-and-features`](../batches/shaping-and-delivery/8-ideas-and-features.md) — idea
   capture, the idea board, the twelve named features and the documentation site. Split from
   batch 1.

## Systems being retired

A new system is finished when the one it replaces is named and turned off. A batch is not
ready while a system of its own is missing from this table.

| System | Replaced by | Turned off by | State |
| :--- | :--- | :--- | :--- |
| tmux as the desks' screen | The herdr panes | Batches 2a–2e | In progress. Todd, 2026-10-03: "we're deprecating tmux" |
| The goal panel | The herdr sidebar desk cards and the board's desk panel | Batch 3 | Held deliberately while the three surfaces run in parallel |
| `~/.claude/statusline.py` | The statusband mod drawing in all four places | Batch 3 | Held deliberately so both can be seen side by side; retiring it is Todd's call |
| The desk file inbox as the primary channel | Desk email, inbound and outbound | Batch 2d | Email became primary on 2026-10-03; the file inbox stays as the offline fallback |
| The `project-shape` and `project-refactor` skills | The project writer and batch writer skills | Batch 1 | Named in Batch 1, not yet done |

## Backlog

Each item below is wanted and written down, and is not in this project. A holder batch exists
for work Todd wants inside this sprint, so an item here is one he has not asked for this
sprint.

- Desk onboarding harmonisation and the rest of the herdr migration.
- One standard dictation engine across both machines.
- Desk memory sharding and what loads at session start.
- Keeping the ThinkPad and the Mac in step.
- A fractional context gauge and a commit floor on the pickup resize.
- The house voice bundle exported for a partner, and the briefing on Cowork against Claude Code.
- Markdown preview in Yazi on the ThinkPad, matching the Mac.
- Cross-team collaboration and autonomous triage protocols, and the off-hours listener test.
- A comparison against GitHub Spec Kit, a priority above high, and a lighter harness for the
  frontier models.
- A watcher that extracts text from every new PDF across the document trees.
- An emergency mode for the operational desk above ninety per cent of the weekly burn.
- A permanent fix for Gemini CLI authentication, which may move into Batch 2 if it bites.

## Cross-cutting verification

**Verification tiers.** Tier 1 is each ticket's own `*Verify:*` lines. **Tier 2** batch
integration tests live in each batch file under `## Integration tests` and run once every member
ticket in that batch is done. **This project page owns tier 3** — the cross-batch tests below;
full procedures stay here, and each batch names only the tests that cross it.

Two tests cross from one batch into the next, so neither belongs to a single batch's
requirements. Each is written here once and owned by one batch; the other batches a test
crosses point at this section rather than restating it as a verify line of their own. A test
restated in several batches drifts in each copy, and every batch then claims to cover it while
none of them builds it. Agreed with Todd on 2026-10-06.

| Test | What it does | Batches it crosses | Owner |
| :--- | :--- | :--- | :--- |
| Idea to stamped ticket | One made-up idea is written into the idea inbox and run the whole way through: it is captured, it joins a project, it becomes a requirement on a batch, and it comes out as a ticket carrying a readiness stamp. It passes only when no file is hand-edited between those steps. | 8 (capture), 1 (shaping), 7 (the stamp) | Batch 7 |
| Stamped ticket through the dispatch gate | The ticket produced by the first test is handed to the dispatch-time validation gate, the check that refuses a ticket before a builder starts, and the gate accepts it without complaint. | 1 (shaping), 7 (the stamp), 2b (dispatch gate) | Batch 7 |

The second test exists because shaping and the dispatch gate were built to two different ideas
of what a finished ticket looks like, and nothing has ever made them agree. That is why a
ticket can read correctly against its batch and still be bounced at dispatch.

**Traceability has one mechanism, not three.** FR-27 of
[Batch 1](../batches/shaping-and-delivery/1-shaping.md) is the mechanism: each step of the chain
stamps the ticket's front matter as it runs, and one command reads those stamps across a project
and reports every break in both directions. The orphan-citation ticket, T-654, is its
implementation rather than a second checker, and the readiness stamp in
[Batch 7](../batches/shaping-and-delivery/7-ticket-template-and-checks.md) consumes its result
rather than re-deriving it.

## How this project ends

This project is finished when four things are true at once. A rough idea becomes a stamped
ticket through one path, and the legacy shaping paths are gone rather than archived beside it.
A ticket runs on a cheap builder, is verified by a different model, and any escalation to an
expensive builder has a ledger row naming its reason. Todd opens Notion and reads which desk
holds which ticket under its project and batch, and opens the reports library and finds every
house report under one schema. Each of the four teams has drawn on its own share of a week's
budget, and the Watcher has warned and then stopped one of them at its share.

## Reports

- [Sprint planning: Slopdog shaping and delivery] —
  the project's tip and all six batch tips on one page, written for the sprint planning
  meeting of 2026-10-03, with the two questions that have to be answered in it.
- [The three meta batches for review] — the
  earlier report Todd called a great report on 2026-10-03. It is kept as the worked example that
  the report work in Batch 3 copies from.

## Questions on the board

- The four department names. Todd's own list is IT, features, Meta and influencer; this plan
  calls two of them Product and Content. One naming has to give. On
  [Batch 5](../batches/shaping-and-delivery/5-teams-and-the-weekly-budget.md), question q1.
- What belongs in the sprint holder, and whether a holder batch is the right shape for it. On
  [Batch 6](../batches/shaping-and-delivery/6-sprint-holder.md), question q1.
- Who leads the team that makes people aware Slopdog exists. Already on the board as q1 of
  T-581, the ticket that is shaping this project.
- Where project questions live, and whether batch documents stay as files. On
  [Batch 1](../batches/shaping-and-delivery/1-shaping.md), questions q1 and q2.

## Sprint order, locked by Todd on 2026-10-03

The sprint planning skill ticket, "A sprint planning skill runs a sequence of gated steps with
explicit sign-off per department" (T-626), runs **first**, ahead of the batch order, even though
it sits topically in batch 5. Todd's reason: "A sprint planning skill we write but don't run this
sprint is worthless." Everything else in this sprint is shaped and ticketed through it once it is
usable, and the delegation-ladder batches (2a–2e) are its first real exercise, so the process is
practised on live work and refined in the doing.

This is an execution-order fact, not a batch membership change: T-626 stays in batch 5 because
that is what it is about, and runs before batches 1 to 4 because that is when it is needed.

## Tickets
- [ ] T-717 · /slopdog:browse checks the Chrome extension is connected before a reader is spawned
- [ ] T-715 · The build ladder starts on Gemini, Composer is off it, and Opus works solo after two failures
- [ ] T-712 · A dispatch through the ideas-composer lane records worker: ideas-composer, so the T-596 lane-recording check passes again
- [ ] T-709 · Ticket-add refuses to hand off until the ticket passes every check Tyrion runs, including a red run of each check
- [x] T-701 · Dispatch refuses a ticket outside the focus batches unless it's a hotfix
- [x] T-696 · Test runs get a sandbox that stubs desk inboxes, herdr sends and model calls, and a test fails if it writes outside it
- [x] T-697 · Dispatch's sender-reply inbox honours the test sandbox, and no test spawns dispatch outside it
- [x] T-695 · Dispatch checks an engine's quota before starting a job and routes to the next engine instead of hanging
- [x] T-694 · turn-commit commits only the paths its own session changed, never another desk's edits
- [x] T-693 · A standing sweep queues every unverified 🔍 ticket for LaForge, oldest first, so none sits unchecked
- [x] T-692 · A ticket cannot be handed off until it passes the same checks as the dispatch gate, and ticket-add refuses with the reasons
- [x] T-689 · Dispatch always runs the build-ticket skill and bounces a job that leaves no trail

- [ ] T-681 · The legacy shaping paths are archived and the ancestor retired, so one shaping path remains
- [ ] T-675 · Every question gets an id and one central home, ticket or no ticket
- [ ] T-671 · A link the house sends out is verified open before it leaves, or it goes as a file instead
- [ ] T-661 · A paused ticket shows as paused, not as ready to build
- [ ] T-660 · The idea board shows captured ideas from idea-inbox grouped by department
- [ ] T-659 · Sprint lessons are captured as they happen and reviewed at the next planning meeting
- [ ] T-658 · Ideation tags each idea with the canonical feature slugs it touches
- [ ] T-657 · Batches carry a feature slug, and landing a batch updates that feature's living doc
- [ ] T-656 · Watcher Slacks Todd at notify, warn, and stop usage rungs once per weekly window
- [ ] T-655 · Per-desk SessionStart hook injects standing context from configuration
- [ ] T-652 · Projects and batches carry a department type tag, tickets inherit it from the batch, and the two-team split is retired in the rules
- [ ] T-653 · Escalate to Slack button on runner question cards
- [ ] T-654 · Report unknown ticket citations across plans, batches and checkers instead of silently skipping
- [ ] T-662 · Migrate pane labels, secondary lookups, and desk onboarding to central registry
- [ ] T-684 · Every desk owns its own sidekicks, as subfolders of the desk
- [x] T-663-1 · Dispatch refuses a ticket that fails any of seven mechanical checks, in a dry run too
- [x] T-663-2 · Every dispatch refusal runs from the gate's one entry point, and --force overrides the gate with a recorded note
- [ ] T-663-3 · Dispatch warns, without refusing, on four judgement checks
- [x] T-665 · The dispatcher gets a desk, rules, and a feeder that never lets a builder idle
- [x] T-666 · Load statusband on Mac and ThinkPad terminal and desktop sessions
- [ ] T-670 · Task-add and task-verify harness skills support Log: verification of acceptance criteria
- [x] T-677 · Dispatch --job write selects writing preamble and prevents false build marks
- [ ] T-678 · Each team holds a share of the weekly budget: a shares file, a warning, and a refusal
- [ ] T-679 · Sprint planning writes a record per department, and the Friday leftover waits for Todd's word
- [ ] T-683 · Clickable link in Slack: sync the document to a Notion Active Conversations page, done by Composer

- [ ] T-685 · A changed house assumption flags the open tickets it touches, and dispatch refuses them until re-checked
- [ ] T-688 · The inbox delivery watcher archives messages for Gemini (agy) desks without delivering them, so those desks never see them
- [ ] T-690 · bw's Activity page filters by project from a sub-menu
- [ ] T-691 · After three failed Composer rounds, a ticket escalates to a stronger model, and the ledger records why
- [ ] T-702 · The build ladder is Composer twice, Grok third, then Sonnet through Cursor, with no Opus
- [x] T-698 · Tickets state each criterion as behaviour plus its test boundary, and the builder's first commit is the failing check
- [x] T-699 · A builder writes a short plan into the ticket and it must pass a mechanical check before step 1 is built
- [x] T-700 · The verifier judges the tests, not only their result, and logs each failure with its category
