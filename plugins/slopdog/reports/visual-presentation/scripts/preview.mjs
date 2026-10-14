#!/usr/bin/env node
// Strip the design-canvas wrapper off one .dc.html so a plain browser or
// `qlmanage -t` can render it. Step 3's look depends on this: <x-dc>, <helmet>
// and the support.js shim are canvas machinery and stop it rendering standalone.
//
//   node preview.mjs <Slide.dc.html> <out.html>
import { readFileSync, writeFileSync } from 'node:fs';
const [src, out] = process.argv.slice(2);
if (!src || !out) { console.error('usage: preview.mjs <Slide.dc.html> <out.html>'); process.exit(1); }
const html = readFileSync(src, 'utf8')
  .replace('<script src="./support.js"></script>', '')
  .replace('<x-dc>', '').replace('</x-dc>', '')
  .replace('<helmet>', '').replace('</helmet>', '');
writeFileSync(out, html);
console.log(`${out} — open it, or: qlmanage -t -s 1600 -o $(dirname ${out}) ${out}`);
