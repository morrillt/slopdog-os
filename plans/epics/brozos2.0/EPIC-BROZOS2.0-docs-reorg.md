---
name: Broz OS 2.0 Docs & Metadata
overview: "Overhaul the documentation system and metadata structures to move from Docs 1.0 to Docs 2.0. This includes reconciling metadata drift, implementing new primary document types (How-to, Research, Dev Notes), and integrating AI-generated summaries into the publishing workflow."
facets:
  type: plan
  status: active
tags:
  - plan/epic
  - meta/docs
---

# EPIC: Broz OS 2.0 Docs & Metadata

## Context
The current documentation system (Docs 1.0) has become messy. Metadata rules are spread across `docfrontmatterrules.md`, `front-matter-schema.md`, and `taxonomy.yaml`. There is no clear distinction between different document intents, and the publishing workflow lacks structured summaries for human and AI/vector consumption.

## Goals
- **Consolidation**: Create a single source of truth for all document metadata.
- **Intent-Driven**: Implement `how-to`, `research`, and `dev-note` as primary document types.
- **AI-Ready**: Integrate human-readable and vector-optimized summaries into the publishing lifecycle.
- **Workflow Overhaul**: Simplify the `broz:docs` menu and workflows to support the new structure.

## Tickets
- [ ] **TICKET-001**: Reconcile Metadata & Implement New Doc Types (Drafting now)
- [ ] **TICKET-002**: AI Summary Integration & Publishing Workflow Overhaul
- [ ] **TICKET-003**: Migration & Audit of Legacy Docs
