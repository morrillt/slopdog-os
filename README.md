# Slopdog OS

![Slopdog OS Crew](assets/slopdog-crew.png)

Slopdog is the harness one person (Todd) uses to run a small team of AI agents on Claude Code.
Each agent sits at a **desk** with one job, work moves as **tickets** grouped into **batches**,
a **build ladder** decides which model builds and which model checks, and **gates** (scripts and
hooks that exit non-zero) refuse work that is not ready. This repo is the harness itself: the
rules the agents read, the skills they run, the hooks that hold the line and the key scripts.

It is published to read and borrow from, not to install as-is. Every path inside the files reads
`~/slopdog/v2/...`; in this repo that is the root. Several scripts expect the rest of the house
(a tasks repo, a board, herdr panes), so treat them as worked examples.

The Cursor-era version (v1: `/broz/plan`, `/broz/build`, epics and personas) is preserved at the
`v1-cursor` tag.

## The shape in plain words

**Desks.** A desk is a folder with its own `CLAUDE.md`, a persona and one job. `lanes.json` is the
registry: every desk and every sidekick, with its model, engine and the skills it carries. The
main ones:

| Desk | Who | Job |
| --- | --- | --- |
| Ideas | Daphne | Talks ideas through with Todd until both rate them eight out of ten, then writes the tickets. Never builds. |
| Build | Tyrion | Runs the sprint: dispatches tickets to builders, verifies results, tracks progress. |
| Builders | LaForge, Data, Gemma, Composer, Grok | Build one ticket each, step by step, in a worktree. Data takes the hard ones. |
| Research | Samwell Tarly | Answers a question as a sourced report. Never builds. |
| Slack | Varys | Answers for the bot in Slack and routes asks to the owning desk. |
| IT | Scotty | Machine, terminal and interface problems. |
| Captain | Slopdog | The front door: answers status from scripts and hands work to the right desk. |
| Watcher | Watcher | Night watch: usage limits, stuck desks, the sprint stop. |

Desks talk by `SendMessage` first, then a file dropped in the other desk's `inbox/`
(`scripts/inbox-write.mjs`), and only as a last resort by typing into a named terminal pane.

**Tickets and batches.** The taxonomy is department, project, feature, batch, ticket. A project
opens with a short why, what and how; a batch delivers one feature; tickets are sharded from a
batch with a three-point floor, a Fibonacci estimate, typed acceptance criteria and a readiness
block. Anything smaller than a ticket is a **quick task**, done by whichever desk received it
(`/slopdog:quick-task-add`, `/slopdog:quick-task-do`). Only the word "ticket" routes work to the
Ideas desk (`rules/critical-rules.md`).

**The build ladder.** One file, `config/build-ladder.json`, read through
`scripts/lib/build-ladder.mjs`, decides who builds and who verifies by the ticket's points
(`config/build-ladder.md` explains it). Today: 1 to 3 points build on Sonnet at medium effort and
are verified by Opus at low; 5 points build on Sonnet high and verify on Opus medium; 8 points, or
two failed verifies, go to Data on Opus high. The verifier is always a fresh session. A green
verdict merges the ticket's branch to main. Subagents pick a tier from `config/subagent-tiers.md`
and a hook refuses an `Agent` call that names no model. `scripts/check-build-ladder.mjs` fails
when a script hardcodes a value the file owns.

**The gates.** Most of the discipline lives in code, not prose:

- `scripts/dispatch-gate.mjs` and `scripts/dispatch.mjs` refuse a ticket that is not in the focus
  list, has no estimate, carries stale assumptions, has a placeholder Verify line, is over its
  department's weekly token share, or would push too many batches into flight (about twenty-five
  refusals in all).
- Hooks in `plugins/slopdog/hooks/`: `context-rot.mjs` (the context gauge, which stops a desk at its
  ceiling and tells it to clear), `sprint-stop.mjs` (the weekly spend stop), `agent-model-guard.mjs`,
  `lane-lock.mjs` (two desks never edit one file blind), `pickup-guard.mjs`, `inbox-watch.mjs`.
- `scripts/shared-tree-git-guard.mjs` refuses `git stash`, a branch checkout and a `git commit`
  that does not name its paths, in the shared working tree every desk has open. `scripts/claude-write-fence.mjs` fences what a
  builder may write. `git-hooks/commit-msg.mjs` enforces the commit format in `rules/commits.md`.

**Clearing.** A desk never waits for compaction. At a landed step it writes a `PICKUP.md`
(`/slopdog:clear-to-close`), clears itself (`scripts/self-clear.mjs`) and resumes from the note
(`/slopdog:pickup`). See `rules/desk-clear.md`.

## What is in the repo

| Folder | What | Start with |
| --- | --- | --- |
| `rules/` | The always-loaded house rules. | `principles.md`, `output-style.md`, `before-asking-todd.md`, `critical-rules.md` |
| `config/` | The build ladder and the subagent tier card. | `build-ladder.md` |
| `lanes.json` | The desk registry. | the `ideas` and `build` entries |
| `plugins/slopdog/` | The Claude Code plugin: skills in group folders, hooks, bin. Every skill runs as `/slopdog:<name>`. | `session/ideate`, `session/sprint-planning`, `session/build-ticket`, `writing/batch-writer`, `hooks/README.md` |
| `scripts/` | The key scripts and the library they import. | `dispatch.mjs`, `dispatch-gate.mjs`, `ready-queue.mjs`, `scripts/README.md` |
| `git-hooks/` | The commit-message hook. | |
| `docs/` | Write-ups. | [pstack beside the house pipeline](docs/pstack-comparison.md) |

Skill groups: `session` (the daily loop: ideate, sprint planning, build-ticket, dispatch, pickup,
clear-to-close, watcher, unstucker, retrospective), `writing` (project, batch), `reports` (filing
and shaping reports, visual decks), `meta` (keeping skills and docs honest), `research`, `media`,
`cmux`, `git`.

## Compared with pstack

[docs/pstack-comparison.md](docs/pstack-comparison.md) sets this pipeline beside pstack, the
Cursor plugin by @poteto. Short version: pstack is a router over twenty-three well-written
playbooks with no gate that refuses; Slopdog has about thirty-two refusals, all of them after a
ticket exists. Each wins on different dimensions, and neither guards the decision that matters
most, whether the work should exist at all.

## Trying it

Point Claude Code at the plugin with `claude --plugin-dir ./plugins/slopdog`, or symlink
`plugins/slopdog` to `~/.claude/skills/slopdog`. Scripts are Node (`.mjs`, no build step). Expect
to adapt paths: the harness assumes it lives at `~/slopdog/v2` next to a tasks repo at
`~/slopdog/tasks`.
