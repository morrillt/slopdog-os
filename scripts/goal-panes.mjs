#!/usr/bin/env node
// goal-panes — the one place that knows how to put a goal pane under a slopdog desk's Claude.
//
// slopdog.mjs imports goalPane() when it builds the layout; run directly with --restart
// it rebuilds the three goal panes under a running slopdog session without touching
// the Claudes. Use --restart after changing goal.mjs: the pane is a long-lived node
// process, so an edit on disk is inert until the process is replaced.
//
//   node scripts/goal-panes.mjs --restart
//
// Why a restart loop and not bare node: `exec` makes the pane's lifetime the
// process's lifetime, so any exit — a crash, a SIGINT, a kill — deletes the pane and
// hands its rows to the neighbours (three panes lost three times on 2026-09-03; the
// pre-loop panes vanished again on 2026-09-04 when Curly killed them to reload
// goal.mjs). The loop keeps the pane and prints the exit status where it can be read.
import { readLanesDocument } from './lib/registry.mjs'
import { execFileSync } from 'node:child_process'
import { dirname, join, basename, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { realpathSync } from 'node:fs'
import { DIR, SESSION } from './session.mjs'

const GOAL = join(DIR, 'scripts', 'goal.mjs')
// SESSION comes from session.mjs (SLOPDOG_SESSION overrides it, for a throwaway build
// beside the live one); the hooks below pass it on as #{session_name}.
export { SESSION }
export const BOTTOM_PCT = 30   // goal pane height, percent of the column (20 was unreadable; Todd, 2026-09-24)
// Every lane is LANE_COLS wide, whatever the screen, and the window is as wide as the
// lanes need; the client shows a viewport onto it (Todd, 2026-09-23: "I'm really
// comfortable with three"). A lane plus its border is STRIDE, so three lanes are
// 3 × 57 − 1 = 170 columns: exactly the ThinkPad's Kitty.
export const LANE_COLS = 56
export const STRIDE = LANE_COLS + 1
const SELF = fileURLToPath(import.meta.url)

let lanesData = null
try { lanesData = readLanesDocument({ v2: DIR }) } catch (e) { if (e.code !== 'ENOENT') throw e }
export const LANES = lanesData
  ? Object.keys(lanesData).filter((k) => k !== '_' && !lanesData[k]?.host && !lanesData[k]?.window)   // a host or window lane is a window, not a column
  : ['larry', 'moe', 'curly']

export const tmux = (...args) =>
  execFileSync('tmux', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()

// The desk window: the one in the session slopdog.mjs tagged @slopdog=1 at build. A
// session target resolves to the *active* window, so with a second window open a hook
// firing there would resize and read the wrong one (T-140). Every window-scoped call
// below goes to this id; null when the session has no desk window.
let WIN
export function deskWindow() {
  if (WIN === undefined) {
    try {
      WIN = tmux('list-windows', '-t', SESSION, '-F', '#{window_id}\t#{@slopdog}')
        .split('\n').map((l) => l.split('\t')).find(([, tag]) => tag === '1')?.[0] ?? null
    } catch { WIN = null }
  }
  return WIN
}
// Whether the client (else the session) is looking at the desk window right now.
const onDeskWindow = (client) => {
  try { return tmux('display', '-t', client || SESSION, '-p', '#{window_id}') === deskWindow() } catch { return false }
}

// Split a goal pane off the bottom of `top` for `lane`; returns the new pane id.
// Percentages round per-pane, so `-l 20%` gave larry and moe 10 rows and curly 9 —
// a one-row stagger that shows up as misaligned pane borders across the columns
// (Todd, 2026-09-05). Resolve the percentage to rows ONCE, against the window, and
// use that same number for every column and for the re-assert hook.
export const bottomRows = () =>
  Math.max(3, Math.round(Number(tmux('display', '-t', deskWindow(), '-p', '#{window_height}')) * BOTTOM_PCT / 100))

export function goalPane(top, lane, { rows = bottomRows() } = {}) {
  const folder = lanesData?.[lane]?.folder || lane
  const bottom = tmux('split-window', '-t', top, '-c', join(DIR, folder), '-v', '-l', String(rows), '-P', '-F', '#{pane_id}')
  // Tagged straight away: carousel.sh (after-split-window) ejects any pane in the desk
  // window that has neither @peak_lane nor @peak_goal.
  tmux('set-option', '-p', '-t', bottom, '@peak_goal', '1')
  tmux('send-keys', '-t', bottom,
    `exec sh -c 'while true; do node "${GOAL}" ${lane}; echo "goal.mjs exited $? — restarting in 2s"; sleep 2; done'`, 'Enter')
  return bottom
}

const panes = () => tmux('list-panes', '-t', deskWindow(), '-F', '#{pane_id}\t#{pane_top}')
  .split('\n').filter(Boolean).map((l) => l.split('\t'))

// The client to fit the window to: the one named, else the largest attached.
const clientSize = (client) => {
  const rows = tmux('list-clients', '-t', SESSION, '-F', '#{client_name}\t#{client_width}\t#{client_height}')
    .split('\n').filter(Boolean).map((l) => l.split('\t'))
    .filter(([name]) => !client || name === client)
  if (!rows.length) return null
  const [name, w, h] = rows.sort((a, b) => b[1] * b[2] - a[1] * a[2])[0]
  return { name, width: Number(w), height: Number(h) }
}

// Fixed-width lanes. The window is STRIDE × lanes wide and as tall as the client, every
// top pane is LANE_COLS, every goal pane is BOTTOM_PCT of the height. `window-size
// manual` (slopdog.mjs) means tmux never sizes the window itself, so this is the only
// thing that does: on build, on attach, on every client resize (the hooks below).
export function fixedColumns(client) {
  const tops = panes().filter(([, top]) => top === '0')
  const size = clientSize(client)
  const height = size?.height ?? Number(tmux('display', '-t', deskWindow(), '-p', '#{window_height}'))
  tmux('resize-window', '-t', deskWindow(), '-x', String(STRIDE * tops.length - 1), '-y', String(height))
  for (const [id] of tops) tmux('resize-pane', '-t', id, '-x', String(LANE_COLS))
  const rows = bottomRows()
  for (const [id, top] of panes()) if (top !== '0') tmux('resize-pane', '-t', id, '-y', String(rows))
  if (size) snapView(size.name)
}

// The viewport. tmux on its own centres the view on the active pane's *cursor*, which
// leaves half-lanes at both edges, and stops following entirely once the view has been
// panned by hand (both seen on a throwaway, 2026-09-23). So the offset is ours: kept in
// the window option @peak_ox, always a whole number of lanes, and applied by panning
// the client all the way left then right by that much.
//   'focus'  — the smallest move that brings the active lane fully into view
//   ±1       — one lane left or right, focus unchanged
export function snapView(client, move = 'focus') {
  const f = tmux('display', '-t', deskWindow(), '-p',
    '#{window_width}\t#{pane_left}\t#{pane_width}\t#{@peak_ox}')
  // tmux() trims the output, so an unset @peak_ox at the end leaves three fields, not four.
  const [ww, left, width, stored = 0] = f.split('\t').map((v) => Number(v) || 0)
  const cw = clientSize(client)?.width
  if (!cw) return
  let ox = stored
  if (move === 'focus') {
    if (left < ox) ox = left
    else if (left + width > ox + cw) ox = Math.ceil((left + width - cw) / STRIDE) * STRIDE
  } else ox += Number(move) * STRIDE
  ox = Math.max(0, Math.min(ox, Math.ceil(Math.max(0, ww - cw) / STRIDE) * STRIDE))
  tmux('set-option', '-w', '-t', deskWindow(), '@peak_ox', String(ox))
  tmux('refresh-client', '-t', client, '-L', '100000')
  if (ox) tmux('refresh-client', '-t', client, '-R', String(ox))
}

// The hooks that keep it so. Set, not appended: re-running replaces them.
export function installHooks() {
  const call = (args) => `run-shell -b "SLOPDOG_SESSION='#{session_name}' node '${SELF}' ${args} '#{client_name}'"`
  tmux('set-hook', '-t', SESSION, 'client-attached', call('--fit'))
  // `sd` from inside another tmux session switch-clients in, which fires this, not client-attached.
  tmux('set-hook', '-t', SESSION, 'client-session-changed', call('--fit'))
  tmux('set-hook', '-t', SESSION, 'client-resized', call('--fit'))
  tmux('set-hook', '-t', SESSION, 'after-select-pane', call('--view focus'))
}

// Rebuild every goal pane under a running session. A desk's top pane is tagged
// @peak_lane (slopdog.mjs); everything untagged in the window is a goal pane. Going by the
// tag, not the running command, keeps a desk whose Claude has dropped to a shell.
export function restart() {
  const panes = tmux('list-panes', '-t', deskWindow(), '-F', '#{pane_id}\t#{@peak_lane}\t#{pane_current_path}\t#{pane_active}')
    .split('\n').filter(Boolean).map((l) => {
      const [id, lane, path, active] = l.split('\t'); return { id, lane, path, active: active === '1' }
    })
  const ours = panes.filter((p) => !p.lane)
  const tops = panes.filter((p) => !ours.includes(p))
  const focus = panes.find((p) => p.active && tops.includes(p))
  for (const p of ours) tmux('kill-pane', '-t', p.id)
  const rows = bottomRows()
  for (const top of tops) {
    const lane = top.lane
    if (!LANES.includes(lane)) continue
    console.log(`${lane}: ${goalPane(top.id, lane, { rows })}`)
  }
  installHooks()   // the hooks carry the session name; a renamed session needs them reasserted
  fixedColumns()
  if (focus) tmux('select-pane', '-t', focus.id)
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  const [cmd, a, b] = process.argv.slice(2)
  // The scroll keys and the hooks are session-wide; with no desk window (a session
  // slopdog.mjs did not build) or from another window of the session, do nothing.
  if (cmd === '--restart') { if (deskWindow()) restart(); else console.error(`${SESSION}: no window with @slopdog=1`) }
  else if (cmd === '--fit') { if (deskWindow() && onDeskWindow(a)) fixedColumns(a) }
  else if (cmd === '--view') { if (deskWindow() && onDeskWindow(b)) snapView(b, a) }
  else console.error('usage: goal-panes.mjs --restart | --fit [client] | --view focus|1|-1 <client>   (or import from slopdog.mjs)')
}
