---
name: ask-todd
description: The one way a desk writes a board question for Todd, and only when that question is blocking a ticket. Never for a live conversation Todd is having with a desk in its pane or in Slack. Draft the blocking question in the agent-to-agent language in ~/slopdog/v2/rules/question-language.md, then translate it with that file's Todd-facing board section, and refuse a translation that fails the do's and don'ts. Use when a blocking question must be written into a ticket's questions.items, or when Todd says "ask-todd" or "/slopdog:ask-todd" about a question that is blocking a ticket.
allowed-tools: Bash, Read, Write
---

# ask-todd — a blocking question, written once, then translated

T-491, Todd 2026-09-27, after T-471 q1 read as "a complete alien language" to
him, and T-528: this skill writes a `questions.items` entry only when the
question is blocking a ticket. It refuses to write a Todd-facing draft that
breaks a do or a don't below. The wording rules live in
`~/slopdog/v2/rules/question-language.md`, not in this file.

## Steps

1. **Only a question that is blocking a ticket.** If the work can continue
   without Todd's answer, this skill does not apply. A live conversation Todd
   is having with a desk in its pane or in Slack is not this skill — answer
   him there, in that conversation. Do not open a board card for it.
2. **Draft the source question in the agent-to-agent language** in
   `~/slopdog/v2/rules/question-language.md` (the `agent-to-agent` section)
   before any Todd-facing translation. Ticket ids, file paths and jargon stay
   in this draft. It is the complete hand-off between agents. Do not show it
   to Todd and do not run the checker on it.
3. **Translate that draft for the board** using the Todd-facing core and the
   `board` section of `~/slopdog/v2/rules/question-language.md`. The checker
   below runs on this translation only.
4. **Save the translation to a scratch file** and run the check yourself before
   calling the writer, so you see exactly what to fix:
   ```
   node $HOME/.claude/skills/slopdog/session/ask-todd/scripts/check.mjs <draft-file>
   ```
   `clean: no do's-and-don'ts violations` (exit 0) or a list of `rule (line N): text`
   (exit 1). Rewrite and re-run until clean — never pass `--force` on real work.
5. **Write it to the ticket:**
   ```
   node $HOME/.claude/skills/slopdog/session/ask-todd/scripts/ask-todd.mjs \
     <ticket-file-path> --asked-by <your lane key> --text-file <draft-file>
   ```
   This re-runs the same check and refuses (exit 1, nothing written) if the
   draft is still dirty. On success it appends the `questions.items` entry
   with the next `qN` id, `owner` set to the ticket's `id`, `resolved: false`,
   and sets `questions.status: open`. The global `gid` (`Q-n`) is assigned on
   the next `questions-index.mjs` rebuild and written back to the item.
6. **What this doesn't do:** the ticket's body status line (🔵→🟠) and its
   `task-list.md` row are still each desk's own job, exactly as before this
   skill — this consolidates the *wording* and the *check*, not the whole
   board-flip mechanics, which differ slightly by desk and stay in each
   desk's `CLAUDE.md`.
7. **A verify-type question** (asking Todd to accept or verify finished work)
   still follows the Todd-facing core in `rules/question-language.md`.
   what-works is what the finished work already does. what's-missing is the
   check he still makes himself. question-or-suggestion is whether he accepts
   it, plus your suggestion. Inside that, quote the ticket's Acceptance
   criterion verbatim (T-492), give the ticket's tip — why, what, how, one
   sentence each — and say exactly what he is accepting and how he checks it.
   If the ticket has no plain acceptance criterion, don't ask — send the
   ticket back for one first.

## The do's and don'ts

These apply to the Todd-facing board translation only. The agent-to-agent
source draft follows `rules/question-language.md` and is allowed to carry
ticket ids and file paths. The bans below are the checker's reading of that
file's Todd-facing core (plain words, no bare codes or file names).

| | Rule | Why it's checked |
| --- | --- | --- |
| Do | Open in everyday words with what-works, then what's-missing, then the decision | The first line is the only one he's guaranteed to read, and it follows the Todd-facing core |
| Do | Name tickets by their full board title, never a bare id or file name | A file name or `T-nnn` means nothing without the board open |
| Do | Say what changes for Todd under each option | He's deciding an outcome, not a mechanism |
| Do | Ask one decision per question | Two decisions in one question forces him to parse which is which |
| Do | Quote a ticket's `## Acceptance` criterion verbatim on any verify-type question (T-492) | The recommendation gets checked against the same words Todd checks the work against, not a paraphrase of them |
| Don't | A file name (`*.md`, a path) | `checkDraft`'s `file-name` rule — Todd never sees which file backs a fact |
| Don't | A question about another question ("close q1", "resolve q2") | `other-question` rule — board bookkeeping isn't a decision he can see or do |
| Don't | A code identifier (backtick span, `snake_case`, `camelCase`) | `code-identifier` rule — an engineer's noun, not a plain one |
| Don't | A step or fact number pulled from inside a ticket ("step 4", "fact 1") | `step-or-fact` rule — internal to the ticket, meaningless outside it |
| Don't | Three or more clauses stacked into one sentence | `stacked-clause` rule — the T-471 q1 failure: three ideas in one line |
| Don't | Ask Todd to do what an agent can (create, edit or move in Notion, Slack, Gmail, Calendar or Drive; run a command; change a setting; install) | `agent-can-do` rule (Todd, 2026-10-08) — do it yourself with the MCP tool or the browser-driver; allowed only with `--live` and a draft saying why only he can (password, 2FA, his device, a sign-in screen) |

The checker (`check.mjs`, `checkDraft(text)`) implements exactly these six
don'ts plus a third-person check on the opening line ("Todd" where "you"
belongs). It is line-based and will occasionally over-flag a `Context:`
bullet that legitimately names something technical — read the flagged line
and judge; the rule is a catch, not a court.

## Worked example: how T-471 q1 got rewritten

Todd and Daphne rewrote one question four times on 2026-09-27 before it read
cleanly.

1. **The original, as LaForge wrote it — bad example (T-471 q1, verbatim from
   `tickets/gmail-standing-service.md`):**
   > Question: Can Todd close brain-one-draft.md's q1 now that a live Gmail
   > profile call succeeded?
   >
   > Context:
   > - Step 1's live check passed: the token is current and a real Gmail
   >   profile call returned 200 for his account.
   > - brain-one-draft.md's q1 still shows resolved: false — it asks whether
   >   to close T-350's real-mailbox check now that the sign-in (T-342) is
   >   done, not whether the credential itself works.
   > - This ticket's own step 4 will run the real subscription-to-controller
   >   check, which is most of what q1 was waiting on.
   >
   > (a) Close brain-one-draft q1 now, pointing at this ticket's evidence
   > (Recommended)
   >   - Why (high confidence): the credential works and T-471 is about to
   >     run the exact live check q1 was blocked on; no reason to keep two
   >     open questions asking the same thing.
   > (b) Leave q1 open until T-471's step 4 fact 1 (a real message landing in
   > the controller) is also proven
   >   - Why: the right pick if you want the controller-side proof in hand
   >     before calling the mailbox check done, not just the credential.
   > (c) Leave it entirely to whoever answers brain-one-draft.md directly
   >   - Why: the right pick if you'd rather not have this ticket speak for
   >     T-350 at all.

   Todd: "you're speaking a complete alien language." `check.mjs` flags this
   draft: `file-name` (`brain-one-draft.md`), `other-question` ("close ...
   q1"), `step-or-fact` ("step 4 fact 1"), and `third-person` ("Can Todd"
   with no "you"). What was wrong: it names a file instead of saying what
   the thing does; it is a question about another question; it talks about
   Todd in the third person; "live Gmail profile call" is an engineer's
   phrase; and option (a)'s recommendation was itself premature — a working
   credential does not prove the real-mailbox check T-350 actually asks
   about.

2. **Daphne's first rewrite:** "Can we close the old 'does the real Gmail
   connection work?' question?" Better words, but still a question about
   another question, and it leaned on a ticket title Todd had to ask about.

3. **The plain explanation Todd asked for:** An email thread is one email
   conversation in Gmail. The part of the email system being judged writes
   one suggested reply for each conversation into the Gmail drafts folder and
   never sends anything. The login works; nobody has yet seen a real
   suggested reply appear.

4. **The version Todd accepted the shape of — passes the check:**
   > Question: The email system has shown that it can log into your Gmail
   > account. It has not yet put a real suggested reply into your Gmail
   > drafts folder. Do you want to call that part of the system finished now,
   > or wait until you have seen a real suggested reply in your drafts
   > folder?
   >
   > Context:
   > - The login works.
   > - No real suggested reply has been seen yet.
   >
   > (a) Wait until you have seen one (Recommended)
   >   - Why (high confidence): the login working does not prove the replies
   >     work.
   > (b) Call it finished now
   >   - Why: the login works.

**The rules this taught, folded into the table above:** ask about what Todd
can see or do, never about ticket bookkeeping; say what is proven and what is
not, in one plain sentence each, before the question; define every noun in
everyday words. A file name never appears in the Todd-facing text. When a
ticket has to be named, use its full board title and say what it does. Complete
sentences addressed to "you", no arrows, no code names, no step numbers;
check the recommendation against the ticket's acceptance criterion (T-492)
before writing it; one question at a time.

## Don't

- Don't write directly into `questions.items` by hand — always go through
  `ask-todd.mjs`, even for a one-line question, so the check always runs.
- Don't pass `--force` outside of testing the checker itself.
- Don't flip the ticket's body status line or `task-list.md` row here — that
  stays the calling desk's job.
