#!/usr/bin/env node
// Prints cmux's pane layout sorted top-left to bottom-right (x, then y),
// since list-panes --json comes back in no particular order and every step
// of team-layout needs to re-check the map after a move or resize.

import { execFileSync } from 'node:child_process';

const CMUX = process.env.CMUX_CLAUDE_TEAMS_CMUX_BIN
  || '/Applications/cmux.app/Contents/Resources/bin/cmux';

const workspace = process.argv.includes('--workspace')
  ? process.argv[process.argv.indexOf('--workspace') + 1]
  : null;

const args = ['list-panes', '--json'];
if (workspace) args.push('--workspace', workspace);

const raw = execFileSync(CMUX, args, { encoding: 'utf8' });
const data = JSON.parse(raw);
const panes = Array.isArray(data) ? data : (data.panes ?? []);

function frame(p) {
  return p.pixel_frame ?? p.frame ?? {};
}

panes.sort((a, b) => {
  const fa = frame(a), fb = frame(b);
  return (fa.x ?? 0) - (fb.x ?? 0) || (fa.y ?? 0) - (fb.y ?? 0);
});

for (const p of panes) {
  const f = frame(p);
  // Real field names, verified against cmux 0.64 output: ref, pixel_frame,
  // focused, selected_surface_ref, surface_refs. Titles need `cmux tree`.
  const ref = p.ref ?? p.pane_ref ?? '?';
  const focused = p.focused ? '*' : ' ';
  const sel = p.selected_surface_ref ?? '';
  const n = p.surface_count ?? (p.surface_refs?.length ?? '');
  const r = (v) => (typeof v === 'number' ? Math.round(v) : '?');
  console.log(
    `${ref.padEnd(8)} x=${String(r(f.x)).padStart(5)} y=${String(r(f.y)).padStart(4)}` +
    ` w=${String(r(f.width)).padStart(5)} h=${String(r(f.height)).padStart(5)} ${focused} ${sel}` +
    (n > 1 ? ` (+${n - 1} more)` : ''),
  );
}
