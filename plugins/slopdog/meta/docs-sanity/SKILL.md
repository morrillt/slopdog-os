---
name: docs-sanity
description: Audit Todd's docs, skills and index files against each other and report the contradictions — a rule stated in one file but implemented in another, a skill that writes somewhere INDEX.md doesn't route, two skills nobody can choose between, a note filed where its folder README says it shouldn't be. Findings only; it never edits. Use when Todd says "docs sanity", "/slopdog:docs-sanity", "are the docs sane", "audit the docs", "find the contradictions", "do the docs and the skills agree", "is anything filed wrong", or when several people are each asked to audit the docs and pool results.
---

# docs-sanity — find where the docs contradict each other

**Findings only. This skill never edits a file, never moves a note, never fixes a
row.** It writes one findings file and stops. Same discipline as `keep-tight`:
Todd approves, a separate pass executes. Breaking that is the one way to make this
skill worse than useless.

## Step 0 — collect the facts

```bash
node ~/.claude/skills/slopdog/meta/docs-sanity/scripts/collect.mjs
```

Strict YAML on every skill's frontmatter is checked first (T-636); a parse failure exits
non-zero before any report is printed. To run only that check:

```bash
node ~/.claude/skills/slopdog/meta/docs-sanity/scripts/collect.mjs --strict-yaml
```

Everything below reads from that output — the skills inventory, the destinations
each skill writes to, the `INDEX.md` rows, the `notes/Slopdog/` census, and the
list of files that make routing claims. It runs `keep-tight`'s own checker as its
first section, so **step 1 is already answered** by the time you read it.

If you are one of three independent runners (see step 6), **do not read anyone
else's findings before writing your own.** Reading them first turns you into a
grader instead of a reader.

## Step 1 — inherit keep-tight

Take the `check-tight.mjs` section of the collect output as-is. Manifest vs
`plugin.json` vs disk is a solved problem; do not re-derive it. Copy its verdict
into the findings and move on.

## Step 2 — duplicates and merges

Read the skills inventory. For each pair, ask the only question that matters:
**would a reasonable person be unsure which of these two to invoke?** Not string
similarity — overlap in the moment of choosing.

Known candidates to judge, not to assume: `source-search` vs `web-search` vs
`shopping-research` (all answer "look this up"; T-174 folded the Reddit and GitHub
lookups into `source-search`, split `youtube-search` back out as its own skill, and
merged the broz-report/deslop-report pair into one `broz-report`, so judge what is
left, not those); `file-report` vs
writing a memo by hand (the same routing decision, made two ways).

Output per pair: a merge proposal **and the argument against merging**. Some of
these should stay separate and the findings must say why.

## Step 3 — does every skill route through INDEX.md?

The highest-value check. For each skill that writes markdown, the collect output
lists the destinations its body names. For each destination, is there an
`INDEX.md` row that covers it?

A hardcoded destination is a future contradiction — the router should be the only
place a destination is decided. Expect findings that are not bugs: machine output
(`~/slopdog/logs/`, `~/slopdog/tasks/`) may correctly have no row. **Surface the
question, do not answer it.**

## Step 4 — is `notes/Slopdog/` filed correctly?

For each file in the census: does it belong where it sits per that folder's own
README, and is it reachable from an index? Look hardest at `How Slopdog Works` —
it is where things go when nobody was sure, and it mixes living reference docs with
dated reports filed before T-308 (new reports go to the Research desk's `reports/` and the
runner's Reports tab, never here). The census marks which is which.

## Step 5 — do the indexes agree?

Cross-check every routing claim across `notes/INDEX.md`, `Slopdog/README.md`, each
folder README, `~/HOME-INDEX.md`, and the routing paragraphs in `~/.claude/CLAUDE.md`
and each project `CLAUDE.md`. The house rule is "don't restate a row of INDEX.md
anywhere else" — check whether it held. A row whose target path does not exist is
a finding too.

## Step 6 — write the findings, one file

Draft the findings as one markdown file titled `YYYY-MM-DD docs sanity <runner>`,
where `<runner>` is who ran it (`moe`, `lu`, `curly`). Structure:

- **Verdict** — one paragraph. Is the tree sane or not.
- **Findings**, numbered, each with: what contradicts what (both file paths), why
  it matters, and the proposed fix.
- **Sorted into two lists at the end** — *mechanical* (a missing row, a stale
  path; safe to execute in one pass) and *Todd's call* (retire a folder, merge
  skills). That split is what makes the file actionable.
- **What I could not check**, named honestly.

Then register it with `/slopdog:file-report`, which picks where the markdown is kept
and appends its line to `~/slopdog/tasks/reports/index.jsonl`, the runner's Reports tab,
with this desk as `author` (T-305). That tab is where Todd reads reports now (T-174 q7),
so this skill names no folder of its own. Commit what file-report wrote. The weekly run
is different: its findings become the docs-order ticket, not a report.

## Step 7 — three runs, then pool

When Todd asks for the full treatment, the same brief goes to three readers who
each write their own findings file **before seeing the others**:

- **Moe** — knows where the bodies are, blind to what he wrote.
- **Princess Lu** — dispatched via `~/slopdog/v2/scripts/dispatch.mjs`,
  Read/Glob/Grep only, fresh context, no shared memory. If the brief is ambiguous
  she replies with a question — that is itself a finding about the docs.
- **Curly** — the architect's read: is the *structure* right, not do the files match.

The disagreements between the three are the interesting part; the merged ticket
leads with them.

## Don't

- Don't fix anything. Not even an obvious typo in a row.
- Don't re-implement `keep-tight`.
- Don't count string similarity as duplication.
- Don't hand a runner someone else's findings before they write their own.
