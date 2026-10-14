---
name: batch-writer
description: Draft or refresh one batch file under ~/slopdog/tasks/batches/ so it reads as a small project — Summary, What, Why, How with Owns FR mapping, long explicit requirements with labelled definition blocks and verify lines, tier-2 integration tests, open questions, appendix, members, and what the batch turns off — using the same guidebook as the project writer, with ticket scaffolding omitted. Use when Todd says "/slopdog:batch-writer", "write this batch at project level", "reshape the batch", or when a batch file is only a ticket list under a heading. This is the only author-reachable batch shaping path; does not emit ticket tips, traceability matrices, or reserved ticket ids.
argument-hint: "<project-slug> <batch-basename> [notes or path to source]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# batch-writer — one batch file at project scale

Batch shaping at project scale with **ticket scaffolding omitted** (no Dataview ticket rollups, no
FR-to-ticket tables, no ticket tips, no traceability matrix, no generated ticket list). The
guidebook remains the authority for vocabulary and depth.

## Step 0 — Grok runs this skill through dispatch

When Grok is the writer, Daphne (or a build ticket) dispatches
`node ~/slopdog/v2/scripts/dispatch.mjs "<brief>" --engine ideas-grok --write --dir
~/slopdog/tasks/batches/<project>/`. That path uses Cursor's Grok model, not the xAI Grok
TUI. If `cursor-agent --model grok-4.7-medium -p "…"` cannot answer, Grok is not ready for
writing; see `v2/memory/grok-auth-ban.md`.

## Step 1 — read the guidebook, every run

Same sources as `/slopdog:project-writer` Step 1:

- `~/slopdog/v2/reports/2026-09-26-formalize-v3-by-hand.md`
- `~/slopdog/v2/reports/Formalize V3 by Hand.html`
- `~/slopdog/v2/rules/principles.md` (**Interlocking icebergs**)
- `~/slopdog/v2/reports/2026-09-26-project-method-from-whatsapp.md`

**Batch trifecta** (skill, template, example enforce one another):

- Template: [`template.md`](template.md) beside this skill (same shape as `~/slopdog/tasks/batches/TEMPLATE.md`).
- Canonical worked example:
  [`examples/01-shaping-and-delivery-1-shaping.md`](examples/01-shaping-and-delivery-1-shaping.md)
  (copy of `~/slopdog/tasks/batches/shaping-and-delivery/1-shaping.md`)

## Step 2 — read the inputs

`$ARGUMENTS`: project slug, batch basename (e.g. `3-seeing-the-work`), then optional notes.
Read the parent project `~/slopdog/tasks/projects/<slug>.md` and any existing batch file
`~/slopdog/tasks/batches/<slug>/<basename>.md`.

## Step 3 — write the batch file

Write `~/slopdog/tasks/batches/<slug>/<basename>.md` with this **section order** (match the
canonical example and template; do not restate this list inside the batch file):

1. `# Batch <basename>` title line, then `type:` (`slopdog`, `projects` or `it`, the project's
   department) and `feature:` front matter. **Every batch names exactly one feature** (Todd,
   2026-10-10): `feature:` holds one kebab-case slug, the same slug a ticket carries. A feature
   collects batches across sprints, so one feature can have a batch this sprint and another next,
   and a batch never serves two. A feature is never a ticket: there are no feature tickets.
   The slug is one of the features in its own project's `## Features` section (the checker also
   accepts the rows still in `~/slopdog/notes/Slopdog/How Slopdog Works/Slopdog Features.md`);
   a batch no feature is honestly true of (a parked batch, say) writes `feature: none`
   rather than forcing the nearest slug (T-657). `check-batch-structure.mjs` warns on a missing or
   doubled `feature:`, and on a slug that is in neither list nor `none`.
2. `## Summary` — one tweet
3. `## What` — up to three bullets
4. `## Why` — up to three bullets
5. `## How` — up to three bullets. **Each bullet ends** with the requirements it owns, as
   `*(Owns FR-n.)*` (several ids allowed on one bullet). Every requirement in the batch must be
   owned by exactly one How bullet.
6. `## Requirements` — open with the two-line note that every FR hangs from How (as in the
   template). Each item:
   - Heading: `**FR-N (title) — hangs from How bullet M:**` then a capability statement in Todd's
     voice (long and explicit, not a single vague sentence).
   - One or more italicised **labelled definition blocks** (`*What X is:*` then concrete
     sub-bullets) for any term the statement leans on.
   - **Three to five** `*Verify:*` lines each able to fail (command, path, or named judgment).
7. `## Integration tests` — tier 2 for this batch only: two to four concrete, runnable checks
   derived from this batch's requirements (intro line: run once every member ticket is done).
   Under `### Project-wide tests that cross this batch`, one line per tier-3 test from the
   project page's Cross-cutting verification table that crosses this batch, each linking to
   `projects/<slug>.md#cross-cutting-verification` (name only; never restate the procedure). If
   none cross, say so in one sentence.
8. `## Discussion & Open Questions` — Obsidian callouts with nested `> [!reply Owner|…]` slots
9. `## Appendix` — subsections with two-tweet intros (what / why)
10. `## Members` — numbered ticket lines the renderer owns (ids may exist; do not scaffold new ids)
11. `## What this batch turns off` — skills or habits this batch retires

**Omit entirely:** ticket tips, traceability matrices, Dataview blocks over `tickets/`, tables
that map FR rows to not-yet-written ticket ids, changelog or numbering notes, and any "leave
`## Tickets` empty" workflow.

## Step 4 — structural self-check

Before commit, run:

```bash
node ~/slopdog/v2/scripts/lib/check-template-headings.mjs \
  ~/slopdog/v2/plugins/slopdog/writing/batch-writer/template.md \
  ~/slopdog/tasks/batches/<slug>/<basename>.md

node ~/slopdog/v2/plugins/slopdog/writing/batch-writer/scripts/check-batch-structure.mjs \
  ~/slopdog/tasks/batches/<slug>/<basename>.md
```

The worked example in `examples/` must also exit 0 when checked the same way.

## Step 5 — commit

Stage only the batch file path in `~/slopdog/tasks`. Say which guidebook sources were read.

## Don't

- Don't restate the guidebook's or template's section list inside the batch file as an unfilled outline.
- Don't write or rewrite ticket files from this skill.
- Don't run legacy project-shape render or sign-off steps here.
- Don't ship a How bullet without `*(Owns FR-n.)*` or a requirement without `— hangs from How bullet N`.

## Requirement numbers

Requirement numbers run in one sequence across a project's batches and are never renumbered and
never reused: a requirement moved to another batch keeps its number, and a squashed or retired
number stays retired. Take the next free number by reading every batch file of the project, not
by counting the requirements in the batch in hand.

Do not write a note in the document explaining the numbering, where a number went or why one was
retired. That is a changelog, and a batch document reads as the current truth. The git history
holds how it got there.
