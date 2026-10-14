---
name: whats-loaded
description: Show what instruction/memory files are loaded into this session's context, human-readable — every CLAUDE.md, rules file, @-import and auto-memory entry, why each loaded, and roughly what it costs — plus a one-line gist of what each file says. Use when Todd says "/whats-loaded", "what's loaded", "show me the memory", "what rules are you running under", "what's in context", or wants to audit his harness setup.
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/report.mjs *)
disable-model-invocation: true
---

# whats-loaded

Todd is developing his harness and wants to *see* what's on the stack. Render
the report below, then add the human layer.

## The report

!`node ${CLAUDE_SKILL_DIR}/scripts/report.mjs ${CLAUDE_SESSION_ID} "${CLAUDE_PROJECT_DIR:-.}"`

## What to do with it

1. **Print the tables as-is** — the file table, auto memory, SessionStart hooks.
2. **Add a "what each file says" list** underneath: one line per file in the
   table, plain English, from what you actually have in context — the gist of
   the rules, not the headings. e.g. `~/.claude/CLAUDE.md — tone rules
   (terse, push back), git auto-commit/push, cmux teammate panes, meta work via
   the best-practices subagent.` If two files overlap or contradict, say so in
   a line; that's the audit value.
3. **Flag the fat one** if any single file is over ~3k tokens, and say what
   would move it — a skill, a `paths:`-scoped rule, or a cut.
4. If the source line says *reconstructed from disk*, say so in one sentence
   and point at `/context all` for the real numbers. Don't apologise for it.

Keep it to one screen. No preamble. Don't repeat the tables in prose.

## Notes for future edits

- Ground truth comes from `~/.claude/hooks/log-instructions.mjs`, an
  `InstructionsLoaded` hook wired in `~/.claude/settings.json`. It appends one
  JSON line per loaded file to `~/.local/state/claude-instructions.jsonl`.
- The script filters that log by `${CLAUDE_SESSION_ID}`; with no rows it
  reconstructs the CLAUDE.md chain from disk (walks `/` → cwd, user rules,
  `@`-imports to 4 hops).
- Token counts are bytes/4 — an estimate. `/context all` is the real number.
- The `Bash(...)` in `allowed-tools` matches the exact command in the body so
  it runs without a prompt (docs: `/docs/en/skills#variable-substitution`).
