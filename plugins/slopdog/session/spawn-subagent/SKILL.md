---
name: spawn-subagent
description: Pick the tier before launching a Claude subagent, then launch it on exactly that model and effort. Use before ANY Agent call, whenever you are about to spawn, launch, delegate to or hand work to a subagent, and when the agent-model-guard hook refuses an Agent call for naming no model. Reads the small examples card, names the tier in one line, resolves it with build-ladder.mjs, and notes the tier in the task or ticket file.
allowed-tools:
  - Bash
  - Read
  - Edit
---

# spawn-subagent — pick the tier first, then launch

Todd, 2026-10-13: whenever a subagent is created, the first step is to consider which
tier it needs, from a very small card of examples. An Agent call that names no model is
refused by the `agent-model-guard` hook (forks excepted), so this is not optional.

1. **Read the card:** `~/slopdog/v2/config/subagent-tiers.md`. It is under 25 lines. Read it
   every launch; the Research desk refreshes it, so do not rely on memory of it.
2. **Pick the tier by the kind of work, not by how hard the job feels,** and say it in one
   line: `Tier: hard — reviewing a diff`. Unsure → `default`. The tiers are `sweep`, `default`,
   `hard` and `ceiling`; there is no other model or effort.
3. **Resolve it:** `node ~/slopdog/v2/scripts/lib/build-ladder.mjs --subagent <tier>` prints
   `<model> <effort>`. Launch the Agent with exactly that `model` and `effort`. If the Agent
   tool has no effort field, say the effort in the prompt. **Start the Agent `description`
   with the tier** (`hard: review T-742 diff`): the hook logs every allowed launch to
   `~/slopdog/v2/reports/usage/subagent-launches.jsonl` (time, cwd, model, effort, subagent
   type, description), and the description is how that log carries your choice. Never type a
   model name from memory, and never use a fork to dodge the choice.
   **A `sweep` launch** (Haiku, whose failure is silently stopping early) states the expected
   item count in the prompt ("there are 100 skills; return one line per skill"). When the
   result comes back, count its lines against that number before using it; a short list means
   relaunch, or move the work to `default`.
4. **Say what you chose and why in the file** when the work has a task or ticket file: two
   front-matter lines, `tier: <sweep|default|hard|ceiling>` and `tier_why: <one sentence, the kind of
   work that picked it>` (Todd, 2026-10-13: "just a couple lines in the front matter, just so we
   can occasionally audit"). Most launches have no file; the logged description is their trail.
   Running a different tier from the card on purpose is allowed; `tier_why` names the reason.
   The two lines are plain `key: value` front matter so another line (a `thread:` field, if Todd
   adds one) can sit beside them later; do not add one now. The log and these lines are an
   audit trail for the early days and may be removed later.

A quick task already carries `tier:` and `tier_why:` (chosen at add time through this same
card), so `/slopdog:quick-task-do` reads those and skips to step 3. The ticket builders are a
different ladder (`builders_by_points` in `v2/config/build-ladder.json`) and are not launched
with this skill.
