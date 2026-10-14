---
name: visual-presentation
description: >-
  Turn a subject into a visual presentation — hand-drawn dark slides with real roughjs geometry and drawn relationships, published twice from one set of files: a click-through deck to show, and a design canvas to edit. Use when Todd says "visual report", "visual presentation", "/slopdog:visual-presentation", "make this a deck", "draw this", "slides", "present this", "make it visual", or asks for a report he can click through rather than read.
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - Skill
  - Agent
  - Artifact
---

# visual-presentation — a subject, drawn

Born 2026-09-06, out of the diagramming bake-off. Todd on the result: *"whatever you did
here is absolutely beautiful… make an agent as well as associated skills so that we can
just keep on doing whatever you did here."* This is that, written down.

**Two artifacts, one set of files.** A deck to show and a canvas to edit are different
tools, not two versions of one thing, and Todd wanted both every time. They are generated
from the same `.dc.html` slides, so they cannot drift.

## Before anything: is this the right shape?

A presentation is for a subject with **structure worth seeing** — parts that relate,
a path something takes, a decision with branches. Prose that happens to be long is not
that; it is a report, and `/slopdog:file-report` files it.

Say so in one line if the subject does not want to be drawn, and offer the report instead.

## The five steps

Run them in order. Steps 2 and 3 are the agent's — invoke it **once per step** so Todd
sees each one and can answer anything it raises before the next begins.

### 1 · Brief — yours, with Todd

Settle four things before a line is drawn. Ask only what you cannot answer from the
sources; a subject Todd already described in the conversation is already briefed.

- **The subject**, in one sentence, and **the sources** — real paths, read them.
- **The slide list**: a title slide, then one per idea, then whatever closes it. Five to
  seven is the usual shape. Name each one now; the names become the deck's dots.
- **The direction** — dark hand-drawn in **Catppuccin Mocha** is the house default
  (`reference/house-style.md` carries the hexes). It matches the theme Todd's own machine
  runs, so a deck looks native on the screen he shows it on. Only settle a different one
  if he asks or the subject demands it.
- **The name**: what the deck is called, and the file it lives in. Todd's words, never
  "presentation" or "output".

### 2 · Draw — the agent, `visual-presentation-draw`

Hand it the subject, the sources by path, the slide list, and the output directory. It
authors one `.dc.html` per slide plus `canvas.json`, and returns paths and a per-slide
line — never the markup. It reads a great deal and writes a lot of it to disk; that is
exactly what a subagent is for.

**Artwork the geometry cannot make** — a character, a texture, anything photographic —
comes from the **`slopdog:generate-image`** skill (the wrapper around Todd's banananano
CLI). Invoke it with the Skill tool, `skill: "slopdog:generate-image"`, or type
`/slopdog:generate-image`; do not call the CLI yourself — the skill picks the working
script and resolves the API key, and both are easy to get wrong.

Ask it for the image, where to write it, and the size:

> Generate a 1024x1024 image of <subject>, Catppuccin Mocha palette (base #1e1e2e,
> mauve #cba6f7, sky #89dceb), written to `<slides-dir>/assets/<name>.png`.

**Downsample it (keep it under ~70 KB — `sips -s format jpeg -s formatOptions 70 -Z 480`
is usually enough), then embed it as a base64 data URI directly in the `.dc.html`
— `<img src="data:image/jpeg;base64,<...>">`. Do NOT reference it by a relative
path** (`assets/<name>.png`) — verified broken 2026-09-07: `deck.mjs` copies each
slide's markup verbatim with no asset pipeline, so a published deck has no `assets/`
folder to resolve against; separately, `seed-canvas.mjs`'s `--image` flag stores by
basename only, which never matches an `assets/`-prefixed `src`. A raw data URI needs
neither mechanism and renders in both the deck and the canvas. Keep the original PNG
in `assets/` anyway as the source file for re-editing; just don't reference it that way
from the slide. **Name the Catppuccin hexes in the prompt** (`reference/house-style.md`
has them); the model will not guess them.

**Diagrams stay SVG.** Generated art is for what roughjs cannot draw, never for a box
and an arrow — a generated diagram cannot be edited on the canvas, which is half the
point of publishing one.

### 3 · Look — yours

Render one slide and actually look at it before publishing:

```bash
node "${CLAUDE_SKILL_DIR}/scripts/preview.mjs" <slides-dir>/<Slide>.dc.html /tmp/p.html
qlmanage -t -s 1600 -o /tmp /tmp/p.html    # then Read /tmp/p.html.png
```

One look, one pass of fixes. Emoji that slipped in, text that overruns its box, a colour
that vanished into the ground — those are what the look is for.

### 4 · Publish both

```bash
# the click-through deck
node "${CLAUDE_SKILL_DIR}/scripts/deck.mjs" --out <name>.html --title "<Name>" \
  --slide Main.dc.html:"<first slide name>" --slide Second.dc.html:"<name>" …

# the editable canvas — the design skill's own helper, from its base directory
node "<design skill base>/seed-canvas.mjs" --template "<…>/payload.template.html" \
  --out <name>-canvas.html --title "<Name>" \
  --artboard Main.dc.html --artboard … --canvas canvas.json
node "<design skill base>/seed-canvas.mjs" --check <name>-canvas.html   # must print ok:
```

Then two `Artifact` publishes:

| | `capabilities` | `contract` | favicon |
| --- | --- | --- | --- |
| the deck | *(omit)* | *(omit)* | `✏️` |
| the canvas | `{self:{}, downloads:{}}` | `0.1.31` | `✏️` |

Invoke the `design` skill first if the canvas half is unfamiliar — it owns the seeding
rules, the pin, and the capability roster, and they change.

### 5 · File it

The slide files are the source and they must not live only in a scratchpad — a power cut
on 2026-09-06 wiped exactly that. Write them into `~/slopdog/dev/playground/peak-decks/<subject>/`
— the one house decks repo, reused rather than a new repo per deck (`notes/INDEX.md` has
the routing row). **Never `~/.claude/presentations/`** — that repo is deny-by-default
gitignored, so anything written there silently never gets committed (found 2026-09-07
shipping the Slopdog deck itself). Commit and push in the same turn.

Then put the deck on the runner's Reports tab, where Todd reads reports: slides are a
kind of report, so they go through `/slopdog:file-report`'s own index append, not a
second index (T-308-2):

```bash
node ~/.claude/skills/slopdog/reports/file-report/scripts/file-report.mjs \
  --slides ~/slopdog/dev/playground/peak-decks/<subject>/<name>.html "<Name>"
```

It appends one line to `~/slopdog/tasks/reports/index.jsonl` with `source: "slides"`;
commit that file by path in `~/slopdog/tasks`. A rebuilt deck at the same path needs no
new line (the board keeps the last line per path). Give Todd both links and one line each
on what they are for, and say the deck is on the Reports tab.

## Steering it afterwards

A change to one slide is: edit that `.dc.html`, re-run step 4's two builds, republish both
to the **same** file paths so the URLs hold. Never hand-edit a built `.html`.

## Don't

- Don't publish only one of the two. Todd asked for both, every time.
- Don't re-author the deck shell or the rough helpers; they are in `scripts/`.
- Don't skip the look in step 3 because the markup seemed fine.
- Don't let a slide carry an emoji.
- Don't invent a palette. Mocha, or Latte if Todd asks for light.
