// ticket-lib — the small pieces build-log.mjs and build-step.mjs share: find a ticket,
// stamp a line, append under ## Build log in template position, tick the Nth step.
// Pure string functions where possible, so the tests can call them without a repo.
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'

export const TAGS = ['Plan', 'Implementation', 'Debug', 'Decision', 'Assumption', 'Blocker']

// The sections that come after ## Build log in ~/slopdog/tasks/templates/ticket.md, in order.
const AFTER_BUILD_LOG = ['Hand-off', 'Progress notes', 'Concerns']

export function tasksDir() {
  return process.env.SLOPDOG_TASKS_DIR || join(homedir(), 'slopdog', 'tasks')
}

// Same rule as findTicketPath in ~/slopdog/v2/scripts/dispatch-ticket-updates.mjs: the
// ticket whose front matter `id:` is T-<id>, in <tasks>/tickets (not the archive).
export function findTicketPath(dir, id) {
  const ticketsDir = join(dir, 'tickets')
  const wantId = id.startsWith('T-') ? id : `T-${id}`
  if (!existsSync(ticketsDir)) return null
  for (const f of readdirSync(ticketsDir)) {
    if (!f.endsWith('.md')) continue
    const p = join(ticketsDir, f)
    const m = readFileSync(p, 'utf8').match(/^id:\s*"?(\S+?)"?\s*$/m)
    if (m && m[1] === wantId) return p
  }
  return null
}

// A path that exists wins; otherwise anything shaped like T-123 or 123 is looked up by id.
export function resolveTicket(arg) {
  if (!arg) return null
  if (existsSync(arg)) return resolve(arg)
  if (/^(T-)?\d+[a-z0-9-]*$/i.test(arg)) return findTicketPath(tasksDir(), arg)
  return null
}

export function ticketId(text) {
  const m = text.match(/^id:\s*"?(\S+?)"?\s*$/m)
  return m ? m[1] : null
}

const pad = (n) => String(n).padStart(2, '0')
export function stamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export function logLine(tag, text, d = new Date()) {
  return `- ${stamp(d)}: [${tag}] ${text.replace(/\s*\n\s*/g, ' ').trim()}`
}

// Line index of `## <name>` (exact heading), or -1.
function headingIndex(lines, name) {
  return lines.findIndex((l) => l.trim() === `## ${name}`)
}

// Append one line at the end of ## Build log. A ticket without the section gets it,
// placed before the first of Hand-off / Progress notes / Concerns, else at the end.
export function appendBuildLog(text, line) {
  const lines = text.split('\n')
  let start = headingIndex(lines, 'Build log')
  if (start === -1) {
    const before = AFTER_BUILD_LOG.map((n) => headingIndex(lines, n)).filter((i) => i !== -1)
    if (before.length) {
      const at = Math.min(...before)
      lines.splice(at, 0, '## Build log', '', '')
      start = at
    } else {
      while (lines.length && lines[lines.length - 1].trim() === '') lines.pop()
      lines.push('', '## Build log', '')
      start = lines.length - 2
    }
  }
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l))
  if (end === -1) end = lines.length
  let last = end - 1
  while (last > start && lines[last].trim() === '') last--
  const insertAt = last + 1
  const out = [...lines.slice(0, insertAt)]
  if (last === start) out.push('')
  out.push(line)
  const rest = lines.slice(insertAt)
  // Keep exactly one blank line before the next heading.
  while (rest.length && rest[0].trim() === '') rest.shift()
  if (rest.length) out.push('', ...rest)
  else out.push('')
  return out.join('\n')
}

// The top-level step checkboxes under ## Steps: [{ index, ticked }], in order.
export function stepBoxes(text) {
  const lines = text.split('\n')
  const start = headingIndex(lines, 'Steps')
  if (start === -1) return []
  const boxes = []
  for (let i = start + 1; i < lines.length && !/^## /.test(lines[i]); i++) {
    const m = lines[i].match(/^- \[( |x|X)\] /)
    if (m) boxes.push({ index: i, ticked: m[1] !== ' ' })
  }
  return boxes
}

export function tickStep(text, n) {
  const boxes = stepBoxes(text)
  const box = boxes[n - 1]
  if (!box) throw new Error(`step ${n} not found: ## Steps has ${boxes.length} top-level checkbox(es)`)
  if (box.ticked) throw new Error(`step ${n} is already ticked`)
  const lines = text.split('\n')
  lines[box.index] = lines[box.index].replace(/^- \[ \] /, '- [x] ')
  return lines.join('\n')
}

// Add `- <path> — <why>` lines under ## Hand-off's Files changed list, creating the list
// (and the section, before ## Progress notes) when missing. A path already listed is skipped.
export function addFilesChanged(text, paths, why) {
  let lines = text.split('\n')
  let start = headingIndex(lines, 'Hand-off')
  if (start === -1) {
    const after = ['Progress notes', 'Concerns'].map((n) => headingIndex(lines, n)).filter((i) => i !== -1)
    const at = after.length ? Math.min(...after) : lines.length
    lines.splice(at, 0, '## Hand-off', '', '')
    start = at
  }
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l))
  if (end === -1) end = lines.length
  let fc = -1
  for (let i = start + 1; i < end; i++) if (/^(\*\*)?Files changed:/.test(lines[i].trim())) { fc = i; break }
  if (fc === -1) {
    let at = start + 1
    while (at < end && lines[at].trim() === '') at++
    if (at < end && lines[at].trim().startsWith('<!--')) {
      while (at < end && !lines[at].includes('-->')) at++
      at++
      if (lines[at - 1] !== undefined) lines.splice(at, 0, '')
      at++
      end++
    }
    const blankAfter = lines[at] !== undefined && lines[at].trim() === ''
    lines.splice(at, 0, ...(blankAfter ? ['**Files changed:**'] : ['**Files changed:**', '']))
    fc = at
    end += blankAfter ? 1 : 2
  }
  let last = fc
  while (last + 1 < end && /^- /.test(lines[last + 1])) last++
  const listed = lines.slice(fc + 1, last + 1).map((l) => l.replace(/^- /, '').split(' — ')[0].trim())
  const add = paths.filter((p) => !listed.includes(p)).map((p) => `- ${p} — ${why.replace(/\s*\n\s*/g, ' ').trim()}`)
  lines.splice(last + 1, 0, ...add)
  return lines.join('\n')
}


// The post-job trail check dispatch.mjs runs: every step ticked during the job (ticked in
// `after`, not in `before`) must have an `[Implementation] Step N:` Build log line and a
// commit subject containing `T-<id> step N:`. Returns one reason per gap; [] means clean.
export function trailGaps(before, after, subjects) {
  const id = ticketId(after)
  const was = stepBoxes(before).map((b) => b.ticked)
  const log = after.slice(after.indexOf('## Build log'))
  const gaps = []
  stepBoxes(after).forEach((b, i) => {
    if (!b.ticked || was[i]) return
    const n = i + 1
    if (!new RegExp(`\\[Implementation\\] Step ${n}:`).test(log)) gaps.push(`step ${n} ticked with no [Implementation] Step ${n} line in ## Build log`)
    if (!subjects.some((s) => s.includes(`${id} step ${n}:`))) gaps.push(`step ${n} ticked with no "${id} step ${n}:" commit`)
  })
  return gaps
}
