#!/usr/bin/env node
// ready-queue — the one answer to "what should I dispatch next" (Todd, 2026-10-05, after every
// builder sat idle for three and a half hours while 37 tickets were marked ready).
//
//   node ready-queue.mjs                 the queue, best first
//   node ready-queue.mjs --limit 3       just the first three
//   node ready-queue.mjs --why T-557     why that one ticket is not in the queue
//   node ready-queue.mjs --loose         include tickets whose readiness has no validator
//
// At most two batches may be in flight (Todd, 2026-10-06). A batch is open while any of its
// tickets is past 🔵 and not yet 🟢, unless every ticket in it is 🟩 or 🟢: that batch is built
// and waits only on Todd's batch review (T-687), so it frees its slot. Todd may allow a third via tasks/.over-batch/<project--batch>
// (same idea as a desk's .over-ceiling): the file body records who allowed it.
//
// A ticket is in the queue only if every rule below holds. The rules are deliberately strict:
// on 2026-10-04, 27 of 37 tickets marked ready carried no validator stamp, and that population
// failed validation fourteen times out of fifteen. A thin queue means validation is behind, which
// is a thing to fix rather than to paper over.
import { readFileSync, readdirSync, existsSync, realpathSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, relative, resolve } from 'node:path'
import { laneDir } from './lib/lane-folder.mjs'
import {
  batchCapExcuse,
  batchKeyFor,
  batchesInFlightOf,
  extractPathTokens,
  isHotfix,
  pathCollisions,
} from './lib/ready-rules.mjs'
import {
  confirmReadinessStamp,
  DEFAULT_RUNS_PATH,
  UNCONFIRMED_STAMP_REASON,
} from './lib/validator-stamp.mjs'

const TASKS = realpathSync(process.env.TASKS_DIR || '~/slopdog/tasks') // real path: ~/slopdog is a symlink to /storage, and git reports the real root
// Tyrion's holds live in the build lane's folder, resolved through the registry (T-684: desks/build/tyrion).
const HOLDS_FILE = process.env.HOLDS_FILE || (existsSync(join(TASKS, 'holds.json')) ? join(TASKS, 'holds.json') : join(laneDir('build'), 'holds.json'))
const argv = process.argv.slice(2)
const flag = (n) => argv.includes(n)
const val = (n) => { const i = argv.indexOf(n); return i === -1 ? null : argv[i + 1] }
const loose = flag('--loose')
// The sprint in hand. One sprint at a time (Todd, 2026-10-04), so the queue never offers a ticket
// from another project — on 2026-10-05 the queue was almost all slopdog-whatsapp work while the
// meta sprint was open, and builders took it. --project overrides, --any-project disables it.
// A ticket with `hotfix: true` is exempt from this rule and from the two-batch cap, and never
// counts toward that cap (vocabulary.md: a hotfix does not wait; Todd, 2026-10-08: "there is no
// longer a limit"). Holds, depends_on and path collisions still apply: they are safety, not limits.
const SPRINT = process.env.SPRINT_PROJECT || val('--project') || 'shaping-and-delivery'
const anyProject = flag('--any-project')
const limit = Number(val('--limit') || 25)
const why = val('--why')

const fm = (text, key) => (text.match(new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n]+)`, 'm')) || [])[1]?.trim()
const list = readFileSync(join(TASKS, 'task-list.md'), 'utf8').split('\n')

// The row carries the mark the board shows, and #Tnnn without the hyphen.
const rows = new Map()
const listOrder = new Map()
for (let i = 0; i < list.length; i++) {
  const line = list[i]
  const m = line.match(/^\|\s*(\S+)\s*\|\s*\[([^\]]+)\][^|]*#T(\S+?)[\s#]/)
  if (m) {
    rows.set(`T-${m[3]}`, { mark: m[1], title: m[2] })
    listOrder.set(`T-${m[3]}`, i)
  }
}

let holdsData = { holds: [], contested: {} }
if (existsSync(HOLDS_FILE)) {
  try {
    const raw = JSON.parse(readFileSync(HOLDS_FILE, 'utf8'))
    if (Array.isArray(raw)) {
      holdsData.holds = raw
    } else if (raw && typeof raw === 'object') {
      holdsData.holds = Array.isArray(raw.holds) ? raw.holds : []
      holdsData.contested = (raw.contested && typeof raw.contested === 'object') ? raw.contested : {}
    }
  } catch {}
}

const tickets = []
for (const f of readdirSync(join(TASKS, 'tickets'))) {
  if (!f.endsWith('.md')) continue
  const text = readFileSync(join(TASKS, 'tickets', f), 'utf8')
  const id = fm(text, 'id')
  if (!id) continue
  const row = rows.get(id) || {}
  const project = fm(text, 'project')
  const batch = fm(text, 'batch')
  tickets.push({
    id, file: f, text,
    title: row.title || '',
    mark: row.mark || '?',
    paused: /^paused:\s*true/m.test(text),
    state: fm(text, 'state'),
    by: fm(text, 'by'),
    points: Number(fm(text, 'points') || 0),
    priority: Number(fm(text, 'priority') || 99),
    project,
    batch,
    batchKey: batchKeyFor(project, batch),
    hotfix: isHotfix(text),
    dependsOn: dependsOnOf(text),
    pathTokens: extractPathTokens(text),
    openPathTokens: extractPathTokens(text, { openOnly: true }),
  })
}
// depends_on comes inline (`depends_on: T-1, T-2` or `[T-1, T-2]`) or as a YAML block list
// (`depends_on:` then `  - T-1` lines); reading only the inline form dropped every list item but the first.
function dependsOnOf(text) {
  const m = text.match(/^depends_on:[ \t]*(.*)\n((?:[ \t]+-[ \t]*.+\n?)*)/m)
  if (!m) return []
  return `${m[1]} ${m[2]}`.match(/T-[\w-]+/g) || []
}
const byId = new Map(tickets.map((t) => [t.id, t]))
const landed = (id) => { const t = byId.get(id); return !t || ['🟢', '🟩'].includes(t.mark) }
// A paused ticket is not being worked, so it holds no paths even while its row says 🟡 or 🔍.
const inFlight = tickets.filter((t) => ['🟡', '🔍'].includes(t.mark) && !t.paused)

const batchCapOpts = { anyProject, sprint: SPRINT }
const batchesInFlight = batchesInFlightOf(tickets, batchCapOpts)

// One rule per reason, so a rejection can always be named.
function excuses(t) {
  const out = []
  if (!anyProject && !t.hotfix && t.project !== SPRINT) out.push(`project is ${t.project || 'unset'}, not this sprint (${SPRINT})`)
  if (t.paused) out.push('paused: true — never dispatched whatever the mark says')
  if (t.mark !== '🔵') out.push(`row is ${t.mark}, not 🔵 ready`)
  if (t.state !== 'ready') out.push(`readiness.state is ${t.state || 'unset'}, not ready`)
  if (!loose && !t.by) out.push('readiness has no validator (readiness.by unset) — self-asserted')
  else if (!loose && t.by !== 'tickets-validate') out.push(`readiness.by is ${t.by}, not tickets-validate — only the validator may stamp a ticket ready`)
  else if (!loose && t.by === 'tickets-validate') {
    const ticketPath = resolve(TASKS, 'tickets', t.file)
    let repoRoot
    try {
      repoRoot = execFileSync('git', ['-C', TASKS, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim()
    } catch {
      out.push(UNCONFIRMED_STAMP_REASON)
    }
    if (repoRoot) {
      const relPath = relative(repoRoot, ticketPath)
      const runsPath = process.env.SLOPDOG_VALIDATE_RUNS || DEFAULT_RUNS_PATH
      const stamp = confirmReadinessStamp({
        repoRoot,
        relPath,
        fileText: t.text,
        runsPath,
      })
      if (!stamp.ok) out.push(stamp.reason)
    }
  }
  if (t.state === 'ready' && t.mark !== '🔵' ) out.push('mark and readiness.state disagree')
  const waiting = t.dependsOn.filter((d) => !landed(d))
  if (waiting.length) out.push(`waits on ${waiting.join(', ')}`)

  const hold = holdsData.holds.find((h) => (typeof h === 'string' ? h === t.id : h?.id === t.id))
  if (hold) {
    const reason = (typeof hold === 'object' && hold.reason) ? `: ${hold.reason}` : ''
    out.push(`held in holds.json${reason}`)
  }

  for (const [cPath, ids] of Object.entries(holdsData.contested)) {
    if (Array.isArray(ids) && ids.includes(t.id) && ids[0] !== t.id) {
      out.push(`contested on ${cPath} — not list head (waiting behind ${ids[0]})`)
    }
  }

  for (const hit of pathCollisions(t.pathTokens, inFlight.filter((inf) => inf.id !== t.id))) {
    out.push(`path collision with in-flight ${hit.id} (${hit.token} overlaps ${hit.inToken})`)
  }

  const batchCap = batchCapExcuse(t, { batchesInFlight, tickets, tasksDir: TASKS, listOrder })
  if (batchCap) out.push(batchCap)

  return out
}

if (why) {
  const t = byId.get(why) || byId.get(why.toUpperCase())
  if (!t) { console.log(`${why}: no such ticket`); process.exit(1) }
  const e = excuses(t)
  console.log(`${t.id} — ${t.title}`)
  console.log(e.length ? e.map((x) => `  excluded: ${x}`).join('\n') : '  in the queue')
  process.exit(0)
}

const queue = tickets.filter((t) => excuses(t).length === 0)
  .sort((a, b) => (b.hotfix - a.hotfix) || (a.priority - b.priority) || (a.points - b.points))

if (!queue.length) {
  console.log('queue empty — nothing passes every rule.')
  console.log(`${tickets.filter((t) => t.mark === '🔵' && !t.paused).length} tickets are 🔵 and unpaused; run --why <id> on one to see what stops it, or --loose to include self-asserted ones.`)
  process.exit(0)
}
console.log(`${queue.length} ready to dispatch in ${anyProject ? 'any project' : SPRINT}${loose ? ', loose: validator not required' : ''}, best first:`)
for (const t of queue.slice(0, limit)) {
  console.log(`  ${t.hotfix ? '!' : ' '} ${t.id.padEnd(8)} ${String(t.points).padStart(2)}pt  ${t.title.slice(0, 64)}`)
}
