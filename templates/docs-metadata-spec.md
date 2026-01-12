---
title: "Docs Metadata Specification"
updated: "2026-01-05"
facets:
  type: how-to
  status: active
  repo:
    path: templates/docs-metadata-spec.md
tags:
  - meta/docs
  - meta/rules
---

# Docs Metadata Specification

This document is the **Single Source of Truth** for all markdown front-matter in Broz OS. It reconciles legacy rules and defines the schema for Docs 2.0.

## Global Schema

All markdown files must include YAML front-matter with these base fields:

```yaml
---
title: "Title String"          # Required. Human-readable title.
updated: "YYYY-MM-DD"          # Required. Last significant update.
facets:                        # Required. Structured metadata.
  type: <type>                 # Required. See Types section.
  status: <status>             # Required. See Status section.
  repo:
    path: <path>               # Required. Repo-relative path.
tags: []                       # Required. Categorical labels from taxonomy.yaml.
---
```

## Facet Types (`facets.type`)

Docs 2.0 uses specific primary types to define intent:

1.  **`how-to`**: Procedural guides for users or devs.
2.  **`research`**: Exploratory notes on problems, options, and strategies.
3.  **`dev-note`**: Technical notes for future developers (workarounds, hiccups).
4.  **`plan`**: Planning artifacts (Epics, Tickets).
5.  **`strategy`**: Trading strategy definitions.
6.  **`changelog`**: Record of changes.

## Status (`facets.status`)

- **`draft`**: Work in progress.
- **`active`**: Current and in use.
- **`deprecated`**: Kept for reference only.
- **`done`**: Completed (primarily for tickets).

## Summary Fields (Required at Publish)

Published documents (`status: active`) must include the `summary` facet:

```yaml
facets:
  summary:
    human: "Short summary for UI (tweet-sized)."
    vector: "Dense information optimized for vector storage (300-400 words)."
```

## Validation Rules

1.  **Taxonomy Compliance**: All `tags` and `facets` must match `docs/taxonomy.yaml`.
2.  **H1 Limitation**: Do NOT use `# Title` in the body; the front-matter `title` is the H1.
3.  **Structure**: Use `##` (H2) for major sections.
4.  **Date**: `updated` must be `YYYY-MM-DD`.
