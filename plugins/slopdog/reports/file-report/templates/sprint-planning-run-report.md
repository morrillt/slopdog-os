# Sprint planning run record template

Use this outline when `/slopdog:sprint-planning-report --run-record` writes the record of
one sprint planning run, which is the last step of `/slopdog:sprint-planning`. It is the
second shape beside the batch-review template `sprint-planning-report.md`; the two serve
different ceremonies and neither replaces the other. The house rules for report prose live
in `~/slopdog/v2/rules/output-style.md` and `/slopdog:file-report`; read those, do not
restate them here. Write every section in full sentences. Use only `##` headings inside the
body, because the report front matter checker rejects deeper ones.

The worked example to read before writing is
`~/slopdog/v2/reports/2026-10-03-sprint-planning-run-1.md`.

---

# Sprint planning run <N> — <Department> — <YYYY-MM-DD>

Notion reading copy: <URL, or "none yet" when the Notion push has not run>

## Executive summary and subject chosen

Two or three short paragraphs: how the run went, which department it served, and the one
subject it worked on with the reason that subject was chosen over the alternative.

## Per-step execution record

One paragraph for every step the run reached, in order, opening with the step number and
name. Each paragraph states what the step was given as input, what it produced as output,
the alignment answer it recorded, and the alternative it rejected. A step the run did not
reach is named, with the reason it stopped.

## What this run produced

A bulleted list of the files, tickets and mirrors the run created or changed, each with its
path.

## Assumptions taken, default-forward

A numbered list. Each item names a question that arose, the call made in its absence, and
where the assumption is flagged.

## Questions for the next iteration

A numbered list of open questions, each worded so it can be answered in a sentence.

## Project and batch dependencies

Links, not summaries: the project file `~/slopdog/tasks/projects/<slug>.md`, each batch
file under `~/slopdog/tasks/batches/<slug>/`, and the Notion URL of the project and of
each batch sub-project.
