---
title: "Docs Front-Matter Rules"
updated: "2025-12-15"
facets:
  type: note
  status: active
  repo:
    path: docs/docfrontmatterrules.md
tags:
  - meta/docs
  - meta/rules
  - doc/howto
---
# Docs Front-Matter Rules

This document serves as the **Single Source of Truth** for front-matter validation in Broz OSS. All workflows (Docs, Plan, Research, Build) must enforce these rules.

## Taxonomy Source of Truth

The canonical list of allowed `facets.*` values and `tags` is defined in `docs/taxonomy.yaml`.
Workflows should treat that file as **authoritative** and keep it current when new tags are introduced.

## Global Schema

All markdown files in the repo (except `src/public/**`, `node_modules/**`, and `data/**`) must have YAML front-matter with the following base fields:

```yaml
---
title: "Title String"          # Required. Short, descriptive title.
updated: "YYYY-MM-DD"          # Required. Last significant update date.
facets:                        # Required. Structured metadata.
  type: <type>                 # Required. See docs/taxonomy.yaml.
  status: <status>             # Required. See docs/taxonomy.yaml.
  repo:
    path: <path>               # Required. Relative path from repo root.
tags:                          # Required (can be empty list [] if draft).
  - <tag1>                     # Must match docs/taxonomy.yaml.
  - <tag2>
---
```

## Mode-Specific Rules

### 1. Docs Mode

Used for general documentation (`docs/*.md`, `docs/strategies/**/*.md`).

- **Draft State**:
  - `facets.status`: `draft`
  - `tags`: Optional (can be empty or omitted in draft, though validation may warn).
- **Published State**:
  - `facets.status`: `active` (or `deprecated`)
  - `tags`: **Required**. Must contain at least 1 valid tag from `taxonomy.yaml`.
- **Strategy Docs**:
  - Must include `facets.strategy`:
    ```yaml
    facets:
      strategy:
        slug: "orb-retest-breakout"
        version: "v2"
    ```

### 2. Plan Mode

Used for Epics and Tickets (`plans/epics/**/*.md`, `plans/tickets/**/*.md`).

- **Tickets**:
  - `facets.type`: `plan`
  - `facets.epic`:
    ```yaml
    facets:
      epic:
        number: "EPIC-003"
        name: "Bulletproof backtest epic"
    ```
  - `tags`: Must include `plan/ticket`.
  - `status`: Managed by Build Mode (pending -> ready -> in progress -> done).
  - **Validation / Review metadata (required)**:
  - **Questions (required; single source of truth)**:
    - `questions.updated`: `YYYY-MM-DD`
    - `questions.items`: list of question objects
      - Required keys per entry: `id`, `status`, `owner`, `question`, `answer`
      - Allowed `status`: `open|resolved`
      - Allowed `owner`: `PO|Dev|TechLead`
      - If `status: resolved`, `answer` must be non-empty
    - `validation.state`: `pending|failed|passed`
    - `validation.updated`: `YYYY-MM-DD`
    - `validation.issues`: list of blocking validation issues (empty when passed)
    - `review.state`: `pending|approved|changes_requested|blocked`
    - `review.updated`: `YYYY-MM-DD`
    - `review.ac_results`: list of per-AC verdicts with evidence + tests (may start empty)
      - Required keys per entry: `id`, `status`, `evidence`, `tests`
      - Allowed `status`: `implemented|partial|missing`
      - `evidence` format: `repo/relative/path.ts:START-END`
      - `tests`: array of repo-relative file paths under `tests/`
    - `review.task_results`: list of per-top-level-task verdicts with evidence (may start empty)
      - Required keys per entry: `id`, `status`, `evidence`
      - Allowed `status`: `verified|questionable|not_done`
      - `id` format: `Task-<n>` aligned to top-level Tasks ordering
    - `review.concerns`: list of structured concerns (may start empty)
      - Required keys per entry: `id`, `status`, `type`, `note`, `priority`, `resolution`
      - Allowed `status`: `open|resolved`
      - Allowed `type`: `Spec|KISS|Tests|Risk|Docs|Taxonomy`
      - Allowed `priority`: `star|normal` (`star` = must resolve before Done)
      - If `status: resolved`, `resolution` must be non-empty

### 3. Research Mode

Used for research notes (`docs/research/**/*.md`).

- **Draft State**:
  - `facets.status`: `draft`
  - `facets.type`: `note`
- **Promoted State**:
  - When promoting to shared docs:
    - Update `facets.status` to `active`.
    - Ensure `tags` are populated and valid.

### 4. Build Mode

Automated updates during execution.

- **Status Transitions**:
  - When moving to "In Progress": update `facets.status` to `active` (or keep consistent with ticket text status).
  - When moving to "Done": update `facets.status` to `done`.
  - *Note: Ticket lifecycle state still lives in the markdown body as `Status:` (Pending/Ready/In Progress/Review/Done). Front-matter `facets.status` is a coarse state useful for filtering.*

## Validation Rules

1. **Taxonomy Compliance**: All `tags` and `facets` values must match `docs/taxonomy.yaml`.
2. **Missing Tags (keep taxonomy current)**:
   - If a workflow introduces a new tag, update `docs/taxonomy.yaml` to include it (and add a short description).
   - If the correct category/placement is unclear, record a `## Questions` checkbox in the relevant plan artifact and resolve it with the stakeholder before finalizing.
3. **Date Format**: `updated` must be `YYYY-MM-DD`.






