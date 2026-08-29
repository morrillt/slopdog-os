End-of-day full system check: merge, verify, clean, deploy, report. (Trigger: `broz:endofday`)

Run a complete health check on the current repo. Work through every phase in
order. Investigate and REPORT first; only take destructive action where this
file says it is safe, or after the user approves.

## Phase 1 — Survey (read-only)

Gather state before changing anything:

```
git status && git branch -vv && git branch -r && git remote -v
git worktree list && git stash list
git log --oneline -20 --graph --all && git reflog -20
gh pr list --state open  --json number,title,headRefName,mergeable,isDraft,statusCheckRollup
gh pr list --state all --limit 20 --json number,title,state,headRefName,mergedAt
```

## Phase 2 — Pull requests, one at a time

For each OPEN PR, oldest first: check mergeability and CI status, merge it,
then re-fetch before the next one so you never merge onto a stale base. Stop
and ask if a PR is a draft, has failing checks, or conflicts.

If there are no open PRs, say so plainly — do not invent work.

⚠️ **Squash merges hide ancestry.** A squash-merged branch keeps its own SHAs, so
`git branch --contains` and `git cherry` both report it as UNMERGED even when it
is fully absorbed. Always verify by CONTENT:

```
git diff --stat origin/main <branch>      # empty  => fully merged
```

Trust that over ancestry every time. Report a branch as merged only on an empty
content diff.

Then fast-forward local main: `git pull --ff-only origin main`.

⚠️ **Untracked files can block the pull.** If git refuses because untracked files
would be overwritten, do NOT delete them blind. Compare each against the incoming
version first:

```
git diff --no-index <(git show origin/main:PATH) PATH
```

If identical, `git stash push --include-untracked -m "endofday: ..."`, pull,
re-verify the hashes match the now-tracked files, then `git stash drop`. If they
DIFFER, stop and show the user the diff — that is unsaved work.

## Phase 3 — Orphans

Find anything stranded. For every extra worktree and local branch, determine
whether it holds unique work:

- Worktree: `git -C <path> status --short | grep -v '^ D'` — anything printed is
  real uncommitted work. Deletions alone mean the directory was cleaned out and
  the worktree is safe to remove. Also hash-compare surviving files against `HEAD`.
- Branch: content diff against `origin/main` as in Phase 2.
- Stashes: list them; never drop one without confirming it is redundant.

Removing a worktree/branch is IRREVERSIBLE — report findings and ask before
deleting, unless the user has already said to clean up.

## Phase 4 — Build integrity

If the project has a documented regeneration command (check `CLAUDE.md`), run it
and confirm the tree is still clean afterwards — that proves the committed
artifacts match what the source actually produces.

⚠️ **Binary artifacts (.xlsx, .zip, .docx, images) differ in BYTES on every rebuild**
because of embedded timestamps and zip metadata. That is not a real diff. If the
repo has a content comparator (e.g. `.github/scripts/compare_xlsx.py`), run it to
confirm. Restore the file with `git checkout --` afterwards so the tree stays clean.

Cross-check any headline numbers the build prints against the figures recorded in
`CLAUDE.md`. A drift there is a genuine finding, not noise.

## Phase 5 — Deploy to production

Only after main is updated and the tree is clean. Use the project's documented
deploy command from `CLAUDE.md`.

Then VERIFY the deploy actually took, rather than trusting the CLI's success line:

```
curl -s <prod-url> -o /tmp/prod.html -w "http=%{http_code} size=%{size_download}\n"
sha256sum /tmp/prod.html <local-built-file>
```

Matching hashes prove production is serving the committed build. If they differ,
identify WHICH commit production corresponds to by hashing the file at each recent
commit (`git show <sha>:<path> | sha256sum`) — that pins down exactly how far
behind it is. Also grep the live page for a marker of the newest feature.

## Phase 6 — Report

Lead EVERY line with a status emoji so Todd can scan without reading prose:

- ✅ done and verified
- ⚠️ done, but with a caveat worth knowing
- ❌ blocked or not done
- 🔲 waiting on Todd's decision

Group by STATUS, not chronology. Put ❌ and 🔲 items where they cannot be missed.
Never mark something ✅ that was only partly done — use ⚠️ and say what is missing.
One emoji per line at the start, not sprinkled mid-sentence.

Cover: PRs merged, main's position, orphans found, build integrity, production
state, and anything awaiting a decision. Show evidence (hashes, diffs, counts)
rather than assertions — "production is byte-identical to main" beats "deploy
looks fine".

Finish by asking whether the report looks right and if there is any feedback.

## Phase 7 — Close the loop

Do NOT end the session at the report. Loop until every 🔲 is resolved:

1. Todd gives feedback on the 🔲 items.
2. Process the ones he approved. Re-verify safety IMMEDIATELY before any
   irreversible step — state can have changed since Phase 3.
3. Re-report with the same emoji flags.
4. If the work surfaced NEW 🔲 items (pruning often reveals more orphans), raise
   them rather than acting. Anything outside what he approved needs its own yes.

Then check what is still unanswered:

- ❗ **If he skipped something you judge important — remind him, once, and say why
  it matters.** Do not let a significant item die in silence just because it was
  not mentioned in his reply. Be specific about the consequence of leaving it.
- ✅ **If everything is resolved and nothing is outstanding**, sign off plainly:

  > **Goodbye, sir. All done — feel free to archive this.**

Only give that sign-off when it is actually true: main updated, tree clean, no
orphans, production verified, no open 🔲. If anything is still hanging, say what
it is instead of signing off. Never use the sign-off as a way to end an
untidy session.
