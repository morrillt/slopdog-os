---
name: project-writer
description: Draft or refresh a project file in ~/slopdog/tasks/projects/ using the house project-formation guidebook — read the guidebook first every run, then write from the project template and the canonical example, with no structure copied into this skill. Use when Todd says "/slopdog:project-writer", "write the project", "draft the project file", "refresh the project", or when a new programme needs a shaped project before batches exist. This is the only author-reachable project shaping path; legacy project-shape and project-refactor skills are archived.
argument-hint: "<project-slug> [notes or path to source material]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# project-writer — a project file from the guidebook

The shape lives in the **project-formation guidebook**, not here. A run that cannot read the
guidebook **stops and says so** rather than writing from memory.

## Step 1 — read the guidebook, every run

Read these in order before writing anything:

1. **Pointer note:** `~/slopdog/v2/reports/2026-09-26-formalize-v3-by-hand.md` — where the
   guidebook lives and which artifact version is current.
2. **Guidebook on disk:** `~/slopdog/v2/reports/Formalize V3 by Hand.html` (fallback: the
   artifact URL named in the pointer note). Strip HTML tags when reading; do not paste the
   guidebook into the project file.
3. **Principle:** `~/slopdog/v2/rules/principles.md`, section **Interlocking icebergs**.
4. **Corrections feed:** `~/slopdog/v2/reports/2026-09-26-project-method-from-whatsapp.md`.

**Trifecta** (skill, template, example enforce one another):

- Template: [`template.md`](template.md) beside this skill — the only home of project section headings.
- Canonical example: [`examples/shaping-and-delivery.md`](examples/shaping-and-delivery.md)
  (same shape as `~/slopdog/tasks/projects/shaping-and-delivery.md`).
- Batch at project scale (next skill in the chain): `~/slopdog/tasks/batches/shaping-and-delivery/1-shaping.md`

## Step 2 — read the inputs

`$ARGUMENTS`: project slug, then optional path or pasted notes. Read the slug's existing file
if present: `~/slopdog/tasks/projects/<slug>.md`. Write nothing yet.

## Step 3 — write or refresh the project file

- Start from [`template.md`](template.md) beside this skill; **fill sections using the
  guidebook and the worked example**, not headings copied into this skill.
- Target path: `~/slopdog/tasks/projects/<slug>.md` with front matter (`project`, `desk`,
  `status`, `status_note`, `owner`, `updated`, and any Notion fields the example carries). `status` is one
  word, `active`, `idle`, `parked` or `merged`; where the project stands goes on `status_note`. A new
  project is `idle` until Todd says it is active; `tasks/bin/check-project-status.mjs` refuses any other word.
- Body: tweet-sized **Why**, **What**, **How** (at most three bullets each, in that order when
  the guidebook uses Summary-style grouping), then requirements with ids and verify bullets,
  open questions with reply slots, appendix subsections with two-tweet intros, and what the
  project turns off. No generated ticket list in the project file.
- Name the project's features in the template's Features section before any batch exists: one line each, `- **Name** (`slug`): one sentence.`, and each
  batch-writer `feature:` line must be one of them (`~/slopdog/v2/rules/vocabulary.md`, "Feature").
- Keep Todd's words when refreshing; do not invent decisions.

## Step 4 — batches come later

This skill does not write batch files. After the project reads right, run
`/slopdog:batch-writer` once per batch folder under `~/slopdog/tasks/batches/<slug>/`.

## Step 5 — checks, then commit

Run both checks. Each failure line says what to fix: fix the project file and rerun until both
exit 0. The run is not finished, and nothing is committed, while either fails.

```bash
node ~/slopdog/tasks/bin/check-project-features.mjs ~/slopdog/tasks/projects/<slug>.md
node ~/slopdog/v2/scripts/lib/check-template-headings.mjs \
  ~/slopdog/v2/plugins/slopdog/writing/project-writer/template.md \
  ~/slopdog/tasks/projects/<slug>.md
```

Stage only `projects/<slug>.md` in the `~/slopdog/tasks` repo. Say which guidebook sources
were read.

## Don't

- Don't copy the guidebook's section list into this skill or into the project file as a stub.
- Don't write tickets; ticket writing is a separate skill.
- Don't run sign-off renders or `/ticket-add` from here.
