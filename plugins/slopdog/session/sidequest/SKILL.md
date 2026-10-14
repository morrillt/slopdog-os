---
name: sidequest
description: Hand a piece of work off to a background agent that starts with no memory of this conversation, writing the brief yourself so it gets exactly the context it needs and nothing else. Use when Todd says "/sidequest", "sidequest", "spin that off", "park that and have someone do it", "do that in the background", or names something worth doing that is not what this session is for. The sidequest is tracked as a job in ~/slopdog/tasks, so it exists before the agent reports back.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Agent
disable-model-invocation: true
---

# sidequest — delegate with a written brief, and track it

A sidequest is work that surfaced here but does not belong here. It runs in a
**non-fork** subagent, which starts from nothing but the prompt (`sub-agents.md`,
"How forks differ from other subagents"). `/subtask` and `/fork` inherit the whole
conversation; this deliberately does not.

**So the brief is the whole job.** Everything the agent will ever know about why
this matters, you write down. A fresh agent handed "fix the thing we discussed"
produces confident nonsense; that failure is the reason this skill exists.

<critical>Track it BEFORE the agent runs, never after. An agent that dies mid-run
with no ticket leaves nothing behind, and Todd finds out by
noticing the silence.</critical>
<critical>Never pass "as discussed", "the file we were looking at", "the same
approach as before", or a bare pronoun standing for a file. The agent cannot ask.</critical>

## Step 1 — decide what the agent actually needs

This is the judgement the command exists for. Write the brief from four buckets,
and write nothing that is not in one of them.

| Include | Why |
| --- | --- |
| **Absolute paths** of every file it reads or writes | It has no cwd assumptions and no memory of yours |
| **Decisions already made** that constrain the work | Or it will re-litigate them and hand back a different design |
| **Gotchas discovered the hard way** | The ones that cost this session time, so they cost the agent none |
| **The output contract** | What "done" looks like, and where the answer goes |

Leave out the narrative, anything it can read for itself, and approaches tried
and abandoned — unless naming one stops it walking into the same wall.

**Say what you could not confirm.** If the brief rests on something unverified,
write that in the brief. A fresh agent treats every sentence you hand it as fact.

<check>Read the brief back as if you had never seen this conversation. Any
sentence that only makes sense with tonight's context is a sentence to rewrite.</check>

## Step 2 — write the job

The durable record is a job in `~/slopdog/tasks`, written the `/ticket-add` way: a
ticket under `tickets/`, a row on `task-list.md`, `tags:` from the fixed eight,
an estimate, `worker:` and `verifier:`, and **at least one `Verify:` line another
agent could run headless**. A sidequest with no Verify line is a wish.

Default it to 1 point. If the brief you just wrote does not fit in one point,
that is the signal it is a real ticket for the morning rather than a sidequest.

## Step 3 — spawn the agent

One `Agent` call. **Never `subagent_type: "fork"`** — a fork inherits everything
and defeats the point. Give it a name, so it earns a pane of its own and Todd can
watch it.

The prompt is the brief from step 1, plus the ticket path, plus one line telling
it to write its result into that ticket's `## Progress notes`.

A sidequest for Gemini (the job's `worker:` is `gemini`, or Todd named her) is
not an `Agent` call: run `~/slopdog/v2/scripts/dispatch.mjs --engine gemini --pane`
as a background Bash command with the same brief after `--` (add `--write --dir
<folder>` when she edits files). `--pane` is the default (T-105, Todd
2026-09-12): the job streams in the Gemini column's shell pane so he can watch
it, with the log, the quarantine and the wake-on-exit unchanged. When the pane
is missing or busy the script says so on stderr and runs headless on its own.

## Step 4 — one line back

The ticket id, the agent's name, and what it will hand back.
Nothing else; the agent reports for itself when it lands.

```
Sidequest · T-094 · agent "docs-sweep" — returns the list of stale paths in the ticket.
```
