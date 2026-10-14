#!/usr/bin/env node
// assumption-sweep — flag open tickets that still state an assumption a house change invalidated.
//
//   node assumption-sweep.mjs              dry run: print matches and count
//   node assumption-sweep.mjs --write      add stale_assumptions ids + one Progress note per new id
//   node assumption-sweep.mjs --only A-3   limit to one assumption id
//   node assumption-sweep.mjs --clear T-nnn A-3   move A-3 from stale_assumptions to assumptions_checked
//
// Which tickets count: rows in task-list.md whose mark is not 🟢/🟩, not archived, not under
// tickets/archive/, and created BEFORE the assumption's date (a ticket written on or after it was
// written to the new truth). Created = the earliest of front matter `created:`/`date:`, the first
// non-Sweep Progress note, and the git add date (all UTC dates, as Progress notes are stamped).
// What is searched: the ticket minus its `## Progress notes` section, which is history, not intent.
// Terms are regexes that state the OLD assumption, not bare nouns the new truth also uses.
//
// Front matter is edited as text (one list key inserted or replaced), never re-dumped, so a sweep
// changes only the lines it means to; js-yaml only validates the result.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, resolve, relative } from 'node:path'
import yaml from 'js-yaml'

const TASKS = process.env.TASKS_DIR || join(homedir(), 'slopdog/tasks')
const ASSUMPTIONS = join(TASKS, 'assumptions.jsonl')
const TASK_LIST = join(TASKS, 'task-list.md')

const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const val = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1] }
const writeMode = flag('--write')
const onlyId = val('--only')
const clearTicket = val('--clear')
const clearAssumption = clearTicket ? argv[argv.indexOf('--clear') + 2] : null

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
const ROW_RE = /^\|\s*(\S+)\s*\|\s*\[([^\]]+)\]\((tickets\/[^)]+\.md)\)/
const CLOSED_MARKS = new Set(['🟢', '🟩'])
const NOTE_DATE = /^- (\d{4}-\d\d-\d\d) \d\d:\d\d · (?!Sweep ·)/

const noteStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')

function loadAssumptions() {
  if (!existsSync(ASSUMPTIONS)) {
    console.error(`assumption-sweep: missing ${ASSUMPTIONS}`)
    process.exit(2)
  }
  const entries = []
  for (const line of readFileSync(ASSUMPTIONS, 'utf8').split('\n')) {
    const t = line.trim()
    if (!t) continue
    try {
      entries.push(JSON.parse(t))
    } catch (err) {
      console.error(`assumption-sweep: bad JSON line: ${t.slice(0, 80)}… (${err.message})`)
      process.exit(2)
    }
  }
  return entries
}

function parseFront(text) {
  const m = text.match(FRONT_MATTER)
  if (!m) return { raw: null, inner: null, fm: {}, body: text }
  let fm = {}
  try {
    fm = yaml.load(m[1]) || {}
  } catch (err) {
    throw new Error(`front matter parse failed: ${err.message}`)
  }
  return { raw: m[0], inner: m[1], fm, body: text.slice(m[0].length) }
}

function asIdList(v) {
  if (!v) return []
  if (Array.isArray(v)) return v.map(String)
  return [String(v)]
}

// Replace (or add, or remove when ids is empty) one top-level list key in the front matter text.
function setListKey(text, key, ids) {
  const { raw, inner } = parseFront(text)
  if (!raw) throw new Error('ticket has no front matter')
  const lines = inner.split('\n')
  const at = lines.findIndex((l) => new RegExp(`^${key}:`).test(l))
  if (at !== -1) {
    let end = at + 1
    while (end < lines.length && /^\s+\S/.test(lines[end])) end++
    lines.splice(at, end - at)
  }
  if (ids.length) lines.push(`${key}:`, ...ids.map((id) => `  - ${id}`))
  const next = `---\n${lines.join('\n')}\n---\n` + text.slice(raw.length)
  parseFront(next) // throws if the edit broke the YAML
  return next
}

// Earliest git add date (UTC) per tickets/ path, one git call.
function gitAddDates() {
  const out = new Map()
  try {
    const log = execFileSync('git', ['-C', TASKS, 'log', '--diff-filter=A', '--format=@%cd',
      '--date=format-local:%Y-%m-%d', '--name-only', '--', 'tickets/'],
    { encoding: 'utf8', env: { ...process.env, TZ: 'UTC' }, maxBuffer: 1 << 26, stdio: ['ignore', 'pipe', 'ignore'] })
    let date = null
    for (const l of log.split('\n')) {
      if (l.startsWith('@')) date = l.slice(1)
      else if (l.trim() && date) out.set(l.trim(), date) // newest first, so the last write is the oldest
    }
  } catch { /* no git: fall back to the ticket's own dates */ }
  return out
}

function createdDate(rel, text, fm, addDates) {
  const dates = []
  for (const k of ['created', 'date']) {
    if (fm[k]) dates.push(fm[k] instanceof Date ? fm[k].toISOString().slice(0, 10) : String(fm[k]).slice(0, 10))
  }
  const note = text.split('\n').find((l) => NOTE_DATE.test(l))
  if (note) dates.push(note.match(NOTE_DATE)[1])
  if (addDates.has(rel)) dates.push(addDates.get(rel))
  return dates.filter((d) => /^\d{4}-\d\d-\d\d$/.test(d)).sort()[0] || null
}

function withoutProgressNotes(text) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => /^## Progress notes\s*$/i.test(l))
  if (start === -1) return text
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) { if (/^#{1,2}\s/.test(lines[i])) { end = i; break } }
  return [...lines.slice(0, start), ...lines.slice(end)].join('\n')
}

function openTickets() {
  const addDates = gitAddDates()
  const rows = []
  const seen = new Set()
  for (const line of readFileSync(TASK_LIST, 'utf8').split('\n')) {
    const m = line.match(ROW_RE)
    if (!m) continue
    const [, mark, title, rel] = m
    if (CLOSED_MARKS.has(mark) || /archived/i.test(line) || rel.startsWith('tickets/archive/')) continue
    const path = resolve(TASKS, rel)
    if (seen.has(path) || !existsSync(path)) continue
    seen.add(path)
    const text = readFileSync(path, 'utf8')
    let fm
    try { ({ fm } = parseFront(text)) } catch (err) { console.error(`assumption-sweep: skip ${rel}: ${err.message}`); continue }
    if (fm.readiness?.state === 'archived' || fm.archived === true) continue
    const tag = line.match(/#T(\d[\d-]*)/)?.[1]
    const id = fm.id || (tag ? `T-${tag}` : null)
    rows.push({ id, title, path, text, fm, created: createdDate(relative(TASKS, path), text, fm, addDates) })
  }
  return rows
}

function termMatches(body, term) {
  try {
    return new RegExp(term, 'i').test(body)
  } catch (err) {
    console.error(`assumption-sweep: bad regex ${term}: ${err.message}`)
    return false
  }
}

function appendProgressNote(text, line) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => /^## Progress notes\s*$/i.test(l))
  if (start === -1) return `${text.replace(/\s+$/, '')}\n\n## Progress notes\n\n${line}\n`
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) { if (/^#{1,6}\s/.test(lines[i])) { end = i; break } }
  let last = start
  for (let i = start + 1; i < end; i++) { if (lines[i].trim() !== '') last = i }
  lines.splice(last + 1, 0, line)
  return lines.join('\n')
}

function runClear(ticketId, assumptionId) {
  const row = openTickets().find((t) => t.id === ticketId)
  const path = row?.path
  if (!path || !existsSync(path)) {
    console.error(`assumption-sweep: no open ticket ${ticketId} in task-list.md`)
    process.exit(2)
  }
  let text = readFileSync(path, 'utf8')
  const { fm } = parseFront(text)
  text = setListKey(text, 'stale_assumptions', asIdList(fm.stale_assumptions).filter((x) => x !== assumptionId))
  text = setListKey(text, 'assumptions_checked', [...new Set([...asIdList(fm.assumptions_checked), assumptionId])])
  writeFileSync(path, text)
  console.log(`cleared ${assumptionId} on ${ticketId}`)
}

if (clearTicket) {
  if (!clearAssumption) {
    console.error('assumption-sweep: --clear needs T-nnn and A-n')
    process.exit(2)
  }
  runClear(clearTicket, clearAssumption)
  process.exit(0)
}

const assumptions = loadAssumptions().filter((a) => !onlyId || a.id === onlyId)
const tickets = openTickets()
const hits = []

for (const entry of assumptions) {
  for (const ticket of tickets) {
    if (asIdList(ticket.fm.assumptions_checked).includes(entry.id)) continue
    if (ticket.created && entry.date && ticket.created >= entry.date) continue
    const haystack = withoutProgressNotes(ticket.text)
    if (!(entry.terms || []).some((term) => termMatches(haystack, term))) continue
    hits.push({ ticket, entry })
  }
}

for (const { ticket, entry } of hits) console.log(`${ticket.id}  ${entry.id}  ${ticket.title}`)
console.log(`count: ${hits.length} hits on ${new Set(hits.map((h) => h.ticket.path)).size} tickets`)

if (!writeMode) process.exit(0)

for (const { ticket, entry } of hits) {
  let text = readFileSync(ticket.path, 'utf8')
  const { fm } = parseFront(text)
  const had = asIdList(fm.stale_assumptions)
  if (had.includes(entry.id)) continue
  text = setListKey(text, 'stale_assumptions', [...had, entry.id])
  text = appendProgressNote(text, `- ${noteStamp()} · Sweep · assumption ${entry.id} changed (${entry.change}); re-check before dispatch.`)
  writeFileSync(ticket.path, text)
}
