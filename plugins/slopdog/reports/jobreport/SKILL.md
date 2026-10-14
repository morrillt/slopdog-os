---
name: jobreport
description: Publish an Artifact detailing every job in ~/slopdog/tasks that is not closed — how far through its steps it is, what it is, where it stands, and two or three bullets on what is actually holding it. Read-only; changes no ticket. Use when Todd says "/jobreport", "job report", "give me the job report", "what is everything sitting at", "show me all the open jobs", or wants one page he can read or send rather than a board of chips.
argument-hint: "[--status 🟠|🔵|🟡|🟩|🔴|🤷] [--project <slug>] [--batch <batch>]"
disable-model-invocation: true
---

# jobreport — every open job on one page

Read-only. Report on what is there; change nothing — no status flips, no ticket
edits, no re-rendering.

**Non-closed means every row in `task-list.md` whose status is not 🟢.** Archived
tickets are out by definition: they are not on the list. On 2026-09-09 that was
80 of the 97 ticket files.

`$ARGUMENTS` is optional and narrows the scope: `--status` to one chip,
`--project <slug>`, `--batch <batch>`. Filters combine.

## Step 1 — gather

Read `task-list.md` for the rows, then each ticket in scope for the rest. Take
every column from the files; infer nothing.

| Column | Where it comes from |
| --- | --- |
| **Job** | The row's `#T` tag and linked title |
| **Progress** | `- [x]` over `- [x]` + `- [ ]` in the ticket's `## Steps` — "2/4". No `## Steps` block → "—", never 0/0 |
| **Description** | The row's third cell in `task-list.md`, verbatim |
| **Status** | The row's chip, plus the legend word for it (line 3 of `task-list.md`) |
| **Notes** | Step 2 |

Also read `project:`, `batch:`, `worker:` and `estimate.points` from frontmatter
where they exist — 67 of 97 tickets carry a project, 43 a batch, 41 a worker, so
plenty will not.

## Step 2 — the notes, two or three bullets, only if there is something

**A job with nothing holding it gets no bullets.** Todd asked for notes *if any*;
inventing a bullet to fill a cell is how a report stops being worth reading.

Take the first of these that has content, and stop — do not stack all four:

1. **`blocking:` in frontmatter, or a blocking line in `## Concerns`** — whoever
   last worked it said it could not be finished. Quote the reason.
2. **Unresolved `questions.items`** — the decisions the job is waiting on. One
   bullet each, the question's own words shortened, up to three.
3. **`readiness.gaps`** — what validation found missing. Up to three.
4. **The last dated line of `## Progress notes`** — where it actually got to.

Shorten to a clause; never paste a whole gap or question. If a source has more
than three entries, take three and end the last bullet with "…and N more".

<critical>Do not editorialise. A note says what the ticket or the board says, not
what you think should happen next — that is `/task-status`'s job, and this report
is meant to be readable by someone who was not in the session.</critical>

## Step 3 — publish the Artifact

**Load the `artifact-design` skill before writing the file.** Then write the HTML
and publish with the Artifact tool.

- **Title:** `Job Report` — stable across redeploys.
- **Favicon:** 📋 on the first publish; omit it on every later one.
- **Description:** one sentence with the date and the count.
- **Lead with the shape:** total open, then a count per chip, before any table.
- **Group by project**, projects with no batch last, and everything with no
  `project:` under a final "Unassociated" heading. Inside a project, group by
  batch in `order`.
- The table must scroll inside its own `overflow-x: auto`; the page body must not
  scroll sideways.
- Theme-aware: define the light palette on bare `:root`, redefine under
  `@media (prefers-color-scheme: dark)` guarded as `:root:not([data-theme="light"])`,
  and again under `:root[data-theme="dark"]`.

Keep the chips as the emoji Todd already reads. A legend once, at the top.

## Step 4 — one line back

The URL, the count, and the one number worth knowing — how many are blocked or
waiting on him.

```
Job report · 80 open · 11 🔴 blocked, 23 🟠 waiting on you · <url>
```

## Don't

- Don't change a ticket, a chip, or `task-list.md`.
- Don't re-render batches; a stale roll-up is a finding, not something to fix here.
- Don't include 🟢 done jobs. They are the record, not the work.
