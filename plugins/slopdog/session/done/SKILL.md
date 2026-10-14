---
name: done
description: Close out a working session properly — refresh the Concerns tab, walk Todd through every open concern until he has acknowledged each one, confirm every repo is committed and pushed, then give the closing report (concerns addressed, commits made, everything clean, documents updated — by path). Use when Todd says "done", "/slopdog:done", "we're done", "wrap up", "let's close out", "that's it for today", "go through your concerns", or wants the session signed off.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - AskUserQuestion
---

# done — nothing is finished until Todd has heard the caveats

The Concerns tab is where the caveats he scrolled past live. This skill makes
him look at each one before the session is called clean. Follow the steps in
order; the report at the end is built from what the steps found, not from
memory.

**Step 1 — find this session's panel files.**

```bash
DIR="$(~/.claude/skills/slopdog/session/wtf/scripts/session-dir.sh --session "${CLAUDE_SESSION_ID}" "Title For The Slug")"
```

Creates `turns.md` and `concerns.md` if they don't exist. Read
`concerns.md`. If `concerns.md` is empty or
`*None open.*` but this conversation contains caveats, flagged limitations,
guesses, or unverified claims, that's a gap — go to step 2 either way.

**Step 2 — bring the Concerns tab up to date.** Sweep the conversation for
anything that could still bite: limitations you flagged in passing, things you
couldn't verify, fragile workarounds, edits that live only on disk, rules that
exist only in this chat. Add each as an entry in the `slopdog-wtf` format
(`### <YYYY-MM-DD HH:MM> · turn <n> · open`), newest first. Don't pad;
`*None open.*` is a real state.

**Step 3 — walk him through them, one at a time.** For every entry marked
`open` or `watching`, present it in one or two sentences and ask what to do
with it. Use `AskUserQuestion`, one concern per question, options:

- **Resolved** — it's handled or he doesn't care; mark `resolved`.
- **Carry** — real, not now; stays `open` with a one-line note of his call.
- **Ticket** — worth tracking; run `/ticket-add` for it (only if the cwd is
  `~/slopdog/tasks`, otherwise say where the ticket should go) and mark
  `open · ticketed T-0NN`.
- **Fix now** — do it, then mark `resolved`.

Rewrite the entry's status line after each answer. `resolved` entries stay in
the file — they're the record. Do not move on to step 4 with an unacknowledged
concern.

**Step 4 — is everything clean?**

```bash
node ~/.claude/skills/slopdog/session/done/scripts/repo-sweep.mjs
```

One line per repo: `clean`, `NOT CLEAN` (dirty or unpushed), `not a repo`.
For every `NOT CLEAN` that this session caused: commit and push, one commit
per working state, messages say why. For dirt that isn't yours (another
session's `settings.json`, Todd's `plans/context.yaml`), leave it and say so.
`not a repo` dirs that got edits this session are listed in the report as
disk-only. Re-run until the only remaining lines are ones you can explain.

**Step 5 — pre-flight.** Run `/slopdog:clear-to-close`'s checks (`PICKUP.md` current,
memory distilled) before the report; it is the light version of this skill and the
report must not say clean while `PICKUP.md` is stale.

**Step 6 — the closing report**, in the terminal, exactly these four
headings, and also written to `$DIR/done.md` with the date on top:

```markdown
## Concerns addressed
<n> resolved · <n> carried · <n> ticketed (T-0NN, …) · 0 unacknowledged

## Commits made
<repo> · <hash> <subject>
<repo> · <hash> <subject>

## Everything clean
<repo> clean · <repo> clean · <repo> NOT CLEAN — <whose dirt, why left>
Disk-only (not a repo): <path>, <path>

## Documents updated
<absolute path> — <what changed, five words>
<absolute path> — <what changed>
```

"Documents updated" is every file a human would read that this session
changed — CLAUDE.md files, skill bodies, maps, notes, READMEs, tickets. Not
scripts, not config, not logs. Absolute paths, so he can open them.

## Don't

- Don't declare a concern resolved because it's embarrassing or old. He
  acknowledges; you record.
- Don't `git add -A` in the notes vault — stage by path (its CLAUDE.md says
  why).
- Don't open anything on screen. The report goes in the terminal and
  `done.md`; the panel live-reloads on its own.
- Don't invent commits. Every hash in the report comes from `git log`.
- Don't run this instead of `slopdog-wtf` mid-session. This is the last thing.
