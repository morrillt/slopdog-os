#!/usr/bin/env node
// batch-review — Todd reviews batches, not tickets (T-687, Todd 2026-10-08: "I don't want to review
// individual tickets anymore, just batches... I don't have time to review 232 tickets.").
//
//   node batch-review.mjs [--list] [--json]                 every batch ready for Todd's review
//   node batch-review.mjs --count                           how many, a bare number
//   node batch-review.mjs --approve <project>/<batch> [--json] [--who Todd]
//                                                           take every 🟩 member to 🟢
//   --tasks <tasksRoot>                                     default ~/slopdog/tasks (or TASKS_DIR)
//
// Ready: every member's ticket status line is 🟩 or 🟢, and at least one is 🟩. A member that is
// archived (tickets/archive/) or has no ticket file keeps the batch out. Members are the batch
// file's `## Members` list (batches/<project>/<batch>.md), read with the batch-cap lib's parser.
// The task-list.md row is not the deciding mark; a row that disagrees with the status line is
// reported under the batch's warnings so the drift is seen rather than hidden. So is a 🟩 member
// whose Progress notes hold no verify log (the `- <stamp> · <who> · verify log` header of §4 of the
// verification design, desks/research/reports/2026-10-11-when-and-how-to-verify.md): a warning,
// not a refusal, because every ticket made 🟩 before batch 10 has no log (T-741).
//
// Approval writes the same three things the board's per-ticket Accept wrote (runner
// src/lib/ticket-status.ts): the status line becomes `🟢 done`, the task-list.md row's emoji cell
// becomes 🟢, a Progress note is appended, and `started:` leaves the front matter. A batch that is
// not ready is refused (exit 1) and nothing is written.
import { existsSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { memberIds } from '../../tasks/bin/lib/batch-cap.mjs'

const STATUS_LINE = /^(T-[\w.-]+ · )(\S+)(?: [^\n]*)?$/m
const ROW = /^\|\s*(\S+)\s*\|\s*\[([^\]]*)\]\(([^)]+)\)/
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
const REVIEW = '🟩'
const DONE = '🟢'

const VERIFY_LOG = /^- [^\n]* · verify log\s*$/m

const fmField = (yaml, key) => (yaml.match(new RegExp(`^${key}:[ \\t]*(.+)$`, 'm')) || [])[1]?.trim().replace(/^["']|["']$/g, '')

// `todd_checks:` is a YAML block list of plain lines (batch-review-decisions.md): the manual ACs
// Todd does while reviewing the batch.
function toddChecksOf(yaml) {
  const m = yaml.match(/^todd_checks:[ \t]*\n((?:[ \t]+-[^\n]*\n?)*)/m)
  if (!m) return []
  return m[1].split('\n').map((l) => l.replace(/^[ \t]+-[ \t]*/, '').trim().replace(/^["']|["']$/g, '')).filter(Boolean)
}

function readTicket(path) {
  const text = readFileSync(path, 'utf8')
  const yaml = (text.match(FRONT_MATTER) || [])[1] || ''
  return {
    path,
    text,
    id: fmField(yaml, 'id'),
    title: (text.match(/^# (.+)$/m) || [])[1]?.trim() || '',
    status: (text.match(STATUS_LINE) || [])[2] || '?',
    toddChecks: toddChecksOf(yaml),
  }
}

// The body of `## Progress notes`, up to the next heading.
function progressNotes(text) {
  const m = text.match(/^##\s+Progress notes\s*$([\s\S]*?)(?=^#{1,6}\s|(?![\s\S]))/mi)
  return m ? m[1] : ''
}

function indexTickets(dir) {
  const byId = new Map()
  if (!existsSync(dir)) return byId
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.md')) continue
    const t = readTicket(join(dir, f))
    if (t.id) byId.set(t.id, t)
  }
  return byId
}

// task-list.md rows by the ticket file they link, resolved against the tasks root. A tree with
// no task-list.md (the runner's e2e trees) has no rows; `exists` tells approveBatch not to write one.
function readRows(tasks) {
  const file = join(tasks, 'task-list.md')
  if (!existsSync(file)) return { lines: [], byPath: new Map(), exists: false }
  const lines = readFileSync(file, 'utf8').split('\n')
  const byPath = new Map()
  lines.forEach((l, i) => {
    const m = l.match(ROW)
    if (m) byPath.set(resolve(tasks, m[3].trim()), { mark: m[1], line: i })
  })
  return { lines, byPath, exists: true }
}

function readBatchFiles(tasks) {
  const root = join(tasks, 'batches')
  const out = []
  for (const project of readdirSync(root, { withFileTypes: true })) {
    if (!project.isDirectory()) continue
    for (const f of readdirSync(join(root, project.name))) {
      if (!f.endsWith('.md')) continue
      const text = readFileSync(join(root, project.name, f), 'utf8')
      out.push({
        project: project.name,
        batch: f.replace(/\.md$/, ''),
        file: join(root, project.name, f),
        title: (text.match(/^# Batch:\s*(.+)$/m) || text.match(/^# (.+)$/m) || [])[1]?.trim() || f.replace(/\.md$/, ''),
        summary: (text.match(/^## Summary\s*\n+([^\n]+)/m) || [])[1]?.trim() || '',
        ids: memberIds(text),
      })
    }
  }
  return out
}

// One batch's verdict: ready or not, with every member and the reasons it is not.
function assess(b, live, archived, rows) {
  const members = []
  const blockers = []
  const warnings = []
  for (const id of b.ids) {
    const t = live.get(id)
    if (!t) {
      blockers.push(archived.has(id) ? `${id} archived` : `${id} missing`)
      continue
    }
    members.push({ id, title: t.title, status: t.status, toddChecks: t.toddChecks, path: t.path })
    if (t.status !== REVIEW && t.status !== DONE) blockers.push(`${id} ${t.status}`)
    const row = rows.byPath.get(resolve(t.path))
    if (row && row.mark !== t.status) warnings.push(`${id}: status line ${t.status}, task-list row ${row.mark}`)
    if (t.status === REVIEW && !VERIFY_LOG.test(progressNotes(t.text))) warnings.push(`${id}: ${REVIEW} with no verify log in its Progress notes`)
  }
  if (b.ids.length === 0) blockers.push('no members')
  else if (!members.some((m) => m.status === REVIEW)) blockers.push(`no member is ${REVIEW}`)
  return {
    project: b.project,
    batch: b.batch,
    title: b.title,
    summary: b.summary,
    members,
    warnings,
    ready: blockers.length === 0,
    blockers,
  }
}

function assessAll(tasks) {
  const live = indexTickets(join(tasks, 'tickets'))
  const archived = indexTickets(join(tasks, 'tickets', 'archive'))
  const rows = readRows(tasks)
  return readBatchFiles(tasks).map((b) => assess(b, live, archived, rows))
}

const publicShape = ({ ready, blockers, ...b }) => b

/** Every batch whose members are all 🟩/🟢 with at least one 🟩, sorted by project then batch. */
export function readyBatches(tasks) {
  return assessAll(tasks)
    .filter((b) => b.ready)
    .sort((a, b) => a.project.localeCompare(b.project) || a.batch.localeCompare(b.batch, undefined, { numeric: true }))
    .map(publicShape)
}

function today() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Append `line` as the last entry of `## <section>` (same rule as the runner's appendUnder).
function appendUnder(text, section, line) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => new RegExp(`^##\\s+${section}\\s*$`, 'i').test(l))
  if (start === -1) return `${text.replace(/\s+$/, '')}\n\n## ${section}\n\n${line}\n`
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) if (/^#{1,6}\s/.test(lines[i])) { end = i; break }
  let last = start
  for (let i = start + 1; i < end; i++) if (lines[i].trim() !== '') last = i
  lines.splice(last + 1, 0, ...(last === start ? ['', line] : [line]))
  return lines.join('\n')
}

function dropStarted(text) {
  const m = text.match(FRONT_MATTER)
  if (!m) return text
  const yaml = m[1].split('\n').filter((l) => !/^started:/.test(l)).join('\n')
  return text.replace(m[0], `---\n${yaml}\n---\n`)
}

/** Take every 🟩 member of `<project>/<batch>` to 🟢. Throws, writing nothing, if it is not ready. */
export function approveBatch(tasks, key, { who = 'Todd', date = today() } = {}) {
  const [project, ...rest] = String(key || '').split('/')
  const batch = rest.join('/')
  const b = assessAll(tasks).find((x) => x.project === project && x.batch === batch)
  if (!b) throw new Error(`no batch ${key} (expected batches/<project>/<batch>.md under ${tasks})`)
  if (!b.ready) throw new Error(`batch ${key} is not ready for review: ${b.blockers.join(', ')}`)

  const rows = readRows(tasks)
  const writes = []
  const flipped = []
  for (const m of b.members) {
    if (m.status !== REVIEW) continue
    const original = readFileSync(m.path, 'utf8')
    let text = original.replace(STATUS_LINE, `$1${DONE} done`)
    text = appendUnder(text, 'Progress notes', `- ${date} · ${who} · approved with batch ${key}.`)
    writes.push({ path: m.path, original, text: dropStarted(text) })
    const row = rows.byPath.get(resolve(m.path))
    if (row) rows.lines[row.line] = rows.lines[row.line].replace(/^\|\s*\S+\s*\|/, `| ${DONE} |`)
    flipped.push(m.id)
  }
  // Tickets first, then the list; a failed write puts back every ticket already written.
  const done = []
  try {
    for (const w of writes) { writeFileSync(w.path, w.text); done.push(w) }
    if (rows.exists) writeFileSync(join(tasks, 'task-list.md'), rows.lines.join('\n'))
  } catch (err) {
    for (const w of done) writeFileSync(w.path, w.original)
    throw err
  }
  return { project, batch, flipped }
}

// ── CLI ──────────────────────────────────────────────────────────────────────
if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const argv = process.argv.slice(2)
  const val = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1] }
  const tasks = realpathSync(val('--tasks') || process.env.TASKS_DIR || join(process.env.HOME || '~', 'slopdog', 'tasks'))
  const json = argv.includes('--json')
  const approve = val('--approve')

  if (argv.includes('--approve')) {
    try {
      const res = approveBatch(tasks, approve, { who: val('--who') || 'Todd' })
      if (json) console.log(JSON.stringify(res))
      else console.log(`Approved ${approve}: ${res.flipped.length} ticket(s) to 🟢 (${res.flipped.join(', ') || 'none'}).`)
    } catch (err) {
      if (json) console.log(JSON.stringify({ error: err.message }))
      console.error(err.message)
      process.exit(1)
    }
  } else {
    const ready = readyBatches(tasks)
    if (argv.includes('--count')) console.log(ready.length)
    else if (json) console.log(JSON.stringify(ready.map(({ members, ...b }) => ({ ...b, members: members.map(({ path, ...m }) => m) })), null, 2))
    else {
      for (const b of ready) {
        const n = (mark) => b.members.filter((m) => m.status === mark).length
        console.log(`${b.project}/${b.batch} · ${b.members.length} tickets (${n(REVIEW)} ${REVIEW}, ${n(DONE)} ${DONE})${b.summary ? ` · ${b.summary}` : ''}`)
        for (const w of b.warnings) console.log(`  warning: ${w}`)
      }
      console.log(`${ready.length} batch${ready.length === 1 ? '' : 'es'} ready for review`)
    }
  }
}
