#!/usr/bin/env node
// commit-msg — the house commit-message rule, enforced (rules/commits.md).
//
// Wired as core.hooksPath in ~/slopdog and ~/slopdog/tasks; `commit-msg` beside this file is a
// symlink to it, so git finds the name it expects and Node still loads this as ESM.
//
//   <lane> T-<id>[-<n>][ step <N>]: <what changed>      ticket work
//   <lane>: <what changed>                              anything else
//   Why: <reason>                                       required in the body
//   Decision: <choice taken> — <alternative rejected>   optional, any number
//   Auto: <script-name>                                 a script's commit; stands in for Why
//
// <lane> is a key in v2/lanes.json, a desk folder under v2/desks/ (publish, research), or `todd`.
// A T-id must be a ticket under tasks/tickets (archive included). Merges, reverts, cherry-picks,
// fixup!/squash!/amend! commits and anything mid-rebase are let through untouched.
//
// Exported `check()` is pure apart from reading lanes and tickets, so the tests and the dry pass
// over history call it directly.
import { existsSync, readFileSync, readdirSync, realpathSync, statSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(realpathSync(fileURLToPath(import.meta.url)));
export const V2 = process.env.COMMIT_HOOK_V2 || resolve(HERE, '..');
export const TICKETS = process.env.COMMIT_HOOK_TICKETS || resolve(V2, '../tasks/tickets');

export const FORMAT = [
  'Expected commit message:',
  '',
  '  <lane> T-<id>[-<n>][ step <N>]: <what changed>     (ticket work)',
  '  <lane>: <what changed>                             (anything else)',
  '',
  '  Why: <the reason for the change>                   (required)',
  '  Decision: <choice taken> — <alternative rejected>  (optional, one per decision)',
  '',
  '  <lane> is a key in ~/slopdog/v2/lanes.json, a desk folder under v2/desks/, or `todd`.',
  '  A script commits with an `Auto: <script-name>` line instead of Why.',
  '',
  'Example:',
  '',
  '  build T-552 step 2: dispatch writes the worktree path into the job file',
  '',
  '  Why: the verifier was guessing the worktree from the branch name and picked a stale one.',
  '  Decision: store the absolute path — rejected deriving it again from the branch',
  '',
  'Rule: ~/slopdog/v2/rules/commits.md',
].join('\n');

let laneCache;
export function lanes(v2 = V2) {
  if (laneCache && laneCache.v2 === v2) return laneCache.set;
  const set = new Set(['todd']);
  try {
    const l = JSON.parse(readFileSync(join(v2, 'lanes.json'), 'utf8'));
    for (const [k, v] of Object.entries(l)) if (v && typeof v === 'object' && v.id === k) set.add(k);
  } catch { /* no lanes.json: only todd and desk folders */ }
  try {
    for (const d of readdirSync(join(v2, 'desks'))) if (existsSync(join(v2, 'desks', d, 'CLAUDE.md'))) set.add(d);
  } catch { /* no desks folder */ }
  laneCache = { v2, set };
  return set;
}

let ticketCache;
export function tickets(dir = TICKETS) {
  if (ticketCache && ticketCache.dir === dir) return ticketCache.set;
  const set = new Set();
  const walk = (d) => {
    let names = [];
    try { names = readdirSync(d); } catch { return; }
    for (const n of names) {
      const p = join(d, n);
      let st;
      try { st = statSync(p); } catch { continue; }
      if (st.isDirectory()) walk(p);
      else if (n.endsWith('.md')) {
        const head = readFileSync(p, 'utf8').slice(0, 4000);
        for (const m of head.matchAll(/^(?:id:\s*(T-\d+)\b|(T-\d+) ·)/gm)) set.add(m[1] || m[2]);
      }
    }
  };
  walk(dir);
  ticketCache = { dir, set };
  return set;
}

// Drop git's comment lines and everything below a `--- >8 ---` scissors line.
export function clean(raw) {
  const lines = [];
  for (const l of String(raw).split('\n')) {
    if (/^# -+ >8 -+/.test(l)) break;
    if (l.startsWith('#')) continue;
    lines.push(l.replace(/\s+$/, ''));
  }
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines[lines.length - 1]) lines.pop();
  return lines;
}

const SUBJECT = /^([a-z0-9][a-z0-9_-]*)(?: (T-\d+)(?:-\d+)?(?: step \d+)?)?: (\S.*)$/;

// state: { merge, revert, cherryPick, rebase } from the repo; all false in a dry pass.
// Returns { ok, exempt?, errors[] }.
export function check(raw, state = {}, { v2 = V2, ticketsDir = TICKETS } = {}) {
  const lines = clean(raw);
  const subject = lines[0] || '';
  const body = lines.slice(1);
  if (state.merge || state.revert || state.cherryPick || state.rebase) return { ok: true, exempt: 'repo state', errors: [] };
  if (/^(fixup|squash|amend)! /.test(subject)) return { ok: true, exempt: 'fixup', errors: [] };
  if (/^Revert "/.test(subject) && body.some((l) => /^This reverts commit [0-9a-f]{7,}/.test(l))) return { ok: true, exempt: 'revert', errors: [] };
  if (/^Merge (branch|remote-tracking branch|commit|pull request|tag) /.test(subject)) return { ok: true, exempt: 'merge', errors: [] };
  // Transitional: dispatch.mjs commits a sidekick's leftovers in its worktree as
  // `sidekick(<engine>): <task>` with its output ignored, so a rejection there would silently
  // drop the builder's work. Tyrion owns dispatch.mjs; drop this line when it writes
  // `<lane> T-<id>: …` plus `Auto: dispatch`.
  if (/^sidekick\([a-z0-9_-]+\): \S/.test(subject)) return { ok: true, exempt: 'dispatch sidekick (transitional)', errors: [] };

  const errors = [];
  if (!subject) return { ok: false, errors: ['the message is empty'] };
  if (/^wip\.?$/i.test(subject)) return { ok: false, errors: ['a bare `wip` is not a commit message'] };
  const m = subject.match(SUBJECT);
  if (!m) {
    errors.push(`the subject does not start with \`<lane>:\` or \`<lane> T-<id>:\` — got "${subject.slice(0, 80)}"`);
  } else {
    const [, lane, ticket, text] = m;
    if (!lanes(v2).has(lane)) errors.push(`\`${lane}\` is not a lane: use a key from v2/lanes.json, a desk folder under v2/desks/, or \`todd\``);
    if (ticket && !tickets(ticketsDir).has(ticket)) errors.push(`${ticket} is not a ticket under ~/slopdog/tasks/tickets (archive included)`);
    if (/^wip\.?$/i.test(text.trim()) && !body.some((l) => /^Auto: \S/.test(l))) errors.push('`wip` says nothing about what changed');
  }
  const auto = body.some((l) => /^Auto: \S/.test(l));
  const why = body.find((l) => /^Why:/.test(l));
  if (!auto) {
    if (!why) errors.push('the body has no `Why: <reason>` line (a script uses `Auto: <script-name>` instead)');
    else if (why.replace(/^Why:\s*/, '').length < 10) errors.push('the Why line is too short to say why');
  }
  for (const d of body.filter((l) => /^Decision:/.test(l))) {
    if (!/^Decision:\s*\S.*\s(—|--)\s+\S/.test(d)) errors.push(`"${d.slice(0, 60)}" needs the shape \`Decision: <choice taken> — <alternative rejected>\``);
  }
  return { ok: errors.length === 0, errors };
}

function gitPath(name) {
  const r = spawnSync('git', ['rev-parse', '--git-path', name], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : '';
}

export function repoState(msgFile) {
  const has = (n) => { const p = gitPath(n); return !!p && existsSync(p); };
  return {
    merge: basename(msgFile || '') === 'MERGE_MSG' || has('MERGE_HEAD'),
    revert: has('REVERT_HEAD'),
    cherryPick: has('CHERRY_PICK_HEAD'),
    rebase: has('rebase-merge') || has('rebase-apply'),
  };
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const file = process.argv[2];
  if (!file) process.exit(0);
  const raw = readFileSync(file, 'utf8');
  const r = check(raw, repoState(file));
  if (r.ok) process.exit(0);
  process.stderr.write(`\ncommit rejected by ~/slopdog/v2/git-hooks/commit-msg:\n${r.errors.map((e) => `  - ${e}`).join('\n')}\n\n${FORMAT}\n\n`);
  process.exit(1);
}
