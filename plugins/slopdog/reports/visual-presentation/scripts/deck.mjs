#!/usr/bin/env node
// Wrap a set of authored slide files into one click-through deck artifact.
//
//   node deck.mjs --out <deck.html> --title "…" \
//     --slide Main.dc.html:"How the crew remembers" \
//     --slide WhatLoads.dc.html:"What loads"  …
//
// Each --slide is a .dc.html authored for the design canvas. This lifts the
// `<div class="slide">…</div>` out of each one and stacks them in a deck shell:
// arrow keys, space, click (left third back), dots, F for full screen, #n in the
// URL. One set of slide files therefore produces BOTH outputs — the canvas via
// the design skill's seed-canvas.mjs, and this deck — with no second authoring.
import { readFileSync, writeFileSync } from 'node:fs';

const args = process.argv.slice(2);
const val = f => { const i = args.indexOf(f); return i < 0 ? null : args[i + 1]; };
const all = f => args.reduce((a, v, i) => (args[i - 1] === f ? [...a, v] : a), []);

const out = val('--out'), title = val('--title');
const slides = all('--slide').map(s => {
  const i = s.lastIndexOf(':');
  return { file: s.slice(0, i), name: s.slice(i + 1) };
});
if (!out || !title || !slides.length) {
  console.error('usage: deck.mjs --out <file> --title "…" --slide <file>:"<name>" [--slide …]');
  process.exit(1);
}

// Palette + shell CSS are read from the FIRST slide's <style> so the deck can
// never drift from the slides it wraps. Everything between <style> and </style>
// inside its helmet is reused verbatim.
const first = readFileSync(slides[0].file, 'utf8');
const styleMatch = first.match(/<style>([\s\S]*?)<\/style>/);
if (!styleMatch) { console.error(`no <style> block in ${slides[0].file}`); process.exit(1); }
const slideCss = styleMatch[1].trim();
const fontLink = (first.match(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>/) || [''])[0];

const bodies = slides.map(s => {
  const raw = readFileSync(s.file, 'utf8');
  const a = raw.indexOf('<div class="slide">');
  const b = raw.lastIndexOf('</x-dc>');
  if (a < 0 || b < 0) { console.error(`${s.file}: no <div class="slide"> inside <x-dc>`); process.exit(1); }
  return raw.slice(a, b).trim();
});

const deck = `<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
${fontLink}
<style>
${slideCss}
*{box-sizing:border-box}
html,body{height:100%;margin:0;overflow:hidden}
.stage{position:fixed;inset:0;display:grid;place-items:center}
.slide{box-shadow:0 30px 90px -30px rgba(0,0,0,.9),0 0 0 1px rgba(255,255,255,.05)}
.deck-slide{display:none}
.deck-slide.on{display:block}
.chrome{position:fixed;left:0;right:0;bottom:18px;display:flex;justify-content:center;
  align-items:center;gap:18px;z-index:5;opacity:.85}
.dots{display:flex;gap:9px}
.dot{width:9px;height:9px;border-radius:50%;background:#3a4756;border:0;padding:0;
  cursor:pointer;transition:background .18s,transform .18s}
.dot[aria-current="true"]{background:var(--deck-accent,#7aa2d8);transform:scale(1.35)}
.dot:focus-visible{outline:2px solid var(--deck-accent,#7aa2d8);outline-offset:3px}
.nav{font-family:'Spline Sans Mono',ui-monospace,monospace;font-size:13px;color:#5b6979;
  background:transparent;border:1px solid #313d4b;border-radius:3px;padding:.3rem .6rem;cursor:pointer}
.nav:hover{color:#dde3ec;border-color:#5b6979}
.nav:focus-visible{outline:2px solid var(--deck-accent,#7aa2d8);outline-offset:2px}
.name{font-family:'Spline Sans Mono',ui-monospace,monospace;font-size:12px;color:#5b6979;
  letter-spacing:.12em;text-transform:uppercase;min-width:16ch;text-align:center}
.hint{position:fixed;top:16px;right:20px;font-family:'Spline Sans Mono',ui-monospace,monospace;
  font-size:11.5px;color:#46525f;letter-spacing:.08em;z-index:5}
@media (prefers-reduced-motion:reduce){.dot{transition:none}}
</style>
<div class="hint">← → &nbsp;or click &nbsp;·&nbsp; F for full screen</div>
<div class="stage" id="stage">
${bodies.map((b, i) => `<div class="deck-slide${i === 0 ? ' on' : ''}">${b}</div>`).join('\n')}
</div>
<div class="chrome">
  <button class="nav" id="prev" aria-label="Previous slide">◀</button>
  <div class="dots" id="dots"></div>
  <span class="name" id="name"></span>
  <button class="nav" id="next" aria-label="Next slide">▶</button>
</div>
<script>
(function(){
  var names = ${JSON.stringify(slides.map(s => s.name))};
  var slides = Array.prototype.slice.call(document.querySelectorAll('.deck-slide'));
  var i = 0, stage = document.getElementById('stage'), dots = document.getElementById('dots');
  slides.forEach(function(_, n){
    var b = document.createElement('button');
    b.className = 'dot'; b.type = 'button';
    b.setAttribute('aria-label', 'Slide ' + (n+1) + ': ' + names[n]);
    b.addEventListener('click', function(e){ e.stopPropagation(); go(n); });
    dots.appendChild(b);
  });
  function fit(){
    var el = slides[i] && slides[i].firstElementChild;
    if (!el) return;
    var w = el.offsetWidth || 1600, h = el.offsetHeight || 900;
    // Inside a published artifact's sandboxed iframe, window.innerWidth/innerHeight
    // can still read 0 (or another not-yet-settled value) at the moment this first
    // runs synchronously on load, before the host finishes sizing the iframe — that
    // produced scale(0), i.e. a genuinely invisible slide (blank on mobile, where the
    // sizing handshake is slower; a stale near-1 scale on desktop, where it read a
    // moment sooner). Never let a bad read zero out the deck: fall back to the
    // slide's own size (scale 1) rather than trusting a 0 or negative viewport.
    var vw = window.innerWidth || w, vh = window.innerHeight || h;
    var s = Math.min(vw / w, (vh - 70) / h);
    if (!isFinite(s) || s <= 0) s = 1;
    slides.forEach(function(sl){
      var inner = sl.firstElementChild;
      if (inner) { inner.style.transform = 'scale(' + s + ')'; inner.style.transformOrigin = 'center center'; }
    });
  }
  // Retry after the iframe's real size settles (it wasn't always ready synchronously)
  // rather than trusting the very first read. Cheap: a few frames, then give up and
  // rely on the resize listener + ResizeObserver below for anything later.
  var fitRetries = 0;
  function fitSoon(){
    fit();
    if (fitRetries++ < 10) requestAnimationFrame(fitSoon);
  }
  // A host resizing the IFRAME ELEMENT from outside does not reliably fire this
  // window's own 'resize' event in every browser — a ResizeObserver on <html> catches
  // it either way, which is what actually caught the bug this comment describes.
  if (window.ResizeObserver) {
    new ResizeObserver(fit).observe(document.documentElement);
  }
  function go(n){
    i = (n + slides.length) % slides.length;
    slides.forEach(function(el, k){ el.classList.toggle('on', k === i); });
    Array.prototype.forEach.call(dots.children, function(d, k){ d.setAttribute('aria-current', k === i); });
    document.getElementById('name').textContent = names[i];
    if (location.hash !== '#' + (i+1)) history.replaceState(null, '', '#' + (i+1));
    fit();
  }
  document.getElementById('next').addEventListener('click', function(e){ e.stopPropagation(); go(i+1); });
  document.getElementById('prev').addEventListener('click', function(e){ e.stopPropagation(); go(i-1); });
  stage.addEventListener('click', function(e){ go(i + (e.clientX < window.innerWidth/3 ? -1 : 1)); });
  document.addEventListener('keydown', function(e){
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); go(i+1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); go(i-1); }
    else if (e.key === 'Home') go(0);
    else if (e.key === 'End') go(slides.length-1);
    else if (e.key === 'f' || e.key === 'F') {
      if (document.fullscreenElement) document.exitFullscreen();
      else if (document.documentElement.requestFullscreen) document.documentElement.requestFullscreen();
    }
  });
  window.addEventListener('resize', fit);
  var start = parseInt((location.hash || '#1').slice(1), 10);
  go(isNaN(start) ? 0 : start - 1);
  fitSoon();
})();
<\/script>
`;
writeFileSync(out, deck);
console.log(`wrote ${out} — "${title}", ${slides.length} slides: ${slides.map(s=>s.file).join(', ')}`);
