---
name: retrospective
description: Run a retrospective on how a ticket was worked — observe the method through a subagent (never reading raw transcripts into the caller), find where rules, skills or scripts cost time, tokens or Todd's attention, file the findings as a report, turn each large finding into a refinement ticket that names the piece it would change, and fix only small obvious slips directly through /slopdog:edit-skill. For an important retro, two builders observe independently and are reconciled through /slopdog:feedback. Use when Todd says "retrospective", "/slopdog:retrospective", "retro this ticket", "run a retro", "retro on T-nnn", or "what should we have done differently".
---

# retrospective — watch how the work was done, then propose how the framework improves

Todd, 2026-09-26: a retro observes the method used on a piece of work and finds
improvements anywhere in the Slopdog framework: rules, skills, scripts and everything in
between. **Propose first.** The output is a report and refinement tickets; a direct edit is
only for a small, obvious slip in one skill. A retro never quietly rewrites the framework it
is reviewing. Design and reasons: T-445 (`~/slopdog/tasks/tickets/retrospective-skill.md`).

**Step 1 — pick the subject.** The argument is a ticket (`T-nnn`); with none, take the
ticket this desk's `PICKUP.md` names. Read the ticket. The window is its first to last
Progress note, and the `cwd` is its worker's desk folder (`~/slopdog/v2/lanes.json`).

**Step 2 — ask how many people.** One observer, or two for an important retro.
- In Todd's own session: one `AskUserQuestion` menu, "One observer (Recommended)", "Two
  builders, compared", "Skip the retro".
- In a desk: a question on the subject's ticket (`questions.items`, `asked_by: <desk>`, the
  T-168 shape in `~/slopdog/v2/rules/output-style.md`); carry on with other work and resume
  here when the answer comes back.

**Step 3 — gather the evidence paths, not their contents.** Build a list of paths only:
- transcripts: `~/.claude/projects/<cwd with / turned into ->/*.jsonl` modified in the window
  (`find … -newermt <start> ! -newermt <end>`);
- the tickets' files (Progress notes, Concerns, verification lines);
- `git -C <repo> log --since=<start> --until=<end> --stat` for each repo the tickets touch;
- the desk's `PICKUP.md` and `memory/` shards written in the window.

**Step 4 — observe through a subagent.** Spawn one `general-purpose` agent with the path list
and this brief: *Read these. Where did the method lose time, tokens or Todd's attention —
a rework loop, a wrong turn, a question that should not have reached him, a rule that was
missing, stale or ignored, a skill that misfired, a script that failed? For each, name the
framework piece that would have prevented it (a file under `~/slopdog/v2/rules/`, a skill
folder under `~/.claude/skills/slopdog/`, a script, a CLAUDE.md). Return at most ten
findings, each: what happened, evidence (path and line, or a short quote), the piece, and
small (one wording fix, stale path or missing trigger in one skill) or large (anything
else). Say what you could not confirm.* Keep only its findings; never read the raw
transcripts in this session.

**Step 5 — two people only: compare through `/slopdog:feedback`.** Run step 4 twice, blind
to each other: once as LaForge's subagent, once through Gemma
(`node ~/slopdog/v2/scripts/dispatch.mjs "<the step 4 brief and paths>" --read <folder>`).
Then follow `/slopdog:feedback` from its step 3: compare point by point, keep what both
found, argue the rest as peers up to five rounds, and put what is still apart to Todd as
one decision (a menu in his session, a ticket question from a desk).

**Step 6 — file the report.** Through `/slopdog:file-report`, in the reports folder of the
repo that owns most of the pieces (`~/slopdog/v2` usually). Title: `Retrospective — <subject>`.
One section per finding: what happened, the evidence, the piece, and what became of it
(ticket, edit, or dropped and why).

**Step 7 — propose refinement tickets.** One `ticket-add` per large finding (on any desk but Ideas, `ticket-add` relays the request to Daphne and writes nothing itself). The ticket's
`## What` names the rule, skill or script it would change, cites the evidence and links the
report, and its `## Notes` says which retrospective it came from, since `ticket-add` allows exactly one tag, `meta` or `work`, and no retrospective tag. Related findings on the same piece go in one ticket.

**Step 8 — apply small fixes.** Each small finding is an edit through `/slopdog:edit-skill`
in adjust mode, recorded in the report's section for that finding. A rule file, a CLAUDE.md,
or anything spanning two skills is never small: it is a ticket.

**Step 9 — say what came out.** One line: the report's title and link, the tickets by full
board title, the edits made. Nothing else.

## Don't

- Don't read transcripts or long logs into this session; the subagent reads, you get findings.
- Don't rewrite a rule or a CLAUDE.md from a retro; propose it as a ticket.
- Don't retro a ticket still 🟡; the method is only visible once the work has landed.
- Don't blame a desk; a finding names a piece of the framework, not who stumbled on it.

## Capturing an entry as it happens (not a retro)

The standing rule, in `~/slopdog/v2/CLAUDE.md`, is that anyone who hits a problem or sees something
that could be better writes it down at once; a retro above reads these entries. The file is
`~/slopdog/v2/retrospective/<YYYY-MM-DD>-<department>.md` (`~/slopdog/v2/retrospective/README.md`
holds naming, schema and retirement rules). Append with the CLI, never a parallel format:

```bash
node ~/slopdog/v2/scripts/retrospective-append.mjs \
  --ticket T-nnn \
  --what "What happened" \
  --cost "Time or correction rounds" \
  --prevention "What would stop it recurring" \
  [--tag <theme>] \
  [--department slopdog]
```

An entry carries four things, and an entry missing them is not worth keeping: what happened, which
ticket or job it happened on, what it cost in time or correction rounds, and what would stop it
recurring. "This was hard" is not a lesson. The file is read twice: when the sprint closes, and
again at the start of the next sprint planning meeting. A house-level change also gets an
`assumptions.jsonl` entry and a sweep (`scripts/assumption-sweep.mjs`); dispatch refuses a ticket
with `stale_assumptions`.
