# Sprint planning report template

Use this outline when `/slopdog:sprint-planning-report` writes a **sprint planning**
meeting report for one project. Fill every section in full sentences. The house rules
for report prose live in `~/slopdog/v2/rules/output-style.md` (report rows), in
`/slopdog:file-report` (Artifact delivery, the **three-section report shape**, and
project-report lessons), and in
`plugins/slopdog/reports/file-report/examples/README.md` — read those; do not restate
them here.

Sprint planning reports use the same **three-section HTML shape** as every other house
report (`/slopdog:file-report`, "Report shape: three sections"). The sprint-specific
content below maps into that shape; it is not a separate page layout. Before filing,
run `node ~/slopdog/v2/plugins/slopdog/reports/file-report/scripts/check-three-section.mjs`
on the saved HTML.

Copy the **link-out pattern** from the worked example (project row in Notion, each batch
as a sub-project in Notion, and the on-disk project and batch files). The HTML at
`~/slopdog/v2/reports/Sprint planning: Slopdog shaping and delivery.html` predates the
three-section rule and does not pass `check-three-section.mjs`; new sprint plans follow
this template instead.

---

## HTML page (designed HTML before filing)

**Header:** eyebrow `Sprint planning · <desk> · <date>`, title `Sprint planning: <project title>`,
status strip (Status, Priority, Owner, Batches, Key things, Tickets written, Questions for
Todd, Sprint readiness).

**Intro (three tweets):** three `<p>` paragraphs under 280 characters each — what was
planned, whether the sprint can run, what Todd should do first.

**Summary table:** one row per main section (§1–§3), each row linking `#s1`–`#s3` and
stating that section's main point in one sentence.

**Table of contents:** links to §1–§3 and each subsection anchor (`#s11` … `#s33`).

### §1 — Project and where to read

| Subsection | Former sprint-only heading | Content |
| --- | --- | --- |
| §1.1 | The verdict first | Three short paragraphs: what blocks Todd (if anything); what changed since the last plan; what is thin or deliberately unticketed. |
| §1.2 | Where to read everything | Notion (project + batch sub-projects), markdown paths, batch link table, when ticket names lack Notion links. |
| §1.3 | The project in three paragraphs | Why / What / How columns, then key things vs batches. |

### §2 — Batches and questions

| Subsection | Former sprint-only heading | Content |
| --- | --- | --- |
| §2.1 | The batches | Each batch at project scale (in one line, why, what closes it, tickets that deliver it, open questions, Notion link). Include the settled “how a batch becomes tickets” paragraph when it applies. |
| §2.2 | Questions Todd answered (or open) | One block per question: label, heading, text, context, answer or “not answered yet”. |
| §2.3 | *(optional)* | Merge or leave empty; use only if a third slice of §2 is needed. At most three subsections total. |

### §3 — What changes and what Todd does next

| Subsection | Former sprint-only heading | Content |
| --- | --- | --- |
| §3.1 | What is being turned off | Retirement table or prose — systems this sprint replaces. |
| §3.2 | What this plan leaves out on purpose | Deliberate gaps (low-priority batch work, upstream contributions, etc.). |
| §3.3 | What Todd does next | Numbered actions — order of batches, Notion “ready”, anything else that starts work. |

**Appendix (not a fourth section):** sources, methodology, or implementation notes only
if needed; anchor `id="appendix"`.

---

## Markdown stub (after HTML is saved)

The stub filed beside the HTML is short: title, pointer to `<Title>.html`, Artifact URL,
and optionally a prose mirror of the lede and link section so the index line and stub
stay readable without opening the Artifact.

---

## Filing

When the HTML passes `check-three-section.mjs` and the stub is ready, run
`/slopdog:file-report` from `~/slopdog/v2` with `--project <slug>` and `--artifact-url`
after publishing the Artifact.
