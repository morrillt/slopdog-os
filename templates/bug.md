---
title: "BUG: {{bug_id}} {{bug_title}}"
updated: "{{date}}"
facets:
  type: plan
  # NOTE: `/docs` defaults to filtering `status: active` (doc lifecycle status).
  # Ticket workflow status lives in the body `Status: ...` line.
  status: active
  epic:
    number: "{{epic_number}}"
    name: "{{epic_name}}"
  repo:
    path: "{{repo_path}}"
tags:
  - plan/ticket
  - ops/bug

# Single source of truth for ambiguities/decisions (no checkbox Questions in body)
questions:
  updated: "{{date}}"
  items: []

validation:
  state: pending   # pending | failed | passed
  updated: "{{date}}"
  issues: []

review:
  state: pending   # pending | approved | changes_requested | blocked
  updated: "{{date}}"
  ac_results: []
  task_results: []
  concerns: []
  # Rails: structured concerns live here (machine-readable).
  # - `priority: star|normal` (star = must resolve before Done)
  # - If status=resolved then resolution must be non-empty
---

# BUG: {{bug_id}} {{bug_title}}
Status: Pending  <!-- Pending | Ready | In Progress | Review | Done -->

## Bug Summary
<!-- 1-3 sentences: what’s broken and why it matters -->

## Stakeholder Notes (raw)
<!-- Paste the loose notes verbatim here -->

## Expected Behavior
<!-- Plain language: what should happen -->

## Observed Behavior
<!-- Plain language: what actually happened -->

## Repro Steps
<!-- Best-effort steps; can be partial -->

## Scope / Impact
<!-- Who is affected, how often, severity -->

## Acceptance Criteria
- [ ] AC-1: Bug is fixed per Expected Behavior above.
- [ ] AC-2: No regressions: relevant unit + e2e tests pass.

## Tests

### E2E Tests
<!-- tests/e2e/ — write stakeholder-clear cases + max 2 “how” bullets -->

### UNIT TESTS
<!-- tests/unit/ — use fixtures in tests/fixtures when data-driven -->

## Tasks
<!-- Two-tier tasks system; top-level tasks must map to ACs -->

- [ ] Task 1: Write failing test(s) that reproduce the bug (AC: AC-1)
  - [ ] Subtask 1.1: Add/extend unit tests (or e2e if needed) to fail on current behavior.
- [ ] Task 2: Implement minimal fix (AC: AC-1)
  - [ ] Subtask 2.1: Fix root cause (prototype bias; avoid overengineering).
- [ ] Task 3: Validate all tests pass + attach evidence (AC: AC-2)
  - [ ] Subtask 3.1: Run unit + e2e suites; write `### Test Evidence` links.

## Dev Notes
<!-- Optional: suspected root cause, links, relevant modules -->

## Dev Agent Record

### DEV AGENT RECORD
<!-- - [YYYY-MM-DD HH:MM] [Spec ambiguity | Blocker | Decision | Gotcha] Description + resolution/next step -->

### File List
<!-- One file per line, repo-relative -->

### Test Evidence
<!-- Commands + results + links to persisted artifacts under tests/results/ -->

### Completion Notes
<!-- PO Summary + Tech Lead Summary -->

#### Issues Summary (fill at completion)
| Category | Issue | Notes |
|----------|-------|-------|
|  |  |  |

## TECH LEAD REVIEW

### Review Log
<!-- - [YYYY-MM-DD HH:MM] [Spec | KISS | Tests | Risk] Note + required follow-up -->

### Concerns / Action Items
<!-- - [ ] Concern: ... -->

### Resolution Notes
<!-- What changed / what was agreed -->
