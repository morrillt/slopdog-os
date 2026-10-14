# The build ladder (`build-ladder.json`)

One file says who builds a ticket, who verifies it, and when it moves up. Todd reads and
edits `build-ladder.json`; every script reads it through `v2/scripts/lib/build-ladder.mjs`,
and `v2/scripts/check-build-ladder.mjs` fails when a script keeps its own copy of a value
the file owns. Tickets: T-714 (the file and loader), T-715 (the policy values).

**The policy today (Todd, 2026-10-12): Claude only, chosen by points.** His words: "from a simplicity
perspective... we're just doing everything for now inside of the Anthropic ecosystem." And for why:
"I want to optimize right now for stability and this thing's working. And then we can, after we have
things stable, we can think about, okay, let's see if we can pull in Gemini." The ladder, in his
final words ("for one and two, let's build Sonnet Medium. The cost is such a small difference, and
it's a pretty big jump"):

| Points | Builds | Verified by |
| --- | --- | --- |
| 1, 2, 3 | Claude Sonnet, medium effort | Claude Opus, low effort |
| 5 | Claude Sonnet, high effort | Claude Opus, medium effort |
| 8 | Data (Opus, high effort, solo) | Data verifies its own work |

On 8 he said: "for eights, if there are any, just have that go directly to Data. I mean, why not?"
That is `escalate_from_points: 8`, so 8 has no entry in `builders_by_points` or `verifiers_by_points`.
The verifier is always a fresh `claude -p` session, so it does not know a Claude built the work: "as
long as we're starting a new context session... I don't think Claude is going to know that another
Claude used it." A GREEN verify merges the build branch to main and sets the ticket 🟩. A RED verify
is a strike, and the same build runs once more on the same branch; the second strike sends the
ticket to Data, whose inbox gets the hand-off. The old rule that sent a ticket with more than four
open steps to Data is off: `escalate_above_steps` is absent from the file, and the loader still
honours it if it is ever set again. Composer is off the ladder.

**Gemini is parked, not deleted.** `builder` (Gemini on agy, `quota_chains.build` with Grok behind
it) still stands in the file for the one place that has no ticket to read points from, a plain
`dispatch.mjs` job with no `--ticket`, and for an explicit `--engine gemini`. Return to it only
once things are stable, not on any date, and move it back by adding Gemini rungs to
`builders_by_points`.

**How one build runs.** `node v2/scripts/dispatch.mjs --write --ticket T-nnn` (what
`seats.mjs route` prints, with the engine the ticket's points name) checks the ticket at the gate,
makes the ticket's own worktree on branch `sidekick/<engine>/T-nnn`, runs the builder headless in it,
then runs the verifier in that same worktree. With no `--engine`, dispatch reads the ticket and takes
the engine and rung from `builders_by_points`. The Claude builder is `claude -p` with `--model` and
`--effort` from the rung, `--dangerously-skip-permissions` and stream-json output, the same headless
runner the OpenRouter engine uses. A PreToolUse write fence, `scripts/claude-write-fence.mjs` passed with
`--settings`, refuses the Claude builder's and verifier's Edit, Write and writing Bash outside the worktree, the ticket and
`task-list.md` before they happen (verified 2026-10-12); the post-run fence check stays as the backstop. It commits as lane `build`, signs its notes "Claude <model>", leaves the ticket and task list
uncommitted for dispatch to commit, and has no quota fall-over: a Sonnet quota error stops the build
rather than swapping builders. On GREEN, main is merged into the branch inside the worktree first, so
a conflict never touches the shared tree, then main fast-forwards to the branch and is pushed; a
conflict or a main that will not fast-forward leaves a ready-to-merge note for Tyrion instead. On RED,
`verify-fail.mjs` writes the strike and dispatch reruns itself, reusing the worktree, with the failure
at the top of the brief. The builder's brief has no preflight: the gate already accepted the ticket.

**Claude subagents run on one of four tiers, picked by kind of work (Todd, 2026-10-13).** Points
no longer choose a subagent's model; the kind of work does. `subagent_tiers` holds four rungs:
`sweep` (Haiku, high effort: narrowly scoped subtasks that read or index many things with one fixed
question and return a list, never judgment, edits or reviews), `default` (Sonnet, medium: specified
work, and where an unsure call lands), `hard` (Sonnet, high: longer or harder but specified work,
including reading a body of sources and reviewing someone else's work) and `ceiling` (Opus, medium:
open-ended work that needs sustained judgment). His words for the shape: "sonnet medium -> sonnet
high -> opus medium with some haiku (medium or high) just narrowly scoped for subtasks with like
indexing big things etc, like look over 100 skills etc." Haiku at 1 point and Opus low are retired
as points rungs (Todd: "remove the opus low tier its too confusing").

A desk never picks a model from memory. It runs `/slopdog:spawn-subagent`: read the small card
`v2/config/subagent-tiers.md` (the Research desk owns it and refreshes it from research published in
the last week), say the tier in one line, then run
`node ~/slopdog/v2/scripts/lib/build-ladder.mjs --subagent <tier>`, which prints `<model> <effort>`
for the `Agent` call. No tier, an unknown tier or a number prints the default tier (a number also
prints a one-line stderr note that points no longer choose a model). The hook
`plugins/slopdog/hooks/agent-model-guard.mjs` refuses an `Agent` call that names no model, forks
excepted, because 212 of 218 September launches named none and ran on the launching desk's own model.
A quick task carries its choice as `tier:` and `tier_why:` front-matter lines (quick-task-add writes
them and `executorFor` in `v2/scripts/lib/quick-tasks.mjs` reads `tier:`; a task with none runs on
`default`), and the hook appends every allowed launch to `v2/reports/usage/subagent-launches.jsonl`
with the tier at the start of the Agent description. **That log and the two front-matter lines are a
temporary audit trail** so Todd can occasionally check the choices in the early days; his word:
"maybe we take this out later". A `sweep` launch states the expected item count in its prompt and the
delegating desk checks the returned list length against it, because Haiku's failure is stopping
early without saying so.

**The tiers climb one cost curve.** On Terminal-Bench 4.0 and FrontierCode (Anthropic's Sonnet 5.5
launch charts, accuracy against cost per attempt) each step from Sonnet medium to Sonnet high to Opus
medium costs more and scores higher, and Sonnet high ties Opus medium on long-horizon knowledge work
for less money. **No tier uses `max` effort**: both Sonnet and Haiku scored worse at max than at the
rung below it in the Publish desk's Sonnet 5.5 roundup
(`v2/desks/ideas/inbox-archive/2026-10-10-1754-from-mac-sonnet55-roundup.md`), and Opus gains nothing
from effort above medium. The evidence for each tier, and what is still untested (Haiku high against
medium, Sonnet high against Opus medium on the house's own work), is in `notes.subagent_tiers` beside
it and in the Research desk's report "The Subagent Ladder"
(`v2/desks/research/reports/2026-10-13-the-subagent-ladder.md`).

| Key | What it means |
| --- | --- |
| `builders_by_points` | The engine, model and effort a ticket builds on, keyed by its estimate points. A points value not listed takes the next listed value up; 8 is absent on purpose, since `escalate_from_points` sends it to Data first. |
| `builder` | The parked Gemini builder: the engine a dispatch with no ticket starts on, and what a ladder without `builders_by_points` uses for everything. |
| `verifiers_by_points` | Which model checks a build, keyed by the ticket's estimate points: Opus low for 1 to 3, Opus medium for 5. A points value not listed takes the next listed value up. |
| `subagent_tiers` | The model and effort a Claude subagent runs on, by tier name: `sweep`, `default`, `hard`, `ceiling`. All four must be present. `default` is also what dispatch uses for a Claude build with no ticket rung. Read with `build-ladder.mjs --subagent <tier>`; points never choose a subagent's model. |
| `notes` | Plain notes on a value. `notes.subagent_tiers` records that Todd set the four tiers on 2026-10-13 (the default on 2026-10-10), the cost-curve evidence for each, and what is still open (the sweep tier's effort). `notes.8.now` records Todd's decisions on 8-point tickets (T-715 q3, then 2026-10-12), `notes.builders_by_points.now` the 2026-10-12 builder rungs, and `notes.builder.parked` the condition for bringing Gemini back. |
| `escalate_from_points` | A ticket of this many points or more starts at the escalation rung with no strikes, skipping the builder (8: Todd, 2026-10-11, T-715 q3; "just have that go directly to Data," 2026-10-12). Checked before the strikes. Must be a positive integer when present. |
| `escalate_above_steps` | Absent today (Todd, 2026-10-12): a ticket's size in steps no longer sends it to Data. When present, a ticket with more open (unticked) steps than this starts at the escalation rung. Must be a positive integer when present. |
| `escalate_after_failures` | How many strikes move a ticket to the escalation rung. |
| `strike_categories` | Which `verify failed [category]` Progress notes count as a strike. Others (stale base, quota) do not. A strike can be voided (T-742): `node v2/scripts/dispatch.mjs --void-strike <T-id> --reason "<why the build is not at fault>"` writes a `strike voided: <reason>` Progress note that takes back the latest standing strike, for a RED the ticket's own cut caused. It is refused without a reason, and when the ticket has no strike to void. |
| `escalation` | The rung a ticket goes to after its strikes: Opus at high effort, solo (Todd, 2026-10-11), on the `data` lane. `steps` is what it does in order: check the ticket makes sense against its batch and project, build it, verify it. |
| `escalation.independent_verify` | `false` (Todd's policy today): Opus verifies its own work. `true` adds a cheap separate verifier that reads only the Verify lines. Todd is deciding this on the board (T-715 q2). |
| `disabled_engines` | Engines dispatch refuses outright, with a message naming this file. Composer is here because Todd may cancel Cursor. |
| `engine_models` | The default model each engine runs when no `--model` is given (not the Claude builder, whose model and effort come from `builders_by_points`). |
| `quota_chains` | Where dispatch falls over to when an engine is out of quota, for build jobs and for verify jobs. The build chain is Gemini alone, so an out-of-quota builder stops rather than silently becoming another one. A disabled engine never appears here. |
| `auto_verify_lane` | The lane name the automatic post-build verifier (T-708) writes under. |
| `verify_brief_by_points` | Which verify brief a ticket gets, by its points (T-742): `trusted`, the short judgement-led brief that still asks for proof in so many words, or `prescriptive`, the brief with exact commands. Every verifier is Opus now, so the brief follows the size of the ticket, not the model: 1 to 3 points get `prescriptive`, 5 points get `trusted`, and a points value not listed takes the next listed value up (the rule `verifiers_by_points` uses). The escalated verify on the Data lane always gets `trusted`, whatever the points. This is the Captain's default (2026-10-13), not Todd's word, and Todd can override it by editing this key. Both briefs write the verify log shape in `v2/desks/research/reports/2026-10-11-when-and-how-to-verify.md` §4 under `## Progress notes` before the 🟩 note. Both briefs and the one verdict parser live in `v2/scripts/lib/verify-brief.mjs`, which `node v2/scripts/lib/verify-brief.mjs --pathway cheap\|trusted --ticket <path>` prints. |

Keys starting with `_` are comments and are never read.
