---
title: "TICKET-001 Docs 2.0: Reconcile Metadata & Implement New Doc Types"
updated: "2026-01-05"
facets:
  type: plan
  status: draft
  epic:
    number: "EPIC-BROZOS2.0"
    name: "Broz OS 2.0 Docs & Metadata"
  repo:
    path: plans/epics/brozos2.0/TICKET-001-docs-2.0-reorg.md
  progress:
    completed: 7
    total: 7
questions:
  updated: "2026-01-05"
  items:
    - id: "Q-1"
      status: resolved
      owner: "PO"
      question: "Should 'User How-To', 'Research', and 'Dev Notes' be tags or primary types?"
      answer: "They are primary facet subtypes for docs (replacing or augmenting 'note')."
    - id: "Q-2"
      status: resolved
      owner: "PO"
      question: "Should summaries be required for drafts?"
      answer: "No, they will be required but generated at publish time."
validation:
  state: pending
  updated: "2026-01-05"
  issues: []
review:
  state: pending
  updated: "2026-01-05"
  ac_results: []
  task_results: []
  concerns: []
tags:
  - plan/ticket
  - meta/docs
---

# TICKET-001 Docs 2.0: Reconcile Metadata & Implement New Doc Types
Status: Done

## User Story
As a semi-technical PO, 
I want a simplified documentation system with dedicated templates and AI-optimized summaries, 
so that my knowledge base is organized and vector-search ready.

## Acceptance Criteria
- [x] AC-1: Consolidate `templates/docfrontmatterrules.md` and `templates/front-matter-schema.md` into a single Source of Truth: `templates/docs-metadata-spec.md`.
- [x] AC-2: Update `docs/taxonomy.yaml` to include `how-to`, `research`, and `dev-note` as allowed values for `facets.type`.
- [x] AC-3: Add `summary` facet schema to `docs/taxonomy.yaml` with `human` (string) and `vector` (string) fields.
- [x] AC-4: Create three new base templates in `templates/docs/`: `how-to.md`, `research.md`, and `dev-note.md` following the new metadata spec.
- [x] AC-5: Overhaul `rules/broz/mode.docs.mdc` to replace the old menu with "Docs 2.0" handlers.
- [x] AC-6: Update `rules/broz/workflows/docs/create.mdc` to support selection between the three new types and apply the correct template.
- [x] AC-7: Implement a new "Audit" script/rule that verifies all files in `docs/` conform to the new `templates/docs-metadata-spec.md`.

## Tests
> **Strategy Note**: Automated testing (Unit/E2E) is explicitly skipped for this ticket to prioritize the structural consolidation of Docs 2.0. Validation will be performed manually.

### UNIT TESTS
- [x] (Skipped per PO decision)

### E2E Tests
- [x] (Skipped per PO decision)

## Tasks
- [x] Task 1: Consolidate Metadata Specs (AC: AC-1, AC-7)
  - [x] Subtask 1.1: Create `templates/docs-metadata-spec.md` by merging existing rules.
  - [x] Subtask 1.2: Delete old `docfrontmatterrules.md` and `front-matter-schema.md`.
- [x] Task 2: Update Taxonomy & Templates (AC: AC-2, AC-3, AC-4)
  - [x] Subtask 2.1: Update `docs/taxonomy.yaml` with new types and summary fields.
  - [x] Subtask 2.2: Create `templates/docs/how-to.md`.
  - [x] Subtask 2.3: Create `templates/docs/research.md`.
  - [x] Subtask 2.4: Create `templates/docs/dev-note.md`.
- [x] Task 3: Overhaul Docs Mode & Workflow (AC: AC-5, AC-6)
  - [x] Subtask 3.1: Rewrite `rules/broz/mode.docs.mdc` menu.
  - [x] Subtask 3.2: Update `rules/broz/workflows/docs/create.mdc` logic.
- [x] Task 4: Manual Validation (AC: AC-7)
  - [x] Subtask 4.1: Manually verify metadata schema against `templates/docs-metadata-spec.md`.
  - [x] Subtask 4.2: Update audit logic to pass manual verification.

## Dev Notes
- The `summary.vector` field should be described as "dense information optimized for vector storage (300-400 words)".
- Ensure the `publish.mdc` (to be handled in TICKET-002) is mentioned as a follow-up for actually generating these summaries.

## Dev Agent Record
- [2026-01-05] [Decision] Created initial ticket for Docs 2.0 reorg.
