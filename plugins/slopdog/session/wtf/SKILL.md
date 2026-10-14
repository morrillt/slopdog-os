---
name: wtf
description: Answer "what's going on" — gather the last six hours of ticket and project activity (or the hours named, "/slopdog:wtf 3h"), write a three-part answer (a tweet of what got done, how Todd can help or unblock, the notable decisions and concerns) and show it in a lightbox in front of Todd, then take up to three follow-up turns in the pane. Use whenever Todd says "wtf", "/slopdog:wtf", "/broz-wtf", "what's going on", "what are we doing", "what got done", "catch me up", "did we go off the rails", or asks for the big picture.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# wtf — what's going on (T-443)

Typing `/slopdog:wtf` answers "what's going on across Slopdog" in a lightbox in front of
Todd, whatever he is looking at. First cut, built for speed. The argument is the window:
`$ARGUMENTS` (empty → 6 hours; `3h` or `3` → 3 hours).

1. **Load.** One Bash call, nothing else read first:

   ```bash
   node ~/.claude/skills/slopdog/session/wtf/scripts/wtf-loader.mjs --hours <N>
   ```

   It prints every ticket touched in the window with its board status, worker, open
   questions and the Progress notes dated inside the window, then archived tickets and
   changed projects and batches. That text is the whole context: no other reads.
2. **Write the answer** as JSON to `/tmp/wtf-answer-${CLAUDE_SESSION_ID}.json`:

   ```json
   {"hours": 6,
    "sections": [
      {"header": "What got done", "body": "Plain text, no emojis. What shipped or landed in this window."},
      {"header": "What's next", "body": "What is happening next or what is blocked."},
      {"header": "Where you can help", "body": "Open questions, things waiting on Todd, batches ready for his review (every ticket 🟩)."}
    ],
    "work": [
      {"ticket": "T-nnn", "project": "slopdog-v2", "status": "building", "what": "Short description"},
      {"ticket": "T-nnn", "project": "content-studio", "status": "waiting on Todd", "what": "Short description"}
    ]}
   ```

   Three headed sections of regular text, no emojis, no bullet lists. Plain words, full
   sentences. Tickets by id (the page highlights `T-nnn`). Then a `work` array: the most
   meaningful tickets, each with its project name, a short plain-text status and what it
   is. At most eight rows, most important first. The lightbox reads `~/slopdog/v2/context.yaml` and shows the
   team focus at the bottom if it is set, with the first ten `focus_tasks` rows under it. When any
   `focus_tasks` ticket has an open question, "Where you can help" gets a button that opens
   the board's Questions tab with the Focus filter on, in the workspace-3 board window.
3. **Show it:**

   ```bash
   node ~/.claude/skills/slopdog/session/wtf/scripts/wtf-lightbox.mjs /tmp/wtf-answer-${CLAUDE_SESSION_ID}.json
   ```

   It detaches and returns at once. Chromium opens an `--app` window titled "What's going
   on", which the i3 rule in `~/.config/i3/config` floats, centres and focuses on Todd's
   current workspace. Esc or the ✕ closes it; a second `/slopdog:wtf` replaces it.
4. **Say one line in the terminal:** `→ lightbox · last <N>h · follow-ups here`. Then answer
   up to three follow-up questions in the pane from the loader output already in context,
   without re-running it. After three, or when he moves on, stop.

On the Mac (no i3) the window opens but does not float; the answer is still correct.

## The session log

Every session in scope also keeps a log directory, written by the `Stop` hook rather than by
this skill: `~/slopdog/logs/conversations/<YYYY-MM>/<YYYY-MM-DD-HHMM>-<slug>/`, keyed on
Claude's `session_id` and resolved only by `scripts/session-dir.sh`. It holds `turns.md` (one
dated line per turn, newest on top) and `concerns.md`. The hook (`turn-log.py`) also names the
cmux sidebar card after the session title through `scripts/rename-card.sh`, which passes
`$CMUX_WORKSPACE_ID` explicitly and skips the rename when the title has not changed.

### `concerns.md` format

Newest first, same shape as a turn entry so the two files read alike. The hook's summariser
(Haiku) drafts each entry `open` from the turn it just logged; the desk never writes one by
hand, it only closes them with Todd, changing `open` to `watching` or `resolved`.

```markdown
# Concerns

### <YYYY-MM-DD HH:MM> · turn <n> · <open|watching|resolved>

<One or two sentences: the concern, and what it would cost if it bites. Concrete.>
```

- A concern is something that could still bite, not a to-do and not a changelog.
- It is what would otherwise be buried in a terminal reply: limitations flagged, guesses
  made, things not verified, fragile workarounds. Say them in the turn so the summariser
  can file them.
- `resolved` entries stay as the record of what was worried about and settled.
- Don't invent concerns to fill the file. `*None open.*` is a fine state.
