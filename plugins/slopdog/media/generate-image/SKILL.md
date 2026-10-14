---
name: generate-image
description: Generate an image — gpt-image-1 via Todd's banananano scripts — an avatar, an illustration, a style study, a graphic for a deck — optionally steered by reference images. Use when Todd says "generate an image", "/slopdog:generate-image", "nano banana", "nanobanana", "banananano", "make an image", "make a picture of", "draw me", "make an avatar", "make a graphic", "crew avatar", or a skill needs artwork it cannot draw as SVG. Every image gets the Slopdog house theme by default — cosmic Catpuccin, synthwave glow, bold cartoon linework (reference/house-theme.md); --plain opts out.
allowed-tools:
  - Read
  - Write
  - Bash
  - Glob
---

# generate-image — nanobanana, wrapped

Todd's own CLI at `~/slopdog/dev/playground/banananano/`. Two scripts sit there, and
picking the right one is most of this skill.

**Use `generate.js`. It is Nano Banana, and billing is on.**

```bash
cd ~/slopdog/dev/playground/banananano
node generate.js <prompt-file> --out <path>.png            # gemini-2.5-flash-image
node generate.js <prompt-file> -pro --out <path>.png       # gemini-3-pro-image-preview
node generate.js <prompt-file> --image ref.png --out <path>.png
```

Output is 1024x1024 square; `--out` takes a full path and creates the directory. The key
is resolved automatically — `GEMINI_API_KEY`, then `~/.config/gemini/env` — so you pass
none and it never reaches shell history.

**Resolution is not a cost lever on flash.** `gemini-2.5-flash-image` returns
1024x1024 and takes no size argument — `imageConfig` only sets `aspectRatio: "1:1"`.
Only `-pro` accepts `imageSize`, and it is pinned to `1K` there. So there is nothing to
turn down for a cheaper image; the choice is the model, not the pixels. Todd's standing
answer if resolution ever does become a lever: **1080p is fine** — never pay for 2K or 4K
without asking. Same on the OpenAI fallback, where `--size 1024x1024` must be passed
because the default is a larger `1536x1024`.

**Never default to `-pro`.** `gemini-2.5-flash-image` is the default and stays the
default; `gemini-3-pro-image-preview` costs materially more per image and is a deliberate
choice Todd makes, not an upgrade to reach for because an image matters. Ask before using
it, or use it only when he has said to. `generate-pro.js` is hardwired to the pro model —
that is the whole reason it is a separate script, so don't reach for it casually either.
Billing is prepay now, so every generation spends real balance.

**`--image` is the reason this is the primary.** It takes reference files for style
matching, which is how a character stays the same character across generations, and the
layered `configs/*.json` prompt engine (`generate-pro.js`) only speaks to Gemini. Todd
tuned the house look against this model; the OpenAI path flattens that tuning to prose.

Verified 2026-09-07: prepay billing enabled on the key's project
(`gen-lang-client-0522455565`), a live call returns a PNG, and `--out` writes where told.
Before that the free tier returned `429 RESOURCE_EXHAUSTED … limit: 0`, which meant image
generation was not included at all rather than temporarily exhausted.

**Fallback — `generate-openai.mjs`, gpt-image-1.** Reach for it only if Gemini is failing.

```bash
node generate-openai.mjs <prompt-file> --out <name>.png --size 1024x1024
```

`--mini` switches to `gpt-image-1-mini`; the key comes from `~/.config/voicerecord/.env`
(then `~/.config/<other-app>/.env`). **Pass `--size 1024x1024`** — the default is
`1536x1024` landscape, wrong for any avatar. It takes no reference images, so a house
style has to be described in words. It drew Princess Lu and Gemmy during the months the
Gemini key was blocked.

Do not reimplement either, and do not call an image API directly.

## Setup, once per machine

```bash
cd ~/slopdog/dev/playground/banananano && npm install     # if node_modules is missing
```

Keys live in `~/.config/`, never in the tree, and both scripts know where to look:
`generate.js` resolves `GEMINI_API_KEY` then `~/.config/gemini/env`, `generate-openai.mjs`
resolves `~/.config/voicerecord/.env` then `~/.config/<other-app>/.env`. These files are
written `KEY = value` **with spaces around the `=`**, which `set -a; . file` chokes on —
parse them, never source them.

Never write a key into a prompt file, a doc, or a commit.

## The house theme goes on everything, not just avatars

**Every image is in the Slopdog universe by default** — the crew on the bridge, an app
cover, a deck graphic, an avatar. Cosmic nebula behind the subject, Catpuccin colour, 80s
synthwave glow, bold black ink outlines with flat 2D cell-shading. Todd built that look
deliberately and it is what makes a new picture look like it belongs.

So compose the prompt with the helper rather than writing one from scratch:

```bash
S=~/.claude/skills/slopdog/media/generate-image/scripts

# a scene — the default
node $S/brand-prompt.mjs "Slopdog in command at the centre of a starship bridge, his crew
  reacting to a glowing anomaly on the viewscreen" --out prompt.txt

# a crew portrait — adds the head-and-shoulders framing, the galaxy sunglasses, the nameplate
node $S/brand-prompt.mjs --profile GEMMY "a small scrappy velociraptor, mint-teal hide …" --out prompt.txt

# no house style at all — say so out loud when you use it
node $S/brand-prompt.mjs --plain "…" --out prompt.txt
```

`--plain` is for when Todd asks for something outside the universe. Everything else gets
the theme. The full wording, where it came from, and the character line for each existing
crew member are in **`reference/house-theme.md`** — read it before deviating.

**Do not lift a `prompt_*.txt` out of `banananano` because its name matches the character.**
Several are rejected attempts kept under the name of the thing they failed to draw —
`prompt_lu_avatar.txt` produces a flat pop-art fox on a gold sunburst and is nothing like
Princess Lu. Check any prompt against the actual image before reusing it.

## The steps

### 1 · Write the prompt to a file

Use `brand-prompt.mjs --out` above; it writes the file for you with the theme already in
it. Both scripts take a **path**, not a string. Write the prompt to a real file — in the
scratchpad for a one-off, or beside the work if it is worth keeping. The repo's
`prompt_*.txt` files are the house examples; read one before writing your first
(`prompt_lu_avatar.txt` and `prompt_gemini_avatar.txt` are the most recent, and the
closest to a team-avatar brief).

What makes these prompts work, from the ones that landed:

- **Name the medium first** — "a hand-inked character portrait", "a flat vector mark" —
  before describing the subject. The medium decides more of the result than the subject.
- **One subject, one action, one setting.** A prompt with three ideas returns a collage.
- **Say what is NOT in it** — no text, no background clutter, no logo — because the model
  adds text unprompted and it is always wrong.
- **Name the palette explicitly** if it must match something. For anything going into a
  Slopdog deck, that is Catppuccin Mocha, and the hexes are in
  `~/.claude/skills/slopdog/reports/visual-presentation/reference/house-style.md`.
- Square is the default (`1:1`); the script sets it and there is no flag to change it.

### 2 · Generate

```bash
node generate-openai.mjs prompt.txt --out gemmy-avatar.png --size 1024x1024
```

`--out` names the file, so there is no `output-<timestamp>.png` to clean up afterwards.
Without it the file lands in the current directory under a generated name, and the repo
root is already thick with those.

### 3 · Look at it

`Read` the PNG. Actually look. The model returns text instead of an image often enough
that "Image saved as …" is the only proof, and a saved image can still be wrong in ways
only looking catches — text baked in, six fingers, the wrong species.

One reroll is normal; three means the prompt is the problem, not the model.

### 4 · Name it and put it somewhere

Rename off `output-<timestamp>`. A keeper goes where the thing it belongs to lives — a
team avatar beside the team, a deck graphic beside the deck. Commit it in the same turn.

Delete the rejects. They are 500 KB each and the repo already carries twenty.

## Using it from another skill

`/slopdog:visual-presentation` calls this for artwork a slide cannot draw as SVG — a
character, a texture, a photographic element. Rough geometry and diagrams stay SVG; this
is for the things roughjs cannot make.

## Don't

- Don't put the key anywhere but `~/.config/playground/.env`.
- Don't generate a person who is a real, identifiable individual.
- Don't leave `output-*.png` lying around unnamed.
- Don't ask the model for text in the image. It cannot spell.
