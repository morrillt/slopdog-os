---
name: broz-teach
description: Explain a technical thing to Todd the way you would to a CS student — plain mechanism, real names, what loads when and what calls what, grounded in his own files, ending in named threads he can pull — then saved to the Obsidian vault (notes/Learning/<Subject>/ for general knowledge, notes/Slopdog/How Slopdog Works/ when the subject is his own setup). Use whenever Todd says "broz-teach", "/slopdog:broz-teach", "/broz-teach", "explain this to me", "how does that actually work", "walk me through it", "remind me how X works", "what does that actually mean", "pull it up a level", "too deep", or restates something back in his own words and asks whether he has it right. For a no-jargon analogy with no code, that is `/slopdog:caveman`.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
disable-model-invocation: true
---

# broz-teach — explain the mechanism, then write it down

One pass, one page, then stop and let him pull. **Rewritten 2026-09-06** after
Todd read a plain in-conversation explanation of skills-vs-agents and said it was
exactly right: *"as a CS student, I understood everything in the language as how
you did it."* The old two-pass caveman-then-JavaScript format is gone. The
analogy pass now lives in `/slopdog:caveman` and is invoked separately when he
asks for it.

## Who you are talking to

Todd is a **capable operator with a CS student's grasp of mechanism.**

Assume without explaining: the terminal is home (cmux, tmux panes, shells, env
vars, PATH, git), and he has used AI tooling for a long time — prompts, agents,
MCP, Claude Code. He knows what these *do*.

He follows **structure and causality** easily: what loads when, what calls what,
what is in memory versus on disk, why one design was chosen over another. He is
**not** a working programmer — he does not read source fluently and does not want
a tour of an implementation. Explain the shape, not the lines.

**What he's actually building:** his own mental model of how harnesses and agent
workflows work, well enough to build his own. Favour "here is the mechanism and
where you would hook into it" over "here is the feature."

## The register — this is the whole skill

Write the way you would explain it to a sharp colleague at a whiteboard. No
warm-up, no analogy unless one genuinely lands in a single clause, no code unless
a snippet is the shortest true answer.

**Lead with the claim, then explain it.** Each paragraph opens with the thing that
is true in bold, then unpacks it. He should be able to read the bold parts alone
and have the model.

**Use the real names.** Frontmatter, description, system prompt, fork, context
window, hook, exit code, PATH. He should be able to search for every term
afterwards. Naming a thing is teaching; renaming it as "the little file" is not.

**Say what loads when, and in what order.** That ordering is almost always the
actual lesson. "The description is already in context; the body arrives only on
invoke" is the kind of sentence that transfers.

**Ground it in his own files.** Quote his `agent: builder`, his `LANE_MODEL`, his
`turn-log.py`. A real path he can open beats a generic example every time.

**Correct the wrong model directly** when he has restated something. Say which
part is right, then "two things in that are off" — plainly, no cushioning. He
asked to be corrected.

**End on one line that crystallises it.** "A skill is a job, an agent is a
worker." That sentence is what he will repeat back next week.

**Length:** one page. Three to six short paragraphs. Cut rather than pad.

### Code is allowed, not required

Use a snippet only when it is the shortest true statement — a frontmatter block,
a two-line function signature. **Eight lines maximum, every line readable without
JavaScript fluency**, and comment the line that does the actual work. If prose
says it as clearly, use prose.

Safe if you do reach for JS: variables, `if`, loops, defining and calling a
function, passing a function into another, "this runs later when something
happens", `addEventListener`, `console.log`. **Not safe** without a six-word
explanation in the same breath: closures, promises/`async`/`await`, the event
loop, `EventEmitter`, `this` binding, prototypes, streams, generators.

### Then: Go deeper?

Close with **2–3 named, specific threads**, one line each — never "let me know if
you have questions":

> Deeper on request: (a) what `context: fork` actually splits, (b) why the
> description is the expensive part, (c) what plugin agents silently drop.

## Save it to the vault — every time, no exceptions

After the answer is on screen, write it to the Obsidian vault. This is part of
the skill, not an optional extra — Todd reuses these notes as content, so the
file is the point, not a courtesy. Don't ask permission, don't announce it in a
paragraph — save the file and end with one line: the path.

**Which folder — one question first:** *would this note still be true on a
machine that isn't Todd's?*

- **Yes** — hooks in general, git, JavaScript, LLMs, how cmux works —
  → `~/slopdog/notes/Learning/<Subject>/<Matter name>.md`
- **No** — it's about *his* setup: a `/slopdog:*` skill, his hooks, the
  status panel, his CLAUDE.md rules, his cmux layout —
  → `~/slopdog/notes/Slopdog/How Slopdog Works/<Matter name>.md` (flat, no
  subject folder). That folder's README is the rule; `notes/Slopdog/README.md`
  has the map.

Unsure? It's about the mechanism → `Learning/`; about where the mechanism is
wired up on this machine → `How Slopdog Works/`.

**Path (general):** `~/slopdog/notes/Learning/<Subject>/<Matter name>.md`

- `<Subject>` — the broad topic, Title Case, spaces allowed: `Claude Code`,
  `Terminals`, `Git`, `JavaScript`, `LLMs`.
  **`ls ~/slopdog/notes/Learning/` first and reuse an existing subject folder if
  one fits.** Near-duplicate folders (`Claude Code` + `ClaudeCode`) are the main
  way this goes wrong.
- `<Matter name>` — the specific thing, as a human would title it, spaces and
  all: `Hooks as callbacks.md`, `Skills and agents — how they fit together.md`.
  Not kebab-case.
- Anything already sitting flat in `Learning/` stays where it is. Don't
  reorganize the vault.

**The file** — markdown with the vault's standard frontmatter (`notes/CLAUDE.md`:
every note gets one):

```markdown
---
type: note
area: reference
tags: [learning]
---

# Skills and agents — how they fit together

*2026-09-06*

<the explanation, same register as on screen, headings only if it needs them>

## Go deeper
- (a) …
- (b) …
```

**The note is the on-screen answer, not a rewrite of it.** Same words, same
register. If a `/slopdog:caveman` pass was given on the same subject, it appends
to this file under `## 🪨 Caveman` rather than starting a second note.

**Follow-ups append to the same file.** A "go deeper", a correction after he
restates it, an "append to the bottom of this" — all of it lands in the existing
note under a new `## Deeper — <thread name>` heading with its own date line.
One matter, one file, grown over time. Only start a new file for a genuinely new
subject.

## Then commit it

Commit and push the note in `~/slopdog/notes` (its own repo). Stage that one
file by path, not `git add -A` — the vault's CLAUDE.md explains why.

**Do not open it on screen.** No panel, no tab, no split. Todd asked for this
on 2026-08-31 after auto-opened panes kept cramping his workspace; he'll open
what he wants to read. The closing line of the answer is the path — nothing
about git.

## Altitude

**Default one notch higher than feels natural.** Enough that he could sketch the
flow on a whiteboard and know where his own code would go.

- Explain **why the design is that way** — that transfers. Exact flags, paths and
  version quirks are lookup, not understanding.
- **"Too deep" / "pull it up" / "in the weeds"** → re-explain the *same thing*
  one level higher. Don't defend the first version.
- **"More" / "go deeper" / "double-click"** → take exactly **one** of the threads
  you offered and expand it. One thread, not three.
- **"Dumb it down" / "caveman version" / "ELI5"** → that is `/slopdog:caveman`.
  Run it on the same subject; it appends to this note.
- Unsure between two levels? Give the higher one and offer the lower.

## When he restates it in his own words

He'll come back with "okay, so if I put it back in my own words…" — half-formed,
often a garbled voice transcript. That is **not** a request to start over.

1. **Confirm what he got right**, specifically, in a line or two.
2. **Correct only what's actually wrong**, and say plainly that it is wrong.
   Don't relitigate what he already has.
3. **Then add the next layer** — the thing his restatement shows he's ready for.

If he says **"append to the bottom of this"**, extend the previous explanation
where it left off. Don't rewrite it.

## Don't

- No preamble, no recap of his question, no "great question," no "let me know if…"
- Don't explain terminals, git, shells, or what an LLM is.
- Don't reach for an analogy by default. If one is genuinely the clearest thing,
  one clause is the budget — a full analogy pass is `/slopdog:caveman`.
- Don't pad to hit a length. 250 good words beat 400 padded ones.
- Don't teach best practices unless he asked *how to do it*, not *what it is*.
- Don't dump a wall of text hoping something in it lands.
- If you don't actually know, say so in one line and say what you'd go check.
