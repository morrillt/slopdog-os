---
name: feedback
description: >-
  Give feedback on another agent's plan, options, recommendation or draft without being anchored by it — form your own answer from the problem first, then compare, then talk it through as a peer. Use whenever another agent (a lane, a task runner, a teammate, a peer session) asks you for feedback, a review, a second opinion, "weigh in", "your picks", "where do we differ". Agent-to-agent only: Todd's own feedback has its own track. Not for reviewing code diffs (that is /code-review).
allowed-tools:
  - Agent
  - SendMessage
  - Read
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
---

# feedback — your own answer first, then theirs, then talk

The failure this prevents: you read their proposal, it sounds reasonable, you agree with
all of it. Agreement reached that way is worth nothing to the team. Diversity of opinion
is the point (`~/slopdog/v2/rules/principles.md`, "Diversity of opinion").

**Step 1 — split the request into the problem and the proposal.** The problem is the
question they are trying to answer, the constraints, and the files that matter. The
proposal is their options, their recommendation, their draft. Write the problem down in
one paragraph, in your words, with no trace of the proposal in it.

**Step 2 — get a blind answer.** Spawn the `feedback` agent with ONLY the problem
paragraph and the file paths. It has not seen the proposal and never will; that is the
whole reason it exists. It returns: its answer, its reasoning against the principles,
and what it would need to know to be sure. Do not skip this because the request "looks
simple" — a request already read has already anchored you.

**Step 3 — now read the proposal properly**, and compare it with the blind answer, point
by point. For each point decide one of three things:
- theirs is better, and why;
- yours is a better fit for the principles (simple first, rapid iteration, complexity
  that cannot defend itself on product value gets cut) balanced against where we are
  going, and why;
- both are fine and the choice is Todd's, because it is a product call.
"Easiest" is not the tiebreak. Something that is more work but serves the direction wins
if it can say what product value it buys.

**Step 4 — reply as a peer, not a boss.** Lead with where you differ; agreements are one
line each. State each difference as a claim they can argue with, and ask them to. Same
team, same goal, nobody is signing off on anybody. Tone: a colleague at the whiteboard.

**Step 5 — go back and forth, up to five rounds.** A round is one message each way. Each
round should narrow: concede what they have shown, restate what still stands, and say
what evidence would change your mind. Bring in a third or fourth agent when a fresh angle
would help more than another round. Keep a count.

**When the asker is Todd, none of this applies.** No blind agent, no rounds: he
wants a fast answer with the disagreement in the first line (`principles.md`, "With Todd,
disagree fast"). Stop here and just answer him.

**Step 6 — still apart after five rounds? Bring it to Todd, together.** Not as a problem
and not as an escalation: as a decision the team wants him in on. One message, through
the Errands desk when you are on the slopdog screen, multiple-choice: the question, each position in two or three
sentences by the agent that holds it, what each buys and costs, and what both agree on.
That fits three paragraphs; when it truly does not, link one Artifact with the fuller
case, sparingly.
Todd enjoys these; he does not want to be in every decision, so only the ones that
earned five rounds get there.

## Don't

- Don't read the proposal before the blind answer exists. If you already have, say so in
  the reply; the blind agent still runs on the problem alone.
- Don't grade their question wording and call it feedback. The options and the
  recommendation are what get reviewed.
- Don't soften a difference to keep the peace, and don't harden one to look rigorous.
- Don't answer for Todd. A product call goes to him as a choice, marked as such.
- Don't run past five rounds quietly.

## Reply format (to the agent who asked)

First line: "N of M points differ" or "no differences". Then the differences, each as
claim, why, what would change your mind. Then agreements, one line each. Then the round
count ("round 1 of 5").
