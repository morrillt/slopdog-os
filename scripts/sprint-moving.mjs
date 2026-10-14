#!/usr/bin/env node
// sprint-moving — "is the sprint moving?", answered from files on disk with no model in the loop.
//
//   node sprint-moving.mjs                 verdict, one line per focus batch, then the evidence
//   node sprint-moving.mjs --json          the same as one JSON object (the machine form)
//   node sprint-moving.mjs --hours 6       window for the "recent" counts (default 3)
//   node sprint-moving.mjs --batch 3-seeing-the-work --batch 6-sprint-holder
//                                          remaining work for any batch, focus or not: done, awaiting
//                                          Todd, open and blocked counts with the ticket ids, straight
//                                          from the ticket files (repeatable; replaces the focus list)
//   --moving-min 60 --stalled-min 180      verdict thresholds in minutes (see below)
//   --now <iso> --v2 <dir> --tasks <dir> --repo <dir> (repeatable) --quota-state <file>
//                                          test seams: a fixed clock and fixture roots
//
// What it reads (Todd, 2026-10-10: "I'd like to know right now, honestly, is it moving?"):
//   v2/context.yaml            focus_batches, the batches the sprint is running
//   tasks/tickets/*.md (+archive)  every ticket whose front-matter `batch:` is a focus batch: its
//                              status line (`T-nnn · <mark> <word>`) and its dated Progress notes
//   git log in ~/slopdog and ~/slopdog/tasks   commits whose subject names a focus ticket
//   the build desk's inbox and inbox-archive   what Tyrion has been sent, and what he has not read
//   v2/desks/watcher/          sprint-watch.log (its last cycle), SPRINT-STOP, stalled-doing.json
//   v2/state/engine-quota.json engines that are out of quota right now
//
// Verdict, from one number: how long since the newest movement on any focus ticket. Movement is a
// dated Progress note (not the Sweep script's, which touches every open ticket) or a commit naming
// the ticket. Within --moving-min (default 60) the sprint is MOVING; within --stalled-min (default
// 180) it is SLOW; older, or no movement at all, it is STALLED. No open tickets and nothing stuck is
// FINISHED; no tickets found for the focus batches is UNKNOWN. Progress-note times are UTC (the
// harness writes them with toISOString), as are inbox file names.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs'
import { join, resolve, dirname } from 'node:path'
import { realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { execFileSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { exhaustedKeys } from './lib/engine-quota.mjs'
import { readLanesDocument } from './lib/registry.mjs'

const MIN = 60_000
const HOUR = 60 * MIN

// ---- pure parsing ------------------------------------------------------------------------

export function parseFocusBatches(yamlText) {
  const lines = String(yamlText).split('\n')
  const i = lines.findIndex((l) => /^focus_batches:/.test(l))
  if (i < 0) return []
  const inline = lines[i].match(/^focus_batches:\s*\[(.*)\]/)
  if (inline) return inline[1].split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
  const out = []
  for (const l of lines.slice(i + 1)) {
    const m = l.match(/^\s+-\s*['"]?([^'"#\s]+)['"]?\s*(#.*)?$/)
    if (m) out.push(m[1]); else if (/^\S/.test(l)) break
  }
  return out
}

// context.yaml writes `B2a-rings-and-builders`, a ticket's front matter `2a-rings-and-builders`.
export const batchKey = (s) => String(s).trim().replace(/^b(?=\d)/i, '').toLowerCase()

export function classify(status) {
  if (/⚫|✂️|↪|^archived/.test(status)) return 'dropped'
  if (/🟢|🟩/.test(status)) return 'done'
  if (/🟡|🔍/.test(status)) return 'inFlight'
  if (/🔵/.test(status)) return 'queued'
  if (/🔴|⏸|🟠|🤷/.test(status)) return 'stuck'
  return 'queued'
}

const NOTE_RE = /^\s*- (\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}) · ([^·]+?) · (.*)$/

export function parseTicket(text, file = '') {
  const fm = text.match(/^---\n([\s\S]*?)\n---/)?.[1] ?? ''
  const id = fm.match(/^id:\s*(T-\d+(?:-\d+)?)/m)?.[1] ?? file.match(/(T-\d+(?:-\d+)?)/)?.[1] ?? null
  const batch = fm.match(/^batch:\s*['"]?([^'"\n#]+?)['"]?\s*$/m)?.[1] ?? null
  const status = (text.match(/^T-\d+(?:-\d+)? · (.+)$/m)?.[1] ?? fm.match(/^status:\s*(.+)$/m)?.[1] ?? '').trim()
  const title = text.match(/^# (.+)$/m)?.[1]?.trim() ?? file
  const notes = []
  for (const line of text.split('\n')) {
    const m = line.match(NOTE_RE)
    if (m) notes.push({ at: Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]), who: m[6].trim(), text: m[7].trim() })
  }
  return { id, batch, status, title, notes, state: classify(status) }
}

// The Sweep script appends a note to every open ticket it touches; that is not the sprint moving.
// Daphne plans and repairs tickets but never builds, so her notes and her `ideas` commits are
// reported as planning activity, apart from the build and verify movement the verdict rests on.
const isSweepNote = (n) => /^sweep$/i.test(n.who)
const isPlanningNote = (n) => /^daphne\b/i.test(n.who)
const isPlanningCommit = (c) => /^ideas\b/i.test(c.subject)

export function parseInboxName(name) {
  const m = name.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})-from-([a-z0-9]+)/i)
  return m ? { at: Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]), from: m[6] } : null
}

export function parseWatchLine(line) {
  const [head, ...rest] = String(line).split(' | ')
  const at = Date.parse(head)
  if (Number.isNaN(at)) return null
  const fields = {}
  for (const part of rest) {
    const m = part.match(/^([A-Z]+)\s+(.*)$/)
    if (m) fields[m[1]] = m[2]
  }
  return { at, fields }
}

export const ago = (ms) => {
  if (ms == null) return 'never'
  const m = Math.max(0, Math.round(ms / MIN))
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  return h >= 24 ? `${Math.floor(h / 24)}d${h % 24}h ago` : `${h}h${String(m % 60).padStart(2, '0')}m ago`
}

const clip = (s, n = 90) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
const iso = (ms) => (ms == null ? null : new Date(ms).toISOString())

// ---- the assessment (pure: everything it needs comes in as data) ---------------------------

export function assess({ now, windowHours = 3, movingMin = 60, stalledMin = 180, focusBatches, tickets, commits, tyrion, watcher, stop, quotaOut }) {
  const keys = focusBatches.map(batchKey)
  const mine = tickets.filter((t) => t.batch && keys.includes(batchKey(t.batch)))
  const ids = new Set(mine.map((t) => t.id))
  const windowMs = windowHours * HOUR

  const events = []
  for (const t of mine) {
    for (const n of t.notes) if (!isSweepNote(n)) events.push({ at: n.at, kind: 'note', ticket: t.id, who: n.who, text: n.text, planning: isPlanningNote(n) })
  }
  for (const c of commits) {
    // The Watcher's own log commits are not movement on a ticket (retro 2026-10-11 17:08).
    if (/sweep/i.test(c.subject) || /^watcher\b/.test(c.subject)) continue
    for (const id of new Set(c.subject.match(/\bT-\d+(?:-\d+)?/g) ?? [])) {
      if (ids.has(id) || ids.has(id.replace(/-\d+$/, ''))) events.push({ at: c.at, kind: 'commit', ticket: id, who: c.subject.split(' ')[0], text: c.subject, planning: isPlanningCommit(c) })
    }
  }
  events.sort((a, b) => b.at - a.at)
  const planningEvent = events.find((e) => e.planning) ?? null
  events.splice(0, events.length, ...events.filter((e) => !e.planning))
  const last = events[0] ?? null

  const batches = focusBatches.map((name) => {
    const ts = mine.filter((t) => batchKey(t.batch) === batchKey(name))
    const count = (s) => ts.filter((t) => t.state === s).length
    const ev = events.find((e) => ts.some((t) => t.id === e.ticket))
    const ids = (f) => ts.filter(f).map((t) => t.id)
    return {
      batch: name, tickets: ts.length,
      done: count('done'), awaitingTodd: ts.filter((t) => /🟩/.test(t.status)).length,
      inFlight: count('inFlight'), queued: count('queued'), stuck: count('stuck'),
      lastMovement: ev ? { at: iso(ev.at), agoMs: now - ev.at, ticket: ev.ticket, kind: ev.kind, who: ev.who } : null,
      // The remaining-work view: four buckets that add up, dropped tickets set apart.
      remaining: {
        done: ids((t) => t.state === 'done' && !/🟩/.test(t.status)),
        awaitingTodd: ids((t) => /🟩/.test(t.status)),
        open: ids((t) => t.state === 'inFlight' || t.state === 'queued'),
        blocked: ids((t) => t.state === 'stuck'),
        dropped: ids((t) => t.state === 'dropped'),
      },
    }
  })

  const total = (k) => mine.filter((t) => t.state === k).length
  const open = total('inFlight') + total('queued')
  const lastAge = last ? now - last.at : null

  const watch = []
  if (stop) watch.push(`SPRINT-STOP is present (written ${iso(stop.at)}, ${stop.reason ?? 'no reason given'}); the prompt hook refuses every desk and dispatch refuses every job, hotfixes included, until Todd types "lift stop"`)
  if (!watcher.last) watch.push('the watcher has no log, so nothing is nudging Tyrion or the idle desks')
  else if (now - watcher.last.at > 30 * MIN) watch.push(`the watcher's last cycle was ${ago(now - watcher.last.at)}, so it is not running`)
  if (tyrion.unread.length) watch.push(`Tyrion has ${tyrion.unread.length} unread inbox file${tyrion.unread.length > 1 ? 's' : ''}, the oldest ${ago(now - Math.min(...tyrion.unread.map((u) => u.at)))}`)
  if (quotaOut.length) watch.push(`out of quota: ${quotaOut.join(', ')}`)
  for (const t of mine.filter((x) => x.state === 'inFlight')) {
    const n = [...t.notes].reverse().find((x) => !isSweepNote(x) && !isPlanningNote(x))
    if (!n || now - n.at > stalledMin * MIN) watch.push(`${t.id} has been ${t.status} with no build note for ${n ? ago(now - n.at).replace(' ago', '') : 'its whole life'}`)
  }

  let verdict, head
  if (!mine.length) { verdict = 'unknown'; head = `no tickets found for ${focusBatches.join(', ') || 'any focus batch'}` }
  else if (!open && !total('stuck')) { verdict = 'finished'; head = 'every focus ticket is done' }
  else {
    verdict = lastAge == null ? 'stalled' : lastAge <= movingMin * MIN ? 'moving' : lastAge <= stalledMin * MIN ? 'slow' : 'stalled'
    head = last ? `last movement ${ago(lastAge)} (${last.who} ${last.kind === 'note' ? 'note' : 'commit'} on ${last.ticket})` : 'no movement on any focus ticket'
  }
  const tally = `${total('inFlight')} in flight, ${total('queued')} queued, ${total('done')} done, ${total('stuck')} stuck`
  const reason = `${verdict}: ${head}${mine.length ? `; ${tally}` : ''}${verdict === 'moving' || verdict === 'finished' || !watch.length ? '' : `. Possible cause: ${watch[0]}`}`

  const recent = events.filter((e) => now - e.at <= windowMs)
  const brief = (t) => {
    const n = [...t.notes].reverse().find((x) => !isSweepNote(x) && !isPlanningNote(x)) ?? t.notes.at(-1)
    return { id: t.id, title: t.title, status: t.status, lastNote: n ? { at: iso(n.at), agoMs: now - n.at, who: n.who, text: clip(n.text) } : null }
  }
  return {
    verdict, reason, now: iso(now), windowHours, thresholds: { movingMin, stalledMin },
    lastMovement: last ? { at: iso(last.at), agoMs: lastAge, kind: last.kind, ticket: last.ticket, who: last.who, text: clip(last.text) } : null,
    batches,
    evidence: {
      inFlight: mine.filter((t) => t.state === 'inFlight').map(brief),
      stuck: mine.filter((t) => t.state === 'stuck').map(brief),
      queued: mine.filter((t) => t.state === 'queued').map((t) => t.id),
      recent: { notes: recent.filter((e) => e.kind === 'note').length, commits: recent.filter((e) => e.kind === 'commit').length },
      newestCommit: events.find((e) => e.kind === 'commit') ? { at: iso(events.find((e) => e.kind === 'commit').at), ticket: events.find((e) => e.kind === 'commit').ticket, subject: clip(events.find((e) => e.kind === 'commit').text) } : null,
      tyrion: {
        unread: tyrion.unread.map((u) => ({ from: u.from, at: iso(u.at) })),
        newestDelivered: tyrion.archived.length ? iso(Math.max(...tyrion.archived.map((a) => a.at))) : null,
        deliveredInWindow: tyrion.archived.filter((a) => now - a.at <= windowMs).length,
      },
      watcher: watcher.last ? { lastCycle: iso(watcher.last.at), agoMs: now - watcher.last.at, fields: watcher.last.fields, stalledDoing: watcher.stalledDoing } : null,
      sprintStop: stop ? { at: iso(stop.at), reason: stop.reason ?? null } : null,
      quotaOut,
      planning: planningEvent ? { at: iso(planningEvent.at), agoMs: now - planningEvent.at, ticket: planningEvent.ticket, who: planningEvent.who } : null,
    },
    watch,
  }
}

// ---- gathering (reads the disk and git) ------------------------------------------------------

const readJson = (p, d) => { try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return d } }
const lsMd = (dir) => (existsSync(dir) ? readdirSync(dir).filter((f) => f.endsWith('.md')).map((f) => join(dir, f)) : [])

export function loadTickets(ticketsDir, focusBatches) {
  const keys = focusBatches.map(batchKey)
  const out = []
  for (const f of [...lsMd(ticketsDir), ...lsMd(join(ticketsDir, 'archive'))]) {
    const text = readFileSync(f, 'utf8')
    const b = text.match(/^batch:\s*['"]?([^'"\n#]+?)['"]?\s*$/m)?.[1]
    if (!b || !keys.includes(batchKey(b))) continue
    const t = parseTicket(text, f)
    // An archived ticket that never finished is dropped, whatever its stale status line still says.
    if (f.includes('/archive/') && t.state !== 'done') t.state = 'dropped'
    out.push(t)
  }
  return out
}

export function loadCommits(repos, sinceMs) {
  const out = []
  for (const repo of repos) {
    if (!existsSync(repo)) continue
    let raw = ''
    try { raw = execFileSync('git', ['-C', repo, 'log', `--since=${new Date(sinceMs).toISOString()}`, '--format=%H%x1f%cI%x1f%s'], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) } catch { continue }
    for (const l of raw.split('\n').filter(Boolean)) {
      const [hash, at, subject] = l.split('\x1f')
      out.push({ hash, at: Date.parse(at), subject, repo })
    }
  }
  return out
}

const inboxFiles = (dir) => (existsSync(dir) ? readdirSync(dir) : []).map((n) => parseInboxName(n)).filter(Boolean)

export function gather({ v2, tasks, repos, now, quotaState, batches = [] }) {
  const focusBatches = batches.length ? batches : parseFocusBatches(existsSync(join(v2, 'context.yaml')) ? readFileSync(join(v2, 'context.yaml'), 'utf8') : '')
  let lanes = {}
  try { lanes = readLanesDocument({ v2 }) } catch { /* no registry: fall back to the default build folder */ }
  const buildDir = join(v2, lanes.build?.folder ?? 'desks/build/tyrion')
  const watchDir = join(v2, 'desks/watcher')
  const logPath = join(watchDir, 'sprint-watch.log')
  let lastLine = ''
  if (existsSync(logPath)) lastLine = readFileSync(logPath, 'utf8').trimEnd().split('\n').at(-1)
  const stopRaw = readJson(join(watchDir, 'SPRINT-STOP'), null)
  const stop = existsSync(join(watchDir, 'SPRINT-STOP'))
    ? { at: Date.parse(stopRaw?.at) || statSync(join(watchDir, 'SPRINT-STOP')).mtimeMs, reason: stopRaw?.reason }
    : null
  return {
    now, focusBatches,
    tickets: loadTickets(join(tasks, 'tickets'), focusBatches),
    commits: loadCommits(repos, now - 48 * HOUR),
    tyrion: { unread: inboxFiles(join(buildDir, 'inbox')), archived: inboxFiles(join(buildDir, 'inbox-archive')) },
    watcher: { last: lastLine ? parseWatchLine(lastLine) : null, stalledDoing: Object.keys(readJson(join(watchDir, 'stalled-doing.json'), {})).length },
    stop,
    quotaOut: exhaustedKeys({ statePath: quotaState, now }),
  }
}

// ---- output ---------------------------------------------------------------------------------

export function renderRemaining(a) {
  const L = [`Remaining work (${a.now}, from the ticket files)`]
  for (const b of a.batches) {
    const r = b.remaining
    const list = (xs) => (xs.length ? ` [${xs.join(', ')}]` : '')
    L.push(`  ${b.batch}: ${r.done.length} done · ${r.awaitingTodd.length} awaiting Todd${list(r.awaitingTodd)} · ${r.open.length} open${list(r.open)} · ${r.blocked.length} blocked${list(r.blocked)}${r.dropped.length ? ` · ${r.dropped.length} dropped` : ''}${b.tickets ? '' : ' (no tickets carry this batch tag)'}`)
  }
  return L.join('\n')
}

export function render(a) {
  const e = a.evidence
  const L = [`Sprint: ${a.reason}`, `(${a.now}, UTC; window ${a.windowHours}h; moving within ${a.thresholds.movingMin}m, stalled past ${a.thresholds.stalledMin}m)`, '', 'Batches']
  for (const b of a.batches) {
    const lm = b.lastMovement ? `last movement ${ago(b.lastMovement.agoMs)} (${b.lastMovement.ticket})` : 'no movement'
    L.push(`  ${b.batch}: ${b.done} done${b.awaitingTodd ? ` (${b.awaitingTodd} awaiting Todd)` : ''} · ${b.inFlight} in flight · ${b.queued} queued · ${b.stuck} stuck · ${lm}`)
  }
  L.push('', 'Evidence')
  const row = (t) => `    ${t.id} ${t.status}: ${clip(t.title, 60)}${t.lastNote ? ` — ${ago(t.lastNote.agoMs)}, ${t.lastNote.who}: ${t.lastNote.text}` : ' — no notes'}`
  L.push(`  In flight (${e.inFlight.length})`, ...e.inFlight.map(row))
  L.push(`  Stuck (${e.stuck.length})`, ...e.stuck.map(row))
  L.push(`  Queued: ${e.queued.length ? e.queued.join(', ') : 'none'}`)
  L.push(`  Movement in the last ${a.windowHours}h: ${e.recent.notes} Progress notes, ${e.recent.commits} commits naming a focus ticket${e.newestCommit ? `; newest commit ${e.newestCommit.ticket}, ${e.newestCommit.at}` : ''}`)
  L.push(`  Tyrion: ${e.tyrion.unread.length} unread inbox file${e.tyrion.unread.length === 1 ? '' : 's'}; ${e.tyrion.deliveredInWindow} delivered in the window; newest delivered ${e.tyrion.newestDelivered ?? 'never'}`)
  L.push(e.watcher
    ? `  Watcher: last cycle ${ago(e.watcher.agoMs)}; ${Object.entries(e.watcher.fields).filter(([k]) => ['DOING', 'QUEUE', 'NUDGE'].includes(k)).map(([k, v]) => `${k} ${clip(v, 60)}`).join(' · ')}`
    : '  Watcher: no log')
  L.push(`  SPRINT-STOP: ${e.sprintStop ? `present since ${e.sprintStop.at} (${e.sprintStop.reason})` : 'absent'}`)
  L.push(`  Planning (Daphne, not counted): ${e.planning ? `${ago(e.planning.agoMs)}, ${e.planning.who} on ${e.planning.ticket}` : 'none'}`)
  L.push(`  Out of quota now: ${e.quotaOut.length ? e.quotaOut.join(', ') : 'none'}`)
  if (a.watch.length) L.push('', 'Worth knowing', ...a.watch.map((w) => `  - ${w}`))
  return L.join('\n')
}

const flag = (argv, name, d) => { const i = argv.indexOf(name); return i >= 0 ? argv[i + 1] : d }

export function main(argv = process.argv.slice(2)) {
  const here = dirname(fileURLToPath(import.meta.url))
  const v2 = resolve(flag(argv, '--v2', join(here, '..')))
  const tasks = resolve(flag(argv, '--tasks', join(homedir(), 'slopdog', 'tasks')))
  const repos = argv.flatMap((a, i) => (a === '--repo' ? [resolve(argv[i + 1])] : []))
  const now = flag(argv, '--now') ? Date.parse(flag(argv, '--now')) : Date.now()
  const batches = argv.flatMap((a, i) => (a === '--batch' ? [argv[i + 1]] : []))
  const data = gather({ v2, tasks, repos: repos.length ? repos : [resolve(v2, '..'), tasks], now, quotaState: flag(argv, '--quota-state') ? resolve(flag(argv, '--quota-state')) : undefined, batches })
  const a = assess({
    ...data,
    windowHours: Number(flag(argv, '--hours', 3)),
    movingMin: Number(flag(argv, '--moving-min', 60)),
    stalledMin: Number(flag(argv, '--stalled-min', 180)),
  })
  console.log(argv.includes('--json') ? JSON.stringify(a, null, 2) : batches.length ? renderRemaining(a) : render(a))
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) main()
