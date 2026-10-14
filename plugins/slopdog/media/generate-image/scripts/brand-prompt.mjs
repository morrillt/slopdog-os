#!/usr/bin/env node
// brand-prompt — wrap a subject in the Slopdog house theme and write a prompt file.
//
// The theme is the point: Catpuccin cosmic, 80s synthwave glow, bold black ink outlines
// and flat 2D cell-shading. It is the look of the crew on the bridge, the app covers and
// the avatars alike — so it applies to EVERY generation unless Todd says otherwise, not
// only to profile pictures. Wording lifted from banananano's own configs
// (configs/catpuccin-space.json, configs/slopdog-crew-new.json).
//
//   node brand-prompt.mjs "a stack of glowing server racks"           scene — the default
//   node brand-prompt.mjs --profile GEMMY "a small scrappy velociraptor …"
//   node brand-prompt.mjs --plain "…"                                 no theme, a one-off
//   node brand-prompt.mjs … --out prompt.txt                          write it (else stdout)
//
// Then: node generate-openai.mjs <that file> --out <name>.png --size 1024x1024

import { writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const take = (f) => { const i = argv.indexOf(f); return i === -1 ? null : argv.splice(i, 2)[1]; };
const has  = (f) => { const i = argv.indexOf(f); if (i === -1) return false; argv.splice(i, 1); return true; };

const out     = take('--out');
const profile = take('--profile');
const plain   = has('--plain');
const subject = argv.join(' ').trim();

if (!subject) {
  console.error('usage: brand-prompt.mjs "<subject>" [--profile <NAME>] [--plain] [--out <file>]');
  process.exit(2);
}

const SPACE =
  'Setting: the Slopdog universe — a swirling cosmic nebula of interstellar gas and dust, ' +
  'distant stars, twinkling clusters and subtle galaxy spirals behind whatever is in frame.';

const LINE =
  'Style DNA: bold black ink outlines, flat 2D cell-shading, simplified features — a clean ' +
  'cartoon treatment over a rich cosmic backdrop, high-contrast and poster-quality.';

const PALETTE =
  'Colour: strictly the Catpuccin palette — deep mocha and onyx for the void and for dark ' +
  'interiors, soft lavender and mauve for highlights, and vibrant rose and cyan for glowing ' +
  'gas, screens, holograms and distant stars.';

const LIGHT =
  'Lighting: 80s synthwave cinematic glow. Light sources bleed softly and the colours pop ' +
  'with neon energy against the dark. Awe-inspiring and technologically vibrant, never murky.';

const scene = [
  `${subject}.`, '',
  SPACE, LINE, PALETTE, LIGHT, '',
  'Composition: one clear focal point, generous contrast, and nothing important in the bottom',
  'third so a title can sit there. No text anywhere in the image.',
].join('\n');

const portrait = [
  `Square 1:1 profile avatar illustration of a character called ${profile}, drawn in a bold pop-art comic style.`, '',
  `Art style: thick clean black outlines, cel-shaded flat colour with soft glowing rim light, high-contrast digital comic illustration. The background is a swirling cosmic nebula in deep purple, hot magenta, electric blue and teal, with scattered small white stars and a bright spiral core behind the character's head. Head-and-shoulders portrait, character centred and filling most of the frame, cropped at the chest.`, '',
  `Character: ${subject}. It wears round black circular sunglasses with a swirling purple-and-blue galaxy reflected in each lens.`, '',
  `Banner: across the top of the image, a rounded-rectangle name plate with a dark navy fill and a glowing neon cyan outline, containing the text "${profile}" in bold condensed uppercase white letters.`, '',
  'Poster-quality, clean, high-impact, vibrant.',
].join('\n');

const text = plain ? subject : (profile ? portrait : scene);
if (out) { writeFileSync(out, text + '\n'); console.error(`wrote ${out}`); }
else process.stdout.write(text + '\n');
