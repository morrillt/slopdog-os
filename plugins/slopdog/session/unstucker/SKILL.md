---

Desk-to-desk ladder: SendMessage first, then inbox-write.mjs, then pane typing as the last resort and only into a named herdr agent pane. Email is for humans and the outside world, not desk to desk. See ~/slopdog/v2/CLAUDE.md (Desk file inbox).
name: unstucker
description: Arm the overnight unstucker — a question sweep every thirty minutes that tells any desk waiting on Todd to move its question to the board, re-types the `/clear` or the pickup line for a desk parked halfway through clearing itself, and asks a desk where nothing is thinking and no subagent is running what it is waiting on, plus a one-shot window-reset pass a few hours out that nudges every desk stuck on a spent five-hour window or a refused context ceiling. Use when Todd says "unstucker", "/slopdog:unstucker", "arm the unstucker", "keep them awake", "make sure you guys are all awake tonight", "run the unstucker tonight", "don't let them get stuck", or is going to bed and wants the desks to keep moving without him. Also for checking what is armed and for disarming it in the morning.
allowed-tools: Bash, Read
---

# unstucker — keep the desks moving while Todd is asleep

Todd named it, 2026-09-26: "Let's call it the unstucker." The problem it solves is that a
quiet desk pane has four different causes and they look identical from outside — the desk is
waiting on a question nobody is awake to answer, its five-hour window ran out, its context
ceiling refused the prompt, or it is parked halfway through clearing itself. The unstucker
reads each pane, works out which kind of quiet it is, and types into only the ones where
typing is safe.

The engine is `~/slopdog/v2/scripts/unstucker.mjs`, which lives beside `self-clear.mjs` rather
than in this skill's `scripts/` folder, because the systemd units and Tyrion both call it
directly. This skill arms it and reports; it never types into a pane itself.

**On/off switch:** `v2/desks/watcher/.unstucker-mode` holds `on` or `off` (missing means on); press `u` on build watch's Main page to flip it, and while it is off every real run logs "unstucker off, skipped" and exits without typing (a `--dry-run` still reports).

## Step one — arm both passes

```bash
node $HOME/.claude/skills/slopdog/session/unstucker/scripts/arm.mjs
```

That arms two systemd user timers. Pass a number of hours to change the window-reset pass:
`arm.mjs 3.5`. The default is **4.6 hours**, which is the five-hour window minus a margin;
the number is an argument because the window length changes.

- **The question sweep**, every thirty minutes. It is a tracked, enabled timer
  (`v2/scripts/systemd/unstucker-questions.{service,timer}`, symlinked into
  `~/.config/systemd/user/`), so it survives a reboot; arming restarts it, and a disarm stops it
  only until the next boot (`systemctl --user disable --now unstucker-questions.timer` turns it
  off for good). It logs to `~/.local/state/unstucker.log` like the reset pass. It acts
  only on a pane with a question menu open, escapes the menu, and types Todd's line:
  "This is not the time to answer questions. Please move this to the board." A desk that is
  simply working, or simply idle, is untouched by this pass.
- **The window-reset pass**, once, at the window length. It nudges every stuck pane — idle, a
  menu, or a hook notice left unsent — with "read your PICKUP.md and carry on with the ticket
  in hand".

Both passes also unstick a desk parked in the clear sequence, described next.

## The desk parked in the clear sequence (T-399)

Todd, 2026-09-26: "they're both just kind of like stuck in some clear state, but they're not
doing it and they're just waiting. They're both just waiting for a clear to close. It never
happens. So you need to have in your checking routine, tap their door a bit."

Clearing is two typed lines (`rules/desk-clear.md`): `/slopdog:clear-to-close` writes
`PICKUP.md`, then `scripts/self-clear.mjs` types `/clear` and a detached `--watch` child types
`/slopdog:pickup <folder>/PICKUP.md` once the pane shows the cleared prompt.

The signature comes from the pane it happened on, Tyrion's `%61`. Clear-to-close finished
normally and `self-clear.mjs` exited 0; then peer messages kept arriving and starting fresh
turns, the typed `/clear` never took, and twenty minutes later the pane sat idle at an empty
prompt with its context still around 230k. So the tell is not a refusal and not a dead watcher.
**It is a desk that ran the sequence and whose context never dropped.**

- **`clear-stalled`** — idle, the clear sequence's own printing still on the visible pane
  (`self-clear.mjs`, a `self-clear:` refusal, `clear-to-close`, `pickup-check.mjs`), the context
  bar at 12% or more, and a `PICKUP.md` between two minutes and three hours old (clear-to-close
  writes it seconds before self-clear runs, so its mtime is when the sequence started). It
  types **`/clear`** itself, because the original watcher is waiting on a cleared prompt that
  will never appear on its own. A live watcher does not block this case — two were alive in the
  stall Todd watched — it only corroborates it.
- **`cleared-no-pickup`** — the clear did land but the pickup line never followed: an empty box
  whose only transcript line above it is the echoed `❯ /clear`, and no live
  `self-clear.mjs --watch <pane>` process. It types `/slopdog:pickup <folder>/PICKUP.md`, with
  the folder from `lanes.json`.

The two chain: the `/clear` from the first leaves the pane in the second's state, and either
the original watcher types the pickup line within a second or the next pass does it.

The context bar is the guard that keeps this off working desks. A desk clears at 20% and up, a
desk that really cleared shows a few per cent, and an unreadable bar (a narrow pane, or `ctx …`
before a session's first turn) reads as cleared, so nothing fires.

## The desk where nothing at all is happening (T-399)

Todd, 2026-09-26: "what if there's no subagents running and there's no thinking happening. You
check that every X interval… and if there's neither happening you just say hey, just checking
in, noticed that there's none of that happening, what's up."

Every pass reads whether each desk is alive, all three signals from the pane capture: a spinner
above the input box (a turn is running), an agent row under it carrying an elapsed time and a
token count (a subagent is running), or a transcript fingerprint that changed since the last
pass (something moved). None of the three for a whole interval and the desk gets one plain
line asking what it is waiting on.

- **25 minutes** of quiet, measured across passes rather than at the instant of the check, so a
  desk that went quiet a second ago is not asked. The thirty-minute sweep means two passes in a
  row have to see the same still pane.
- **Once every two hours per pane**, not once per pass. Answering the check-in restarts the
  quiet clock, so without the cooldown a genuinely idle desk would be asked every second pass
  all night.
- The fingerprint stops at the last box edge, leaving the status rows out: the five-hour
  countdown and the spend figure tick on their own and would make a frozen pane look alive.
- A box holding a human's unsent words is never typed into, here as everywhere, and a pane with
  no `herdr-<lane>` agent name is not a desk and is skipped.

State lives in `~/.local/state/unstucker-state.json`, one entry per pane: the fingerprint, the
context reading, when the quiet spell started and when it was last asked. A dry run reads it
and never writes it. Deleting the file costs one pass, nothing more.

## The desk held by an approval prompt

A permission prompt replaces the input box rather than sitting in it, so a pane holding one
used to read as "no claude input box" and was skipped — the worst place to have a blind spot,
since the Build desk is the pane most likely to hit one overnight. It is now its own case:
numbered options after a `❯` with `Esc to cancel` under them. The unstucker presses Escape and
tells the desk to put what it needed approved on the ticket as a question for Todd.

Escape and the line after it are sent with a gap between them. Sent in one breath they arrive
as a single escape sequence and the terminal eats the Escape: fired at a real approval prompt
on a scratch pane it selected "1. Yes" and ran the command. Every nudge now spaces its
keystrokes, which removes the same hazard from the menu case.

## Step two — report what was armed

Read back what systemd actually holds, never assert it:

```bash
systemctl --user list-timers 'unstucker-*' --all --no-pager
```

Tell Todd the two passes, when each fires in local time, and the log path
(`~/.local/state/unstucker.log`). Then give him the disarm line, so it is in front of him
before he goes to bed rather than something he has to ask for in the morning.

## Step three — the disarm line

```bash
systemctl --user stop unstucker-questions.timer unstucker-reset.timer
```

Or `arm.mjs --disarm`, which runs exactly that and prints the timer list after. `arm.mjs
--status` says what is armed without changing anything.

## What it will not do

- It escapes an approval prompt rather than answering it, and never chooses an option.
- It never types into a pane holding a human's unsent words, in either pass. Enter there would
  submit Todd's half-written message, so that pane is reported and skipped.
- It never interrupts a desk mid-turn: a spinner above the input box means leave it alone.
- A pane with no Claude input box in it at all — a shell, a dead desk — is skipped.
- It asks a quiet desk what it is waiting on at most once every two hours, and never while a
  turn is running or a subagent is still going.
- It presses Enter on text it did not type in exactly one case: a notice a hook typed in and
  never submitted (`Mode changed: …`, `Todd answered qN on T-nnn`). Those are submitted as they
  stand, with nothing new added, because the desk was going to read them anyway.

## Checking on it

The log holds one block per run, newest last, each line naming a desk and what was decided:

```bash
tail -30 ~/.local/state/unstucker.log
```

To see what a run would decide right now without typing anything:
`node ~/slopdog/v2/scripts/unstucker.mjs --mode questions --dry-run`. Add `--lane <key>` for
one desk.

## The third pass: the focus sweep is not something this skill arms (T-472)

The two passes above are session-scoped: this skill arms them for a night and disarms them in
the morning. `--mode focus` is different in kind — a standing `focus-sweep.timer` (a tracked
unit, `~/.config/systemd/user/focus-sweep.{timer,service}`, not one of this skill's transient
`systemd-run` units) fires every two minutes, always, forever, and `unstucker.mjs --mode focus`
itself no-ops at once unless `~/slopdog/v2/context.yaml`'s `focus_mode: on` — which only Todd or
Daphne flips, so it only ever does anything while Todd is actually here driving the team. It
never types into a pane: it writes a file-inbox note to the one desk that can act, for three
conditions read straight off the board and the panes (a desk idle with a ready ticket assigned
to it, the focus project running thin, or the focus project fully stalled on Todd). Nothing
here arms or disarms it; that's `systemctl --user {start,stop} focus-sweep.timer`, or just
flipping `focus_mode` in context.yaml.
