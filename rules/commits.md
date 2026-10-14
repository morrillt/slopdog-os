# Commit messages

Todd, 2026-10-08: "we need rules around commits, what are people doing, ticket numbers, what
decisions they took and why. structure! enforced." A commit records who did it, for which
ticket, and why; the diff already says what.

```
<lane> T-<id>[-<n>][ step <N>]: <what changed>      ticket work
<lane>: <what changed>                              anything else

Why: <the reason for the change>                    required
Decision: <choice taken> — <alternative rejected>   optional, one line per decision
```

- `<lane>` is a key in `v2/lanes.json`, a desk folder under `v2/desks/` (publish, research), or `todd`.
- A T-id must be a ticket under `~/slopdog/tasks/tickets`, archive included.
- A script's commit carries `Auto: <script-name>` instead of `Why:`, and still has the lane prefix.
- A bare `wip` is rejected. Merges, `git revert`, cherry-picks, `fixup!`/`squash!`/`amend!` and
  anything mid-rebase pass untouched.

Example: `build T-552 step 2: dispatch writes the worktree path into the job file`, then
`Why: the verifier was guessing the worktree from the branch name and picked a stale one.`

Enforced by `~/slopdog/v2/git-hooks/commit-msg` (tests beside it), wired as `core.hooksPath`
in `~/slopdog` and `~/slopdog/tasks`, so every worktree of either repo gets it. A rejection prints
the format and an example. `--no-verify` exists for emergencies only; say why in the next commit.
