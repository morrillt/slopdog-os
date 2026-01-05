---
title: "TICKET: {{ticket_id}} {{ticket_title}}"
updated: "{{date}}"
facets:
  type: plan
  status: draft
  epic:
    number: "{{epic_number}}"
    name: "{{epic_name}}"
  repo:
    path: plans/epics/{{epic}}/{{ticket_id}}.md
questions:
  updated: "{{date}}"
  # Rails:
  # - Use this as the single source of truth for open/resolved questions.
  # - Keep questions minimal and decision-oriented.
  # - When resolved, set status=resolved and fill `answer`.
  items: []
  # Example (copy/paste + fill in):
  # items:
  #   - id: "Q-1"
  #     status: open        # open | resolved
  #     owner: "PO"         # PO | Dev | TechLead
  #     question: "What is the expected behavior when X happens?"
  #     answer: ""          # fill when resolved
validation:
  state: pending   # pending | failed | passed
  updated: "{{date}}"
  issues: []
review:
  state: pending   # pending | approved | changes_requested | blocked
  updated: "{{date}}"
  # Per-AC review results (filled by Build > Code Review).
  # Strong rails:
  # - one entry per AC in `## Acceptance Criteria`
  # - `id` must match exactly (e.g. "AC-1")
  # - `status` must be one of: implemented | partial | missing
  # - `evidence` must be repo-relative with line range: "path/to/file.ts:12-44"
  # - `tests` must be repo-relative file paths under `tests/`
  ac_results: []
  # Example (copy/paste + fill in):
  # ac_results:
  #   - id: "AC-1"
  #     status: implemented
  #     evidence: "src/path/file.ts:12-44"
  #     tests:
  #       - "tests/unit/<name>.test.ts"
  #       - "tests/e2e/<name>.e2e.spec.ts"
  #   - id: "AC-2"
  #     status: partial
  #     evidence: "src/path/other.ts:5-90"
  #     tests: []
  # Per-top-level-task review results (filled by Build > Code Review).
  # Rails:
  # - include ONLY top-level Tasks (not subtasks)
  # - `id` should be "Task-<n>" aligned to ordering in `## Tasks` (Task-1, Task-2, ...)
  # - `status` must be one of: verified | questionable | not_done
  # - `evidence` should point to key code/PR diff areas: "path/to/file.ts:12-44"
  task_results: []
  # Example:
  # task_results:
  #   - id: "Task-1"
  #     status: verified
  #     evidence: "src/path/file.ts:12-44"
  # Review concerns (structured; mirrors `## TECH LEAD REVIEW` but machine-readable).
  # Rails:
  # - `status` must be: open | resolved
  # - `type` must be: Spec | KISS | Tests | Risk | Docs | Taxonomy
  # - `priority` must be: star | normal (star = must-fix before Done)
  # - If status=resolved, `resolution` must be non-empty
  concerns: []
  # Example:
  # concerns:
  #   - id: "C-1"
  #     status: open
  #     type: "KISS"
  #     priority: star
  #     note: "Fix added an abstraction layer we likely don't need."
  #     resolution: ""
tags:
  - plan/ticket
---
# TICKET: {{ticket_id}} {{ticket_title}}
Status: Pending  <!-- Pending | Ready | In Progress | Review | Done -->

## User Story
As a {{role}},
I want {{action}},
so that {{benefit}}.

<!-- Questions live in front-matter under `questions.items` (single source of truth). -->

## Acceptance Criteria
- [ ] AC-1: ...
- [ ] AC-2: ...


## Tests
<!--
Tests are critical, we want to make sure that test descriptions are adequately defined, while not being overly prescriptive. High level descriptions that are reasonably clear and specific enough that a samart AI, can fill them in at execution time. 
-->

### E2E Tests
<!--
Playwrigt tests  tests/e2e
-->

### UNIT TESTS
<!--
Vitest tests  tests/e2e
-->

## Tasks
<!--
CRITICAL STRUCTURE :
- Two-tier tasks system
- Every TOP-LEVEL task MUST map to 1+ Acceptance Criteria using (AC: AC-#,...)
- Subtasks do NOT need AC mapping (they inherit from parent task)
-->

- [ ] Task 1: ... (AC: AC-1)
  - [ ] Subtask 1.1: ... // should likely be create a failing test.
  - [ ] Subtask 1.2: ...
- [ ] Task 2: ... (AC: AC-2, AC-1)

## Dev Notes
- Architecture patterns: ...
- Implementation details: ...

## Dev Agent Record

### DEV AGENT RECORD
<!-- Continue workflow: log issues/concerns as they arise (KISS + concise) -->
<!-- AT LEAST One bullet per SUB TASK (required): -->
<!-- - [YYYY-MM-DD HH:MM] [Spec ambiguity | Blocker | Decision | Gotcha] Description + resolution/next step -->

### File List
<!--
Continue workflow: keep this up to date.
List files changed during implementation (one per line), repo-relative paths.
-->

### Test Evidence
<!--
Continue workflow: REQUIRED at completion (so code review can verify “done” quickly).
Provide commands + pass/fail summary + links to persisted artifacts under `tests/results/`.

- Unit (Vitest):
  - Command(s):
  - Result:
  - Artifact: tests/results/vitest-results.md
- E2E (Playwright):
  - Command(s):
  - Result:
  - Artifact: tests/results/e2eresults.md
-->

### Completion Notes
<!--
Continue workflow: REQUIRED at completion.
- PO Summary: what changed + what to verify (stakeholder-friendly)
- Tech Lead Summary: key decisions, risks, KISS notes
-->

#### Issues Summary (fill at completion)
<!--
categories:
  - Spec ambiguity        # requirements unclear; assumptions needing PO review
  - Implementation blocker # technical issue delaying/complicating work
  - Implementation decision       # non-obvious choice future devs should know
  - Bug               # subtle bug/edge case/pitfall discovered
-->
<!-- Extract entries above into this table -->
| Category | Issue | Notes |
|----------|-------|-------|
|  |  |  |

## TECH LEAD REVIEW

<!--
Post-`build/continue` review loop:
- Read `### DEV AGENT RECORD` logs
- Validate tests actually ran + passed
- Review `git diff` since last commit for spec compliance + KISS
- If concerns exist, capture them here and resolve in dialogue with stakeholder/dev
-->

### Review Log
<!-- One bullet per concern / noteworthy point -->
<!-- - [YYYY-MM-DD HH:MM] [Spec | KISS | Tests | Risk | Docs | Taxonomy] Note + required follow-up -->

### Concerns / Action Items
<!-- Checkbox list; resolve by checking off -->
<!-- - [ ] Concern: ... -->

### Resolution Notes
<!-- Short outcomes after dialogue: what changed / what was agreed -->