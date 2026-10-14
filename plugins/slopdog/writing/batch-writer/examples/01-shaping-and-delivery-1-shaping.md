# Batch 1-shaping — Initial shaping
type: slopdog
feature: ticket-shaping

## Summary
This batch is **initial shaping**: taking a rough idea and writing it the first time. Taking a
document that already exists round again is **refinement shaping**, which is a separate kind of
work and would be its own batch if it ever carries tickets of its own; today it is done
one-off, with `/slopdog:batch-refine`. Shaping is one system of three skills that dovetail — a project writer, a batch writer and a ticket writer — each with its own template and its own worked examples, and each handing its output to the next: the project writer sets the project and names its batches, the batch writer writes each batch at project level, and the ticket writer turns a batch's requirements into tickets. A traceability check closes the chain, so every ticket names the batch and the requirement it serves and nothing is left orphaned. The most recent shaping work — the ticket shaper and the batch and project writers beside it — is the foundation, and every older shaping path is folded into that lineage rather than the other way round.

## What

- Three writing skills that form one system: a project writer, a batch writer and a ticket
  writer. Each carries its own template and its own worked examples, and each is built so that
  the skill, the template and the examples enforce one another.
- One hand-off chain rather than three separate acts of writing. The project writer hands the
  project and the names of its batches to the batch writer; the batch writer hands each batch's
  requirements to the ticket writer; the ticket writer hands board-ready tickets back, each one
  carrying its project, its batch and the requirement it serves.
- A traceability check over the whole chain, and the retirement of the two legacy shaping skills
  so that only one shaping path exists.

## Why

- Competing templates and guidebooks still produce tickets that fail validation or that belong
  to no project and no batch, so nobody can say what a ticket is for.
- The batches in the fifth draft of this plan were written at the wrong level, which is the
  concrete cost of having no batch writer: Todd's words, "the batches generally need to have
  the batches applied at the project level."
- Two ticket writers existing at once is how the failures happen, so the legacy paths have to
  be folded rather than left standing beside the new one.

## How

- The direction of folding is fixed and runs one way. The most recent shaping work is the
  foundation: the ticket shaper at the writing desk, and the batch writer and project writer
  beside it. Every older shaping path is folded into that lineage, and nothing in the finished
  system is rebuilt from the older `project-shaper` structure. The skill names themselves do
  not matter; the lineage does. *(Owns FR-4.)*
- Each skill is built as a trifecta — the skill, its template and its worked examples — and all
  three read the project-formation guidebook rather than restating it, so no one of them can
  drift from it or from the other two. *(Owns FR-1.)*
- The three skills are wired as one chain: the output of each is the declared input of the
  next, and the ticket writer is the single writer, with the validators and the ticket-add path
  re-pointed at it. The ticket template, the checks and the readiness stamp live in
  `7-ticket-template-and-checks`; the idea and feature end lives in `8-ideas-and-features`.
  *(Owns FR-2.)*
- Each step of the chain stamps the ticket as it runs, so the record of what happened is
  written by the work itself rather than reconstructed afterwards. *(Owns FR-27.)*

## Requirements

Every requirement hangs from one bullet of How, named in its heading. A requirement that hangs
from nothing means How is missing a bullet, not that the requirement is homeless.

- [ ] **FR-1 (One trifecta per skill, across all three) — hangs from How bullet 2:** I can
  draft or refresh a project, each of its batches and each of its tickets using one skill, one
  template and one set of worked examples per artefact, and the three parts of each trifecta
  check one another rather than merely sitting in the same folder.

  *What a trifecta is, so that "skill, template and example" is not three files in a folder:*
  - The skill is the procedure: the numbered steps, what to run, what to refuse.
  - The template is the empty shape the skill fills, and it is the only place the section list
    lives, so the skill never restates it and the two cannot disagree.
  - The worked examples are real artefacts that pass the checks the skill enforces, so an
    example that would fail the check is a bug in one of the three, not an acceptable sample.

  - *Verify:* A dry run of each of the three skills on a fixture transcript produces a draft
    that passes the structural checklist, with no second front-matter block and no section
    missing.
  - *Verify:* Each of the three skills has a template and at least one worked example on disk,
    and a check names any skill of the three missing either one.
  - *Verify:* Each skill's own worked example passes that skill's structure check, run as part
    of the check rather than asserted.
  - *Verify:* The section list for each artefact appears in its template and nowhere else: a
    search across the three skills finds no skill restating the list of sections, so the skill
    and its template cannot disagree.

- [ ] **FR-2 (Ticket writing from a batch's settled requirements) — hangs from How bullet 3:**
  I can hand the ticket writer a batch whose requirements are settled and get back tickets a
  builder can start on immediately, without coming back to me with a question and without the
  board showing them wrongly. The writer reads the batch, not the project, because the
  requirement it is delivering lives in the batch.

  *What a board-ready ticket is, in full, because "board-ready" on its own means nothing:*
  - Its front matter carries every field the board reads — title, status, project, batch and
    estimate — and the board renders the ticket without a missing-field warning.
  - It has a row in `tasks/task-list.md`, so it is reachable from the list and not only by
    knowing its filename.
  - It carries exactly one origin hashtag, and a derived ticket also carries `extends: T-nnn`
    naming a real ticket whose own chain ends at something Todd asked for.
  - Each acceptance criterion says how it will be checked — the typed check, not the intention
    — so the verifier never has to invent a method.
  - Its steps are under the count ceiling and every path, file and command it names exists.
  - `check-ticket.mjs` exits zero on it, and the drafter has already shown that checker able to
    fail in the same pass, so a clean result means something.

  *What mapping a requirement to steps means, both ways:*
  - Downward: every requirement in the batch has at least one ticket, and inside that ticket at
    least one step, that delivers it. Nothing Todd asked for is left unbuilt.
  - Upward: every step in every ticket traces to a requirement of that batch. Nothing is built
    that no requirement asked for, so scope cannot grow quietly between the batch and the board.

  - *Verify:* The ticket writer emits tickets whose project and batch fields match the batch
    file they came from, and `check-ticket.mjs` exits zero on the canonical example ticket.
  - *Verify:* Every ticket the writer emits names the requirement it serves, and a ticket that
    names none is refused rather than written.
  - *Verify:* Run over a finished batch, a check reports any requirement with no ticket and any
    ticket step tracing to no requirement, and exits non-zero when it finds either.
  - *Verify:* A ticket the writer emits appears as a row in `tasks/task-list.md` and renders on
    the board with no missing-field warning, checked by opening the board rather than by
    reading the front matter.

- [ ] **FR-4 (One author-reachable shaping path, and the ancestor retired) — hangs from How
  bullet 1:** I can shape work without reaching for a skill that produces the thin-batch shape,
  because the two author-reachable legacy paths are archived and the ancestor the new trifecta
  grew from is retired once its children carry everything it did.

  *What the thin-batch shape is, named rather than alluded to:*
  - The project file carries everything — the tip, the pillars, the requirements, the batch
    list and the ticket list — so all the depth sits in one document.
  - Each batch file carries only a summary, why, what, how and a member list. It has no
    requirements of its own, no questions and no appendix, so it cannot be read or agreed on
    its own and a reader is always sent back up to the project.
  - Nineteen of the twenty-two project files on disk are still in that shape, so this is the
    live state of the house and not a historical note.

  - *Verify:* `project-shape` and `project-refactor` under the task folder's skills directory
    are archived or redirected, the ticket-add path calls the single ticket writer or is
    retired, and the documentation points an author at one path.
  - *Verify:* No author-reachable skill still produces the thin-batch shape: a check runs each
    remaining shaping skill on a fixture and names any whose batch output carries no
    requirements section of its own.
  - *Verify:* `project-shaper` is retired only after the project writer, the batch writer and
    the ticket shaper between them cover everything it did, and the ticket retiring it names
    which of the three took over each part.

- [ ] **FR-27 (The chain stamps itself, and the stamps are what proves it) — hangs from How
  bullet 4:** I can open any ticket and see the idea it came from and a stamp from each step
  between that idea and the ticket, and I can ask one command to read those stamps across a
  whole project and tell me what is broken. The stamps are the record; the command is the
  reader. There is no second mechanism that re-derives the chain from the files.

  *What a stamp carries, so that a stamp is evidence and not decoration:*
  - The step's name, its date, and a one-line note saying what that step did.
  - It is written by the step itself as it runs. A step never writes another step's stamp, and
    nothing writes a stamp on behalf of a step that did not run.
  - The chain of stamps leads back to a real captured idea, so provenance is readable from the
    ticket alone without opening another file.

  - *Verify:* A ticket written through the whole chain carries, in its front matter, the idea it
    came from, its project, its batch and the requirement it serves, and one stamp per step.
  - *Verify:* Each skill in the chain writes its own stamp as it runs and never another
    skill's, so a stamp that is present is evidence that step ran.
  - *Verify:* One command run over a project reads the stamps and reports every break it finds:
    a ticket missing a stamp for a step that should have run, a ticket whose batch or
    requirement does not resolve, a batch belonging to no project, a requirement no ticket
    delivers, and a stamped chain that does not lead back to a real idea.
  - *Verify:* The command exits non-zero on any break, and a deliberately broken fixture — one
    ticket pointed at a requirement that does not exist, and one with a step's stamp removed —
    is named in its output.
  - *Verify:* One fixture transcript run through the whole chain — project writer, then batch
    writer, then ticket writer — produces a project, its batches and its tickets with no
    hand-patching between the three steps, and the finished ticket's stamps show all three
    steps ran.

## Integration tests

Run once every member ticket in this batch is done (tier 2).

- **Three-skill structure on worked examples** — run
  `node ~/slopdog/v2/plugins/slopdog/writing/batch-writer/scripts/check-batch-structure.mjs
  ~/slopdog/tasks/batches/shaping-and-delivery/1-shaping.md` and the project-writer and
  ticket-writer structural checks named in FR-1 on their canonical examples → each exits 0.
- **Traceability reader catches a broken chain** — run the FR-27 stamp-reading command on a
  fixture project tree with one ticket missing a step stamp and one pointed at a missing
  requirement → exits non-zero and names both breaks in stdout.
- **One author-reachable shaping path** — `test ! -e ~/slopdog/tasks/.claude/skills/project-shape/SKILL.md && test ! -e ~/slopdog/tasks/.claude/skills/project-refactor/SKILL.md` (or each path is a redirect stub) and `rg -l 'ticket-writer|task-add' ~/slopdog/tasks/.claude/skills/task-add/SKILL.md` → task-add names the single ticket writer (FR-4).
- **Hand-off chain without hand-patching** — one fixture transcript run through project writer,
  batch writer and ticket writer in order with no edits between steps, then the FR-27 reader on
  the output → exits 0 (FR-27 final verify bullet).

## Cross-cutting tests

Tier 3 procedures live in
[the shaping and delivery project](../../projects/shaping-and-delivery.md#cross-cutting-verification).

- **Idea to stamped ticket** — crosses this batch with batches 8 and 7 (owner: batch 7).
- **Stamped ticket through the dispatch gate** — crosses this batch with batches 7 and 2 (owner: batch 7).

## Discussion & Open Questions

> [!comment Agent|q1]
> **Where a project's open questions live:** should an architectural question stay in the
> project and batch documents as a callout, move to the board's Questions tab, or be synced
> both ways with one of them as the source of truth?
> - *Context:* the writing desk's structure prefers front matter plus callouts in the document;
>   the house board prefers the question on a ticket, where Todd can answer it with a button.
>
> > [!reply Owner|q1-r1]
> > ✍️ **Hey Todd, enter your answer here:**

> [!comment Agent|q2]
> **Batch documents as files, or sections of the project page:** should each batch keep its own
> file, as it does today, or become a section inside the project page?
> - *Context:* a separate file is what lets a batch be read and agreed on its own, which is the
>   whole point of writing it at the project level. The counter-argument is one page to read.
>   This batch has been written on the assumption of separate files, and reversing it is a
>   mechanical move.
>
> > [!reply Owner|q2-r1]
> > ✍️ **Hey Todd, enter your answer here:**

## Appendix

### Todd's own words on shaping

**What you are looking at.** Todd's own transcripts about the shaping system, quoted and dated,
so that the directive this batch is written to can be read in his words rather than in a
paraphrase of them.

**Why it is here.** The summary and the requirements above are an interpretation of these
quotes. When the two disagree, these quotes are the source and the rest of the document is
what needs correcting.

**2026-10-06, reading this batch file:** "In the summary, I want to be clear that it's not
really one skill, but one set of skills. I think the project and the batches dovetail into each
other, and these should be considered one system of skills. Each of those should have a
template and examples, so I want to make sure that is clear in the summary. Each one passes it
to the next: the project hands off to the batches, the batches hand back to the tickets, and
I'm guessing there's a verification to make sure everything is traceable and connected, etc."

**2026-10-06, on which lineage everything folds into:** "the two shaping skills that live in
Ticket Writer were very much the most recently done and I want to fold everything into those as
those are kind of like the strongest most recent foundation and we're folding the other things
into those skills, not the other way around... I don't care about the name of the skill but
conceptually I want to make sure that that's clear."

**2026-10-03, on the level a batch is written at:** "the batches generally need to have the
batches applied at the project level."

**2026-10-03, on building the batch writer as a copy:** "maybe we take the writing project
skill and we make a slightly different copy of it. Just modify the skill and the template to
leave out the scaffolding of the tickets because that's the weakest part." And on living with
the current state in the meantime: "for now, it's better than what we've got."

**2026-10-03, on ticket scaffolding in a batch document:** "I don't want it to confuse the
other work that you've done."

### The shape a batch document follows

**What you are looking at.** The section list every batch document in this project uses, taken
from the writing desk's project structure with the ticket scaffolding removed.

**Why it is here.** It is the thing this batch turns into a skill, so it is worth being able to
read it in one place before the skill exists.

A batch document carries, in this order: a one-tweet summary; What, Why and How, at most three
bullets each; its requirements, each with one to three verify bullets; its own open questions,
each with a ready-to-fill reply slot; this appendix; its members, which the renderer owns; and
what the batch turns off. It carries no generated ticket list, no traceability matrix pointing
at tickets and no reserved ticket ids.

### Which lineage the system is built from

**What you are looking at.** Which existing work is the parent of the finished system, and
which is folded into it.

**Why it is here.** It is the difference between a day of work and a week of it, and getting
it backwards is how two ticket writers come to exist at once.

The parent is the most recent shaping work: the ticket shaper at the writing desk, and the
batch writer and project writer beside it. Those are the strongest and most recently proven
shape, so the finished system grows from them and the older `project-shaper` structure is
folded in. Todd, 2026-10-06: the recent skills "were very much the most recently done and I
want to fold everything into those as those are kind of like the strongest most recent
foundation and we're folding the other things into those skills, not the other way around."
He also said the naming is not the point: "I don't care about the name of the skill but
conceptually I want to make sure that that's clear."

The earlier plan had it the other way round — the batch writer as a modified copy of the older
project skill, with the ticket scaffolding dropped. That is superseded by the direction above.
The quotes behind both are in "Todd's own words" above.

## Members
1. T-493 · The layers principle goes into principles.md, quoting Todd
2. T-581 · Slopdog-itself tickets are reorganised into one project with six batches: shaping, the delegation ladder, seeing the work, customizing herdr, teams and the weekly budget, and the sprint holder
3. T-595 · The ticket-writing skill moves to the writing desk as a skill, a template and an example that enforce each other
4. T-612 · A project writer skill and a batch writer skill, so a batch is written at project level
5. T-623 · The ticket writer produces fewer, larger tickets with a stated size floor and a folding rule
6. T-627 · Standardize writing skills around the trifecta pattern and deploy a standing writing sub-agent
7. T-628 · Decide whether the rebuilt delegation-ladder batch is the shape, and whether the other five batches get the same treatment
8. T-629 · Make the shaping system's own worked example pass its structure check, and fold small requirements instead of rounding them up
9. T-637 · A bug skill at the writing desk, as a trifecta, that finds the feature it belongs to and files itself on that ticket
10. T-654 · Report unknown ticket citations across plans, batches and checkers instead of silently skipping

## What this batch turns off

The `project-shape` and `project-refactor` skills, which the project writer and batch writer
replace. Neither is left standing beside the new path.
