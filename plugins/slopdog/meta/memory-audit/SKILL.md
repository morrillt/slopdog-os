---
name: memory-audit
description: Check every desk against the desk standard — identity block, CLAUDE.md, memory folder, index and @-import against rules/desk-standard.md. Files a report and DMs Todd the link. Use when Todd says "memory audit", "/slopdog:memory-audit", "audit the desks' memory", or when the weekly timer runs it.
disable-model-invocation: true
---

# memory-audit — check every desk's memory against the standard

One subagent per desk checks the identity block, CLAUDE.md, memory folder, index and @-import against rules/desk-standard.md; files a report and DMs Todd the link.

## Step 0 — the desk standard

The rules file is `~/slopdog/v2/rules/desk-standard.md` (shared). If it does not exist, the skill fails with a finding.

## Step 1 — collect the desks

Read `~/slopdog/v2/lanes.json`. For every lane that has a `folder` (every desk, not sidekicks or chairs), spin a subagent.

## Step 2 — one subagent per desk

Each subagent receives the desk's `folder` (e.g., `desks/ideas`) and the desk standard path. It runs:

1. **Identity block** — the desk's `CLAUDE.md` has a role line and imports the shared rules. The subagent checks that the role matches the lane's `name` and `title` in lanes.json.
2. **CLAUDE.md read** — run a headless docs check (`claude -p --model sonnet --tools '' --no-session-persistence`) over just that desk's CLAUDE.md and the shared rules it imports. Collect its findings.
3. **Memory folder** — the desk's `memory/` folder (e.g., `desks/ideas/memory/`) has a `MEMORY.md` index and shards. Check each shard has `name`, `description`, `metadata.type` in `user|feedback|project|reference`. Check the index has a one-line pointer for every shard.
4. **@-import** — the desk's CLAUDE.md @-imports the shared rules correctly (no stale paths, no missing imports).

Each subagent writes its findings to a temp file under `~/.local/state/memory-audit/<desk>/`.

## Step 3 — aggregate and report

The main skill reads all temp files, builds one report markdown with:
- **Verdict** — one paragraph per desk: clean or gaps named.
- **Per desk** — identity pass/fail, docs-sanity findings, memory folder findings, @-import findings.
- **Rollup** — total desks clean, total with gaps, total findings.

Write the report to `~/slopdog/tasks/reports/memory-audit-<date>.md`.

## Step 4 — file report and DM

Run `/slopdog:file-report` on the report file. It writes the canonical copy and appends a line to `~/slopdog/tasks/reports/index.jsonl` with the Artifact URL.

DM Todd the link (one line: "Memory audit <date>: N desks clean, M with gaps — <Artifact URL>").

## Don't

- Don't fix anything. Findings only.
- Don't run docs-sanity with tools; it must be headless.
- Don't check sidekick lanes — only desks with their own `folder` in lanes.json.
- Don't skip the DM; it's the signal Todd sees.