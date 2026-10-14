---
name: quick-task-do
description: "Do one quick task from v2/quick-tasks/ end to end: plan, subagent at the task's tier, Verified and Concerns lines, quick-task-check, commit. Use for \"do the quick task\", \"next quick task\", or a named quick-task file."
allowed-tools: Bash, Read, Write, Edit, Agent
---

# quick-task-do — pick, plan, delegate, note, done

The lane is described in `~/slopdog/v2/quick-tasks/README.md`.

## Steps

1. **Pick the task.** A path given → that file. None → your desk's lane key (the lane in
   `~/slopdog/v2/lanes.json` whose `folder` holds your working directory), then the oldest file
   by name in `~/slopdog/v2/quick-tasks/` whose front matter has that `desk:` and
   `status: queued` (an old `status: open` counts as queued). None found → say "no queued quick
   tasks for <desk>" and stop.
2. **Set `status: doing`** in its front matter, set `now:` to planning, and append a Notes line
   `- YYYY-MM-DD HH:MM: started` (`date '+%F %H:%M'`).
3. **Write the plan before any work note.** Add a `## Plan` section (between **Done when** and
   **Notes**) of three to seven numbered lines saying what this run will do — simple and concrete,
   no placeholders. This is the task file's plan, not Claude Code interactive plan mode (that waits
   on Todd). Do not append any Notes line about the work until the plan is saved.
4. **Name the tier, then hand off to a subagent.** Read the front matter's `tier:` line
   (quick-task-add writes it, with a `tier_why:` line, from `~/slopdog/v2/config/subagent-tiers.md`).
   A task with no `tier:` is picked now with `/slopdog:spawn-subagent` (read the card, pick, then
   write `tier:` and `tier_why:` into the front matter); start the Agent `description` with the
   tier (`hard: do quick task spawn-subagent`) so the launch log carries it. Points never choose the model. Run
   `node ~/slopdog/v2/scripts/lib/build-ladder.mjs --subagent <tier>`. It prints
   `<model> <effort>` from `v2/config/build-ladder.json`, the one place those values live. Spawn
   one `general-purpose` subagent (never a fork) with exactly that `model` and `effort` on the
   Agent call; if the tool has no effort field, say the effort in the prompt. The prompt is the
   plan, absolute paths, the task's What and Done when, and the rule to follow quick-task-do's
   finish steps on that file. Append a Notes line
   `- YYYY-MM-DD HH:MM · Executor: <model> at <effort> effort, tier <tier>` before the subagent
   runs, so a reader sees which tier ran and why. `executorFor` in
   `v2/scripts/lib/quick-tasks.mjs` reads the same `tier:` line (missing means `default`), so
   the skill and the code cannot drift; running a different tier on purpose is allowed, named
   in that Notes line with the reason. A `sweep` task's prompt states the expected item count,
   and you check the returned list length against it (see `/slopdog:spawn-subagent`).
5. **Do the work** the subagent returns (or you carry on in this session if the spawn failed):
   until Done when is true. Each time you move to a new step, overwrite `now:` with one short
   phrase (`now: editing buildwatch.mjs`). After each real step, append a Notes line
   `- YYYY-MM-DD HH:MM · <what was done>`. Commit any other files the work changes by path, in
   their own repos.
6. **Blocked** (it needs a ticket after all, or something outside the desk stops it) → set
   `status: blocked` and `blocked_by:` to a one-line reason, clear `now:`, append a Notes line
   saying why; when it needs a ticket, tell the Ideas desk. Skip to step 9.
7. **Finish:** at least one Notes line must say what was done (the created line, a bare
   "started" line, the Executor line, and the two below do not count). Then append two Notes lines,
   `Verified: <what you checked and how>` (or `Not verified: <why>`) and `Concerns: <any, or none>`.
   Set `status: done`, `done:` to today (`date +%F`), clear `now:` and `blocked_by:`, then run
   `node ~/slopdog/v2/scripts/quick-task-check.mjs <path>`. It exits 1 naming a missing line:
   add it and rerun; the task is done only once it prints `ok`. A done task that fails anyway is
   sent back: `quick-task-check.mjs --sweep` (bw once a minute, `quick-task-sweep.timer` every two
   minutes) sets it to doing, appends "Rejected by quick-task-check: …" and writes your desk an
   inbox message; add what it names and run this skill on the path again.
   **Never set `status: reviewed`.** Reviewed is Todd's sign-off, set only from bw's menu with `r`.
8. **Save the final reply** once step 7 prints `ok`. Write the executor's final reply (the text the
   subagent returned, or your own last turn text when you did the work yourself) to a scratch file
   outside the task file, then run `node ~/slopdog/v2/scripts/quick-task-report.mjs <path> < <reply file>`.
   It writes the reply verbatim under a `## Final report` section at the end of the task file, and
   replaces that section if it is already there, so a second run does not duplicate it.
9. **Commit that task file by path** in `~/slopdog`: `git add <path>`, message
   `<your lane key>: quick task <slug> <status>`, `git push origin main`. Never `git add -A`.
10. **Reply** in one line: the title, the new status, what was done.
