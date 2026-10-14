---
name: sprint-planning-report
description: Write a sprint planning meeting report for one project from the house template, copy the link-out shape from the meta batches worked example, design the HTML page, then file it through /slopdog:file-report. Use when Todd says "sprint planning report", "/slopdog:sprint-planning-report", "write the sprint plan", "planning meeting report", or when a sprint planning ceremony needs the same artifact shape as Slopdog shaping and delivery (tip first, full sentences, links to the project, Notion and batch sub-projects). With `--run-record` it writes the record of one sprint planning run instead, as the last step of /slopdog:sprint-planning. For filing only, use /slopdog:file-report.
argument-hint: "<project-slug> [notes or path to source material] | --run-record <department> [intake or run notes]"
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# sprint-planning-report — sprint planning as the first meeting shape

Reports get the same standing flow as desk work: **one skill, one template, one worked
example.** This skill writes; `/slopdog:file-report` publishes and indexes.

**Template (read every run, write from it):**
`~/slopdog/v2/plugins/slopdog/reports/file-report/templates/sprint-planning-report.md`

**Worked example (read for link-out and artifact shape; do not overwrite):**
`~/slopdog/v2/reports/2026-10-03-slopdog-shaping-and-delivery-the-three-meta-batches-for-review.md`
and its designed page
`~/slopdog/v2/reports/Slopdog shaping and delivery: the three meta batches for review.html`.
For a **sprint planning** ceremony, also read
`~/slopdog/v2/reports/Sprint planning: Slopdog shaping and delivery.html` — that is the
current sprint planning layout.

House report rules are **not** copied here. Read them at run time:

- `~/slopdog/v2/rules/output-style.md` — full sentences in reports; ticket naming
- `/slopdog:file-report` — Artifact default, front matter, project-report lessons when
  the report is project state
- `plugins/slopdog/reports/file-report/examples/README.md` — body shape for batch/project
  reports
- Load `artifact-design` before designing the HTML page (same nesting as file-report)

## Step 1 — read template, example and inputs

Read the template path above, then the worked example stub and HTML. `$ARGUMENTS`: project
slug, then optional notes or a path. Read `~/slopdog/tasks/projects/<slug>.md`, every batch
file under `~/slopdog/tasks/batches/<slug>/`, and any intake the operator named.

## Step 2 — write the designed HTML

Title pattern: `Sprint planning: <project title>`. Follow the template's **three-section**
mapping (intro, summary table, table of contents, then §1–§3 with at most three
subsections each). Open §1.1 with the **verdict first** (tip first). Link out to:

- The project in Notion and `~/slopdog/tasks/projects/<slug>.md`
- Each batch as a **sub-project in Notion** and its file under `batches/<slug>/`
- Related processed draft on the writing desk when one exists

Save as `~/slopdog/v2/reports/Sprint planning: <project title>.html` (or the owning
repo's reports folder if the project lives outside `v2` — same routing as file-report).

Run `node ~/slopdog/v2/plugins/slopdog/reports/file-report/scripts/check-three-section.mjs`
on the HTML before publishing the Artifact.

Publish the Artifact before filing. Keep Todd's liked patterns from the worked example:
the report is an artifact that links out to projects, Notion and sub-projects.

## Step 3 — write the markdown stub

Short stub only (file-report writes front matter). Body may mirror the lede and the
“where to read everything” links so AC-style greps on the stub stay meaningful.

## Step 4 — file through file-report

```bash
cd ~/slopdog/v2
node ~/.claude/skills/slopdog/reports/file-report/scripts/file-report.mjs \
  --kind how --project <slug> --artifact-url '<published-url>' \
  "Sprint planning: <project title>" <stub-path>
```

Commit the HTML, stub, and index line by path in their repos. DM Todd on Slack when the
session has Slack access (file-report delivery rule).

## Step 5 — reply

Name the Artifact URL, the HTML path, the index line, and which guidebook sources you
read. Say if any batch has no Notion row yet (name tickets without Notion links until
T-619 lands).

## Run-record mode (`--run-record`)

`/slopdog:sprint-planning` ends by calling this skill with `--run-record <department>`.
It writes the record of the run that just happened, not a plan for a project, so Steps 1
to 3 above are replaced by these:

- **Template (read every run, write from it):**
  `~/slopdog/v2/plugins/slopdog/reports/file-report/templates/sprint-planning-run-report.md`
- **Worked example (read for shape; do not overwrite):**
  `~/slopdog/v2/reports/2026-10-03-sprint-planning-run-1.md`
- **Input:** the run's own notes, or the intake file the run was recorded in. The run
  number is the count of earlier run records for that department, plus one.
- **Output:** a markdown record with the title `Sprint planning run <N> — <Department> —
  <YYYY-MM-DD>`, the `Notion reading copy:` line and the six sections the template names,
  then the same Step 4 filing as above. Check the record first with
  `node ~/.claude/skills/slopdog/reports/sprint-planning-report/scripts/check-run-record.mjs <file>`,
  which refuses a record that lacks a required heading.

The batch-review template and example above stay as they are; the two shapes serve
different ceremonies.

## Don't

- Don't restate the full file-report or copywriting skills in the report body.
- Don't replace the meta batches worked example file; new sprint plans get their own title.
- Don't file into the Obsidian vault.

## See also

- [`/slopdog:file-report`](../file-report/SKILL.md) — publish and index
- [`/slopdog:project-writer`](../../writing/project-writer/SKILL.md) — project file shape
- [`/slopdog:batch-writer`](../../writing/batch-writer/SKILL.md) — batch file shape
