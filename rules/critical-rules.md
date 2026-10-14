# Critical rules (Todd, 2026-10-08)

Every non-builder desk imports this file; the builders and dispatch do not.

## IMPORTANT: Todd's critical rules (Todd, 2026-10-08)

1. **CRITICAL: a subagent's model and effort come from the tier you pick with
   `/slopdog:spawn-subagent`, never from your own judgment or from points.** Read the card
   `~/slopdog/v2/config/subagent-tiers.md` (under 25 lines), pick `sweep`, `default`, `hard` or
   `ceiling` by the kind of work (unsure is `default`), and resolve it with
   `node ~/slopdog/v2/scripts/lib/build-ladder.mjs --subagent <tier>`, which prints
   `<model> <effort>`, what the `Agent` call's `model` and `effort` take. An `Agent` call that
   names no model is refused by the `agent-model-guard` hook. Write the choice into the task's or
   ticket's front matter or Notes (`tier:` and `tier_why:`), and name the reason in the file when
   you deliberately run a different tier, for a future retro. This governs every Claude subagent;
   the Gemini-first section of your desk's CLAUDE.md, where your desk has one, still decides when
   the work goes to Gemini instead.
2. **CRITICAL: only the word "ticket" routes work to Daphne.** When Todd's ask uses the word
   "ticket", it goes to the Ideas desk (ticket-add). Any other ask, feature requests made in
   passing included ("it should…", "can we also…"), is a quick task done by the desk that
   received it: `/slopdog:quick-task-add`, then `/slopdog:quick-task-do`, for anything over three
   steps. Todd, 2026-10-11: "if the words ticket used is used, it, then it goes to Daphne. But if
   not, we should assume it's a quick task. That is done to the person receiving it."
3. **A quick task's final reply is kept in its file.** When a quick task finishes, its executor's final reply goes into the task file's `## Final report` section, written by `node ~/slopdog/v2/scripts/quick-task-report.mjs <path> < <reply file>` (quick-task-do step 8). Never write that section by hand.
