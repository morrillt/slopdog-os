// T-663-1: mechanical refuse-tier checks at dispatch time (before any builder starts).
// T-740: the cheap lane is build then verify, so the gate no longer runs a ticket's Verify
// commands before the build (check 2), no longer refuses on a hardcoded ladder value (check 13;
// check-build-ladder.mjs stays as a test) and no longer refuses a big ticket on the Gemma lane
// (check 14; build-ladder.json's escalate_above_steps sends it to the escalation rung instead).
import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'
import { pathToFileURL } from 'node:url'
import { taskListRowEmoji } from './dispatch-ticket-updates.mjs'

const TASKS_BIN = join(homedir(), 'slopdog', 'tasks', 'bin')
const { checkTicket } = await import(pathToFileURL(join(TASKS_BIN, 'check-ticket.mjs')).href)

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/

function splitFrontMatter(text) {
  const m = text.match(FRONT_MATTER)
  if (!m) return { raw: null, body: text }
  return { raw: m[1], body: m[2] }
}

function parseYamlScalar(raw, key) {
  const m = raw.match(new RegExp(`^${key}:\\s*(true|false)\\s*$`, 'm'))
  if (m) return m[1] === 'true'
  const inline = raw.match(new RegExp(`^${key}:\\s*(\\S+)`, 'm'))
  return inline ? inline[1].replace(/^["']|["']$/g, '') : undefined
}

function readinessState(raw) {
  const block = raw.match(/^readiness:\s*\n((?:[ \t].*\n?)*)/m)?.[1] || ''
  const m = block.match(/^\s+state:\s*(\S+)/m)
  return m ? m[1] : undefined
}

function sectionBody(body, name) {
  const re = new RegExp(`^## ${name}\\s*$`, 'm')
  const start = body.search(re)
  if (start === -1) return ''
  const after = body.slice(start).split('\n').slice(1).join('\n')
  const next = after.search(/^## /m)
  return (next === -1 ? after : after.slice(0, next)).trim()
}

function parseSteps(stepsBody) {
  if (!stepsBody) return []
  const lines = stepsBody.split('\n')
  const steps = []
  let current = null
  for (const line of lines) {
    if (/^-\s*\[[ xX]\]/.test(line) || /^\d+\.\s/.test(line)) {
      if (current) steps.push(current)
      current = { text: line, extra: [], ticked: /^-\s*\[[xX]\]/.test(line) }
    } else if (current && line.trim()) {
      current.extra.push(line)
    }
  }
  if (current) steps.push(current)
  return steps.map((s) => ({
    ...s,
    block: [s.text, ...s.extra].join('\n'),
    unticked: /^-\s*\[ \]/.test(s.text),
  }))
}

function expandPath(p, cwd) {
  const cleaned = p.replace(/\s+\(new\)$/, '').trim()
  if (cleaned.startsWith('~')) return join(homedir(), cleaned.slice(1))
  if (cleaned.startsWith('/')) return cleaned
  return join(cwd, cleaned)
}

function parseCriteria(acBody) {
  if (!acBody) return []
  const out = []
  for (const line of acBody.split('\n')) {
    const m = line.match(/^-\s*\[[ xX]\]\s*AC-(\d+)\s*(?:\[([^\]]+)\])?\s*(?:\(([^)]*)\))?\s*(.*)$/)
    if (!m) continue
    const bracket = (m[2] || '').trim()
    const type = bracket.split(',')[0]?.trim() || null
    const refs = (m[3] || '').match(/FR-\d+/g) || []
    out.push({ id: `AC-${m[1]}`, type, refs })
  }
  return out
}

function frIds(frBody) {
  return [...(frBody || '').matchAll(/^-\s*FR-(\d+)/gm)].map((m) => `FR-${m[1]}`)
}

function check5Paused(raw) {
  if (parseYamlScalar(raw, 'paused') === true) {
    return [{ check: 5, reason: 'ticket has paused: true' }]
  }
  return []
}

function check6MarkMismatch(tasksDir, ticketPath, raw) {
  const mark = taskListRowEmoji(tasksDir, ticketPath)
  if (!mark) return []
  const state = readinessState(raw)
  const expected = { '🔵': 'ready', '🔴': 'blocked', '🟠': 'questions', '🤷': 'unknown' }[mark]
  if (!expected) return []
  if (state !== expected) {
    return [{ check: 6, reason: `task-list mark ${mark} disagrees with readiness.state ${state ?? '(missing)'}` }]
  }
  return []
}

function check12ToddOnlyProof(body) {
  const frBody = sectionBody(body, 'Functional Requirements')
  const acBody = sectionBody(body, 'Acceptance Criteria')
  const criteria = parseCriteria(acBody)
  const failures = []
  for (const fr of frIds(frBody)) {
    const refs = criteria.filter((c) => c.refs.includes(fr))
    if (!refs.length) continue
    if (refs.every((c) => c.type === 'manual')) {
      failures.push({ check: 12, reason: `${fr} is proved only by manual acceptance criteria` })
    }
  }
  return failures
}

function pathsMarkedNewOnStepLine(line) {
  const paths = []
  for (const m of line.matchAll(/`([^`]+)`\s*\(new\)/g)) {
    paths.push(m[1].trim())
  }
  for (const m of line.matchAll(/(?:^|[\s,(])(~\/[^\s`'")]+|\/home\/[^\s`'")]+)\s*\(new\)/g)) {
    paths.push(m[1].replace(/[.,;:]+$/, ''))
  }
  return paths
}

function check10CreatesExisting(body, tasksDir) {
  const stepsBody = sectionBody(body, 'Steps')
  const failures = []
  for (const line of stepsBody.split('\n')) {
    if (/^\s*-\s*\[x\]/i.test(line)) continue
    if (!/\(new\)/.test(line)) continue
    for (const p of pathsMarkedNewOnStepLine(line)) {
      const expanded = expandPath(p, tasksDir)
      if (!existsSync(expanded)) continue
      const st = statSync(expanded)
      if (st.isDirectory()) continue
      failures.push({ check: 10, reason: `step creates ${p} but it already exists` })
    }
  }
  return failures
}

function check3PlaceholdersAndPaths(body, ticketPath, tasksDir) {
  const stepsBody = sectionBody(body, 'Steps')
  const failures = []
  for (const step of parseSteps(stepsBody)) {
    for (const line of step.block.split('\n')) {
      if (!/^\s*(?:-\s*)?Verify\b/i.test(line)) continue
      if (/<[^>]+>/.test(line) || /\.\.\.|…/.test(line)) {
        failures.push({ check: 3, reason: 'Verify line contains a placeholder path or ellipsis' })
      }
    }
  }
  const prev = process.env.CHECK_TICKET_TASKS_ROOT
  process.env.CHECK_TICKET_TASKS_ROOT = tasksDir
  try {
    const { failures: ctFails } = checkTicket(ticketPath)
    for (const f of ctFails) {
      if (f.startsWith('Verify line names a path that does not exist')) {
        failures.push({ check: 3, reason: f })
      }
    }
  } finally {
    if (prev === undefined) delete process.env.CHECK_TICKET_TASKS_ROOT
    else process.env.CHECK_TICKET_TASKS_ROOT = prev
  }
  return failures
}

function isTierCountOverflowFailure(message) {
  if (/^\d+ points: exactly one acceptance criterion/.test(message)) return true
  if (/^\d+ points: \d+ or \d+ acceptance criteria/.test(message)) return true
  if (/^\d+ points:.*\bfound \d+\s*$/.test(message)) return true
  return false
}

function check7TierOverflow(ticketPath, tasksDir) {
  const prev = process.env.CHECK_TICKET_TASKS_ROOT
  process.env.CHECK_TICKET_TASKS_ROOT = tasksDir
  try {
    const { failures } = checkTicket(ticketPath)
    return failures
      .filter(isTierCountOverflowFailure)
      .map((reason) => ({ check: 7, reason }))
  } finally {
    if (prev === undefined) delete process.env.CHECK_TICKET_TASKS_ROOT
    else process.env.CHECK_TICKET_TASKS_ROOT = prev
  }
}

export function runDispatchMechanicalGate({ ticketPath, ticketText, tasksDir }) {
  const { raw, body } = splitFrontMatter(ticketText)
  const refused = [
    ...check3PlaceholdersAndPaths(body, ticketPath, tasksDir),
    ...(raw ? check5Paused(raw) : []),
    ...(raw ? check6MarkMismatch(tasksDir, ticketPath, raw) : []),
    ...check7TierOverflow(ticketPath, tasksDir),
    ...check10CreatesExisting(body, tasksDir),
    ...check12ToddOnlyProof(body),
  ]
  const gaps = refused.map((r) => `dispatch gate check ${r.check}: ${r.reason}`)
  return { refused, gaps }
}

export function writeReadinessGaps(ticketPath, gaps) {
  const text = readFileSync(ticketPath, 'utf8')
  const m = text.match(FRONT_MATTER)
  if (!m) throw new Error('ticket has no front matter')
  const lines = m[1].split('\n')
  let start = lines.findIndex((l) => /^readiness:/.test(l))
  if (start === -1) {
    const block = [...lines, 'readiness:', '  gaps:']
    for (const g of gaps) block.push(`    - ${JSON.stringify(g)}`)
    writeFileSync(ticketPath, text.replace(m[0], `---\n${block.join('\n')}\n---\n${m[2]}`))
    return
  }
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z0-9_]+:/.test(lines[i])) {
      end = i
      break
    }
  }
  const withoutGaps = []
  for (let i = start + 1; i < end; i++) {
    if (/^\s+state:/.test(lines[i]) || /^\s+by:/.test(lines[i]) || /^\s+updated:/.test(lines[i])) {
      withoutGaps.push(lines[i])
    }
  }
  const head = lines.slice(0, start + 1)
  const tail = lines.slice(end)
  const mid = [...withoutGaps, '  gaps:']
  for (const g of gaps) mid.push(`    - ${JSON.stringify(g)}`)
  const block = [...head, ...mid, ...tail]
  writeFileSync(ticketPath, text.replace(m[0], `---\n${block.join('\n')}\n---\n${m[2]}`))
}
