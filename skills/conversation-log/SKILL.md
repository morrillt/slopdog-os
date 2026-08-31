---
name: conversation-log
description: Extract the operator's own timestamped prompts from Claude Code session transcripts and fold them into git commit messages, then replay both sides of a merge as one wall-clock conversation timeline. Use when writing a commit that should record WHY, when resolving a merge conflict between overlapping sessions, or when asked what was said about a change and when.
---

# conversation-log

Two scripts that carry human intent — with timestamps — from the chat into git,
and back out again at merge time.

## The problem

A commit records **what** changed and **when it landed**. It does not record
**when the decision was made**, or **what that decision superseded**.

Broz runs several sessions against one repo in the same afternoon: opens 1, then
2, then 3, closes 2, then 3, then 1. The branch that merges **last** may be
carrying the **oldest** instruction. Commit order, commit date and branch
topology all lie about precedence. The prompt timestamps do not.

## The fix

`harvest_prompts.py` writes Broz's own prompts, timestamped, into the commit
body. `merge_timeline.py` reads them back out of both sides of a merge and
interleaves them by wall clock, so the resolution rule becomes readable:

> The **latest instruction on a given topic** wins — not the branch that merged
> last.

## Scripts

### Harvest a session into a commit block

```bash
python3 ~/.slopdog/skills/conversation-log/scripts/harvest_prompts.py
```

Auto-detects repo, branch and time window (since the branch's newest commit, or
its fork point if the branch has none yet). Prints a commit-ready block on
stdout; diagnostics go to stderr, so stdout pastes straight in.

| Flag | Default | Purpose |
|---|---|---|
| `--repo` | cwd | Working tree |
| `--branch` | current | Branch filter |
| `--since` / `--until` | auto / now | ISO8601 window override |
| `--session` | all matching | Restrict to one session id |
| `--max-prompt-chars` | 3000 | Per-prompt truncation |
| `--max-total-chars` | 24000 | Whole-block cap |
| `--format` | `commit` | `commit` \| `plain` \| `json` |

Output shape — `merge_timeline.py` parses this back, so the markers matter:

```
--- Conversation (5 prompts, 2026-08-18 04:36 UTC → 2026-08-18 06:40 UTC) ---

[2026-08-18 04:36 UTC] broz:
  the prompt text, indented two spaces

Conversation-Window: 2026-08-18T04:36:12Z/2026-08-18T06:40:05Z
Prompt-Count: 5
Session-Id: 5cbedbad-8915-4c7f-849d-aa6ec13e6c72
```

The trailing block is git trailers — machine-readable, greppable, and the
pointer back to the full transcript if the truncated version is not enough.

### Replay a merge as a timeline

```bash
python3 ~/.slopdog/skills/conversation-log/scripts/merge_timeline.py           # inside a conflicted merge
python3 ~/.slopdog/skills/conversation-log/scripts/merge_timeline.py --ours main --theirs claude/some-branch
python3 ~/.slopdog/skills/conversation-log/scripts/merge_timeline.py --file model/build.py
```

Reads `MERGE_HEAD` automatically when a merge is in progress. Prints every
prompt from both sides in wall-clock order, tagged OURS/THEIRS, with the commit
that carried it and which conflicted files it touched. Commits with **no**
recorded conversation are printed too — their absence must not read as "nothing
was said".

## What it captures, and what it skips

Captured: anything Broz typed or dictated, plus slash commands (real intent).

Skipped, because none of it is a person talking:

- `isMeta` entries — skill preambles, cwd-reset notices
- `isSidechain` entries — subagent conversations
- entries with `sourceToolUseID` or `toolUseResult` — tool output on the user channel
- `<system-reminder>`, `<local-command-stdout>`, `<local-command-caveat>` wrappers

## Where the data lives

`~/.claude/projects/<slugified-cwd>/<session-uuid>.jsonl`, one JSON object per
line. The slug is the working-tree path with every non-alphanumeric character
replaced by a hyphen. The script prefers that directory and falls back to
scanning all of them, filtering on each entry's own `cwd` and `gitBranch`.

⚠️ **Transcripts are outside the repo and are not backed up.** That is precisely
why the prompts are copied into the commit body rather than merely linked — the
commit stays self-contained if the transcript is ever rotated or deleted.

## ⚠️ Before using this on a repo with a public remote

The conversation block travels with the commit **everywhere the commit goes**.
Raw dictation is unedited and often contains context that was never meant to be
published — client names, numbers, opinions. On any repo whose remote is public,
check the block before committing, or skip the harvest entirely.

## Trigger scenarios

- Writing a commit that should record why, not just what (`broz:committomain`)
- Resolving a merge conflict between two overlapping sessions (`broz:resolvemerge`)
- "What did I say about X, and when?" across sessions on a branch
