---
title: "Broz OSS: Operating System for RockCap Workflows"
updated: "2025-12-16"
facets:
  type: note
  status: active
  repo:
    path: docs/broz-oss.md
tags:
  - doc/howto
  - doc/broz-oss
  - meta/onboarding
  - audience/dev
  - audience/stakeholder
---

## What is Broz OSS?

Broz OSS is a lightweight “operating system” implemented inside this repo to make planning, execution, and review **repeatable, traceable, and AI-friendly**.

It’s not a single tool—it's a set of conventions and automation rules:
- **Modes** (Plan/Build/Task/Docs/Research/Menu)
- **Workflows** (step-by-step recipes the agent follows)
- **Canonical state** in `plans/context.yaml`
- **Standard ticket/task templates** under `plans/templates/`

The goal: you can hand a ticket to an agent (or a human) and get consistent outcomes with clear evidence.

## Core mental model

## Modes

Modes are “permission + intent” switches. They tell the agent what kind of work is allowed.

- **Plan**: write planning artifacts (tickets/epics) and make them ready.
- **Build**: implement a ticket (code changes), with strict traceability.
- **Task**: one-off work that can change code, but must be tracked.
- **Docs/Research**: documentation or research artifacts.
- **Menu**: entry router.

## Workflows

Workflows are procedural checklists stored under:

- `.cursor/rules/broz/workflows/**`

Examples:
- `plan/validate_ticket` → “is this ticket coherent and executable?”
- `build/continue` → “implement the ticket with a logged loop”
- `build/code_review` → “post-continue review: spec + tests + KISS”

## Single source of truth: `plans/context.yaml`

`plans/context.yaml` is the repo’s live “state file”:

- `project.current_mode`: which mode is active
- `execution.current_ticket`: which ticket is being worked
- `execution.current_task`: which one-off task is being worked

Workflows read/update this file to coordinate.

## Ticket design: why the YAML front-matter matters

Tickets are Markdown, but they carry **structured state** in YAML front-matter so agents can fill things in mechanically and reviewers can audit quickly.

## Required front-matter rails (current direction)

For plan tickets, the system expects (at minimum) structured fields like:

- **`questions.items`**: single source of truth for open/resolved questions
- **`validation.state/updated/issues`**: whether Plan validation is passed
- **`review.*`**: code review outcomes + per-AC and per-task results

This enables:
- Plan mode: ensure ambiguity is resolved before Build starts
- Build mode: keep evidence attached to the ticket
- Review: mark “done” based on test artifacts + diffs, not vibes

## The standard lifecycle

## 1) Plan: create + validate a ticket

Key workflows:
- `Plan > Add Ticket` (`.cursor/rules/broz/workflows/plan/add_ticket.mdc`)
- `Plan > Validate Ticket` (`.cursor/rules/broz/workflows/plan/validate_ticket.mdc`)
- `Plan > Mark Ticket Ready` (`.cursor/rules/broz/workflows/plan/mark_ready.mdc`)

The Plan validation workflow is intentionally strict:
- Story → ACs → Tasks → Tests must align
- Test planning goes one layer deeper (stakeholder-clear expected outcomes)
- Any ambiguity becomes a structured question in front-matter (`questions.items`)
- Validation sets `validation.state: passed|failed` (plus issues)

When validation passes, the ticket is marked **Ready** for Build.

## 2) Build: execute the ticket (implementation loop)

Key workflow:
- `Build > Execute Ticket (Dev Story)` (`.cursor/rules/broz/workflows/build/continue.mdc`)

The Build loop:
- Picks the next unchecked task
- Implements only what’s needed
- Logs decisions/risks in the ticket
- Updates the file list
- On completion: runs tests + build/lint and records evidence
- Sets ticket `Status: Review`

## 3) Review: confirm spec + evidence + KISS

Key workflow:
- `Build > Code Review Ticket` (`.cursor/rules/broz/workflows/build/code_review.mdc`)

This is explicitly **post-continue**. It checks:
- Preconditions (Status=Review, validation passed, no open questions)
- Tests actually passed (and artifacts are linked)
- Diff since last commit (spec + KISS, prototype bias)
- Per-AC results written to `review.ac_results`
- Per-task results written to `review.task_results`

It also logs concerns in `## TECH LEAD REVIEW` and loops with the stakeholder to resolve.

## Bug workflow (paired down)

This repo now also supports a simpler 2-step bug loop in **Task** mode:

- **Task > File Bug**: capture notes → clarify → design failing tests → fix + log → set Status=Review
- **Task > Confirm Bug Fixed**: verify diff + tests + no overengineering → close

Related files:
- `.cursor/rules/broz/workflows/task/file_bug.mdc`
- `.cursor/rules/broz/workflows/task/confirm_bug_fixed.mdc`
- `plans/templates/bug.md`

This is optimized for prototypes:
- a couple users
- fast iteration
- avoid huge systems for unlikely edge cases

## How to operate Broz OSS (practical)

## Where to start

- Use the Broz commands under `.cursor/commands/broz/` (menu/plan/build/task/docs/research).
- The command sets mode in `plans/context.yaml` and loads the relevant mode rule.

## Common gotchas

- If `validation.state` isn’t passed, **don’t start Build**—fix the ticket first.
- If tests aren’t linked as artifacts, “done” is hard to verify.
- If a change adds tags in front-matter, update `docs/taxonomy.yaml` so the taxonomy stays current.

## Changelog

## 1.0 (this commit)

- Added stricter, coherence-driven `Plan > Validate Ticket` with deeper test planning and explicit readiness handoff.
- Added structured ticket front-matter rails:
  - `questions.items` for ambiguity tracking
  - `validation.*` for plan validation state
  - `review.*` for code review outcomes and per-AC/per-task results
- Improved `Build > Continue` to require recording test execution evidence + linking artifacts under `tests/results/`.
- Refactored `Build > Code Review` to be explicitly post-continue and to write machine-readable review results.
- Extended taxonomy + front-matter rules to keep tags/status schemas consistent.
- Added Task-mode paired bug workflows:
  - `Task > File Bug`
  - `Task > Confirm Bug Fixed`
  - Added `plans/templates/bug.md`.

