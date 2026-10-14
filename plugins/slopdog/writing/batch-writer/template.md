# Batch {{batch-basename}}
type: slopdog
feature: {{feature-slug}}
<!--
Department type (T-652), exactly one of the three departments in rules/vocabulary.md:
slopdog  = improving Slopdog itself, the whole pipeline from ideation to execution to verification.
projects = building the things we ship, including communicating about them (an influencer
           project is a project with project_type: influencer on its project file).
it       = tooling at the OS level, tooling problems, bugs in our actual tools, not really Slopdog.
Tickets inherit this from their batch and never carry their own type:. A missing, retired or unknown value warns, never fails.

Feature (Todd, 2026-10-10): every batch names exactly one feature on the feature: line, the same
kebab-case slug a ticket carries. A feature collects batches across sprints (one batch this sprint,
another next) and is never a ticket: there are no feature tickets. check-batch-structure warns on a
batch with no feature: line or more than one.
-->

## Summary
A tweet-sized description of what this batch delivers — the kind of work, not a ticket list.

## What

- {{Up to three bullets: deliverables and scope.}}
-
-

## Why

- {{Up to three bullets: problem, cost, or house rule this batch answers.}}
-
-

## How

- {{Up to three bullets: approach, lineage, or where work lands. Each bullet ends with the requirements it owns, e.g. *(Owns FR-N.)* A bullet may own several FR ids; list each.}}
-
-

## Requirements

Every requirement hangs from one bullet of How, named in its heading. A requirement that hangs
from nothing means How is missing a bullet, not that the requirement is homeless.

Number FR ids in sequence with the parent project (`FR-1`, `FR-2`, …). Continue the project's
sequence; never renumber an existing FR and never reuse a retired number.

- [ ] **FR-N ({{Requirement title}}) — hangs from How bullet {{1|2|3}}:** I can {{statement in Todd's voice — one user-visible capability, not a sentence of jargon}}.

  *{{Label for a term the statement leans on, introduced with "What … is" or similar}}:*
  - {{Concrete bullet defining the term.}}
  - {{Another bullet if needed.}}

  - *Verify:* {{Observable check — command, path, or judgment that can fail.}}
  - *Verify:* {{Three to five verify lines per requirement; each must be able to fail.}}
  - *Verify:* {{Optional fourth.}}
  - *Verify:* {{Optional fifth.}}

{{Repeat one requirement block per FR. Match every *(Owns FR-n.)* on How to exactly one "hangs from How bullet n" here, and vice versa.}}

## Integration tests

Run once every member ticket in this batch is done (tier 2).

- **{{Batch integration test title}}** — `{{command}}` → {{expected outcome that can fail}} (FR-{{n}}).
-

## Cross-cutting tests

Tier 3 procedures live in [the parent project](../projects/{{project-slug}}.md#cross-cutting-verification).

- **{{Cross-batch test name}}** — crosses this batch with {{other batch names}} (owner: {{batch}}).
- {{Or one sentence that no tier-3 test crosses this batch.}}

## Discussion & Open Questions

> [!comment Agent|q1]
> **{{Decision title}}:** {{Question text}}
> - *Context:* {{Why this matters and what options exist.}}
>
> > [!reply Owner|q1-r1]
> > ✍️ **Hey Todd, enter your answer here:**

## Appendix

### {{Appendix subsection title}}

**What you are looking at.** {{One sentence.}}

**Why it is here.** {{One sentence.}}

{{Supporting detail — provenance, constraints, quotes. No ticket scaffolding.}}

## Members
<!-- At most ten tickets; derived ones (origin: derived with extends: chain to todd-asked) not counted; check-batch-structure.mjs fails an eleventh. Renderer owns this list. -->
1. T-0NN · {{Ticket title as a member line; ids assigned when tickets exist.}}

## What this batch turns off

{{Skills, habits, or parallel paths this batch retires — or a sentence naming each path retired.}}
