# The house look

What made the 2026-09-06 deck work, written down so it is reproducible rather than
remembered. Deviate deliberately, not by accident — and if Todd asks for a different
direction, his words win over every line below.

## The one thing that matters most

**The hand-drawn strokes are real geometry, not a CSS effect.** `roughjs` draws every
shape as two overlapping wobbled bézier curves — that is what Excalidraw's look actually
is, and no border-radius or filter imitates it. `roughjs`'s **generator** runs headless
with no DOM, so `scripts/rough-svg.mjs` produces path data in Node and the slide inlines
it as plain SVG.

An earlier attempt drew flat rectangles and Todd's verdict was *"Excalidraw can be very
beautiful, and I'm not seeing it in yours."* He was right, and this is why.

## Ground and palette — Catppuccin Mocha

**The palette is Catppuccin Mocha.** Todd's machine already runs it (micro, sketchybar,
Ghostty), so a deck in it matches the screen it is shown on. Hexes below are read from
`~/.config/micro/colorschemes/catppuccin-mocha.micro`, not recalled.

Dark, always, unless Todd says otherwise. A flat fill reads as a slide template; the depth
comes from three layers:

```css
background:
  radial-gradient(1200px 700px at 22% 8%, #313244 0%, transparent 62%),  /* surface0, one soft light source */
  #1e1e2e;                                                              /* base — the ground */
```

plus a grain overlay at `opacity:.045` — a 5px `radial-gradient` dot pattern, absolutely
positioned, `pointer-events:none`. Barely visible, and the difference between "dark
background" and "paper".

**One hue per meaning, never per box.** Mocha's accents are already tuned to one another,
so pick from the row and do not mix in an off-palette colour:

| Role | Mocha name | Hex |
| --- | --- | --- |
| the ground | base | `#1e1e2e` |
| a deeper well behind it | mantle / crust | `#181825` / `#11111b` |
| panel fill | surface0 | `#313244` |
| a lifted panel — the one box that matters | surface1 | `#45475a` |
| body text | text | `#cdd6f4` |
| secondary text | subtext1 | `#bac2de` |
| labels, rules, arrows | overlay2 | `#9399b2` |
| loaded / shared / live | blue | `#89b4fa` |
| private / a lane's own | green | `#a6e3a1` |
| machine — hooks, config, caveats | peach | `#fab387` |
| triggers, traps, danger | red | `#f38ba8` |
| a fourth actor | mauve | `#cba6f7` |
| a fifth, or an aside | teal | `#94e2d5` |

Also on the palette when one more is needed: lavender `#b4befe`, sky `#89dceb`, yellow
`#f9e2af`, pink `#f5c2e7`, flamingo `#f2cdcd`. Sapphire `#74c7ec`, maroon `#eba0ac` and
rosewater `#f5e0dc` are standard Mocha but are not in Todd's micro colorscheme file —
verify before relying on them.

**Latte** (`base #eff1f5`, `text #4c4f69`) is the light counterpart if Todd ever asks for
a light deck. Do not invent a third theme.

## Type

Two faces, both from Google Fonts (the only host the Artifact CSP admits):

- **Architects Daughter** — everything hand-drawn: headings, node labels, body.
- **Spline Sans Mono** — file paths, code, kickers, slide numbers.

Kickers are `15px`, `letter-spacing:.24em`, uppercase, `--faint`. Slide titles `56px`,
`line-height:1.02`. A title slide goes to `96px`. Never mix in a third face.

## Composition

- **1600×900 fixed.** Every slide, no exceptions — the deck shell scales one number.
- A `<svg width="1600" height="900" viewBox="0 0 1600 900" style="position:absolute;inset:0">`
  holds the drawing; HTML sits above it for anything that is running text.
- Margins are `72px` left and right, `64px` top, `44px` bottom.
- **Draw the relationships.** A slide of boxes is a list with borders. Arrows that
  converge, an elbow that routes around something, a decision diamond with two labelled
  exits — that is what makes it a diagram. `elbow([[x,y],[x,y],[x,y]])` routes; the last
  segment gets the arrowhead.
- Text inside SVG uses `<text>` with the `.m` class for mono. Keep it left-aligned at a
  box's `x+22`.

## Rules that bite

- **No emoji, ever.** A `✅` renders as a colour emoji block and wrecks a hand-drawn
  slide. Write the word, or draw the mark.
- Give every `roughjs` call a distinct `seed` — the same seed twice makes two shapes wobble
  identically, which reads as a copy-paste.
- Roughness `1.1–1.2` for boxes, `0.6` for arrowheads. Above `1.5` it stops looking
  hand-drawn and starts looking broken.
- Slides are authored as `.dc.html` for the design canvas. Keep the
  `<script src="./support.js"></script>` head line exactly; a static slide needs no
  `<script data-dc-script>` at all.
- The deck builder lifts `<div class="slide">…</div>` out of each `.dc.html` and reuses
  the first slide's `<style>` verbatim, so **the two outputs can never drift**.

## When a slide needs artwork, not geometry

roughjs draws boxes, arrows and diagrams. It cannot draw a character, a texture or
anything photographic. For those, call **`/slopdog:generate-image`** — the wrapper around
Todd's nanobanana script (`~/slopdog/dev/playground/banananano/generate.js`, Gemini image
models, key at `~/.config/playground/.env`).

Ask it for the Catppuccin Mocha hexes explicitly in the prompt; the model will not guess
them. Save the result beside the slides and reference it as a `files` entry (bare base64)
in the canvas, or inline it as a data URI in the deck. Keep each under ~70 KB — downsample
with `sips -Z 1200` — because the whole document republishes on every save.

Diagrams stay SVG. Reach for a generated image only when roughjs genuinely cannot make it.

## What the deck shell gives the viewer

Arrow keys, space, PageUp/PageDown, Home/End; click — left third back, rest forward; dots
that jump and announce themselves to a screen reader; `F` for full screen; `#3` in the URL
so a single slide is linkable. All of it is in `scripts/deck.mjs`; do not re-author it.
