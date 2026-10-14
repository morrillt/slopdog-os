---
name: caveman
disable-model-invocation: true
description: The no-jargon, no-code pass — one real-world analogy, what the thing is for and what happens in order, about 120 words, then saved to the vault. Todd types this one by name; the default explainer is `/slopdog:broz-teach`.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
---

# caveman — the no-jargon pass

Split out of `/slopdog:broz-teach` on 2026-09-06. It used to be that skill's
first of two mandatory passes; Todd wanted teach to run at mechanism level by
default and the analogy to be something he asks for. So this is now its own
thing, invoked on its own or straight after a teach when the plain version
didn't land.

## The one rule

**Zero jargon. Zero code. If a term has a Wikipedia page, it doesn't go here.**

If you can't write it without a technical word, you don't understand it well
enough yet. Go read the actual files first, then come back.

## The shape — about 120 words

Pick **one** real-world analogy and stay inside it. A doorbell. A restaurant
order ticket. A mail slot. A receptionist taking messages. A hotel key that only
opens some doors.

Say what the thing is **for**, then what happens, **in order**. The ordering is
the lesson — the same ordering the mechanism has, stripped of its names.

One analogy, not three. Mixing metaphors halfway is what makes these confusing.
If the analogy breaks down at some point, say where in one clause — "the part
this doesn't cover is X" — rather than bolting on a second one.

Don't name the real parts. That's `/slopdog:broz-teach`'s job, and naming them
here is what turns a caveman pass back into a technical one.

## Where it goes

**If this follows a `/slopdog:broz-teach` on the same subject**, append it to
that existing note under a `## 🪨 Caveman` heading. One matter, one file — the
teach note is the home, and this is a section of it.

**If it stands alone**, write it as its own note using the same routing
`/slopdog:broz-teach` uses — *would this still be true on a machine that isn't
Todd's?* Yes → `~/slopdog/notes/Learning/<Subject>/<Matter name>.md`, reusing an
existing subject folder (`ls` first). No → `~/slopdog/notes/Slopdog/How Slopdog
Works/<Matter name>.md`, flat.

Standard vault frontmatter (`type: note`, `area: reference`, `tags: [learning]`),
the date line, then `## 🪨 Caveman`.

Then commit and push in `~/slopdog/notes`, staging that one file by path.
**Don't open it on screen.** End with one line: the path.

## Don't

- Don't preface it with "think of it like…". Just start.
- Don't explain what a terminal, a file or a program is — he knows.
- Don't apologise for simplifying, and don't add "of course, technically…".
- Don't append a technical paragraph at the end. If he wants that, it's
  `/slopdog:broz-teach`.
- Don't run this unasked after a teach. He asks for it.
