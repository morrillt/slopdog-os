---
name: cmux-panel
description: Open things FOR Todd in the cmux right-hand panel instead of asking him to open them himself — a browser tab for an API key page, a signup, a login, a dashboard or docs; a terminal tab for something he must type or authenticate interactively; a rendered markdown tab for a report. Use whenever you are about to say "go to X", "sign up at Y", "grab a key from Z", "run this command", or "paste your token" — open it instead, then ask for the value. Also use when Todd says "open that", "put it in the panel", "make it a tab", or asks why something isn't showing up on his screen.
allowed-tools:
  - Bash
  - AskUserQuestion
  - Read
  - Write
  - Edit
---

# cmux-panel — open it yourself, don't send Todd on errands

**The rule Todd asked for, in his words: "if you need something do it."**

Never end a turn with "go to console.groq.com and grab a key." Open the page, then ask
him for the value. Never say "run this command" for something interactive — open a
terminal tab in the panel and tell him it's waiting. The panel is on his screen already;
use it.

## Steps — always ask where first

Todd decides which pane a thing lands in. Never guess, never split on your own
(2026-09-01: auto-created panes kept cramping his screen).

**Step 1 — list the panes.**

```bash
~/.local/bin/cmux-panel panes
```

Prints `L1 pane:3 594x456 4 tabs`, `L2 …`, `R1 …` — column letter, position
from the top, ref, size, tab count, `*` on the focused one.

**Step 2 — ask him.** `AskUserQuestion`, one question: "Which pane for
<the thing>?" Options: each pane from step 1 by its `L1`/`R1` name with the
tab count, plus **"New pane on the right"**. Skip the question only if he
already said where in this message ("put it in R1").

**Step 3 — open it as a tab at the right end of that pane.**

```bash
~/.local/bin/cmux-panel --pane pane:NN browser <url> [tab title]   # key pages, logins, dashboards, docs
~/.local/bin/cmux-panel --pane pane:NN terminal [tab title]        # interactive shells, auth flows
~/.local/bin/cmux-panel --pane pane:NN markdown <path>             # rendered, live-reloading
~/.local/bin/cmux-panel --new markdown <path>                      # only when he chose "new pane"
```

It prints the surface ref. Without `--pane` or `--new` it refuses — that's
deliberate.

**Step 4 — give him his cursor back.** `cmux focus-pane --pane <your own
pane_ref>` (from `cmux identify` → `caller.pane_ref`).

Then tell him what's open and where (`R1, right-most tab`) — one line.

Inspect and tidy:

```bash
CMUX="$CMUX_CLAUDE_TEAMS_CMUX_BIN"
"$CMUX" list-pane-surfaces --pane pane:NN
"$CMUX" close-surface --surface surface:NN     # close a tab when done with it
```

## When to reach for each

| Situation | Do this |
|---|---|
| Need an API key / token | `browser` the key page, then ask him to paste the value |
| Need a signup or login | `browser` the signup page |
| Interactive CLI auth (`gcloud auth login`, `gh auth login`, `ssh` to a host) | `terminal`, then tell him what to type |
| Something he should read on a site | `browser` the exact URL, not the homepage |
| A report or long doc you wrote | `markdown` — though `~/reports/*.md` opens automatically, see below |

## Gotchas

- **`cmux` is not on `PATH`** in the Bash tool. Use `$CMUX_CLAUDE_TEAMS_CMUX_BIN`
  (`/Applications/cmux.app/Contents/Resources/bin/cmux`). The helper (`scripts/cmux-panel`, symlinked as `~/.local/bin/cmux-panel`) already handles this.
- **No remembered pane any more.** The old helper kept one "panel pane" in
  `~/.cache/cmux-panel-pane` and recreated it silently; that's what spawned the
  strays. Now every call names its pane.
- **Don't call `cmux new-split`** to pre-make a pane. You get an empty stray pane next to
  the real one.
- **`markdown` always splits**, unlike `new-surface`, so the helper opens it then
  `move-surface`s it into the chosen pane. Don't call `cmux markdown open` directly.
- **`~/reports/*.md` opens by itself.** A `PostToolUse` hook on `Write`
  (`~/.local/bin/cmux-report-hook`) catches it. Writing a report there needs no extra step.
  `Write` opens a new tab; `Edit` live-reloads the existing one — so revise with `Edit`.
- **Link a live URL when there is one.** A browser tab he can click beats a URL in prose.

## Secrets

Todd's rule: secrets live in `~/.config/<app>/`, never in doc trees or synced folders.
So when he pastes a token back, write it there and lock it down:

```bash
printf 'SERVICE_API_KEY="%s"\n' "$KEY" > ~/.config/<app>/env
chmod 600 ~/.config/<app>/env
```

Never echo a token back into the transcript, never write one into a report, and never put
one anywhere under `~/reports/` or a git working tree.
