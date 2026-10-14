---
name: sprint-validate
description: Report which batch functional requirements still have no ticket before sprint planning closes — named gaps, never blocking, never writing tickets. Use when Todd says "/slopdog:sprint-validate", "sprint validation", "is the sprint ready", "sprint readiness", "validate the sprint", or as the readiness step of the sprint planning ceremony after batches and tickets exist for a project.
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
disable-model-invocation: true
---

# sprint-validate — readiness report for a sprint project

A [sprint](~/slopdog/v2/rules/vocabulary.md) is weekly token allowances per department, kicked off by a planning meeting. This skill answers whether every **batch** functional requirement (FR-1, FR-2, … in each batch file's `## Requirements`) maps to at least one ticket in `~/slopdog/tasks/tickets/`. It names gaps and never blocks planning, never creates tickets, and never reads Notion (a missing Notion row is not a missing ticket).

## Step 1 — pick the project

`$ARGUMENTS` is the project slug (for example `shaping-and-delivery`). With no argument, read `~/slopdog/tasks/projects/` and ask which sprint project to check, or infer from the ticket in hand's `project:` frontmatter.

## Step 2 — run the check (read-only)

```bash
node ~/slopdog/tasks/bin/check-sprint.mjs <project-slug>
```

The script always exits **0**, even when gaps exist. Paste its full stdout into the conversation as the readiness report.

## Step 3 — say what it means

In one short paragraph: how many gaps, whether any batch is entirely unticketed, and that unmapped requirements are normal mid-shaping. Do not open tickets, do not edit batch files, do not treat the report as a gate.

## Don't

- Don't read Notion or treat a stale mirror as truth.
- Don't fail the ceremony or refuse to plan when gaps are listed.
- Don't generate tickets or traceability tables — Todd asked to remember the check in planning, not to automate mapping yet.
