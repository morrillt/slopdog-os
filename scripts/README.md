# scripts/

The key scripts of the harness, one job per file, Node not bash. Each opens with a header comment
saying what it does and why it exists. `lib/` holds what they import. This is a selection: the
scripts that run the pipeline and its gates, not every utility in the house.

| Script | Does |
| --- | --- |
| `dispatch.mjs` | Sends one job (usually one ticket, `--write --ticket T-nnn`) to a builder lane in its own worktree, then runs a fresh verifier in the same worktree. |
| `dispatch-gate.mjs` | The refuse checks dispatch runs before any builder starts. |
| `dispatch-ticket-updates.mjs` | Writes the ticket file and task-list updates a dispatch makes. |
| `ready-queue.mjs` | The one answer to "what should I dispatch next". |
| `start-batch.mjs` | Sets the dispatcher going on a batch and keeps it going. |
| `seats.mjs` | Reads and swaps the primary and sidekick builder seats. |
| `check-build-ladder.mjs` | Fails when a script hardcodes a value `config/build-ladder.json` owns. |
| `assumption-sweep.mjs` | Flags open tickets that still state an assumption a house change invalidated. |
| `sprint-moving.mjs` | "Is the sprint moving?", answered from files with no model in the loop. |
| `unstucker.mjs` | Walks the desk panes and unsticks the ones waiting on nothing. |
| `self-clear.mjs` | A desk clears its own context and picks up from `PICKUP.md`. |
| `inbox-write.mjs` | Writes one correctly named message into another desk's inbox. |
| `quick-task-new.mjs`, `quick-task-check.mjs` | Create a quick task; refuse to close one that does not say what was done and how it was verified. |
| `retrospective-append.mjs` | Appends a lesson to the running sprint retrospective. |
| `shared-tree-git-guard.mjs` | PreToolUse guard: no stash, branch checkout or path-less commit in the shared tree. |
| `claude-write-fence.mjs` | PreToolUse write fence for headless builds. |
| `framework-audit.mjs` | The weekly one-page snapshot of skills, hooks, desks and rules. |
| `session.mjs` | Names the terminal session the desks live in. |

`notiontime/` is here only because `quick-task-new.mjs` imports its parser.
