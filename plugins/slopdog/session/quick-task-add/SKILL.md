---
name: quick-task-add
description: Write one quick task, a small piece of work one desk just does, with no ticket, batch, builder or verifier, into ~/slopdog/v2/quick-tasks/ from its TEMPLATE.md, given a sentence. Any desk may use it. Use when Todd says "quick task", "make a quick task", "/slopdog:quick-task-add", or the work is small, needs no validation and the named desk can finish it alone. A trailing `critical` argument or the words "important" or "critical" in the sentence mark the task critical (the CRITICAL badge on bw and the hotfix meaning in rules/vocabulary.md; the executor's model comes from the task's tier, not from critical). Anything that needs a builder, a verifier, a batch or a plan sign-off is a ticket instead (the Ideas desk, ticket-add).
allowed-tools: Bash, Read, Write
---

# quick-task-add — a sentence in, one task file out

Todd, 2026-10-06: "just doing tech tickets, there's much less steps, but there's some structure."
The lane is described in `~/slopdog/v2/quick-tasks/README.md`; the shape is `TEMPLATE.md` there.

## Steps

1. **Ticket or quick task?** Needs a builder, a verifier, a batch or Todd's sign-off on a plan →
   stop and say it is a ticket for the Ideas desk. Otherwise go on.
2. **Pick the desk.** The one Todd named; none named → your own. Your desk is the lane in
   `~/slopdog/v2/lanes.json` whose `folder` holds your working directory. Use the lane key
   (`prototyper`, `ideas`, `it`), never the display name.
3. **Critical?** From `~/slopdog`, run
   `node -e "import { parseQuickTaskAddInput } from './v2/scripts/lib/quick-tasks.mjs'; console.log(JSON.stringify(parseQuickTaskAddInput(process.argv.slice(1).join(' '))))" -- <Todd's words>`
   Use `.criticalLine` in front matter and `.matched` in the reply.
3b. **Pick the tier, and size it.** Read `~/slopdog/v2/config/subagent-tiers.md` (under 25 lines)
   and pick the tier by the kind of work: `sweep` (many items, one fixed question, a list for an answer), `default` (specified work, and where an unsure call
   lands), `hard` (longer or harder but specified, including reading sources and review) or
   `ceiling` (open-ended work needing sustained judgment). Write it as a `tier: <tier>`
   front-matter line and a `tier_why: <one sentence, the kind of work that picked it>` line
   under it in step 5 (Todd, 2026-10-13: a couple of front-matter lines so we can audit the
   choice). Also put a Fibonacci size estimate on the task as
   `points: <n>` (1 one obvious edit, 2 simple, 3 a few files or one judgment call, 5 real
   design, 8 only when it is really a ticket, step 1); points are a size note only and never
   pick the model, the tier does. Run `node ~/slopdog/v2/scripts/lib/build-ladder.mjs --subagent <tier>`; it
   prints `<model> <effort>` from `v2/config/build-ladder.json`, and quick-task-do spawns the
   executor on exactly that. Never name a model yourself; a task you cannot place takes
   `tier: default`.

4. **Name the file** `~/slopdog/v2/quick-tasks/YYYY-MM-DD-<slug>.md`, today's local date
   (`date +%F`), a three-to-six-word kebab slug. If it exists, add `-2`.
5. **Copy `TEMPLATE.md` and fill it:** `title`, `desk`, `status: queued`, `created:` today,
   `done:`, `now:` and `blocked_by:` left blank (never `status: reviewed`, which only Todd sets
   from bw); `critical: true` when step 3 said critical, otherwise a blank `critical:` line; `tier:`, `tier_why:` and `points:` from
   step 3b; the
   `#` heading repeats the title; **Asked** is Todd's words, lightly cleaned; **What** one or two
   sentences; **Done when** one or two lines; **Notes** one line,
   `- YYYY-MM-DD HH:MM: created` (time from `date '+%F %H:%M'`). No `## Plan` yet — quick-task-do
   writes that before work runs.
6. **Commit that one path** in `~/slopdog`: `git add <path>`, message
   `<your lane key>: quick task <slug>`, then `git push origin main`. Never `git add -A`.
7. **Reply** in one line: the title, the desk, the path, and when critical the word that
   triggered it (`critical` / `important`).
