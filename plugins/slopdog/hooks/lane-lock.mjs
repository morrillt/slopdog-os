#!/usr/bin/env node
// lane-lock — stop two slopdog desks editing the same file blind.
//
// Born 2026-09-08, after Moe and Curly independently rewrote the same three
// lines of v2/CLAUDE.md three minutes apart and neither saw the other.
//
// PreToolUse (Edit|Write|NotebookEdit): if another lane holds the file and the
// lock is younger than TTL, exit 2 — Claude Code turns stderr into the refusal
// reason and the edit never happens. Otherwise take or refresh the lock, exit 0.
//
// Stop (--release): drop every lock this session holds.
//
// Scope is everything under ~/slopdog/v2 (ROOT): desks work
// in their own folders, so a same-file collision is two desks on one file. Files
// outside v2 (tasks/, dev/, notes/) are not locked. A lock lasts until the
// holder's turn ends (Stop) and expires after 30 minutes regardless, so a
// crashed desk never blocks anyone. Wired in plugins/slopdog/hooks/hooks.json.

import { readLanesDocument } from '../../../scripts/lib/registry.mjs'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve, relative, join, sep } from 'node:path';

// ~/slopdog/v2: this file is plugins/slopdog/hooks/lane-lock.mjs. Node hands a main module its
// realpath, so the ~/.claude/skills/slopdog symlink does not move ROOT.
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const LOCKS = join(ROOT, '.locks');
const TTL_MS = 30 * 60 * 1000;
// The desks, from the registry: key → folder under v2 (`scotty` → `desks/scotty`).
let LANES = [];
try {
  LANES = Object.entries(readLanesDocument({ v2: ROOT }))
    .filter(([, v]) => v && typeof v === 'object' && v.folder)
    .map(([key, v]) => ({ key, folder: v.folder.split('/').join(sep) }));
} catch { /* no registry: every session is 'slopdog' */ }

const stdin = readFileSync(0, 'utf8');
let input = {};
try { input = JSON.parse(stdin || '{}'); } catch { process.exit(0); }

const session = input.session_id || 'unknown';

// Which lane is this? The deepest registry folder the cwd sits in, so
// desks/build/laforge is `laforge`, not `build`.
function laneOf(cwd) {
  if (!cwd) return 'slopdog';
  const rel = relative(ROOT, resolve(cwd));
  if (rel.startsWith('..')) return 'slopdog';
  const hit = LANES
    .filter(({ folder }) => rel === folder || rel.startsWith(folder + sep))
    .sort((a, b) => b.folder.length - a.folder.length)[0];
  return hit ? hit.key : 'slopdog';
}

function lockPath(rel) {
  return join(LOCKS, rel.split(sep).join('__') + '.json');
}

if (process.argv.includes('--release')) {
  let dropped = 0;
  try {
    for (const f of readdirSync(LOCKS)) {
      const p = join(LOCKS, f);
      try {
        if (JSON.parse(readFileSync(p, 'utf8')).session === session) { rmSync(p); dropped++; }
      } catch { /* unreadable lock: leave it, TTL will clear it */ }
    }
  } catch { /* no locks dir yet */ }
  if (dropped) console.log(`lane-lock: released ${dropped} lock(s)`);
  process.exit(0);
}

const target = input.tool_input?.file_path || input.tool_input?.notebook_path;
if (!target) process.exit(0);

const rel = relative(ROOT, resolve(target));
// Not in the slopdog repo, or is the lock store itself — none of our business.
if (rel.startsWith('..') || rel.split(sep)[0] === '.locks') process.exit(0);

const lane = laneOf(input.cwd);
const now = Date.now();
const lp = lockPath(rel);

try {
  const held = JSON.parse(readFileSync(lp, 'utf8'));
  const age = now - held.ts;
  if (held.session !== session && age < TTL_MS) {
    const mins = Math.max(1, Math.round(age / 60000));
    const when = new Date(held.ts).toTimeString().slice(0, 5);
    process.stderr.write(
      `lane-lock: ${held.lane} has ${rel} — took it at ${when}, ${mins} min ago.\n` +
      `Do not edit it. Message ${held.lane} with the change you want, or pick different work.\n` +
      `The lock clears on its own ${Math.max(1, Math.round((TTL_MS - age) / 60000))} min from now.\n`
    );
    process.exit(2);
  }
} catch { /* no lock, or a corrupt one: fall through and take it */ }

mkdirSync(LOCKS, { recursive: true });
writeFileSync(lp, JSON.stringify({ path: rel, lane, session, ts: now }, null, 2));
process.exit(0);
