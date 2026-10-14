#!/usr/bin/env node
// sprint-record — a department's sprint record, the Friday leftover, and Todd's authorisation
// to draw on it (T-679, FR-16). Builds on team-budget (T-678): the shares and the spend come
// from lib/team-budget.mjs.
//
//   sprint-record.mjs write --team <department> --tickets T-1,T-2
//       writes sprints/<YYYY-MM-DD>-<department>.md: team, share_pct, window_resets_at, tickets.
//       Exit 2 for an unknown department, for todd, or for an empty ticket list.
//   sprint-record.mjs leftover
//       Friday before noon America/New_York only (exit 2 otherwise). Writes
//       sprints/leftover-<YYYY-MM-DD>.json: each department's share minus spend, floored at zero,
//       added up, with authorised: null and draws: []. A rerun keeps a recorded authorisation and draws.
//   sprint-record.mjs authorise --by todd --note "<why>"
//       records Todd's authorisation on the latest leftover file. Only --by todd is accepted:
//       a desk runs this on Todd's word and says so in the note.
//   sprint-record.mjs draw <department> --pct <n>
//       exit 3 with no authorisation recorded; exit 3 naming the remainder when n is more than is
//       left; otherwise appends {team, pct, at} to draws. team-budget's check then adds it to
//       that department's share for the window.
//
// Overrides: --dir (the sprints folder) --shares --ledger --usage --tickets-dir --batches-dir
// --now <ISO>; TEAM_BUDGET_FIXTURE_DIR points the team-budget inputs at a fixture folder.

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { DEPARTMENTS, loadShares, readUsage, resolvePaths, spendByDepartment } from './lib/team-budget.mjs'

const argv = process.argv.slice(2)
const opt = (f) => { const i = argv.indexOf(f); return i > -1 ? argv[i + 1] : null }
const die = (m, code = 2) => { console.error(m.startsWith('sprint-record:') ? m : `sprint-record: ${m}`); process.exit(code) }

const paths = resolvePaths({
  shares: opt('--shares'), ledger: opt('--ledger'), usage: opt('--usage'),
  ticketsDir: opt('--tickets-dir'), batchesDir: opt('--batches-dir'),
})
const dir = resolve(opt('--dir') || paths.sprintsDir)
const now = opt('--now') ? new Date(opt('--now')) : new Date()
if (Number.isNaN(now.getTime())) die(`bad --now ${opt('--now')}`)

/** Date, weekday and hour in America/New_York, where the planning rhythm is kept. */
function newYork(d) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short', hour: '2-digit', hourCycle: 'h23',
  }).formatToParts(d).map((p) => [p.type, p.value]))
  return { date: `${parts.year}-${parts.month}-${parts.day}`, weekday: parts.weekday, hour: Number(parts.hour) }
}

const ny = newYork(now)
const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'))
const writeJson = (p, o) => writeFileSync(p, JSON.stringify(o, null, 2) + '\n')

function latestLeftover() {
  if (!existsSync(dir)) return null
  const files = readdirSync(dir).filter((n) => /^leftover-\d{4}-\d\d-\d\d\.json$/.test(n)).sort()
  return files.length ? join(dir, files[files.length - 1]) : null
}

function windowResetsAt() {
  try { return readUsage(paths.usage).resetsAtIso } catch { return null }
}

const cmd = argv[0]

if (cmd === 'write') {
  const team = opt('--team') || die('need --team <department>')
  if (team === 'todd') die("todd is a share, not a department: there is no sprint record for Todd's own work")
  if (!DEPARTMENTS.includes(team)) die(`unknown department '${team}' (one of ${DEPARTMENTS.join(', ')})`)
  const tickets = (opt('--tickets') || '').split(',').map((t) => t.trim()).filter(Boolean)
  if (!tickets.length) die('need --tickets T-1,T-2: a sprint record names the tickets it took')
  let shares
  try { shares = loadShares(paths.shares) } catch (e) { die(e.message) }
  const share = shares.shares[team]
  const resets = windowResetsAt()
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `${ny.date}-${team}.md`)
  const body = [
    '---',
    `team: ${team}`,
    `share_pct: ${share}`,
    `window_resets_at: ${resets ?? 'null'}`,
    'tickets:',
    ...tickets.map((t) => `  - ${t}`),
    `written: ${now.toISOString()}`,
    '---',
    '',
    `# ${team} sprint, planned ${ny.date}`,
    '',
    `The ${team} department plans against ${share}% of the week's usage limit${resets ? `, in the window that resets ${resets}` : ''}.`,
    `It took ${tickets.length} ticket${tickets.length === 1 ? '' : 's'}: ${tickets.join(', ')}.`,
    'The share comes from v2/desks/watcher/team-shares.json; a draw on the Friday leftover, once Todd authorises it, raises it for this window.',
    '',
  ].join('\n')
  writeFileSync(file, body)
  console.log(`sprint-record: wrote ${file}`)
  process.exit(0)
}

if (cmd === 'leftover') {
  if (!(ny.weekday === 'Fri' && ny.hour < 12)) die(`leftover is computed on Friday morning (America/New_York); it is ${ny.weekday} ${ny.date} ${ny.hour}:00 there`)
  let shares, spend
  try { shares = loadShares(paths.shares); spend = spendByDepartment(paths) } catch (e) { die(e.message) }
  const byDepartment = Object.fromEntries(DEPARTMENTS.map((d) => [d, Math.max(0, Math.round((shares.shares[d] - spend.spend[d]) * 10) / 10)]))
  const leftover = Math.round(Object.values(byDepartment).reduce((a, b) => a + b, 0) * 10) / 10
  mkdirSync(dir, { recursive: true })
  const file = join(dir, `leftover-${ny.date}.json`)
  const prior = existsSync(file) ? readJson(file) : null
  const doc = {
    date: ny.date,
    computed_at: now.toISOString(),
    window_resets_at: spend.resetsAtIso,
    weekly_used_pct: spend.pct,
    leftover_pct: leftover,
    by_department: byDepartment,
    authorised: prior?.authorised ?? null,
    draws: prior?.draws ?? [],
  }
  writeJson(file, doc)
  console.log(`sprint-record: leftover ${leftover} (${DEPARTMENTS.map((d) => `${d} ${byDepartment[d]}`).join(', ')}) in ${file}`)
  process.exit(0)
}

if (cmd === 'authorise' || cmd === 'authorize') {
  const by = opt('--by')
  if (by !== 'todd') die('only Todd authorises a draw: pass --by todd, and run it only on his word')
  const note = opt('--note') || die('need --note "<why>": the authorisation records his reason')
  const file = latestLeftover() || die(`no leftover file in ${dir}; run leftover on Friday morning first`)
  const doc = readJson(file)
  doc.authorised = { by, at: now.toISOString(), note }
  writeJson(file, doc)
  console.log(`sprint-record: authorised by todd in ${file}: ${note}`)
  process.exit(0)
}

if (cmd === 'draw') {
  const team = argv[1]
  if (!team || !DEPARTMENTS.includes(team)) die(`draw needs a department (one of ${DEPARTMENTS.join(', ')})`)
  const pct = Number(opt('--pct'))
  if (!(pct > 0)) die('need --pct <n> greater than zero')
  const file = latestLeftover()
  const doc = file ? readJson(file) : null
  if (!doc?.authorised) {
    console.error('sprint-record: refused no authorisation')
    die('no authorisation recorded: Todd authorises a draw with sprint-record.mjs authorise --by todd --note "<why>"', 3)
  }
  const leftoverPct = Number(doc.leftover_pct)
  if (doc.leftover_pct == null || !Number.isFinite(leftoverPct)) die(`refused: ${file} has no numeric leftover_pct; rerun leftover on Friday morning`, 3)
  const drawn = (doc.draws || []).reduce((a, d) => a + (Number.isFinite(Number(d.pct)) ? Number(d.pct) : 0), 0)
  const remaining = Math.round((leftoverPct - drawn) * 10) / 10
  if (pct > remaining) die(`refused: ${team} asked for ${pct} but only ${remaining} of the leftover remains`, 3)
  doc.draws = [...(doc.draws || []), { team, pct, at: now.toISOString() }]
  writeJson(file, doc)
  console.log(`sprint-record: draw ${team} ${pct} remaining ${Math.round((remaining - pct) * 10) / 10}`)
  process.exit(0)
}

die('usage: sprint-record.mjs write --team <department> --tickets <ids> | leftover | authorise --by todd --note "<why>" | draw <department> --pct <n>')
