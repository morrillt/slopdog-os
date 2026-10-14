// Hand-drawn SVG fragments via roughjs's headless generator (no DOM needed).
//
// This is the thing that makes a slide look hand-drawn: roughjs draws every shape as two
// overlapping wobbled bezier curves, which is what Excalidraw's look actually IS. No
// border-radius, filter or CSS trick imitates it. The GENERATOR needs no DOM, so it runs
// in plain Node and the slide inlines the path data as ordinary SVG.
//
// Needs `npm install` in this skill's directory once (node_modules is gitignored).
let rough;
try {
  rough = (await import('roughjs')).default;
} catch {
  console.error('roughjs is missing — run: npm install --prefix "$(dirname "$(dirname "$0")")"');
  console.error('  (that is the sd-visual-presentation skill directory, beside package.json)');
  process.exit(1);
}
const g = rough.generator();
const path = (d, opts) => {
  const out = [];
  for (const s of d.sets) {
    if (s.type === 'path')      out.push({ d: opsToPath(s.ops), stroke: opts.stroke, fill: 'none', w: opts.strokeWidth ?? 1.6 });
    else if (s.type === 'fillPath')   out.push({ d: opsToPath(s.ops), stroke: 'none', fill: opts.fill, w: 0 });
    else if (s.type === 'fillSketch') out.push({ d: opsToPath(s.ops), stroke: opts.fill, fill: 'none', w: (opts.fillWeight ?? 1) });
  }
  return out;
};
function opsToPath(ops) {
  let d = '';
  for (const o of ops) {
    const n = o.data.map(v => Math.round(v * 10) / 10);
    if (o.op === 'move') d += `M${n[0]} ${n[1]}`;
    else if (o.op === 'bcurveTo') d += `C${n[0]} ${n[1]} ${n[2]} ${n[3]} ${n[4]} ${n[5]}`;
    else if (o.op === 'lineTo') d += `L${n[0]} ${n[1]}`;
  }
  return d;
}
const emit = parts => parts.map(p =>
  `<path d="${p.d}" fill="${p.fill}" stroke="${p.stroke}"${p.w ? ` stroke-width="${p.w}" stroke-linecap="round" stroke-linejoin="round"` : ''}/>`
).join('');

export function rect(x, y, w, h, o = {}) {
  const opts = { roughness: o.roughness ?? 1.15, bowing: o.bowing ?? 1.1, seed: o.seed ?? 7,
    stroke: o.stroke ?? '#cfd6e4', strokeWidth: o.strokeWidth ?? 1.7,
    fill: o.fill, fillStyle: o.fillStyle ?? 'solid', fillWeight: o.fillWeight ?? 1 };
  return emit(path(g.rectangle(x, y, w, h, opts), opts));
}
export function ellipse(cx, cy, w, h, o = {}) {
  const opts = { roughness: o.roughness ?? 1.1, seed: o.seed ?? 11, stroke: o.stroke ?? '#cfd6e4',
    strokeWidth: o.strokeWidth ?? 1.7, fill: o.fill, fillStyle: o.fillStyle ?? 'solid' };
  return emit(path(g.ellipse(cx, cy, w, h, opts), opts));
}
export function line(x1, y1, x2, y2, o = {}) {
  const opts = { roughness: o.roughness ?? 1.2, seed: o.seed ?? 3, stroke: o.stroke ?? '#cfd6e4',
    strokeWidth: o.strokeWidth ?? 1.7 };
  return emit(path(g.line(x1, y1, x2, y2, opts), opts));
}
export function arrow(x1, y1, x2, y2, o = {}) {
  const stroke = o.stroke ?? '#cfd6e4', sw = o.strokeWidth ?? 1.7, seed = o.seed ?? 5;
  const ang = Math.atan2(y2 - y1, x2 - x1), head = o.head ?? 13, spread = 0.42;
  return line(x1, y1, x2, y2, { stroke, strokeWidth: sw, seed, roughness: o.roughness })
    + line(x2, y2, x2 - head * Math.cos(ang - spread), y2 - head * Math.sin(ang - spread), { stroke, strokeWidth: sw, seed: seed + 1, roughness: .6 })
    + line(x2, y2, x2 - head * Math.cos(ang + spread), y2 - head * Math.sin(ang + spread), { stroke, strokeWidth: sw, seed: seed + 2, roughness: .6 });
}
export function elbow(pts, o = {}) {
  let out = '';
  for (let i = 0; i < pts.length - 1; i++) {
    const last = i === pts.length - 2;
    const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
    out += last && o.arrow !== false
      ? arrow(x1, y1, x2, y2, { ...o, seed: (o.seed ?? 5) + i * 3 })
      : line(x1, y1, x2, y2, { ...o, seed: (o.seed ?? 5) + i * 3 });
  }
  return out;
}
