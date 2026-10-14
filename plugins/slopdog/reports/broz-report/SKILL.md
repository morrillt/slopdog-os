---
name: broz-report
description: Reshape a report you already wrote, in one of two shapes, and ask Todd which one first. "status" is the condensed status format (a tweet-sized headline, 🟢/🟡/🔴 bullets, per-bullet assumptions, open questions split into blockers vs go-deeper); "deslop" is the round-by-round cleanup, one dictated tweak at a time, until the report reads as title, plain-English intro, one rich table, closing paragraph. Use whenever Todd says "broz-report", "/broz-report", "condense that", "report format", "deslop this report", "deslop-report", "refine the report", "polish the report", "make it way simpler", "make the table readable", "add a dimension to the table", asks for the status of work you just finished in his format, or starts dictating revisions to a report you just wrote. Not for writing the first draft; that is the task itself.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Edit
  - AskUserQuestion
disable-model-invocation: true
---

# broz-report — reshape a report you already wrote

Two shapes, one skill (T-174, Todd 2026-09-26: merged from broz-report and
deslop-report, and it asks which shape before it starts).

**Step 1 — ask which shape.** If the argument is `status` or `deslop`, that is the
answer; don't ask. Otherwise ask one menu before anything else (`AskUserQuestion`):

- **status** — condense into headline + 🟢🟡🔴 bullets + assumptions + open questions,
  in one pass. Recommend this when he asked how the work went.
- **deslop** — refine the report with him round by round toward title, intro, one
  table, closing paragraph. Recommend this when there is a drafted report file and he
  wants it cleaner.

**Step 2 — follow that shape's section below, and only that one.**

## Shape: status

Once the report is in this format and Todd wants it kept, file it with
`~/.claude/skills/slopdog/reports/file-report` — that skill puts the canonical copy in the
Research desk's reports folder and a line in the runner's reports index, so Todd reads it
on the Reports screen; this skill only formats.

Todd invokes this **after** you have reported on some work. Your job is to
**restructure what you already said** into the format below. This is a
reformatting pass, not a new investigation.

### Rules

- **Reuse, don't redo.** Everything comes from work already done in this
  conversation. Only re-read a file if you need it to decide a bullet's colour
  honestly.
- **No new work.** Do not fix the 🟡/🔴 items now. Report them, then stop and
  wait. If Todd wants them fixed he'll say so.
- **Be honest about colour.** A 🟢 that was never verified is a 🟡. "It compiles"
  is not "it works". If you didn't run it, say so in Assumptions and drop to 🟡.
- **Condensed means condensed.** Every bullet is one line. Assumptions are one
  line each, three max per bullet. Cut anything Todd already knows.
- **No praise, no summary paragraph, no "let me know if…" closer.** The format
  below is the entire output.
- Link files as clickable markdown paths (`[file.ts](src/file.ts:42)`).
- If there are genuinely no open questions, omit the whole Open Questions
  section rather than padding it.

### The colours

| | Meaning |
|---|---|
| 🟢 | Done and verified working. |
| 🟡 | Partial — landed but incomplete, unverified, worked around, or with a known gap. |
| 🔴 | Not done successfully — failed, blocked, or abandoned. |

### Output format

```markdown
## What was done:

<One tweet-sized sentence — the whole change in ≤280 characters. No preamble.>

- 🟢 <one-line detail>

  **Assumptions**
  - <note or assumption behind this bullet>

- 🟡 <one-line detail — say what's missing right in the line>

  **Assumptions**
  - <what you assumed, what you didn't verify, what you worked around>

- 🔴 <one-line detail — say what failed right in the line>

  **Assumptions**
  - <why it failed / what you assumed that turned out wrong>

## Open questions

**To resolve the 🟡 / 🔴 above**
1. <question whose answer unblocks a specific yellow or red bullet — name it> — a) <option, recommended> b) <option>

**Go deeper**
1. <question about direction, scope or design worth Todd's attention next> — a) … b) …
```

Every open question carries its options, recommended one first (`output-style.md`: a
question for Todd is a menu). An open prompt hands him the work of enumerating choices.

### Worked example

```markdown
## What was done:

Digest job now pulls Notion comments and emails a Mon/Tue/Wed summary; the
unanswered-thread detection works but the scheduled trigger is still manual.

- 🟢 Comment threads fetched and grouped by page in [digest.ts](notiondigest/digest.ts:88)

  **Assumptions**
  - "Unanswered" = last comment isn't Todd's. Notion has no resolved flag on the API.

- 🟡 Email send wired up — sends to Todd only, never tested against a real digest

  **Assumptions**
  - Gmail MCP auth is already good; I didn't send a live message to check.

- 🔴 Scheduled task not created — the scheduler rejected the Mon/Tue/Wed cron

  **Assumptions**
  - Assumed a 3-day-of-week cron was supported. It isn't; needs three tasks.

## Open questions

**To resolve the 🟡 / 🔴 above**
1. Send a live test email now, or wait for Monday's real run? (🟡 email send)
2. Three separate scheduled tasks, or one daily task that no-ops Thu–Sun? (🔴 scheduler)

**Go deeper**
1. Should status changes on someone else's task count as "activity" worth digesting?
2. Worth folding this into `email/` rather than keeping a second Notion client?
```

## Shape: deslop

Born 2026-09-01 from the Schedule D reconciliation session. Todd refines by
dictation, one instruction per turn; your job is to land each one fast,
keep the doc on screen, and know the shape he's steering toward.

### The target shape

1. **Title.**
2. **Plain-English intro, three short bolded leads:** **The question:** (what
   was asked, in the words it was asked), **The answer:** (one or two
   sentences, worst news first), **How to read the table:** (walk the columns
   left to right). No jargon, no throat-clearing.
3. **One table** carrying everything. No separate Suggestions/Decisions
   sections — fold them in as columns.
4. **One closing paragraph** — "Everything else ✅": what checked out, as a
   `✅ · ✅ ·` run, plus leftover chores 🧹.

### Table conventions

- **Concern cell = title + tweet.** Bold short name, `<br>`, then a
  one-tweet plain description. One emoji per row as an icon (⚔️ 🧮 🏦 …),
  severity marker (🔴🟡⚪) in the `#` column.
- **Sources side by side, quoted.** When comparing two texts, give each its
  own column ("What the contract says" / "What Schedule D says"), open each
  cell with the citation — section number AND header, e.g. "§4.7 (Cash
  Reserves) ¶1:" — then `<br><br>`, then the actual quoted words. No
  paraphrase where a quote fits.
- **"Why this is a problem"** is the column that earns the row: plain
  English, multiple short paragraphs via `<br><br>`, bold mini-leads, worked
  numbers where they bite ("~$540/month of interest, so it hits whenever X
  is under ~$3,400").
- **Decision column:** ✅ **Made (whose):** with the call stated, or
  ❓ **To make:** with the question, `<br><br>`, 👉 Recommended: and why.
- **Suggested correction column:** the exact replacement text, quoted, per
  document touched — never "reword this".
- Line breaks inside cells are `<br>`; never let a cell become one unbroken slab.

### The loop

1. **Find the report.** The one just written or filed this session; else ask
   which file. Edit the canonical copy where file-report put it (its index line's `path`); the
   Reports screen reads it from there.
2. **Get it on screen once.** If it isn't already open, open it as a
   live-reloading markdown tab next to Todd's working context —
   `~/.local/bin/cmux-panel --pane pane:NN markdown <path>` per
   /slopdog:cmux-panel (ask which pane unless he's said). Then leave it;
   every Edit reloads the tab.
3. **One round per instruction.** Transcripts arrive garbled — read for
   intent; "add a dimension" means a column, "title and a tweet" means the
   concern-cell pattern above. Do exactly the asked change, resist bundling
   your own improvements in.
4. **Commit and push every round**, message recording what Todd asked for,
   per the owning repo's rules.
5. **Reply in one short paragraph:** what changed, note the tab reloads
   itself. No menus of next steps — Todd drives the rounds.
6. **Publishing is a separate ask.** When he says post/publish, that's
   Slack (file upload + short plain comment) or Notion. To Notion, post the
   markdown as-is — the full table, not a restructured per-row layout. The
   API can't set column widths; Todd widens them by hand and said so
   (2026-09-01): don't work around it for him.

### Don't

- Don't rewrite parts he didn't point at.
- Don't let old sections survive as duplicates when their content moves
  into the table — delete them.
- Don't open extra panes; one markdown tab, reused.
