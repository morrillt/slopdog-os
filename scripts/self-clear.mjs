#!/usr/bin/env node
// self-clear.mjs — a desk clears its own Claude Code context and picks up from PICKUP.md.
//
// What: types `/clear`, Enter, then `/slopdog:pickup <folder>/PICKUP.md`, Enter, into the
// desk's own pane; the pickup skill reads the note and carries on. The pane is found through
// lib/desk-pane.mjs: in herdr it is $HERDR_PANE_ID (HERDR_ENV=1), in tmux $TMUX_PANE, herdr
// first (2026-10-03: tmux is being closed). Claude Code queues typed input while a turn runs,
// so when the desk runs this mid-turn the `/clear` fires as the turn ends. The pickup line is
// NOT queued behind it: in 2.1.281 the clear drops whatever is still queued (seen 2026-09-24:
// `/clear` fired at turn end, the second queued line vanished). So this process sends `/clear`
// and exits, and a detached child (`--watch <pane>`, setsid'd so the Bash tool's exit does not
// kill it) reads the pane (`herdr pane read` or `tmux capture-pane`) every half second until it
// shows the cleared, idle prompt (`❯ /clear` as the only transcript line above an empty `❯`),
// then types the pickup line (on herdr only once the agent is idle or done, never while it is
// working or waiting on a background agent; lib/clear-watch.mjs). On an idle pane that is immediate; mid-turn it is whenever the
// turn ends. No timer, no second pane: a state watch, using the same idle rule as `--lane`.
//
// Read before type: herdr's send-text appends to text already at the prompt, so every line
// typed here first reads the pane and refuses (exit 1, nothing sent) when the input box holds
// a human's unsent words. Claude Code's dim grey suggestion is not typed text.
//
// One watcher per pane, and it ends with its sequence (T-401). A new watcher kills any older
// `--watch` on the same pane before it starts polling. A watcher quits, typing nothing,
// when the sequence it belongs to is over: its PICKUP.md was rewritten (a later clear wrote
// a new note), or the pane went idle and then started another turn without clearing (the
// `/clear` did not take, and a stray pickup line now would land on a live desk). Past
// 15 minutes it gives up regardless. T-399's unstucker then recovers a parked clear.
//
// Why: context past ~70% makes a desk slow and forgetful; a note plus a self-sent /clear
// is cheaper than a restart and keeps the ticket in hand (T-133). The note is the one
// `/slopdog:clear-to-close` writes and `/slopdog:pickup` reads (T-141); this script only
// sends the two lines, and refuses when the note is stale or names no ticket, so a desk
// can never clear itself into amnesia.
//
// Modes:
//   (none)          the desk itself, from inside a turn. Targets its own pane only
//                   ($HERDR_PANE_ID, else $TMUX_PANE). Refuses (exit 1, one line, sends
//                   nothing) unless <dir>/PICKUP.md was modified in the last 10 minutes and
//                   names a ticket (first T-nnn or T-nnn-n in it, or, for a desk with its own
//                   task system, a tasks/<name>.md under the desk), and, in herdr, unless that
//                   pane runs claude and is this desk's (its label's registry folder, or its
//                   cwd when unlabelled, is <dir>): lib/desk-pane.mjs selfPaneProblem.
//   --ticket T-nnn  require that exact id in PICKUP.md instead of "any ticket".
//   --dir <folder>  the desk folder (default: cwd); its PICKUP.md is what the pickup line
//                   names.
//   --lane <key>    dispatcher use only (Tyrion clearing LaForge between batches). Finds
//                   that lane's pane (herdr agent `herdr-<lane>`, else tmux @peak_lane),
//                   refuses unless it is idle at an empty prompt (and, in herdr, the agent
//                   is idle or done, not working or blocked), sends only `/clear` + Enter.
//                   No pickup line, no PICKUP check. Never together with the default flags.
//   --dry-run       print what would be sent, send nothing. Still does the lookup and the
//                   idle check, which only read.
//
// Idle-prompt rule (lib/desk-pane.mjs notIdle, from captures of the live desks, 2026-09-24):
// an idle Claude Code pane ends with the input box — a `─` border, a line that is exactly
// `❯` and another border — followed by the status rows. While a turn runs the same box is
// still drawn (typed input is queued), and the tell is the spinner line just above the box's
// top border: `✢ Slithering… (1m 29s · ↓ 5.5k tokens)`. A menu (AskUserQuestion) puts text
// after the `❯`. No prompt line at all means claude is not running there, or a menu is up.

import { spawn } from 'node:child_process';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertCanTypeHerdrPane, findDeskPane, isIdleEmptyPrompt, selfPaneProblem, targetOf, typeLine } from './lib/desk-pane.mjs';
import { retireOlderWatchers, watchForClear } from './lib/clear-watch.mjs';
import { CHAIRS } from './lib/chairs/index.mjs';
import { isRemoteMachine } from './lib/chairs/herdr-route.mjs';
import { readLanesDocument, resolveRegistryFilePath } from './lib/registry.mjs';
import { deskTaskAnchor, identityProblem } from './lib/pickup-owner.mjs';

const FRESH_MS = 10 * 60 * 1000;

const args = process.argv.slice(2);
const flag = (name) => {
  const i = args.indexOf(name);
  return i === -1 ? undefined : args[i + 1] ?? '';
};
const dryRun = args.includes('--dry-run');
const lane = flag('--lane');
const ticketWanted = flag('--ticket');
const dirArg = flag('--dir');

const refuse = (msg) => {
  console.error(`self-clear: ${msg}`);
  process.exit(1);
};

const where = (t) => t.machine ? `${t.world} (${t.machine}) ${t.pane}` : `${t.world} ${t.pane}`;

// typeLine spaces the text and its Enter like a human typing them (Claude Code reads keys a
// few ms apart as a paste, and an Enter inside a paste is a newline: sent back to back,
// `/clear` and the pickup line became one two-line draft that never fired, 2026-09-24).
const send = (target, line) => {
  if (dryRun) return console.log(`dry-run: would send to ${where(target)}: ${line}  ⏎`);
  try {
    if (target.world === 'herdr') assertCanTypeHerdrPane(target.pane, target.machine);
    typeLine(target, line);
  } catch (e) {
    refuse(e.code === 'unsent_text' ? `${e.message}; sent nothing` : e.message);
  }
  console.log(`sent to ${where(target)}: ${line}  ⏎`);
};

if (args[0] === '--watch') {
  // ---- detached child: type the pickup line once the pane shows the cleared prompt
  const [, pane, line, maybeMachine] = args;
  const target = targetOf(pane, maybeMachine);
  retireOlderWatchers(pane, { machine: maybeMachine });
  const note = line.replace(/^\/slopdog:pickup\s+/, '');
  process.exit(watchForClear({ target, note, send: () => send(target, line) }));
}

if (lane !== undefined && (ticketWanted !== undefined || dirArg !== undefined)) {
  refuse('--lane is the dispatcher mode; it takes no --ticket or --dir');
}

if (lane !== undefined) {
  // ---- dispatcher mode: clear another desk that is sitting idle
  if (!lane) refuse('--lane needs a registry key');
  const hit = findDeskPane(lane);
  if (!hit) refuse(`no herdr agent named herdr-${lane} and no tmux pane with @peak_lane = ${lane}`);
  const target = { world: hit.world, pane: hit.pane, ...(hit.machine ? { machine: hit.machine } : {}) };
  const why = isIdleEmptyPrompt(target);
  if (why) refuse(`${lane} (${where(target)}) is not idle: ${why}`);
  send(target, '/clear');

  if (target.machine && isRemoteMachine(target.machine)) {
    const lanesDoc = readLanesDocument();
    const laneObj = lanesDoc.lanes?.[lane] || lanesDoc[lane];
    const deskFolder = laneObj?.folder || `desks/${lane}`;
    const v2Dir = dirname(resolveRegistryFilePath());
    const pickup = resolve(v2Dir, deskFolder, 'PICKUP.md');
    const pickupLine = `/slopdog:pickup ${pickup}`;
    if (dryRun) {
      console.log(`dry-run: would send to ${where(target)} once it shows the cleared prompt: ${pickupLine}  ⏎`);
    } else {
      const watchArgs = [fileURLToPath(import.meta.url), '--watch', target.pane, pickupLine, target.machine];
      spawn(process.execPath, watchArgs, {
        detached: true,
        stdio: 'ignore',
      }).unref();
      console.log(`will send to ${where(target)} once it shows the cleared prompt: ${pickupLine}  ⏎`);
    }
  }

  process.exit(0);
}

// ---- default mode: this desk clears itself from inside a turn
const dir = resolve(dirArg ?? process.cwd());
const pickup = resolve(dir, 'PICKUP.md');
if (!existsSync(pickup)) refuse(`${pickup} does not exist; write it first`);

const ageMs = Date.now() - statSync(pickup).mtimeMs;
if (ageMs > FRESH_MS) {
  refuse(`${pickup} is ${Math.round(ageMs / 60000)} min old (limit 10); rewrite it first`);
}

const text = readFileSync(pickup, 'utf8');
const crossed = identityProblem(dir, text);
if (crossed) refuse(crossed);
const first = text.match(/\bT-\d+(-\d+)?\b/);
if (!first && !deskTaskAnchor(dir, text)) refuse(`${pickup} names no ticket (no T-nnn, and no tasks/<name>.md under the desk); it must say what is in hand`);
if (ticketWanted !== undefined) {
  if (!first) refuse(`--ticket ${ticketWanted}: ${pickup} names no T-nnn`);
  if (!/^T-\d+(-\d+)?$/.test(ticketWanted)) refuse(`--ticket wants T-nnn, got "${ticketWanted}"`);
  if (!new RegExp(`\\b${ticketWanted}\\b`).test(text)) {
    refuse(`${pickup} does not name ${ticketWanted} (first ticket in it is ${first[0]})`);
  }
}

const self = findDeskPane(null, { self: true });
if (!self && !dryRun) refuse('neither $HERDR_PANE_ID (HERDR_ENV=1) nor $TMUX_PANE is set; run this from inside a desk pane');

const target = self ?? { world: 'none', pane: '(no HERDR_PANE_ID or TMUX_PANE)' };
// HERDR_PANE_ID can name another desk's pane (a background job inherits it from the Claude
// daemon), and an agy/Cursor desk has no /clear: refuse unless the pane is this desk's Claude.
const wrong = selfPaneProblem(target, dir);
if (wrong) refuse(`${wrong}; sent nothing`);
const pickupLine = `/slopdog:pickup ${pickup}`;
// The hold goes up before /clear is even typed, so no inbox delivery can start after this line
// (lib/desk-pane.mjs pickupPending; the watcher rewrites it when it starts).
if (!dryRun) { try { writeFileSync(join(dirname(pickup), '.pickup-pending'), new Date().toISOString() + '\n'); } catch {} }
// selfPaneProblem has asked the pane's chair (lib/chairs) and refused agy and Cursor, so the chair
// here is Claude Code's (tmux desks are all Claude): its clear-and-pickup is /clear now, then the
// watcher types the pickup line.
const chair = CHAIRS.claude;
if (dryRun) console.log(`dry-run: chair ${chair.id}: clear-and-pickup is /clear, then ${pickupLine} once the prompt clears`);
const done = chair.clearAndPickup({ paneId: target.pane, pickupLine, send: (line) => send(target, line) });
if (!done.ok) refuse(`${done.refusal}; sent nothing`);
if (dryRun) {
  console.log(`dry-run: would send to ${where(target)} once it shows the cleared prompt: ${pickupLine}  ⏎`);
} else {
  const watchArgs = [fileURLToPath(import.meta.url), '--watch', target.pane, pickupLine, ...(target.machine ? [target.machine] : [])];
  spawn(process.execPath, watchArgs, {
    detached: true,
    stdio: 'ignore',
  }).unref();
  console.log(`will send to ${where(target)} once it shows the cleared prompt: ${pickupLine}  ⏎`);
}
