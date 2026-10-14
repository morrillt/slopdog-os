---
name: gist
description: >-
  "Gist me" — answer Todd's ask in exactly three tweet-length paragraphs, plain words, answer first, and pop them in the lightbox on the workspace he is on, so he is sure to see it. Use whenever Todd says "gist me", "gist", "/slopdog:gist", "gist me X", "give it to me in a lightbox", "put that in the light box", or asks for the gist of anything. Not for a long report; that is /slopdog:file-report.
allowed-tools:
  - Bash
  - Read
---

# gist — three paragraphs, in the lightbox

Todd, 2026-09-26: "a special verb, gist me, which means give this to me in a light box.
All it's gonna do is give me a three-paragraph response in that light box, so we're sure
I'm gonna see it." This skill reuses T-443's lightbox (`/slopdog:wtf`'s
`wtf-lightbox.mjs` and the i3 rule that floats its window on the focused workspace). It
builds no lightbox of its own.

1. **Run the gist writer** — one call, everything happens externally on Haiku (T-448):

   ```bash
   node $HOME/.claude/skills/slopdog/session/wtf/scripts/gist-writer.mjs "$ARGUMENTS" --session-id "$CLAUDE_SESSION_ID"
   ```

   It runs the wtf loader, calls `claude -p` on Haiku with a fixed prompt, writes the JSON
   and pops the lightbox. The desk's context is never used for the writing. The script
   prints the JSON on success.

2. **Reply in the pane** with one line, `→ lightbox · gist`, then the same three paragraphs
   (parse them from the script's JSON output), nothing else. The `ran:` footer still closes
   the reply.

## Don't

- Don't write a fourth paragraph, a list or a header; the cap is the point.
- Don't answer only in the pane. The lightbox is the deliverable; the pane copy is the record.
- Don't build or restyle a window. Changes to the lightbox belong in `wtf-lightbox.mjs` (T-443).
- Don't use this desk's model to write the gist; that is the old path and the reason it was slow.
