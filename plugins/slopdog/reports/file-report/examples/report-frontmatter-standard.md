# Report front matter standard

Every filed report — markdown stub or full markdown body — carries one YAML front-matter
block between `---` lines at the top of the file. The gold rules for the report *body*
stay in `README.md` beside this file; this document is only the front-matter contract and
how the body must structure headings for retrieval (T-530).

`/slopdog:file-report` fills every field below on new reports and runs
`scripts/validate-report-frontmatter.mjs` on the written file before the reports index
line is appended.

## Field reference

| Field | Allowed values | Meaning and rules |
| --- | --- | --- |
| `title` | Non-empty string, quoted if it contains `:` | Human title; same string as the report's H1 when the body is markdown. |
| `date` | `YYYY-MM-DD` | Calendar date the report was filed (ISO, no time zone). |
| `kind` | `how`, `research`, `project` | Routing kind: harness/how-to (`how`), an experiment under `~/slopdog/research/` (`research`), or a product/repo report (`project`). Matches `file-report`'s `--kind` when overridden. |
| `project` | Slug, or `""` when unknown | The `tasks/projects/<slug>.md` the report belongs to. A slug that has no such file is not a project: write `""`. Never the catch-all `slopdog`. New filings always resolve one (`file-report --project`, else the destination repo). |
| `summary` | One line of plain text | Single sentence: what the report is for, suitable for a list row. No line breaks. |
| `abstract` | 2–3 sentences of plain text | The chunk a future RAG pass would embed: verdict plus scope, written so someone who never opens the body still knows whether to read it. |
| `entities` | YAML list of strings | Key people, systems, and ticket ids the report is about (e.g. `T-530`, `Larry`, `Gmail pipeline`). Use `[]` when nothing specific applies. |
| `related` | YAML list of strings | Paths (absolute or repo-relative) to other reports this one builds on or overlaps. Use `[]` when none. Kept because `validate-report-frontmatter.mjs` requires the key. |
| `tags` | YAML list of strings | Always `report` first (the validator requires it), then 0 to 3 topic tags from the closed list: `sprint` (a sprint's delivery, planning or status), `pipeline` (the ideas, ticket, dispatch, build and file mechanics), `audit` (an inspection of the framework, desks or memory against a checklist). A report that fits none stays `[report]`. A fourth tag is a new decision, not a backfill. |
| `desk` | Lane key, or `""` | The desk that wrote the report: the index `author`, else the desk folder in its path, else the lane prefix of its filing commit. `""` when none of those names one. New filings take it from the acting lane. |
| `ticket` | `T-nnn`, or `""` | The ticket the report is about. New filings take it from `file-report --ticket`. Backfilled reports take it from the filing commit subject only, and only when that names exactly one ticket. A ticket mentioned in the body is not this field. |
| `skills` | YAML list of strings, optional | The skills that produced the body. Written only when the writing skill passes `file-report --skills`; omitted otherwise. Not backfilled: no older report records it. |
| `audience` | `self`, `team`, `partner`, `public` | Who the report is written for: Todd only (`self`), the house crew (`team`), a business partner (`partner`), or safe to show outside the house (`public`). |
| `quality` | Integer `1`–`5` | House judgment of how complete and usable the report is (see rubric below). |
| `sensitivity` | `safe`, `personal`, `deal-confidential`, `secret-adjacent` | Whether the content exposes private life (`personal`), deal material (`deal-confidential`), or material that must never leave Todd's machines (`secret-adjacent`). |
| `shareable` | `yes`, `no` | Whether the report may enter a shared or public library index. **Derived** from `audience` and `sensitivity` (see below); the validator rejects a mismatch. |
| `source_path` | Non-empty path string | Canonical path of this markdown file on disk (the filed stub or full report). |
| `rag_ready` | `yes`, `no` | `yes` only when `abstract` is present, the body follows the clean-H2 rule below, and `quality` is at least `3`. Otherwise `no`. |

Legacy reports may still carry `source:` instead of `source_path:`; new filings use `source_path` only.

### `shareable` derivation

Set `shareable` from `audience` and `sensitivity` in this order:

1. If `sensitivity` is `secret-adjacent`, `shareable` must be `no` (never `yes`, for any audience).
2. Else if `sensitivity` is `deal-confidential` or `personal`, `shareable` must be `no`.
3. Else (`sensitivity` is `safe`): `shareable` is `yes` only when `audience` is `team` or `public`; for `self` or `partner`, `shareable` must be `no`.

The validator prints `shareable` when the value does not match this rule.

### Quality rubric (`quality` 1–5)

| Score | When to use it |
| --- | --- |
| 1 | Stub or placeholder: title and intent only, not safe to rely on. |
| 2 | Partial: major gaps, missing verification, or body not shaped for readers. |
| 3 | Usable: complete enough for the intended audience; meets filing bar for `rag_ready: yes` when the body also complies. |
| 4 | Strong: clear verdict, evidence named, ready-to-review rows or equivalent where applicable. |
| 5 | Reference: gold-standard clarity (see `batch-report-gold.html` and `README.md` for body shape). |

### Report body: clean `##` headings (RAG chunking)

Below the closing `---` of the front matter, the body is ordinary markdown (or a one-line
pointer to HTML when the Artifact holds the full report). For markdown bodies:

- Section titles use **`##` only** — one level of section heading for the whole file.
- Do **not** use `###` or deeper heading levels.
- Do **not** use bold lines, ALL CAPS lines, or horizontal rules as stand-ins for section titles.
- The H1 (`#`) is the report title once, then sections are `##` only.

HTML-only reports without a markdown body are exempt from the heading rule; the filed
markdown stub is exempt when the body is only a short pointer to the `.html` and Artifact.
