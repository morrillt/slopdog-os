# Subagent tiers (read before every launch)

Pick a tier by the kind of work, then run `node ~/slopdog/v2/scripts/lib/build-ladder.mjs --subagent <tier>`; it prints the model and effort for the Agent call.

| Tier | Pick it when |
| --- | --- |
| `sweep` | Many items, one fixed question, the answer is a list (scan 100 skills for a field, index a folder, list every file mentioning X). Never judgment, edits or review. Guard: the prompt states the item count ("there are 100 skills; return one line per skill"); check the returned length against it, relaunch or use `default` if short. |
| `default` | Specified work: a lookup, one file, a check with a verifiable answer. Scope fits in one sentence. |
| `hard` | Longer or harder but still specified: edits across several files, reading a body of sources, reviewing someone else's work. |
| `ceiling` | Open-ended work needing sustained judgment: ambiguous requirements, a decision with no stated answer, cross-cutting design. |

Examples:
- List every skill whose front matter lacks `description` → `sweep`
- Find where `executorFor` is defined; add one field to one script and its test → `default`
- Review a builder's diff against its ticket; read five reports and write up the findings → `hard`
- Redesign how the ladder picks a model → `ceiling`

Unsure → `default`. Reading, reviewing and writing up is `hard`, not `ceiling`. No other model or effort exists.

Do not over-shift work down to `sweep` to save money: measured on a real bug fix, the gap between the cheapest and dearest tier came out about 3x per task, not the 20x the list prices imply, because the harness's own overhead dominates a small task (Deriv Tech, 9 Oct 2026). And never add an advisor or reviewer model to a launch: in that same test the Opus advisor re-read the whole session uncached and cost more than the worker it was advising.

The Research desk owns this card and refreshes it from research published in the last week; source: `v2/desks/research/reports/2026-10-13-the-subagent-ladder.md` (section 3.1).
