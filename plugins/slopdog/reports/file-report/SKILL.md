---
name: file-report
description: File a finished report the house way — publish it as a designed Artifact by default (sent to anyone outside Todd's account as a file, since Artifacts publish private), save its HTML source into the Research desk's reports folder (~/slopdog/v2/desks/research/reports/), where every report lives, and append one line to the runner's reports index (~/slopdog/tasks/reports/index.jsonl), including the Artifact URL, so it shows on the Reports tab where Todd reads it and leaves feedback. Nothing is filed into the Obsidian vault. Use whenever Todd says "make a report", "write a report", "file this report", "save that as a report", or whenever you finish a research/audit/status deliverable.
allowed-tools:
  - Read
  - Bash
---

# file-report — one file in the Research desk's reports folder, one line in the runner's index

## Delivery rule (Todd, 2026-09-26)

"Reports and docs can be filed wherever but will use the task runner for viewing and
feedback primarily... I think the default should just be that it's an artifact — they
just look so good relative to a markdown file. The artifacts need to be saved to the
reports directory."

1. **Every report is an Artifact by default.** Write it as a designed HTML page (load
   `artifact-design` first — proper page, themed, not a markdown dump styled up) and
   publish it before running the script.
2. **Every published report is link-accessible by default** (Todd, 2026-10-05: "I think
   the solution here is to make all of our artifacts accessible to anyone with a link.
   I think that's okay for now"). That is the intent; the tool cannot do it yet (rule 3),
   so until it can, a report for someone outside the account goes to them as a file.
   Once a page is opened up, say what that means plainly: **the link is the access control, so a link that leaks
   is access that leaked.** One carve-out — a report carrying something Todd has marked
   sensitive, or a partner's confidential figures (`sensitivity: deal-confidential`,
   `personal` or `secret-adjacent`) is **not** published link-accessible; ask Todd how he
   wants that one handed over before sharing it, and file it markdown-only per rule 6
   if he says not to publish it at all.
3. **A report page goes to a partner as a file, not a link** (T-671, decided 2026-10-11 under
   Todd's delegation). The `Artifact` tool publishes private and has no sharing or
   visibility parameter, so nothing can confirm a page opens for someone outside Todd's
   account. When a report is for a partner or anyone else outside the account, send the
   `<Title>.html` file itself: a partner-repo report is already copied into
   `~/partner/shared/reports/` (below), so name that path; anything else goes
   into `~/partner/shared/` and the message names the path. Google Docs and Drive links
   are checked mechanically instead: the Slack `reply` tool and `v2/scripts/email-reply.ts`
   both run `v2/scripts/lib/link-open-check.mjs`, which fetches each Google link logged
   out and refuses to send one that asks for sign-in or access. Check a link by hand
   with `node ~/slopdog/v2/scripts/lib/link-open-check.mjs <url>`.
4. **Save the Artifact's HTML source into `~/slopdog/v2/desks/research/reports/`**, as
   `<Title>.html`, *before* running the script — the same folder the markdown goes to
   (`notes/INDEX.md`; "What it does" below). This is the
   durable, git-tracked record; the hosted page can move or be deleted, the file can't.
5. **Run the script with `--artifact-url <url>`.** It writes a short markdown stub at
   the usual `CANONICAL_PATH` (title, date, a one-line pointer to the `.html` file and
   the Artifact URL — not the full content, which lives in the HTML) and appends the
   index line with both `html` (the local file) and `artifact` (the hosted URL) filled
   in. The runner's Reports tab reads that index; that tab is what Todd reads, so the
   reply to him names the report and links the Artifact URL directly.
6. **Skip the Artifact only when there's a concrete reason not to publish one** — the
   content is sensitive (rule 2's carve-out), or the report is a one-line internal note
   not worth the design pass. Then it's markdown only, same as before, and
   `--artifact-url` is omitted (the index line's `artifact` field is `""`).
7. **Nothing goes into the Obsidian vault.** The script writes no file and no symlink
   under `~/slopdog/notes/`. The convention is `~/slopdog/notes/INDEX.md`'s opening
   paragraph; this skill applies it.

## Report shape: three sections, read one at a time (hard rule)

Todd, 2026-10-06: "three main sections, and each main section can have three
subsections, and it should have a table of contents, and an intro which is three
tweets, and then a graphic or a table as an intro summarizing the main point of each
of the sections... so I can read one section at a time."

**This skill owns the shape of every house report.** The research desk's template
(`~/slopdog/v2/desks/research/CLAUDE.md`, "The template"), `/slopdog:receive-report`
and the project report lessons below all fit inside it; none of them restates it.
Every report, in this order:

1. **Title.**
2. **Intro: exactly three tweets.** Three paragraphs, each under 280 characters,
   full sentences. Together they say what was asked, what was found, and what to do.
3. **Summary graphic or table.** One row or panel per main section, giving that
   section's main point in a sentence. A table or a small inline SVG both work.
4. **Table of contents.** Links to the three sections and each of their subsections.
5. **Exactly three main sections**, numbered §1 to §3, each with **at most three
   subsections** (§1.1 to §1.3). Content that does not fit is merged or cut, or goes
   to a short Appendix (Sources, Methodology, Implementation notes) after §3. The
   Appendix is not a fourth section.

Check before publishing:

```bash
node ~/slopdog/v2/plugins/slopdog/reports/file-report/scripts/check-three-section.mjs \
  "<path-to-designed.html>"
```

The script enforces the structural checklist below (intro length, three summary links,
table of contents, `id="s1"`–`id="s3"` with at most three subsections each, no `id="s4"`
main section). You still confirm by hand that every fact and citation from the draft
survives somewhere on the page.

- [ ] Three intro paragraphs, each counted under 280 characters.
- [ ] The summary graphic or table has exactly three rows or panels, one per section.
- [ ] The table of contents links resolve to the section and subsection anchors.
- [ ] Three `§` sections, none with a fourth subsection; nothing but the Appendix after §3.
- [ ] Every fact and citation from the draft survives somewhere in the page.

**Writing a sprint planning report** — use **`/slopdog:sprint-planning-report`** first.
It reads the template at
`~/slopdog/v2/plugins/slopdog/reports/file-report/templates/sprint-planning-report.md`,
the worked example at
`~/slopdog/v2/reports/2026-10-03-slopdog-shaping-and-delivery-the-three-meta-batches-for-review.md`,
designs the HTML, then hands off here to publish and index. This skill does not
replace that writer; it files what is already written.

This skill files the report and, when the report is a project's state, it also
owns the shape below. Todd's condensed status format is still **`broz-report`**.
A project report — one batch, a cluster of related user stories around one
theme — is written to the six lessons here before it is filed. The lessons are
the procedure. They are the same rules as
`plugins/slopdog/reports/file-report/examples/README.md`, folded into this
skill so running the skill is enough. The page to copy from is the gold
example at
`~/slopdog/v2/plugins/slopdog/reports/file-report/examples/batch-report-gold.html`
("Gmail Pipeline State", the report Todd called the best one made). Read that
file, then follow the lessons. Do not leave the rules only in the README.

## Project report shape

One project, one report. The ready-to-review table is a section of that
report. Never point Todd at a second report to see what he can verify.

### Lesson 1: verdict-first TLDR

Open with the verdict as a TLDR: the worst news first, in the three-tweet intro,
before why / what / how. The picture of which stages work today is the summary
graphic. The three sections then carry, in order, what works (simple cards, the
single ready-to-review table, what has been shown to work), what is wrong (the
problems found while checking), and what Todd does next (what is waiting on his
answers, and a checklist of his next steps). That order is the gold example's
order, fitted into the report shape above. The wording of the "waiting
on your answers" lines is not written here: it follows the Todd-facing core and
the `report` section of `~/slopdog/v2/rules/question-language.md`.

### Lesson 2: full-title naming

Wherever the report names a ticket, give its full title and one plain sentence
of the value it delivers: what the user can now do (from its user story) or,
when it is not user-facing, what it lets one part of the system do with
another. Full sentences. No bare T-numbers or codes as the only name.

### Lesson 3: one-tweet Proof

The Proof cell is the Verify step's method, one tweet long (280 characters or
fewer), in plain words: what was actually done to verify, with evidence from
something real of Todd's. His model: "the email was sent at this time, arrived
at this time, the difference was five milliseconds." Never "the tests pass" or
"the notes say so." No extra columns; the Proof cell carries the method and,
when the row is not ready, the sentence that says so. If no real-world check
was done, the cell says so and the row is not ready.

### Lesson 4: live-checked claims

Before writing any claim about a running service, run a live check at writing
time. Do not copy the claim from an earlier note, ticket, or report. The claim
states what was just checked and when (the clock time of this session). A
claim that cannot be checked live is marked as not checked, not stated as
fact. A row is ready for review only when this session ran an end-to-end test
(Playwright, Puppeteer, or the Chrome extension) against the real app and real
data. Each ready row says "As a user, you can now …", gives a Do-it link that
opens exactly that, and its Proof names that run. A row without one is not
ready and says which end-to-end run it still needs.

### Lesson 5: single ready-to-review table

The report contains one ready-to-review table, inside this file. Todd reviews
batches, not tickets (T-687), so the rows sit under one heading row per batch,
and that heading says whether the batch is ready for his review: it is ready
only when every row under it is ready. Every ticket row has four parts:

| Part | What the cell holds |
| --- | --- |
| Ticket | Full title, then one plain sentence of the user value |
| As a user | The line "As a user, you can now …" |
| Do it | A link that opens exactly that step |
| Proof | The one-tweet Proof cell from lesson 3 |

That table replaces any pointer to a second report, including a "ready for you
to check" writeup filed somewhere else. Stories that belong to the project go
in this table.

### Lesson 6: plain-words jargon rule

Any term in a Proof cell or in a claim is either a plain word or is defined in
the same sentence in plain words. "Live gap sweep moved the cursor forward" is
not a sentence Todd can use; say what moved, in words, or define the term
right there.

## Before you run it: is this a report at all?

**0a. A living reference doc is not a report.** A dated report is a one-off: a status,
an audit, research findings. A doc that must read as current truth (how a skill, hook or
the Mac works) is revised in place where it already lives (`~/slopdog/CLAUDE.md` →
"Revise in place. Do not append."), not filed again as a new dated file. How the Mac is
set up is authored directly in `notes/Slopdog/How The Mac Works/`, and a harness
reference doc directly in its own folder per `notes/INDEX.md`; this script is the wrong
tool for either. Can't tell → a dated report is the safe default: it duplicates nothing
and can be folded into a living doc later.

**0b. Already filed?** Refiling the same report adds a second index line. Check
`grep -n '"title":"<Title>"' ~/slopdog/tasks/reports/index.jsonl` first.

## What it does

1. Writes the report as `YYYY-MM-DD-<slug>.md` into
   `~/slopdog/v2/desks/research/reports/`, **wherever it is run from** (T-650; Todd,
   2026-10-04: every report is routed to the research desk). Where you stand still decides
   the report's `kind` and `project`; `--kind` only when the inference is wrong.

   | You're standing in | `--kind` | `project` comes from |
   | --- | --- | --- |
   | `~/slopdog` (any subdir: `v2/`, `tasks/`, a desk…) or `~/.claude` | `how` | none, filed as `""` |
   | `~/slopdog/research/<experiment>/` | `research` | the experiment's folder name |
   | any other git repo | `project` | a project's `repo:`, else the repo's basename |

   **A report filed from the partner repo** (`~/partner`, or `~/slopdog/partner` on the
   Mac) is also copied, with its `<Title>.html` when there is one, into
   `partner/shared/reports/`, which Syncthing carries to the partner (Todd, 2026-10-05).
   The copy is not indexed; the index line points at the Research desk's file. Commit
   the copy in the partner repo by path when that repo's rules ask for it.

   Not reports, so not routed here: code docs stay beside their code
   (`dev/<project>/docs/`), and decks stay in `dev/playground/peak-decks/` (`--slides`
   indexes a deck where it lives). Reports filed before 2026-10-10 stay where they are;
   their index lines are unchanged.

2. Stamps the file with the report front-matter standard in
   `plugins/slopdog/reports/file-report/examples/report-frontmatter-standard.md`
   — every field in that table: `title`, `date`, `kind`, `project`, `summary`,
   `abstract`, `entities`, `related`, `tags`, `audience`, `quality`,
   `sensitivity`, `shareable`, `source_path`, and `rag_ready`. Fill `entities`
   and `related` from the report content (use `[]` when empty). Set
   `shareable` with the derivation rule in that doc (never `yes` when
   `sensitivity` is `secret-adjacent`). Set `rag_ready: yes` only when
   `quality` is at least 3 and the markdown body obeys the clean-`##`-only
   heading rule there; Artifact-first stubs stay `rag_ready: no`. Override
   defaults the script supplies whenever you know better (audience, quality,
   sensitivity, entities).
3. **Runs `validate-report-frontmatter.mjs` on the written markdown path before
   any index line is appended.** The script invokes the same validator; if it
   exits non-zero, fix the named field and re-run — do not append to the index
   by hand while the file fails validation.

   ```bash
   node plugins/slopdog/reports/file-report/scripts/validate-report-frontmatter.mjs "<canonical-path>.md"
   ```

4. **Appends one line to the reports index the board reads** (T-176-1):
   `~/slopdog/tasks/reports/index.jsonl`, one JSON object per report with exactly
   `title`, `date`, `project`, `path`, `html`, `artifact`, `source`, `author` in that
   order. `artifact` is the hosted claude.ai Artifact URL passed via `--artifact-url`,
   or `""` when a report skipped publishing one (rule 6 above). `project` is
   the `tasks/projects/<slug>.md` slug from `--project`, or inferred from the
   repo it was filed from (a project file's `repo:` front-matter path, else a slug equal
   to the repo's basename), or `""` when nothing matches; an unknown `--project`
   is an error that lists the known slugs. When more than one project's `repo:`
   claims the filing repo and no `--project` is given, the script refuses,
   writes nothing, and names the competing slugs; `scripts/check-repo-collisions.mjs`
   lists every repo claimed twice (exit 1 when there is one). `html` is the absolute path of
   `<Title>.html` beside the report when it already exists at run time, else `""`.
   `source` is `file-report`, or `slides` for a deck indexed with `--slides`; the
   backfill writes `backfill`. `author` is the
   lane key of the desk that filed it, read off the acting pane's herdr agent name
   `herdr-<lane>` (`selfLane()` in `scripts/lib/desk-pane.mjs`, the `mode.mjs` lookup), else `"todd"`; the board's sign-off types into that
   lane's pane (T-303, T-305). The file is append-only: never rewrite it by hand.
   `SLOPDOG_REPORTS_INDEX=<path>` redirects the append for tests and verification; the
   parent folder is created if missing.
5. Commit the report in `~/slopdog` by path; the index line is committed in `tasks`.
6. Memos are **not** this skill — a memo is written by hand straight into
   `Slopdog/Memo/<Memo Title>.md` per `rules/output-style.md`.
7. **DM it to Todd too** (Todd, 2026-09-04: "all reports should be sent to me DM'd on
   Slack"). If the acting session has Slack access, upload the report file as-is
   (two-step: `slack_get_file_upload_url` → POST bytes → `slack_complete_file_upload`)
   to Todd's DM. Sessions without Slack access skip this step; the filing and the
   Reports tab still work. **The file path is a required, visible field in that
   message's `initial_comment`** (Todd, 2026-09-04: "keep the file path as a required
   field... I like to keep an eye on your taxonomy"). If the message bundles more than
   one report, state every path.

## Usage

```bash
node ~/.claude/skills/slopdog/reports/file-report/scripts/file-report.mjs [--kind how|research|project] [--project <slug>] [--artifact-url <url>] [--skills <a,b>] [--ticket T-nnn] [--tags sprint,pipeline,audit] "<Title>" [content-file|-]
```

- `--skills`, `--ticket` and `--tags` fill the front matter's `skills`, `ticket` and topic `tags`; the
  writing skill passes `--skills` with the skills that produced the body, since only it knows them. The
  field set and the closed tag list are in `examples/report-frontmatter-standard.md`; `desk` is stamped
  from the acting lane.

- `<Title>` becomes both the frontmatter `title` and the kebab-case slug — and the
  `<Title>.html` filename the script looks for in the Research desk's reports folder.
- Second arg is a path to the report body (markdown stub, or the full report when
  skipping the Artifact per rule 6). Omit it, or pass `-`, to pipe the body in on
  stdin. Either way the script strips any existing `---` frontmatter block before
  writing its own, so refiling an already-written report doesn't double it up.
- Run it with your cwd inside the project the report belongs to — cwd names
  the kind and project (and triggers the partner copy); the folder is always the
  Research desk's. `--kind` only when the inference is wrong.
- `--artifact-url <url>` stamps the published Artifact's URL into the index line.
  Publish the Artifact and save its HTML into `~/slopdog/v2/desks/research/reports/` as `<Title>.html`
  *before* running the script, so both `html` and `artifact` land in the same line.
- `--project <slug>` names the board project (`~/slopdog/tasks/projects/<slug>.md`)
  for the index line. Pass it whenever the report belongs to a project whose
  slug is not the basename of the repo you file from; the script cannot guess that.
- `--slides <deck.html>` indexes a built `/slopdog:visual-presentation` deck instead
  (T-308-2): no markdown is written, and the line's `path` and `html` are both the
  deck's absolute path with `source: "slides"`; the project is inferred from the
  deck's repo. The Reports tab opens it in the same report view, framed.
- If `node` isn't on `PATH` (an agent's Bash tool runs with a trimmed one),
  call it as `/usr/local/bin/node …` instead.

Example — filing content you just wrote:

```bash
cd ~/slopdog/dev/some-project
node ~/.claude/skills/slopdog/reports/file-report/scripts/file-report.mjs "Q3 ad spend audit" <<'EOF'
# Q3 ad spend audit
...
EOF
```

Example — filing an existing file that predates this skill:

```bash
cd ~/slopdog/dev/slopdog-migration
node ~/.claude/skills/slopdog/reports/file-report/scripts/file-report.mjs "Downloads triage" reports/downloads-triage.md
```

## See also

- `~/.claude/skills/slopdog/reports/sprint-planning-report/SKILL.md` — writes a sprint
  planning meeting report from the template, then runs this skill to file it.
- `~/.claude/skills/slopdog/reports/broz-report/SKILL.md` — formats a report's *content*.
  Run that first if the content isn't in shape yet; this skill only files
  what's already written.
- `~/slopdog/notes/INDEX.md` — the routing table and the reports convention this skill obeys.
- `plugins/slopdog/reports/file-report/examples/report-frontmatter-standard.md` —
  the front-matter contract and body heading rule; `examples/README.md` remains the
  gold standard for report *body* shape.
- Todd's 9/10 example of a report aimed at him (his rating, in the file's own
  frontmatter, `example.why`): `~/slopdog/notes/Slopdog/How Slopdog Works/2026-09-04-why-your-crm-digest-went-quiet.md`.
  What it got right: ~80% plain language, one short technical section at the end for
  follow-up, short enough for a phone, complete enough not to need a question back.
  Read it before writing a report aimed at Todd rather than at another agent; it is an
  example to read, not a place to file.
