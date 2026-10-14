#!/usr/bin/env node
// mode.mjs — the one writer of ~/slopdog/v2/mode.json (T-264, T-643 crew modes).
//
//   node mode.mjs <spend|normal|conserve> [hours] [--dry-run] [note words…]
//
// Writes {mode, until: now+hours (default 4), set_by, note}, commits only that path in
// ~/slopdog and pushes, then types one line into every desk pane (herdr agent `herdr-<lane>`,
// else tmux @peak_lane; scripts/lib/desk-pane.mjs) whose lane is in the registry (never its own pane). Ends with the five-hour window from usage.json when
// that file is under ten minutes old, and a suggestion; it never flips the mode from the
// number. --dry-run prints what it would do and touches nothing.

import { readFileSync, writeFileSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { findDeskPane, listDeskPanes, selfLane, targetOf, typeLine } from '../../../../../scripts/lib/desk-pane.mjs';
import { readLanesDocument } from '../../../../../scripts/lib/registry.mjs';

const HOME = homedir();
const REPO = join(HOME, 'slopdog');
const MODE_FILE = join(REPO, 'v2', 'mode.json');
const V2 = join(REPO, 'v2');
const USAGE_FILE = join(HOME, '.local', 'state', 'slopdog', 'usage.json');
const USAGE_MAX_AGE_MS = 10 * 60 * 1000;
const VALID_MODES = new Set(['spend', 'normal', 'conserve']);

const usage = () => {
  console.error('usage: mode.mjs <spend|normal|conserve> [hours] [--dry-run] [note…]');
  process.exit(1);
};

const argv = process.argv.slice(2);
const dryRun = argv.includes('--dry-run');
const words = argv.filter((a) => a !== '--dry-run');
const mode = words.shift();
if (!mode || !VALID_MODES.has(mode)) usage();
let hours = 4;
if (words.length && /^\d+(\.\d+)?$/.test(words[0])) hours = Number(words.shift());
if (!(hours > 0)) usage();

const run = (cmd, args, opts = {}) => spawnSync(cmd, args, { encoding: 'utf8', ...opts });

// Who is setting it: an explicit lane, else this pane's desk lane (desk-pane selfLane), else Todd.
const laneOf = () => selfLane() || 'todd';

const now = new Date();
const until = new Date(now.getTime() + hours * 3600 * 1000);
const untilIso = until.toISOString().replace(/\.\d{3}Z$/, 'Z');
const untilLocal = until.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
const setBy = laneOf();
const note = words.length
  ? words.join(' ')
  : `${setBy}, ${now.toISOString().slice(0, 10)}: ${mode} for ${hours}h via /slopdog:mode.`;
const record = { mode, until: untilIso, set_by: setBy, note };
const json = JSON.stringify(record, null, 2) + '\n';

// Desk panes: every herdr/tmux desk pane whose lane the registry knows, minus this one.
const lanes = readLanesDocument({ v2: V2 });
const laneKeys = Object.keys(lanes).filter((k) => k !== '_');
const self = findDeskPane(null, { self: true })?.pane || '';
const targets = [];
let skippedSelf = null;
for (const { pane, lane } of listDeskPanes()) {
  if (!laneKeys.includes(lane)) continue;
  if (pane === self) { skippedSelf = { pane, lane }; continue; }
  targets.push({ pane, lane, name: lanes[lane].name });
}
const line = `Mode changed: ${mode} until ${untilLocal} local (${untilIso}). Re-read ~/slopdog/v2/mode.json; the mode hook tells you on your next prompt.`;

if (dryRun) {
  console.log(`dry-run: would write ${MODE_FILE}`);
  process.stdout.write(json);
  console.log(`dry-run: would commit v2/mode.json as "${setBy}: mode ${mode} until ${untilIso}" and push`);
  console.log(`dry-run: would send to ${targets.length} desk pane(s):`);
  for (const t of targets) console.log(`  ${t.pane}  ${t.lane} (${t.name})`);
  console.log(`dry-run: line: ${line}`);
} else {
  writeFileSync(MODE_FILE, json);
  console.log(`wrote ${MODE_FILE}: ${mode} until ${untilIso} (${setBy})`);
  const add = run('git', ['-C', REPO, 'add', 'v2/mode.json']);
  if (add.status !== 0) console.error(`git add failed: ${add.stderr.trim()}`);
  const commit = run('git', ['-C', REPO, 'commit', '-m', `${setBy}: mode ${mode} until ${untilIso}`, '-m', 'Auto: mode.mjs', '--', 'v2/mode.json']);
  if (commit.status !== 0) console.error(`git commit: ${(commit.stdout + commit.stderr).trim()}`);
  else {
    const push = run('git', ['-C', REPO, 'push']);
    console.log(push.status === 0 ? 'committed and pushed v2/mode.json' : `committed; push failed: ${push.stderr.trim()}`);
  }
  for (const t of targets) {
    try {
      typeLine(targetOf(t.pane), line);
      console.log(`told ${t.name} (${t.pane})`);
    } catch (e) {
      console.log(`could not reach ${t.name} (${t.pane}): ${e.message}`);
    }
  }
}
if (skippedSelf) console.log(`not sent to this pane (${skippedSelf.pane}, ${skippedSelf.lane}): you are reading this instead.`);
if (!targets.length) console.log('no other desk pane is live.');

// Budget: read-only advice from the status line's usage.json.
if (existsSync(USAGE_FILE)) {
  const age = Date.now() - statSync(USAGE_FILE).mtimeMs;
  if (age <= USAGE_MAX_AGE_MS) {
    try {
      const u = JSON.parse(readFileSync(USAGE_FILE, 'utf8'));
      const pct = u?.five_hour?.used_percentage;
      if (typeof pct === 'number') {
        const advice = pct < 50 ? 'budget says spend' : pct >= 70 ? 'budget says conserve' : 'budget is in between; any mode is fine';
        console.log(`five-hour window at ${pct}%: ${advice}. The mode was not flipped from this number; only the mode you name is set.`);
      }
    } catch (e) {
      console.log(`usage.json unreadable (${e.message}); no budget advice.`);
    }
  } else {
    console.log(`usage.json is ${Math.round(age / 60000)} min old; no budget advice until the status line refreshes.`);
  }
} else {
  console.log('no usage.json yet; no budget advice.');
}
