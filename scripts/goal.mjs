#!/usr/bin/env node
// goal — the short pane under each slopdog desk's Claude: that desk's tickets, top to
// bottom in the order the work will be done, and nothing else (T-467).
//
//   goal.mjs <lane>          the live pane: redraws only when the text changes
//   goal.mjs <lane> --once   print one frame and exit (a check, or a pipe)
//
// Todd, 2026-09-26: "All that it does is it shows in the order that the things will be
// done a task list top to bottom. With three statuses: what's currently being worked
// on, planned to be worked on, and blocked. That's it. Two lines per item." So the pane
// is derived from the tickets alone. It reads ~/slopdog/tasks/task-list.md for the row
// order and each ticket's status line and front matter (worker, verifier, priority);
// it reads no goal file and writes nothing.
//
// Three sections, in order:
//   Working on  🔙 sent back first, then 🟡 doing and 🔍 verifying, in task-list order
//   Planned     🔵 ready, by `priority:` (1 first, unset last), then task-list order
//   Blocked     🟠 with a worker (built, waiting on Todd), then 🔴, in task-list order
// 🟩 and 🟢 drop off, and so does anything else (🤷, ⚪, a 🟠 with no worker, which is
// a pre-build question and the Ideas desk's).
//
// Whose rows: a ticket is this lane's when `worker:` names it, or, for a 🔍 ticket,
// when `verifier:` names it (the builder's pane lets go while it is being verified).
// The build lane is the dispatcher and sees every ticket, with the worker's name on
// the row. A ticket whose front matter fails to parse is skipped, never a crash.
// A ticket with `paused: true` or a future `start_after: YYYY-MM-DD` in its front matter
// is parked/hidden and never shown (T-481).
//
// Each row is `<mark> PROJECT T-nnn · <status word>`, then the title clipped to the pane's
// width, then a blank line (Todd: "white space is your friend"). The project is the short
// name from tasks/projects/<id>.md's heading, in capitals; the ticket id is an OSC 8 link
// to the ticket on the board (?view=tickets&ticket=T-nnn). Rows that do not fit are left
// off whole.
// SLOPDOG_TICKETS_DIR points it at another tickets folder for a test (its task-list.md
// is the one beside it).
//
// Plain ANSI, redrawn only when the text changes. glow was considered and dropped: it
// cannot follow a file, so it would have to be re-run every tick and the pane would
// flicker. A handful of short lines do not need a renderer.

import { readLanesDocument } from './lib/registry.mjs'
import { existsSync, readFileSync, readdirSync } from 'node:fs'
import { spawn } from 'node:child_process'
import { findDeskPane, readPane } from './lib/desk-pane.mjs'
import { ticketTimeTurnsChip } from './lib/goal-panel.mjs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import yaml from 'js-yaml'

const lane = process.argv[2]
const ONCE = process.argv.includes('--once')
if (!lane || lane.startsWith('-')) {
  console.error('usage: goal.mjs <lane> [--once]')
  process.exit(2)
}
const DIR = dirname(dirname(fileURLToPath(import.meta.url)))   // the slopdog repo version folder, parent of scripts/
let lanesData = {}
try { lanesData = readLanesDocument({ v2: DIR }) } catch (e) { if (e.code !== 'ENOENT') throw e }
const NAME = lanesData[lane]?.name?.replace(/ Desk$/, '') || lane[0].toUpperCase() + lane.slice(1)
const TICKETS = process.env.SLOPDOG_TICKETS_DIR || join(homedir(), 'slopdog', 'tasks', 'tickets')
const TASK_LIST = join(dirname(TICKETS), 'task-list.md')
const DISPATCHER = 'build'   // the lane that sees every ticket, not just its own
const TICK_MS = 2000
const BOARD = process.env.SLOPDOG_BOARD_URL || 'http://localhost:3008'
const PROJECTS = join(dirname(TICKETS), 'projects')
// ticket-add's drafting markers (T-470): live only on the Ideas desk's own panel, since
// only Daphne ever holds a ticket with no worker: yet. scripts/drafting-marker.mjs owns
// the file shape: {id, title, started, ticket}. `ticket: null` renders a placeholder
// "✏️ drafting" row; a ticket id there instead lets that real ticket show on her panel
// (mine, below) even though the builder hasn't set worker: on it yet.
const DRAFTING_LANE = 'ideas'
const DRAFTING_DIR = join(DIR, 'desks', 'ideas', 'drafting')
// Same rule as inbox-watch.mjs and inbox-delivery-watch.mjs: only `*-from-<lane>-*` files
// are desk messages; publish-desk idea files and other inbox clutter are not counted.
const INBOX_MESSAGE = /^\d{4}-\d{2}-\d{2}-(?:\d{4}-)?from-[a-z0-9]+-.+/i

// Todd, 2026-09-04: "Larry's goals", not "Larry" — the pane gets screenshotted and sent
// to people who have no idea what a lane is. Now it lists tickets, so it says so.
const HEADER = `${NAME}'s tickets`
// Catppuccin Mocha, same as tmux.conf: blue for the name, subtext for section rules.
const BLUE = '\x1b[1;38;2;137;180;250m'
const DIM = '\x1b[38;2;166;173;200m'
const MAUVE = '\x1b[1;38;2;203;166;247m'   // the project name, so it reads at a glance
const RED = '\x1b[1;38;2;243;139;168m'
const RESET = '\x1b[0m'

// Whether this lane's own Claude pane is mid-turn right now (T-470, Todd): the same tell
// unstucker.mjs's spinner check uses, "esc to interrupt" shown while a turn is running. The
// pane is the lane's desk pane through lib/desk-pane.mjs (herdr agent `herdr-<lane>`, else tmux
// @peak_lane), read directly here rather than importing unstucker.mjs, which runs its own scan
// as a side effect the moment it loads and isn't built to be a module.
function paneBusy() {
  try {
    const desk = findDeskPane(lane)
    if (!desk) return false
    const raw = readPane(desk)
    return raw.split('\n').map((l) => l.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')).slice(-8).some((l) => /esc to interrupt/i.test(l))
  } catch { return false }
}

// The one word each status shows, from the legend at the top of task-list.md. The
// status lines themselves vary ("🟡 building", "🟠 waiting"), so the word is fixed here.
const WORD = { '🟡': 'doing', '🔍': 'verifying', '🔙': 'sent back', '🔵': 'ready', '🟠': 'waiting on Todd', '🔴': 'blocked' }
const SECTION = { '🔙': 0, '🟡': 0, '🔍': 0, '🔵': 1, '🟠': 2, '🔴': 2 }

const read = (p) => {
  try {
    return readFileSync(p, 'utf8')
  } catch {
    return null
  }
}

const isFuture = (dateVal) => {
  if (!dateVal) return false
  if (typeof dateVal === 'string') {
    const s = dateVal.trim().toLowerCase()
    if (s === 'tomorrow') return true
    if (s === 'yesterday' || s === 'today') return false
  }
  let dateStr = ''
  if (dateVal instanceof Date) {
    dateStr = dateVal.toISOString().slice(0, 10)
  } else if (typeof dateVal === 'string') {
    dateStr = dateVal.trim().slice(0, 10)
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const today = new Date().toISOString().slice(0, 10)
  return dateStr > today
}

// A project's short name: its projects/<id>.md heading up to any colon ("Ticket flow: idea
// → …" → "Ticket flow"), capitalised. No file, or a heading too long for a narrow pane,
// falls back to the id with dashes as spaces.
const projectNames = new Map()
function projectName(id) {
  if (!id) return ''
  if (!projectNames.has(id)) {
    const h = ((read(join(PROJECTS, `${id}.md`)) || '').match(/^# (.+)$/m) || [, ''])[1].split(':')[0].trim()
    projectNames.set(id, (h && h.length <= 18 ? h : id.replace(/-/g, ' ')).toUpperCase())
  }
  return projectNames.get(id)
}

// OSC 8: the terminal shows `text` and opens `url` on click. tmux passes it on only when
// the outer terminal has the `hyperlinks` feature.
// Blue and underlined so it reads as a link (Todd); 24/39 undo only those two, not the line's other styles.
const link = (url, text) => `\x1b]8;;${url}\x1b\\\x1b[34;4m${text}\x1b[24;39m\x1b]8;;\x1b\\`

// Display names for the build pane's `· LaForge` come from the registry when the name is
// one word; a multi-word desk name ("Build Desk") or a worker with no lane is capitalised.
const laneNames = Object.fromEntries(Object.entries(lanesData)
  .filter(([, v]) => v && typeof v.name === 'string' && !/\s/.test(v.name)).map(([k, v]) => [k, v.name]))
const workerName = (w) => laneNames[w] || (w[0].toUpperCase() + w.slice(1))

// task-list.md row order: the ticket file names in the order their rows appear. Rows
// are newest first, so this is the tie-breaker after priority. A ticket with no row
// sorts after every ticket that has one.
function listOrder() {
  const order = new Map()
  for (const m of (read(TASK_LIST) || '').matchAll(/\]\(tickets\/([^)]+\.md)\)/g)) {
    if (!order.has(m[1])) order.set(m[1], order.size)
  }
  return order
}

// This lane's live drafting markers, split into placeholders (no ticket file yet) and
// ticket ids ticket-add has written but not yet handed off. Only the Ideas desk has any:
// draftingRows() below is a no-op for every other lane.
function inboxCount() {
  const folder = lanesData[lane]?.folder
  if (!folder) return 0
  const inbox = join(DIR, folder, 'inbox')
  try {
    return readdirSync(inbox).filter((n) => INBOX_MESSAGE.test(n)).length
  } catch {
    return 0
  }
}

function inboxBadge() {
  const n = inboxCount()
  return n > 0 ? ` ✉ ${n}` : ''
}

function draftingMarkers() {
  let files = []
  try { files = readdirSync(DRAFTING_DIR).filter(f => f.endsWith('.json')) } catch { return { placeholders: [], ticketIds: new Set() } }
  const placeholders = []
  const ticketIds = new Set()
  for (const f of files) {
    let m
    try { m = JSON.parse(read(join(DRAFTING_DIR, f)) || '{}') } catch { continue }
    if (m.ticket) ticketIds.add(m.ticket)
    else placeholders.push(m)
  }
  return { placeholders, ticketIds }
}

// One row per placeholder marker (no ticket file on disk yet), styled like a ticket row
// so it sorts and clips the same way. Sorts to the end of the "working on" section: a
// title with no id is the least concrete thing on the panel.
function draftingRows(placeholders) {
  if (lane !== DRAFTING_LANE) return []
  return placeholders.map((m, i) => ({
    section: 0, back: 1, priority: 0, at: Number.MAX_SAFE_INTEGER, f: `drafting-${m.id || i}`,
    head: `✏️ ${DIM}drafting${RESET}`,
    title: m.title || 'untitled',
  }))
}

// One pass over the tickets folder → this lane's rows, sorted into the three sections.
// Every tick: a few hundred small files is nothing, and it needs no watcher that can
// miss an editor's rename-in-place.
function ticketRows(draftingTicketIds) {
  const order = listOrder()
  let files = []
  try { files = readdirSync(TICKETS).filter(f => f.endsWith('.md')) } catch { return [] }
  const rows = []
  // Kanban (T-470, Todd): a ticket shows on one panel, whoever holds it now. The
  // dispatcher (build) is a plain column of its own work — nothing out with a builder
  // shows there at all, not even as a count (T-475, Todd, 2026-09-27).
  for (const f of files) {
    const text = read(join(TICKETS, f))
    if (!text) continue
    const status = text.match(/^(T-[\w.-]+) · (🟡|🔙|🔍|🔵|🟠|🔴)/mu)
    if (!status) continue
    let front = {}
    const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (fm) {
      try { front = yaml.load(fm[1]) || {} } catch { continue }
      if (typeof front !== 'object') continue
      if (front.paused === true) continue   // parked (Todd): off the panel, not archived, not done
      if (isFuture(front.start_after)) continue  // held for future (T-481): hidden from desk panels
    }
    const mark = status[2]
    const worker = typeof front.worker === 'string' ? front.worker : ''
    const verifier = typeof front.verifier === 'string' ? front.verifier : ''
    // The dispatcher's panel is a plain Kanban column: its own undispatched work and
    // its own held tickets (8s included), never a meta ticket and never one out with
    // another builder (Todd, 2026-09-27 — no more bare-id "N out with X" count lines).
    // Except a meta ticket the dispatcher holds itself (`worker: build`, T-597/T-598): that one
    // is Tyrion's in hand and would otherwise show on no panel.
    const tags = Array.isArray(front.tags) ? front.tags : []
    if (lane === DISPATCHER && tags.includes('meta') && worker !== lane) continue
    // A 🟠 with a worker was built and waits only on Todd's answer (Todd, 2026-09-25);
    // one with no worker is a pre-build question and belongs to the Ideas desk.
    if (mark === '🟠' && !worker) continue
    const id = front.id || status[1]
    const mine = mark === '🔍' ? verifier === lane
      : worker === lane || (lane === DRAFTING_LANE && !worker && draftingTicketIds.has(id))
    if (!mine && lane !== DISPATCHER) continue
    // The dispatcher sees what is actually in hand: a 🟡 with no worker is stale data.
    if (!mine && mark === '🟡' && !worker) continue
    // Kanban: a ticket already held by another builder is out with them, not the
    // dispatcher — it doesn't show on this panel at all.
    if (lane === DISPATCHER && !mine && worker && worker !== lane) continue
    const who = lane === DISPATCHER ? (mark === '🔍' ? verifier : worker) : ''
    const priority = Number.isFinite(Number(front.priority)) && front.priority !== null && front.priority !== '' ? Number(front.priority) : Infinity
    // A 🟠 ticket this lane holds (`worker:` still names it) is being worked around an
    // open question, not sitting stopped — it shows as in-hand work with a "question
    // open" mark, not in the Blocked section (Todd: "a desk working a 🟠 ticket shows it
    // in hand"). Only the holder's own view gets this; anyone else still sees it blocked.
    const questionOpen = mark === '🟠' && mine && worker === lane
    const section = questionOpen ? SECTION['🟡'] : SECTION[mark]
    const word = questionOpen ? 'question open' : WORD[mark]
    rows.push({
      section,
      back: mark === '🔙' ? 0 : 1,
      priority: section === 1 ? priority : 0,
      at: order.has(f) ? order.get(f) : Infinity,
      f,
      id,
      mark: questionOpen ? '🟡' : mark,
      head: (() => {
        const id = front.id || status[1]
        const isMetaTicket = (Array.isArray(front.tags) ? front.tags : []).includes('meta')
        const proj = isMetaTicket ? '#meta' : projectName(typeof front.project === 'string' ? front.project : '')
        return `${mark} ${proj ? `${MAUVE}${proj}${RESET} ` : ''}${link(`${BOARD}/?view=tickets&ticket=${encodeURIComponent(id)}`, id)}`
          + ` · ${word}${who && who !== lane ? ` · ${workerName(who)}` : ''}${ticketTimeTurnsChip(text, front, lanesData, Date.now(), mark)}`
      })(),
      title: (text.match(/^# (.+)$/m) || [, ''])[1].trim(),
    })
  }
  rows.sort((a, b) => a.section - b.section || a.back - b.back || a.priority - b.priority
    || a.at - b.at || a.f.localeCompare(b.f))
  return rows
}

// A line's width is COLUMNS, not characters. The marks are emoji — one JS character
// each but two terminal cells — so clipping on `.length` packed lines a cell or two
// past the pane and they wrapped onto the next row (Todd, 2026-09-05).
const WIDE = [
  [0x1100, 0x115f], [0x231a, 0x231b], [0x23e9, 0x23ec], [0x23f0, 0x23f0], [0x23f3, 0x23f3],
  [0x25fd, 0x25fe], [0x2614, 0x2615], [0x2648, 0x2653], [0x267f, 0x267f], [0x2693, 0x2693],
  [0x26a1, 0x26a1], [0x26aa, 0x26ab], [0x26bd, 0x26be], [0x26c4, 0x26c5], [0x26ce, 0x26ce],
  [0x26d4, 0x26d4], [0x26ea, 0x26ea], [0x26f2, 0x26f3], [0x26f5, 0x26f5], [0x26fa, 0x26fa],
  [0x26fd, 0x26fd], [0x2705, 0x2705], [0x270a, 0x270b], [0x2728, 0x2728], [0x274c, 0x274c],
  [0x274e, 0x274e], [0x2753, 0x2755], [0x2757, 0x2757], [0x2795, 0x2797], [0x27b0, 0x27b0],
  [0x27bf, 0x27bf], [0x2b1b, 0x2b1c], [0x2b50, 0x2b50], [0x2b55, 0x2b55],
  [0x2e80, 0x303e], [0x3041, 0x33ff], [0x3400, 0x4dbf], [0x4e00, 0x9fff], [0xa000, 0xa4cf],
  [0xac00, 0xd7a3], [0xf900, 0xfaff], [0xfe10, 0xfe19], [0xfe30, 0xfe6f], [0xff00, 0xff60],
  [0xffe0, 0xffe6], [0x1f300, 0x1f64f], [0x1f680, 0x1f6ff], [0x1f7e0, 0x1f7eb], [0x1f900, 0x1f9ff],
  [0x1fa70, 0x1faff], [0x20000, 0x3fffd],
]

export function cols(text) {
  let n = 0
  for (const ch of text) {
    const c = ch.codePointAt(0)
    // Variation selectors, ZWJ and combining marks take no cell of their own.
    if (c === 0x200d || c === 0xfe0f || c === 0xfe0e || (c >= 0x0300 && c <= 0x036f)) continue
    n += WIDE.some(([lo, hi]) => c >= lo && c <= hi) ? 2 : 1
  }
  return n
}

// Escape sequences (colour, OSC 8 links) take no cell, so clip measures around them.
const ESC = /(\x1b\][^\x07\x1b]*(?:\x07|\x1b\\)|\x1b\[[0-9;?]*[A-Za-z])/

// Cut `text` to `width` cells, ending in an ellipsis when anything was dropped. A cut
// inside a coloured or linked span closes the link and resets the colour.
function clip(text, width) {
  const parts = text.split(ESC)   // odd indexes are the escapes
  if (cols(parts.filter((_, i) => i % 2 === 0).join('')) <= width) return text
  let out = ''
  let n = 0
  outer: for (const [i, part] of parts.entries()) {
    if (i % 2) { out += part; continue }
    for (const ch of part) {
      const w = cols(ch)
      if (n + w > width - 1) break outer
      out += ch
      n += w
    }
  }
  return out.trimEnd() + '…' + (parts.length > 1 ? `\x1b]8;;\x1b\\${RESET}` : '')
}

// Keeps the herdr sidebar card current (Herdr.md, "Sidebar desk cards"): the first two things in
// hand, the first two planned, and the ticket id. Only inside a herdr pane, only when the text
// changed, fire-and-forget, and any failure is swallowed: the panel never depends on the card.
let reported = ''
const clipText = (t, n = 44) => (t.length > n ? `${t.slice(0, n - 1)}…` : t)
export function cardTokens(tickets) {
  const doing = tickets.filter((t) => t.section === 0)
  const planned = tickets.filter((t) => t.section === 1)
  const row = (t, pre = '') => (t ? clipText(`${pre}${t.title}`) : '')
  return {
    now1: doing[0] ? row(doing[0]) : 'Nothing in hand',
    now2: row(doing[1]),
    next1: planned[0] ? row(planned[0], 'Next: ') : '',
    next2: row(planned[1]),
    ticket: doing[0]?.id || '',
  }
}
function reportCard(tickets) {
  if (ONCE || process.env.HERDR_ENV !== '1' || !process.env.HERDR_PANE_ID) return
  try {
    const tokens = cardTokens(tickets)
    const key = JSON.stringify(tokens)
    if (key === reported) return
    reported = key
    const child = spawn(process.env.HERDR_BIN_PATH || 'herdr',
      ['pane', 'report-metadata', process.env.HERDR_PANE_ID, '--source', 'desk-status',
        ...Object.entries(tokens).flatMap(([k, v]) => ['--token', `${k}=${v}`])],
      { detached: true, stdio: 'ignore' })
    child.on('error', () => {})
    child.unref()
  } catch {}
}

function render() {
  const width = Math.max(20, (process.stdout.columns || 56) - 1)
  // Two rows are not ours: one for the header, one for the newline the last line ends
  // with — fill the pane exactly and that trailing newline scrolls the header off the
  // top, which is how Larry's pane lost its title on 2026-09-04.
  const rows = Math.max(1, (process.stdout.rows || 24) - 2)
  const { placeholders, ticketIds } = draftingMarkers()
  const tickets = ticketRows(ticketIds).concat(draftingRows(placeholders))
    .sort((a, b) => a.section - b.section || a.back - b.back || a.priority - b.priority
      || a.at - b.at || a.f.localeCompare(b.f))
  reportCard(tickets)
  // Mid-turn with nothing in the "working on" section: the desk is doing something the
  // panel can't name (T-470, Todd). One line, no ticket lookup needed twice — the same
  // capture-pane call this tick already did.
  const warn = paneBusy() && !tickets.some((t) => t.mark === '🟡')
    ? ` ${RED}⚠ working, no ticket${RESET}` : ''
  const badge = inboxBadge()
  if (!tickets.length) return `${BLUE}${HEADER}${RESET}${badge}${warn} ${DIM}— nothing in hand${RESET}\n`
  // Two lines per ticket and a blank line before each, no section titles (the status mark
  // says it). Stop at the first ticket that does not fit whole.
  const lines = []
  for (const t of tickets) {
    if (lines.length + 3 > rows) break
    lines.push('', clip(t.head, width), `   ${clip(t.title, width - 3)}`)
  }
  return `${BLUE}${HEADER}${RESET}${badge}${warn}\n${lines.join('\n')}\n`
}

if (ONCE) {
  process.stdout.write(render())
  process.exit(0)
}

let shown = ''
function draw(force = false) {
  const next = render()
  if (!force && next === shown) return
  shown = next
  process.stdout.write(`\x1b[2J\x1b[H${next}`)
}

const bye = () => {
  process.stdout.write('\x1b[?25h')
  process.exit(0)
}
process.stdout.write('\x1b[?25l')
process.on('SIGINT', bye)
process.on('SIGTERM', bye)
process.on('SIGWINCH', () => draw(true))

draw(true)
setInterval(draw, TICK_MS)
