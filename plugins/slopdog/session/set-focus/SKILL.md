---
name: set-focus
description: Set the focus for the team or for one desk. Asks first whether it is for the team (the shared focus in ~/slopdog/v2/context.yaml that every desk reads) or for this desk (its standing current-focus.md, printed on every prompt and after every clear). Use when Todd says "set the focus", "set the focus for this desk", "desk focus", "standing directive", "/slopdog:set-focus", "change our focus to", "here's what we're focused on", "the team should be focused on X", or specifies focus batches with "--batches".
---

# set-focus — the team's focus or one desk's focus

1. Ask one question with AskUserQuestion: is this focus for the team or for one desk? When the
   working directory is a desk folder under `~/slopdog/v2/desks/`, list "This desk" first and mark it
   recommended; otherwise list "The team" first. Wait for the answer.

2. **Team:** take Todd's focus line as-is (dictated; read for intent, don't paraphrase it
   into something shorter) and any `--batches <tag,tag>` list specified. Run the script, full path so it works from any desk:

   ```
   node $HOME/.claude/skills/slopdog/session/set-focus/scripts/set-focus.mjs [--batches <tag,tag>] [--finish-by <ISO UTC|none>] ["<the new focus line>"]
   ```

   It rewrites the `focus:` key, `focus_batches:` and/or `finish_by:` in `~/slopdog/v2/context.yaml` —
   never `focus_tasks`, never the file's comments. Each flag touches only its own key: running with
   `--batches` writes the list and leaves the `focus:` line untouched, and so on. Confirm back to Todd
   in one line with the updated settings.

   **The finish-by time** (T-740; Todd, 2026-10-11: "once we execute a sprint, we have to be finishing
   that sprint in hours not days"). Whoever starts a sprint sets `--finish-by`, an ISO UTC time a few
   hours out (`--finish-by 2026-10-11T23:00:00Z`); the script writes `finish_by: "<iso>"` under the
   batch list, refuses a value that is not a date (exit 1, nothing changed), and `--finish-by none`
   removes the line. Once that time passes with a focus batch still holding a ticket that is not 🟩/🟢
   or dropped, the Watcher hands the open batches to Data, the trusted lane (`/slopdog:watcher`, step
   five-b). Moving the time later re-arms the hand-off.

   **At most three focus batches** (Todd, 2026-10-10: more than that has been very problematic). The
   script refuses a fourth with exit 1 and changes nothing, so close or drop a batch first.

   Don't hand-edit `context.yaml`'s `focus:` or `focus_batches:` lines anywhere else; this script
   and the focus-batches pane are the only writers so every desk can trust that the file only changes here.

3. **Desk:** the focus is for the caller's own desk unless Todd names another lane.
   - Find the lane: the entry in `~/slopdog/v2/lanes.json` whose `folder` (relative to `~/slopdog/v2/`)
     is the working directory or holds it. Todd naming another lane overrides that.
   - Take Todd's words as dictated, lightly cleaned: drop stutters and transcription slips, keep his
     meaning and phrasing. Write them as one line ending `(Todd, YYYY-MM-DD)` with today's date.
   - Edit `~/slopdog/v2/<folder>/current-focus.md` (for this desk, `~/slopdog/v2/desks/slopdog/current-focus.md`) (read it first). If the new focus supersedes
     a standing line, rewrite that line; keep every other line verbatim.
   - Show Todd the whole new file content.
   - The desk focus takes effect on the desk's very next prompt and survives every clear:
     `plugins/slopdog/hooks/mode.mjs` prints `current-focus.md` on every prompt, and
     `plugins/slopdog/session/pickup/scripts/pickup-report.mjs` prints it after a `/clear`. No new mechanism.
   - `--batches` and `--finish-by` are team-only; a desk focus names no batches and no finish-by time.

How the whole mechanism fits together (the file, who writes the table, who reads it):
`~/slopdog/notes/Slopdog/How Slopdog Works/Team Focus.md`.
