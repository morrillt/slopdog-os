# pstack beside the house pipeline

*Todd asked what would be different if we simply ran the pstack loop as it is written. The answer is that there is no single pstack loop to run: pstack is a router that matches a task to one of twenty-three playbooks and copies that playbook's steps into a todo list, and nothing in it refuses. Our pipeline is the opposite shape, eleven stages with roughly thirty-two places where a script or a hook actually says no. What to do is take one rule from pstack, the one that says a question whose answer could be observed by running something is not the human's to answer, and fix the four house defects that looking for the comparison uncovered.*

| Section | What it covers | The verdict |
| --- | --- | --- |
| §1 (What pstack actually is) | The router, the twenty-three playbooks, the routed skills, the cross-cutting rules, and what enforces them | A rigor library written as prose, Cursor-native, with no gate that refuses |
| §2 (What we actually run) | Eleven stages, the dispatch gate's refusals, the model ladder, and the fifteen rules with nothing behind them | Strong machinery around the ticket, prose around everything that decides whether a ticket deserved to exist |
| §3 (What to do about it) | The one rule to take, the four defects to fix, and what to leave alone | Take the classify rule; fix the four defects; do not import the playbook model |

## The comparison, dimension by dimension

Todd asked which approach is better on each dimension, so the last column says so and gives the reason. The split comes out even at three dimensions each, with one neither of us wins and one that is not a design choice at all. It is not a diplomatic even: we win wherever a machine has to hold the line, pstack wins wherever the work has to carry its own record, and the dimension neither of us wins is the one that matters most.

| Dimension | pstack | Slopdog | Better, and why |
| --- | --- | --- | --- |
| Unit of work | A task typed into a chat. Rigor is selected per task. | A ticket with a type, points, typed acceptance criteria and a batch. Rigor is selected when the ticket is written. | **Ours.** A ticket outlives the conversation that made it, so a different model can verify it later against criteria written before the build. pstack's unit of work dies with the chat it was typed into. |
| Where the steps live | Copied verbatim into a todo list; a skipped step stays with `skip: <reason>`. | In the skill the desk runs. The ticket records the outcome, not the steps. | **pstack.** The record of what rigor a task actually received travels with the task, and a skipped step is visible with its reason. Ours leaves that record in a desk's memory, which is where it goes missing. |
| Gates that refuse | None. | About thirty-two. | **Ours, not close.** An instruction drifts the moment a model is tired, long-context or confident; an exit code does not. Every "Mandatory" in pstack is a sentence a model may quietly skip. |
| Where the gates sit | Nowhere. Five scripts exist; the model chooses to run them. | All after the ticket exists. Nothing gates whether it deserved to. | **Neither.** Both of us are unguarded exactly where it costs most, which is whether the work should exist at all. Ours is guarded well, but only downstream of a decision nothing checked. |
| Model choice | Named per role in prose, overridable by a config file. Grok for code, Opus for judgment. | One file, `build-ladder.json`, read by a library. Points decide the model and the effort. | **Ours.** One file a library reads beats a rule a model reads, and a checker greps for scripts that hardcode what the file owns. pstack's version is the same idea left in prose. |
| Second opinion | "The same prompt against a different model", required to be a different model family. | A different, more expensive model. Family is left open. | **pstack.** Two models from one family share their blind spots, so a more expensive reviewer from the same family buys cost, not independence. Naming the family is the cheaper and stricter rule. |
| Asking the human | Classify first: an answer you could observe is not the human's to answer. Build a sketch. | Product calls go to Todd, technical calls are the desk's. The test is the kind of question, not the kind of answer. | **pstack.** Sorting by the kind of answer closes the gap ours leaves open: "which approach" reads as a preference, so a desk can ask it in good faith when a sketch would have settled it in five minutes. |
| Runs here? | Cursor-native. The Claude Code versions are community ports with one `SessionStart` hook. | This is the house pipeline. | **Not a choice.** A fact about where each one runs, not a design decision, so there is nothing to judge. |

## Contents

- §1 What pstack actually is
  - §1.1 A router, not a loop
  - §1.2 The cross-cutting rules, including the one worth taking
  - §1.3 What enforces any of it
- §2 What we actually run
  - §2.1 Eleven stages and about thirty-two refusals
  - §2.2 How a model gets chosen
  - §2.3 Where our pipeline is prose with nothing behind it
- §3 What to do about it
  - §3.1 Take the classify rule, with a prototype path
  - §3.2 Four defects this comparison uncovered
  - §3.3 What not to take
- Appendix

---

## §1 What pstack actually is

### §1.1 A router, not a loop

pstack is Lauren Tan's (@poteto) Cursor-native plugin, version 0.15.21, installed with `/add-plugin pstack`. The thing Todd called a loop is the `/poteto-mode` skill, and its own README describes three moves rather than a cycle: "when invoked it: 1. matches your task to a playbook and opens a todo list whose first items are its steps, copied in verbatim. 2. routes to the other skills as the steps fire. 3. writes unslopped replies framed for the consumer and the maintainer."

The rigor therefore lives in the playbooks, not in the router. There are twenty-three of them, and each one is a numbered list of steps for one kind of work. The Feature playbook runs the `how` skill, then `architect`, then writes a four-item throughput checkpoint, then delegates the code, then verifies on a matching surface, then rebases into small commits, then runs `interrogate` if the design is contested, then opens a pull request. The Bug-fix playbook reproduces the defect first, binary-searches the cause, plans and delegates the fix, verifies on the same surface, and stages the failing reproduction before the fix. The Prototype playbook scopes the decision, gathers references, builds a throwaway, puts variants behind one switcher, verifies, and hands a recommendation to the Feature playbook.

One discipline in the router is worth noting on its own: a step the model chooses not to do stays in the todo list carrying a one-line `skip: <reason>`. The record of what rigor a task received is therefore in the task, not in the skill that was supposed to run.

The playbooks sort into three groups when set against our work. Some have a direct house equivalent: `session-pickup` reconstructs state from a prior trail and verifies inherited claims, which is our pickup, and `pause-safely` stops at a safe boundary, makes the work durable with one `wip:` commit and writes a resume note, which is our clear. Some describe work we do differently: Investigation, Feature, Bug-fix, Perf-issue, Refactoring, Prototype and Eval all correspond to things a ticket already carries as its type. And a large group is about pull-request mechanics we do not have at all, because our builds merge to main on a green verdict: Babysit, Shipping, Autopilot-full, Autopilot-stack, Opening-a-pr and Visual-parity.

### §1.2 The cross-cutting rules, including the one worth taking

Above the playbooks sit the Non-negotiables, which apply to every run. The one Todd asked for in full reads:

> "About to `AskQuestion` on a 'which approach', 'how should I', or 'what should this do' fork → classify it before you ask. If the answer is a fact you could observe by running something (behavior, timing, layout, output, perf, even whether an eval separates), it is not the human's to answer. Sketch it via the Prototype playbook (`playbooks/prototype.md`) and let the result decide. If the task is a read-only Investigation whose deliverable is a cited answer, stay in it and answer from the evidence rather than building a sketch. Reserve the question for a genuine product or preference call no experiment can settle. Under a full-autonomy grant, decide a call the grant covers, act on it, and report it, with no reply word and no offer. Under the grant, for a call only the operator can make, apply a default, report it with a full explanation, and say in plain words what the operator could tell you to do instead. The operator answers in their own words. Never give a shorthand token to type back. Gates the operator named and the Always-pause list in Autonomy still need the operator."

Three other groups of cross-cutting rules matter for the comparison. The subagent defaults name a model per role rather than leaving it to the agent's judgment: `grok-4.7-xhigh-fast` for code and `claude-opus-5-5-xhigh` for prose and judgment, with the hardest changes going to the judgment model whether or not they need judgment, and a per-role override file written by `/setup-pstack`. Every Task call runs in the background, passes file pointers rather than inlined context, and prefers a fresh subagent, because "interrupt-chained resumes silently drop directives". A second opinion is defined mechanically as "the same prompt against a different model", and `arena`, `interrogate` and `show-me-your-work` all require the reviewing model to come from a different family than the one being reviewed.

The autonomy rules draw a line we draw differently. Reversible work and external actions, including team chat, ticket updates and starting evaluations, proceed without asking. The always-pause list is short and concrete: force-pushing a shared branch, a deploy, deleting data, and messaging a customer. And "No is an acceptable answer" is written as a standing instruction, with candor preferred over agreement.

The reply rules are, almost line for line, the output style Todd wrote for this house, arrived at independently: short declarative sentences, no long-dash character anywhere, no colon used as a mid-sentence connector, "terse is not an excuse to drop content", every claim carrying its evidence or a label saying whether it is measured, inferred or a guess, and "never hand the human a check you could run".

### §1.3 What enforces any of it

Almost nothing. The repository tree contains no hooks and no commands. The genuinely mechanical parts are the plugin manifest, a set of frontmatter keys, and five scripts: a plan linter, a bookkeeping command-line tool for the orchestrate playbook, a pull-request watcher, a read-only worktree audit, and a decision-log appender. Every one of those scripts runs only if the model decides to run it; none of them gates a stage, and nothing at all notices a skipped step. The single mechanical safeguard with real effect is `disable-model-invocation: true`, which stops the model from entering poteto-mode on its own, and the `/setup-pstack` command, which writes a model-configuration file the model then reads.

So every item written as "Mandatory" in a pstack playbook is a sentence addressed to a model. This is worth stating plainly because it was the one thing I got wrong when Todd first asked: I said nothing in pstack checks a stage, then saw three scripts named and doubted it. The scripts exist; the gate does not.

Two details sharpen that. pstack does ship real scripts with real exit codes, five of them, and the plan linter exits 1 when it finds problems, but nothing consumes any of those exit codes: the repository's only continuous integration validates plugin manifests and runs none of the scripts or tests. And the one thing pstack has mechanised is its writing. The plan linter checks the shape of a plan file and also flags long dashes, curly quotes and colons used as mid-sentence connectors, which is the house output style enforced by code, in one file type, by a script the model has to remember to run.

---

## §2 What we actually run

### §2.1 Eleven stages and about thirty-two refusals

Our pipeline runs from a ramble to a batch Todd marks green in eleven stages, each with a named owner and a named output file. An idea is sorted into threads and scored to eight out of ten by the Ideas desk and lands in that desk's intake folder. A department planning meeting shapes a project and a batch. Tickets are sharded against a three-point floor, estimated on the Fibonacci scale, and validated into a readiness block. The batch is handed to the Build desk and enters the focus list. Dispatch opens a worktree on a per-engine branch. A cheap builder works the ticket step by step, committing once per step. A separate, fresh verifier returns `Verdict: GREEN` or `RED`, and a green verdict merges to main. Two red strikes, or an eight-point estimate, reroute the ticket to the Data desk on the strongest model. Todd marks the batch green when every ticket in it is green.

Against pstack's zero gates, this pipeline refuses in about thirty-two distinct places. Roughly twenty-five of them sit in the dispatch gate. A job is refused outright when the weekly sprint stop file exists, when the engine is disabled or is not a builder on the ladder, when write-job concurrency is at its cap, when the target checkout has uncommitted changes, or when the sending desk does not own the sidekick lane. A ticket is refused when its batch is not in the focus list, when it carries stale assumptions, when its department has spent its weekly token share, when it has no points estimate, when a Verify line holds a placeholder or a dead path, when the board mark disagrees with the readiness state, when the step count exceeds what its points tier allows, when a step claims to create a file that already exists, when a functional requirement is proved only by a manual criterion, or when more than two batches are in flight.

Seven more gates sit outside dispatch and refuse rather than warn: the context-rot hook at four hundred thousand tokens, the sprint-stop hook, the shared-tree git guard, the lane lock on concurrent edits, the Gmail send guard, the commit-message hook in both repositories, and the write fence passed to the builder and verifier processes.

### §2.2 How a model gets chosen

One file owns it, `v2/config/build-ladder.json`, and one library reads it. Builders run Sonnet at medium effort for one, two and three points and Sonnet at high effort for five. Verifiers run Opus at low effort for one through three points and Opus at medium for five. Subagents run Haiku at medium for one point, Haiku at high for two, Opus at low for three, Sonnet at high for five and Opus at high for eight, with Sonnet at medium as the default when points are unknown. Eight points, or two failed strikes, escalate to the Data desk on Opus at high effort in solo mode. A points value not listed takes the next listed value up.

This is the same idea as pstack's per-role model lines, and ours is the stronger version, because the ladder is a file a script reads and a checker greps for scripts that hardcode a value the file owns. One cost is recorded in the file's own notes and is worth repeating here: the three-point rung, Opus at low effort, is a figure Todd dictated against the evidence, and it costs more per token than the five-point rung above it.

### §2.3 Where our pipeline is prose with nothing behind it

The gates all cluster after a ticket exists. Almost everything that decides whether the ticket deserved to exist is prose, and a desk that ignored it would pass every check.

The eight-out-of-ten alignment loop is the clearest case. The only mechanical part is a ticket checker that the ticket-writing skill itself describes as mechanical rather than the alignment gate, so a desk can write a note claiming alignment at eight, set the readiness state to ready, and nothing notices. The validator stamp is read only by the queue the dispatcher is shown and by the builder's own preflight, so a hand-run dispatch of an unstamped ticket passes. Todd's three sign-offs in sprint planning are recorded by a state machine that the sprint-planning skill never calls and that nothing downstream reads, so a desk can skip every signature and the focus command still accepts the batches. The critical rule that a subagent's model comes from the ladder has a command-line tool that prints the rung and no check at all on the model an Agent call actually used. The three-point ticket floor and the folding rules are counted by nobody. The output style, including the skills footer and the three-paragraph cap, has no hook anywhere, which is the one place pstack beats us on enforcement: its plan linter flags long dashes, curly quotes and mid-sentence colons, and we flag none of ours. The two caps on batches in flight, three in the focus command and two in the dispatch rules, disagree with each other. And both of the hooks that protect the shared tree can be walked around by a script that edits a file through Node or Python rather than through the Edit tool, which the fence file itself admits.

---

## §3 What to do about it

### §3.1 Take the classify rule, with a prototype path

The recommendation is to add the classify rule to `rules/before-asking-todd.md`. Our current rule divides questions into product calls, which go to Todd, and technical calls, which the desk decides. That division is about the kind of question. pstack's test is about the kind of answer, which is sharper: if the answer is a fact a desk could observe by running something, the desk runs it, whatever kind of question it looked like. A desk currently has a defensible path to asking Todd which of two approaches reads better, because "which approach" sounds like a preference. Under the classify rule it is not a preference if a sketch would settle it.

Two parts of the rule need a decision from Todd rather than a straight import. The first is the prototype path: pstack has a Prototype playbook to route to, and we have no equivalent, so the house version would have to say what a desk does instead, and the honest options are a quick task or a throwaway in the Prototyper desk. The second is the sentence "never give a shorthand token to type back", which argues against our board buttons. Our board renders options as buttons with a Why line each because Todd asked for that, so this is a place where pstack's rule and a standing instruction from Todd disagree, and Todd's instruction wins unless he says otherwise.

### §3.2 Four defects this comparison uncovered

Looking for our side of the comparison turned up four things that are simply broken, each verified by reading the files.

First, `v2/scripts/lib/verify-brief.mjs` does not exist, although the build-ticket skill and both the Tyrion and Data desk instruction files send verifiers to it; dispatch builds its verifier prompt inline instead. Second, no validator-stamp check exists in either the dispatcher or its gate, so the stamp protects only the queue display, not the dispatch. Third, the sprint-planning sign-off state machine is never called by the skill that is supposed to call it, and nothing reads its state, so Todd's three signatures are currently honour-system. Fourth, the error code the sprint-planning skill documents for an empty or missing retrospective is printed by no script in the tree; it appears only in documentation.

A fifth discrepancy wants a decision rather than a fix: a comment in the dispatcher says the verifier runs Sonnet at high effort, while the ladder file says Opus at low or medium. One of the two is wrong and the comparison cannot say which is intended.

### §3.3 What not to take

Do not import the playbook model. pstack's twenty-three playbooks exist because its unit of work is a task someone types into a chat, so the rigor has to be selected per task and copied into a todo list. Our unit of work is a ticket with a type, points, typed acceptance criteria and a batch, so the rigor is selected when the ticket is written and enforced when it is dispatched. Copying playbook steps into our tickets would duplicate what the ticket already carries.

Do not take the pull-request half at all. Babysit, Shipping, Autopilot-full, Autopilot-stack, Opening-a-pr and Visual-parity are about driving a stack of pull requests to green and landing them in order. We merge to main on a green verdict from a separate verifier, which is a different model, and nothing in those six playbooks improves on it.

Do not take the enforcement style, which is the thing Todd's question was really about. If we ran pstack as written we would trade about thirty-two refusals for a set of well-written instructions. Our weakness is the opposite of pstack's and the fix is not to copy it: the gates we are missing are the ones before a ticket exists, which is exactly where pstack has none either.

Two smaller things are worth taking cheaply. The `skip: <reason>` discipline, where a step not done stays visible with its reason, costs nothing and would make a thin ticket obvious in the ticket rather than in a desk's memory. And defining a second opinion as the same prompt against a different model family is tighter than our wording, which says a different, more expensive model and leaves the family open.

---

## Appendix

### Sources

- Upstream pstack, version 0.15.21, read from `raw.githubusercontent.com/cursor/plugins/main/pstack/`: the README, `skills/poteto-mode/SKILL.md`, all twenty-three files under `skills/poteto-mode/playbooks/`, and the routed skills `how`, `why`, `architect`, `interrogate`, `reflect`, `swarm`, `arena`, `figure-it-out` and `show-me-your-work`. Local copies were kept under the session scratchpad.
- `deslop` is not in pstack; it is in the sibling plugin `cursor-team-kit`.
- The Claude Code ports are community work, not Tan's: `michael-denyer/pstack-claude`, which adds one `SessionStart` routing hook, and `potetos-for-everyone`, which describes itself as a replacement for that port.
- House files read: `v2/rules/principles.md`, `critical-rules.md`, `before-asking-todd.md`, `question-language.md`, `system-change-rubric.md`, `commits.md`, `desk-clear.md`; `v2/config/build-ladder.md` and `build-ladder.json`; `v2/lanes.json`; the skills `ideate`, `sprint-planning`, `build-ticket`, `quick-task-add`, `quick-task-do`, `ask-todd`, and `ticket-add`, `tickets-validate` and `task-verify` under `tasks/.claude/skills/`; `v2/scripts/dispatch.mjs` refusal paths and `dispatch-gate.mjs`; the gating hooks and `v2/git-hooks/commit-msg`.

### Methodology

Two subagents did the reading, both on Sonnet at medium effort, the rung `build-ladder.mjs --subagent` prints with no points given. One read pstack at source with curl, so nothing was summarised in transit, and diffed the router skill against the local copy to confirm it matched upstream main. The other read the house pipeline and was asked specifically for the places where we have prose and no gate, since a comparison that only lists our strengths is not worth writing.

Four of the house reader's load-bearing claims were then checked directly rather than taken on trust: the missing verifier-brief file, the absent validator-stamp check in the dispatcher and its gate, the sprint-planning state machine that its own skill never calls, and the retrospective error code that no script prints. All four hold.

### Implementation notes

- The classify rule is a few lines in `rules/before-asking-todd.md` and cannot land as a straight paste: it needs the prototype path named, and it needs Todd's call on the shorthand-token sentence, which conflicts with the board's buttons.
- The four defects in §3.2 are each small and independent. The missing verifier-brief file is the one to do first, because three instruction files point at it, so a verifier following its instructions today finds nothing there.
- The `skip: <reason>` discipline would go in the ticket template rather than in a skill, so that a step left undone is visible to whoever reads the ticket next.
- Nothing in pstack was run. Everything about its behaviour comes from reading its source, and it has not been tested outside Cursor.

### What this report could not confirm

- Whether Cursor honours the frontmatter keys pstack sets, since no Cursor documentation was read.
- The bodies of pstack's pull-request watcher and its orchestrate bookkeeping tool; their exit codes were grepped but not read. The plan linter, the worktree audit and the decision-log appender were read in full.
- Twenty-seven `principle-*` skills in pstack were not read, nor its docs guide, nor the two control skills in `cursor-team-kit`.
- No hook and no dispatch job was run on our side either, so every gate described in §2.1 comes from source and comments rather than a live test.
