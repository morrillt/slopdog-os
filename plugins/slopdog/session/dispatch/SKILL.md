---
name: dispatch
description: Document every execution route in dispatch.mjs — visible herdr pane (default for builds), headless, the Cursor chat id and --resume, and Mac Ghostty window — and how to verify each.
allowed-tools:
  - Bash
  - Read
  - Grep
  - Glob
disable-model-invocation: true
---

# /slopdog:dispatch — execution routes in `v2/scripts/dispatch.mjs`

Read `v2/scripts/dispatch.mjs` when this skill and the script disagree; the script is authoritative.

**The ladder:** who builds, who verifies by points and when a ticket escalates are read from `v2/config/build-ladder.json` (T-714, T-715) through `v2/scripts/lib/build-ladder.mjs`; this skill names no engine policy of its own. Dispatch refuses an engine in its `disabled_engines`, stamps `verifier:` from `verifiers_by_points`, and when `builderFor` says the escalation rung (`escalate_from_points`, `escalate_above_steps`, or `escalate_after_failures` strikes) records the escalation, writes the hand-off into the escalation lane's inbox with `inbox-write.mjs`, prints `route: <lane>` and exits 3. `v2/scripts/check-build-ladder.mjs` is a test that fails while a caller hardcodes a ladder value; it is no longer a dispatch gate. Dispatch refuses `--engine prototyper` and `--engine data`, and refuses tickets whose `verifier:` is `prototyper` or `data`.

**The cheap lane is two steps (T-740).** `dispatch.mjs --write --ticket T-nnn`, which `seats.mjs route` prints, is the one build command: headless, in the ticket's own worktree (`sidekick/<engine>/T-nnn` under `v2/.worktrees/`, reused by a correction round), then the auto-verify below. Nothing runs between build and verify: no Verify commands before the build, no preflight in the brief, no trail bounce after it, no test-writer round, and a ticket build never folds the sidekick's inbox.

## Visible herdr pane (`--pane`, default for builds)

**When:** Default for sidekick engines (grok, gemini/agy, openrouter) when the job is not `--ticket`, not `--write` on an unattended engine, and neither `--headless` nor `--window` was passed. `--pane` asks for the pane explicitly.

**What:** `dispatch.mjs` resolves the sending desk's sidekick lane, finds an idle cursor or agy agent in herdr (`herdr-<lane>` or the pane labelled `<Name> (<lane>)`), and types a one-line prompt that runs the inner `--headless` command so Todd can watch the build in a **visible herdr pane**. Builds are expected to run here, not headless-by-default.

**Verify:** From a desk folder that owns the engine, `node v2/scripts/dispatch.mjs "noop" --engine grok --dry-run 2>&1 | grep dispatch-routed`. With a stub herdr agent idle, `node v2/scripts/dispatch.mjs "noop" --engine grok --pane` prints `sent to herdr pane` and does not run headless in the outer process.

## Headless (`--headless`)

**When:** `--headless` opts out of the pane; `--ticket` / `--ticket-path` jobs always run headless; `--write` on grok or agy runs headless as this process's child; a missing or busy pane logs a reason and falls back to headless unless the pane was busy on cursor/agy (then dispatch refuses).

**What:** The job runs in the `dispatch.mjs` process (or its direct child), streams output, writes `<lane>/jobs/<stamp>.md`, and exits with the job's code; a desk starts it with `run_in_background` and ends its turn, and the exit notice wakes it. Post-job ticket updates, the auto-verify and ledger rows use this path.

**Verify:** `node v2/scripts/dispatch.mjs "say hi" --engine grok --headless --timeout 30` with `DISPATCH_CURSOR_BIN` pointing at a stub that prints a json result exits 0 and creates a job file under the lane's `jobs/`.

## Cursor chat (`cursor_chat`, `--resume`)

**When:** A grok or ideas-grok job that carries a ticket. A `--job write` does not record a chat.

**What:** The first attempt creates a Cursor chat, writes `cursor_chat` (id, lane, model, ring) into the ticket front matter, and launches with `--resume` and that id so the chat holds the work. A later attempt with the same lane, model, and ring launches with `--resume` and the stored id; the prompt is only the verifier's failure text or the run's error, or `Retry this ticket.` when neither is present. `--continue` and a bare resume are never used. A different lane, model, or ring creates a new chat and overwrites `cursor_chat`. When a resume exits with no result and the text says the chat is gone, dispatch creates a new chat, overwrites `cursor_chat`, appends a Progress notes line saying the resume failed and a fresh session started, and launches that session with the full brief. A `--dry-run` that would resume prints `cursor route: --resume` and the stored id, then the brief, and does not start a builder or write the ticket.

**Verify:** On a fixture ticket whose `cursor_chat` lane, model, and ring match the engine, `DISPATCH_QUOTA_STATE_PATH` pointing at an empty file, `node v2/scripts/dispatch.mjs --engine grok --ticket-path <fixture> --dry-run` prints `cursor route: --resume` and the stored id. The skill text names `cursor_chat` and `--resume`.

## Quota report (`--quota`)

**When:** Any time Tyrion or Todd needs to see which provider:model keys are exhausted and when they reset.

**What:** Reads `DISPATCH_QUOTA_STATE_PATH` (default `v2/state/engine-quota.json`) and prints one tab-separated line per key: `key`, `exhausted` or `available`, and the reset timestamp (parsed from the provider message or the default six-hour backoff).

**Verify:** With a temp state file, `node v2/scripts/dispatch.mjs --quota` exits 0 and lists every key.

## Mac Ghostty window (`--window`)

**When:** Mac only (`darwin` + `/usr/bin/open`); not used with `--ticket`. Re-runs the same command in a new Ghostty window so a long job is visible without taking a pane on the slopdog screen.

**What:** Outer `dispatch.mjs` opens Ghostty with the inner argv (including `--headless`) and exits 0 immediately; the inner run behaves like headless.

**Verify:** On Mac, `node v2/scripts/dispatch.mjs "noop" --engine grok --window` exits 0 without blocking. On Linux, the same command exits 2 and stderr mentions Mac only.

## Auto-verify after build (`--no-auto-verify`)

**When:** When a dispatch build job with a ticket exits 0 and the ticket reaches `🔍 verifying`, unless `--no-auto-verify` is passed.

**What:** Dispatch launches exactly one verify job on the ladder's verifier for the ticket's points (`verifiers_by_points`; a Claude verifier runs through the `claude` CLI with its effort), under the config's `auto_verify_lane`, with its working directory set to the build's worktree and the branch named in the prompt, killed after `DISPATCH_VERIFY_TIMEOUT_SEC` (default 1800). The build's own wake note to Tyrion is skipped, since the verify outcome is the report. If the verifier cannot start, times out, or hits quota, dispatch writes an explanatory note to Tyrion's inbox and exits cleanly (exit 0). When the verify returns `Verdict: GREEN`, dispatch merges `main` into the build branch inside the worktree, fast-forwards `main` to it, pushes, removes the auto-made worktree and branch, and sets the ticket 🟩 (status line and row, `verifier:` and `started:` removed) with a merge note and the verifier's `Evidence:` line as the last Progress note; a conflict, a checkout not on `main`, or a `main` that will not fast-forward leaves a `ready-to-merge` note in Tyrion's inbox instead. When the verify returns `Verdict: RED`, dispatch records the strike with `verify-fail.mjs` (the reply's `AC:` and `Category:` lines), and either hands the ticket to the escalation lane (the strike reached `escalate_after_failures`) or sets it 🟡 and runs the same dispatch command once more, which reuses the worktree and opens its brief with the failure. A verify reply with no verdict line writes a `verify-no-verdict` note to Tyrion's inbox, with the tail of the reply, and nothing is merged or rebuilt. `--no-auto-verify` skips the auto-verify step entirely.

**Verify:** Run tests in `v2/scripts/dispatch.test.mjs` matching pattern `T-708|T-740`.

