---
name: qa-respond
description: >-
  Process an incoming @QA press from the board. Two triggers land here: "Todd asked for more on qN on T-nnn" / "Todd pressed @QA for qN on T-nnn" (explain a question's recommendation) and "Todd pressed @QA to verify T-nnn" (T-465: actually verify the built feature through the Chrome extension and report pass/fail). Spawns a subagent for either so the desk stays free for Todd's next message.
allowed-tools:
  - Agent
  - Read
  - Bash
  - Grep
  - Glob
  - Skill
  - SendMessage
  - ListAgents
---

# qa-respond — handle a @QA press from the board

Two shapes of trigger land in this pane. Tell them apart before doing anything else:

- **Explain** (T-460): `Todd asked for more on qN on T-nnn: ...` or `Todd pressed @QA for
  qN on T-nnn`. Names a question id (`qN`). Go to "Explain a question".
- **Self-verify** (T-465): `Todd pressed @QA to verify T-nnn`. No question id — it comes
  from the verify card (T-297, the card for a 🟩 ticket waiting on its batch's review), where the
  synthetic question has no real id. Go to "Self-verify a ticket".

Either way, spawn one subagent so the desk stays free for Todd's next message.

## Find the ticket file

```bash
cd ~/slopdog/tasks && find tickets/ -name "*.md" | xargs grep -l "^id: T-nnn"
```

## Explain a question

Extract the ticket id (T-nnn) and question id (qN) from `$ARGUMENTS`.

One `Agent` call, type `general-purpose`, named `qa-<T-nnn>-<qN>`. Give it:

1. The ticket file path to read.
2. The question id to find in the `questions.items` YAML block.
3. Instructions:
   - Read the ticket and the specific question.
   - Check if the question is `live: true` — if so, determine the URL or app
     (Notion, Slack, a localhost page, an external site) and say so in the response.
   - If Chrome can help (a URL to navigate to, a page to show Todd), say
     "I can open this in Chrome for you" and name the URL — but do NOT open it
     without Todd confirming.
   - Give Todd a plain-language explanation of the recommendation: what it does,
     why it's recommended, what the alternatives trade off, and what he needs to
     do if he picks it.
   - Keep the explanation under five short paragraphs.
   - End with a one-line offer: what the next step is if he wants to proceed.
4. The subagent reports back to `main` when done.

After it reports: relay its explanation to Todd in the chat. If it identified a
Chrome-navigable URL, offer to open it.

## Self-verify a ticket (T-465)

Extract the ticket id (T-nnn) from `$ARGUMENTS` (pattern: `Todd pressed @QA to verify
T-nnn`).

One `Agent` call, type `general-purpose`, named `qa-verify-<T-nnn>`. Give it:

1. The ticket file path (found above) to read in full.
2. Instructions:
   - Read the ticket's own `## Steps`, and pull every `Verify:` line word for word —
     these are Todd-facing checks the ticket already promises, not a paraphrase of them.
   - Run each one:
     - A command-shaped Verify line (`grep`, a test runner, `tsc`, a script) runs
       directly with Bash, in the repo the ticket names.
     - A Verify line that means looking at a running page, a board, a dashboard, or
       clicking through a flow goes through `/slopdog:browse` (`Skill` tool,
       `skill: "slopdog:browse"`): claim the site under this desk's key (`qa`),
       hand the check to the `browser-driver` subagent with the ticket id, release
       the claim when done. Never open a browser directly; that skill is the only
       path to Chrome (one-bot-per-site).
   - Every Verify line has to pass for the ticket to count as verified; note exactly
     what each one showed (a real result, like "grep -c returned 3", not "looked
     fine"). Before any pass, run the touched files' existing test suites against
     origin/main and read any close or delete code path. The verifier must be a
     different seat (model or engine) from the builder.
   - **On a pass:** send Todd one short Slack DM that is the gist,
     not a transcript — one line naming the ticket, one line per Verify line saying
     what it showed, done. This is the report Todd asked for so he never has to open
     the ticket to confirm it worked.
   - **On a failure, or a browser step the extension refuses or gets stuck on:**
     do not silently stop. Write a `live: true` question onto the ticket's
     `questions.items` (`asked_by: qa`, the shape in `desks/build/tyrion/CLAUDE.md`'s
     Questions-for-Todd section: `Question:`, a `Context:` bullet list, options
     (a)/(b)/(c) with your recommendation first and a `- Why:` line each), and flip
     the ticket's status line and `task-list.md` row to 🟠 if either was 🔵 or 🟩. Add
     a Progress note saying which Verify line failed or which browser step stuck, and
     end that note with a line starting `Try it: … You should see …` so whoever reads
     it next can reproduce the failure by hand.
   - Never mark the ticket 🟢 or 🟩 yourself; a pass is reported to Todd, not written
     onto the ticket. 🟩 is Tyrion's call, and 🟢 only ever comes from Todd approving the whole batch.
3. The subagent reports back to `main` when done: pass/fail per Verify line, whether
   it DM'd Todd or wrote a live question, and the message link or question id.

After it reports: relay a one-line summary to Todd in the chat (or say nothing further
if the subagent already DM'd him directly — don't double-report a pass).
