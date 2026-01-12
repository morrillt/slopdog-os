# Front Matter Schema

This document defines the standard front matter schema for all markdown files in `docs/` and `plans/`, conforming to `docs/taxonomy.yaml`.

## Schema Definition

All markdown files should include YAML front matter at the top of the file:

```yaml
---
title: "Document Title"
updated: "2025-12-15"
facets:
  type: plan | strategy | note | changelog
  status: draft | active | deprecated
  strategy:
    slug: string  # e.g., "orb-retest-breakout", "stepped-no-orb"
    version: string  # e.g., "v1", "v2", "v3"
  repo:
    path: string  # e.g., "docs/strategies/orb/v2/guide.md"
tags:
  - plan/epic
  - domain/strategy/orb-retest-breakout
  - tech/frontend/ui
  - ops/bug
---
```

## Required Fields

### `title` (string, required)
- Human-readable document title
- Used for display and navigation
- Example: `"ORB Retest Breakout Strategy Guide"`

### `updated` (string, required)
- ISO 8601 date (YYYY-MM-DD format)
- Last update date
- Example: `"2025-12-15"`

### `facets` (object, required)
Structured metadata fields (good for IDs + filtering).

#### `facets.type` (string, required)
- One of: `plan`, `strategy`, `note`, `changelog`
- See `docs/taxonomy.yaml` for allowed values

#### `facets.status` (string, required)
- One of: `draft`, `active`, `deprecated`
- See `docs/taxonomy.yaml` for allowed values

#### `facets.strategy` (object, optional)
- **Required for strategy docs only**
- `slug`: Strategy identifier (e.g., `"orb-retest-breakout"`, `"stepped-no-orb"`)
- `version`: Strategy version (e.g., `"v1"`, `"v2"`, `"v3"`)

#### `facets.repo.path` (string, optional)
- Stable repository path identifier
- Useful for cross-references and stable IDs
- Example: `"docs/strategies/orb/v2/guide.md"`

### `tags` (array, required)
- Multi-select categorical labels (good for graphing + discovery)
- Must use values from `docs/taxonomy.yaml`
- Format: lowercase + hyphenated
- Depth <= 4 levels
- Example: `["plan/epic", "domain/strategy/orb-retest-breakout", "tech/frontend/ui"]`

## Examples

### Strategy Documentation

```yaml
---
title: "ORB Retest Breakout Strategy Guide"
updated: "2025-12-15"
facets:
  type: strategy
  status: active
  strategy:
    slug: orb-retest-breakout
    version: v2
  repo:
    path: docs/strategies/orb/v2/guide.md
tags:
  - domain/strategy/orb-retest-breakout
  - domain/indicator/orb
  - domain/indicator/atr
  - domain/tag/stoploss
  - domain/tag/takeprofit
---
```

### Planning Artifact (Ticket)

```yaml
---
title: "TICKET-008 Docs reorg + front matter tags + repo-wide markdown audit"
updated: "2025-12-15"
facets:
  type: plan
  status: active
  repo:
    path: plans/epics/EPIC-003-bulletproof-backtest/TICKET-008-docs-reorg-front-matter-tags-and-md-audit.md
tags:
  - plan/ticket
  - ops/refactor
  - meta/index
---
```

### User Documentation

```yaml
---
title: "Backtester User Guide"
updated: "2025-12-15"
facets:
  type: note
  status: active
tags:
  - doc/howto
  - tech/frontend/ui
  - domain/tag/data-candles
---
```

### Technical Documentation

```yaml
---
title: "MkDocs + Next Integration"
updated: "2025-12-15"
facets:
  type: note
  status: active
tags:
  - tech/infra
  - doc/howto
---
```

## Tag Naming Rules

1. **Lowercase + hyphenated**: `tech/frontend/ui`, not `Tech/Frontend/UI`
2. **Depth <= 4**: Maximum 4 levels (e.g., `plan/epic/ticket/task` is 4 levels)
3. **Multi-select**: Documents can have multiple tags
4. **Cross-references allowed**: Tags like `#ops/bug` ↔ `#doc/beware` relationships are allowed
5. **Use facets for IDs**: Prefer `facets.strategy.slug/version` and `facets.repo.path` for stable identifiers

## Validation

- All front matter must conform to `docs/taxonomy.yaml`
- `facets.type` and `facets.status` must use allowed values from taxonomy
- Strategy docs must include `facets.strategy.slug` and `facets.strategy.version`
- Tags must exist in taxonomy or follow documented inference rules

## Migration Notes

- Existing docs without front matter should be updated to include it
- Legacy tags should be normalized to match taxonomy
- Strategy version should be captured in `facets.strategy.version`, not inferred from folder structure






