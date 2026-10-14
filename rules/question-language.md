# Question language

Two languages, one file. An agent handing another agent a question for Todd writes the source in the agent-to-agent section. The translation Todd actually reads follows the Todd-facing core, then the short section for the surface he is reading: the board card, Slack, or a report.

`/slopdog:ask-todd` is the writer for a board card, and only when the question is blocking a ticket. A live conversation Todd is having with a desk, in its pane or in Slack, stays in that conversation.

## agent-to-agent

When one agent relays a question meant for Todd to another agent, write it in this language. The reader is an agent. Be dense and complete. Ticket ids, file paths, step numbers and jargon are all fine here. This is the source question. It is not what Todd reads.

Use it whenever the hand-off is agent to agent: a desk telling Tyrion a question is blocking a ticket, a subagent returning a question for Todd to its caller, and ticket-add's step 0 when another desk relays an ask to the Ideas desk.

Write, in order:

- Who is blocked, and which ticket, by id and by file path.
- What is already proven and what is missing, with the ids and paths that locate each fact.
- The decision Todd has to make, which option the sender recommends, and why.
- What work cannot continue until he answers.

Worked example, LaForge handing Tyrion a blocking question:

> Blocking on T-471 (`tickets/gmail-standing-service.md`). The live Gmail profile call returned 200, so the login works. Step 4 fact 1, a real message landing in the controller, is not proven. `brain-one-draft.md` q1 is still open and asks the same real-mailbox question as T-350. Decision for Todd: wait for the controller proof, or call the mailbox check finished on the login alone. Recommend wait: a working login does not prove the check T-350 describes. T-471 stays blocked until he picks.

## Todd-facing

This is the only copy of the wording Todd reads. Plain words. No bare codes, no bare ticket ids, no file names. Speak to him as "you".

The order is always the same three parts, in this order:

1. **what-works** — what he can already see or do.
2. **what's-missing** — what is not done yet, and why that matters to him.
3. **question-or-suggestion** — the one decision, in words he would use, then your suggestion, which he can accept or refuse.

One decision per question. If you cannot say what's missing and why it matters, the question is not ready (`before-asking-todd.md`).

The three sections below only say how that surface differs from this core. They do not replace it.

## board

The board card is a form the Questions tab renders as buttons. The words inside it still follow the core: what-works and what's-missing in the question sentence and the context bullets, and question-or-suggestion as the decision plus the recommended option.

How it differs: labels and lettered options, because the card draws each option as a button with its Why line under the label.

The item's `text` is, in order: a line starting `Question:` and one full sentence; one blank line; `Context:` as bullets only, three at most, two lines at most each; then the options (a) (b) (c), one marked "(Recommended)", each followed by one indented line, `- Why:` and one short sentence saying when that option is the right pick. The recommended option's line reads `- Why (high|medium|low confidence):`. No general Why line.

No file name, bare id, or code name in that text. Those stay in the agent-to-agent source. The card is written only for a question that is blocking a ticket, through `/slopdog:ask-todd`.

## Slack

How it differs: paragraphs a person would send, not a form. No `Question:` label, no lettered options, no numbered menu, no "reply with a digit".

The same three parts, in prose: what-works, then what's-missing, then question-or-suggestion as the question in his words and a suggestion he can say yes to. Messages he has already marked, good and bad: `desks/ideas/asking-todd-examples.md`.

A live conversation he is already in, in a desk's pane or in Slack, stays there. It is not copied onto a board card.

## report

How it differs: the ask sits in the report's "waiting on your answers" part, in full sentences, not in a card and not in a chat bubble.

Each item still runs what-works, then what's-missing, then question-or-suggestion. Name the batch, or what he can see and do. A bare ticket id is not the name of the question. One decision per item.
