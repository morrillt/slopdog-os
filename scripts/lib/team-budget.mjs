// team-budget — each department's share of the weekly Claude usage limit (T-678, FR-15).
//
// A department's spend is the weekly usage percentage (`seven_day.used_percentage` in the
// statusline cache) times that department's fraction of the ledger minutes logged in the current
// window. A ledger row belongs to the department its ticket's batch names on its `type:` line;
// rows whose ticket has no batch, or whose batch has no type, count in the total but belong to
// no one. Todd's own work is a share (`todd`) but never a department, so it is never refused.
//
// The shares live in one file, desks/watcher/team-shares.json, which Todd edits by hand.
// Recorded draws on the Friday leftover (T-679, sprints/leftover-*.json) raise a department's
// effective share for the window they were drawn in.

import { existsSync, readdirSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { isHotfix } from './ready-rules.mjs'

const V2 = resolve(import.meta.dirname, '..', '..')
export const DEPARTMENTS = ['slopdog', 'projects', 'it']
export const SHARE_KEYS = [...DEPARTMENTS, 'todd']
// A retired batch type is read as its replacement (A-23), so old batches still attribute.
const RETIRED = { meta: 'slopdog', features: 'projects', influencer: 'projects' }
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

export function defaultPaths() {
  return {
    shares: join(V2, 'desks', 'watcher', 'team-shares.json'),
    ledger: join(V2, 'reports', 'usage', 'ledger.jsonl'),
    usage: join(homedir(), '.local', 'state', 'slopdog', 'usage.json'),
    ticketsDir: join(homedir(), 'slopdog', 'tasks', 'tickets'),
    batchesDir: join(homedir(), 'slopdog', 'tasks', 'batches'),
    state: join(V2, 'desks', 'watcher', 'team-budget-state.json'),
    sprintsDir: join(V2, 'sprints'),
  }
}

/** The fixture folder's files in the same shape, for TEAM_BUDGET_FIXTURE_DIR and tests. */
export function fixturePaths(dir) {
  const d = resolve(dir)
  return {
    shares: join(d, 'shares.json'),
    ledger: join(d, 'ledger.jsonl'),
    usage: join(d, 'usage.json'),
    ticketsDir: join(d, 'tickets'),
    batchesDir: join(d, 'batches'),
    state: join(d, 'state.json'),
    sprintsDir: join(d, 'sprints'),
  }
}

/** Defaults, then the fixture folder if TEAM_BUDGET_FIXTURE_DIR is set, then explicit overrides. */
export function resolvePaths(overrides = {}, env = process.env) {
  const base = env.TEAM_BUDGET_FIXTURE_DIR ? fixturePaths(env.TEAM_BUDGET_FIXTURE_DIR) : defaultPaths()
  const out = { ...base }
  for (const [k, v] of Object.entries(overrides)) if (v != null) out[k] = resolve(v)
  return out
}

export function loadShares(path) {
  const doc = JSON.parse(readFileSync(path, 'utf8'))
  const shares = doc.shares || {}
  const keys = Object.keys(shares)
  const sum = keys.reduce((a, k) => a + Number(shares[k]), 0)
  const missing = SHARE_KEYS.filter((k) => !(k in shares))
  const extra = keys.filter((k) => !SHARE_KEYS.includes(k))
  if (missing.length || extra.length) throw new Error(`team-shares: keys must be exactly ${SHARE_KEYS.join(', ')} (missing: ${missing.join(',') || 'none'}; extra: ${extra.join(',') || 'none'})`)
  if (Math.abs(sum - 100) > 1e-9) throw new Error(`team-shares: shares add to ${sum}, not 100`)
  const warn = doc.warnAtFractionOfShare ?? 0.8
  return { shares, warnAtFractionOfShare: warn, sum }
}

function frontField(text, key) {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return null
  const m = fm[1].match(new RegExp(`^${key}:[ \\t]*["']?([^"'\\n]*?)["']?[ \\t]*$`, 'm'))
  return m ? m[1].trim() || null : null
}

/** id -> {project, batch} for every ticket file in a folder (top level only). */
export function indexTickets(ticketsDir) {
  const out = new Map()
  if (!existsSync(ticketsDir)) return out
  for (const name of readdirSync(ticketsDir)) {
    if (!name.endsWith('.md')) continue
    let text
    try { text = readFileSync(join(ticketsDir, name), 'utf8') } catch { continue }
    const id = frontField(text, 'id')
    if (id) out.set(id, { project: frontField(text, 'project'), batch: frontField(text, 'batch') })
  }
  return out
}

/** A batch file's department: its `type:` line, a retired name read as its replacement. */
export function batchDepartment(batchesDir, project, batch) {
  if (!batch) return null
  const candidates = [project && join(batchesDir, project, `${batch}.md`), join(batchesDir, `${batch}.md`)].filter(Boolean)
  for (const p of candidates) {
    if (!existsSync(p)) continue
    const m = readFileSync(p, 'utf8').match(/^type:[ \t]*["']?([a-z-]+)["']?[ \t]*$/m)
    if (!m) return null
    const t = RETIRED[m[1]] || m[1]
    return DEPARTMENTS.includes(t) ? t : null
  }
  return null
}

/** The department a ticket spends from, given its front matter (project + batch). */
export function departmentOfTicket({ project, batch }, batchesDir) {
  return batchDepartment(batchesDir, project, batch)
}

export function readUsage(usagePath) {
  const u = JSON.parse(readFileSync(usagePath, 'utf8'))
  const sd = u.seven_day || {}
  const resetsAt = typeof sd.resets_at === 'number' ? sd.resets_at * 1000 : Date.parse(sd.resets_at)
  return { pct: Number(sd.used_percentage), resetsAtMs: resetsAt, resetsAtIso: new Date(resetsAt).toISOString() }
}

function rowTime(row) {
  const t = Date.parse(row?.window?.to || row?.generated_at || '')
  return Number.isFinite(t) ? t : null
}

/**
 * Spend per department for the current window: usage pct x (department minutes / all minutes).
 * Returns { pct, resetsAtIso, totalMinutes, minutes: {dept}, unattributedMinutes, spend: {dept} }.
 */
export function spendByDepartment(paths) {
  const usage = readUsage(paths.usage)
  const from = usage.resetsAtMs - WEEK_MS
  const tickets = indexTickets(paths.ticketsDir)
  const deptCache = new Map()
  const minutes = Object.fromEntries(DEPARTMENTS.map((d) => [d, 0]))
  let total = 0
  let unattributed = 0
  const lines = existsSync(paths.ledger) ? readFileSync(paths.ledger, 'utf8').split('\n') : []
  for (const line of lines) {
    if (!line.trim()) continue
    let row
    try { row = JSON.parse(line) } catch { continue }
    const t = rowTime(row)
    if (t == null || t < from || t >= usage.resetsAtMs) continue
    const mins = Number(row.minutes) || 0
    if (mins <= 0) continue
    total += mins
    const id = row.ticket
    if (!deptCache.has(id)) {
      const tk = tickets.get(id)
      deptCache.set(id, tk ? departmentOfTicket(tk, paths.batchesDir) : null)
    }
    const dept = deptCache.get(id)
    if (dept) minutes[dept] += mins
    else unattributed += mins
  }
  const round = (n) => Math.round(n * 10) / 10
  const spend = Object.fromEntries(DEPARTMENTS.map((d) => [d, total > 0 ? round((usage.pct * minutes[d]) / total) : 0]))
  return { pct: usage.pct, resetsAtIso: usage.resetsAtIso, totalMinutes: round(total), minutes, unattributedMinutes: round(unattributed), spend }
}

/** Sum of recorded draws per department on leftover files for this window (T-679). */
export function drawsFor(sprintsDir, resetsAtIso) {
  const out = Object.fromEntries(DEPARTMENTS.map((d) => [d, 0]))
  if (!sprintsDir || !existsSync(sprintsDir)) return out
  for (const name of readdirSync(sprintsDir)) {
    if (!/^leftover-\d{4}-\d\d-\d\d\.json$/.test(name)) continue
    let doc
    try { doc = JSON.parse(readFileSync(join(sprintsDir, name), 'utf8')) } catch { continue }
    if (doc.window_resets_at !== resetsAtIso || !doc.authorised) continue
    for (const d of doc.draws || []) if (d.team in out) out[d.team] += Number(d.pct) || 0
  }
  return out
}

/** ok below the warn line, warn between it and the share, refused at or over the share. */
export function checkDepartment(department, { shares, warnAtFractionOfShare }, spendInfo, draws = {}) {
  if (department === 'todd') return { department, status: 'ok', spend: null, share: shares.todd, reason: 'todd is never refused' }
  if (!DEPARTMENTS.includes(department)) throw new Error(`unknown department '${department}' (one of ${SHARE_KEYS.join(', ')})`)
  const share = Number(shares[department]) + (Number(draws[department]) || 0)
  const spend = spendInfo.spend[department]
  let status = 'ok'
  if (spend >= share) status = 'refused'
  else if (spend >= share * warnAtFractionOfShare) status = 'warn'
  return { department, status, spend, share }
}

export function refusalLines(r) {
  return [`team-budget: refused ${r.department}`, `refused: ${r.department} has spent its ${r.share}% share (${r.spend}% of the week so far)`]
}

/** Everything a check needs, read once. */
export function budgetSnapshot(paths) {
  const sharesDoc = loadShares(paths.shares)
  const spendInfo = spendByDepartment(paths)
  const draws = drawsFor(paths.sprintsDir, spendInfo.resetsAtIso)
  return { sharesDoc, spendInfo, draws }
}

/**
 * dispatch.mjs's refusal: null when the ticket may run, else { department, share, spend, lines }.
 * A ticket with no attributable department is never refused, nor is a `hotfix: true` ticket:
 * rules/delegation.md exempts hotfixes from everything but SPRINT-STOP. Any read error is not a refusal:
 * the budget is advisory until its inputs exist, and dispatch must not die on a missing cache.
 */
export function dispatchBudgetRefusal({ ticketText, paths = resolvePaths() }) {
  try {
    if (isHotfix(ticketText)) return null
    const project = frontField(ticketText, 'project')
    const batch = frontField(ticketText, 'batch')
    const department = departmentOfTicket({ project, batch }, paths.batchesDir)
    if (!department) return null
    const { sharesDoc, spendInfo, draws } = budgetSnapshot(paths)
    const r = checkDepartment(department, sharesDoc, spendInfo, draws)
    if (r.status !== 'refused') return null
    return { ...r, lines: refusalLines(r) }
  } catch {
    return null
  }
}

/**
 * The Watcher's sweep: one warning per department per window into the dispatcher's inbox.
 * `send(slug, text)` delivers it; the state file remembers what was sent for which window.
 * Returns { lines, sent: [dept] } where lines are the log lines to print.
 */
export function sweep({ paths, send, dryRun = false }) {
  const { sharesDoc, spendInfo, draws } = budgetSnapshot(paths)
  let state = {}
  try { state = JSON.parse(readFileSync(paths.state, 'utf8')) } catch { /* first sweep */ }
  if (state.window !== spendInfo.resetsAtIso) state = { window: spendInfo.resetsAtIso, warned: {} }
  const lines = []
  const sent = []
  for (const d of DEPARTMENTS) {
    const r = checkDepartment(d, sharesDoc, spendInfo, draws)
    if (r.status === 'ok' || state.warned[d]) continue
    lines.push(`team-budget: warn ${d} ${r.spend}/${r.share}`)
    const text = r.status === 'refused'
      ? `The ${d} department has spent its share of this week's usage: ${r.spend}% of the week against a share of ${r.share}%. dispatch.mjs refuses its tickets (hotfix ones aside) until the window resets on ${spendInfo.resetsAtIso} or Todd authorises a draw on the Friday leftover. The shares are in desks/watcher/team-shares.json.`
      : `The ${d} department is near its share of this week's usage: ${r.spend}% of the week against a share of ${r.share}%. At ${r.share}% dispatch.mjs refuses its tickets (hotfix ones aside) until the window resets on ${spendInfo.resetsAtIso}. The shares are in desks/watcher/team-shares.json.`
    if (!dryRun) {
      send(`team-budget-${d}`, text)
      state.warned[d] = r.status
    }
    sent.push(d)
  }
  if (!dryRun) {
    mkdirSync(dirname(paths.state), { recursive: true })
    writeFileSync(paths.state, JSON.stringify(state, null, 2) + '\n')
  }
  const summary = `BUDGET ${DEPARTMENTS.map((d) => `${d}=${spendInfo.spend[d]}/${Number(sharesDoc.shares[d]) + draws[d]}`).join(' ')} unattributed=${spendInfo.unattributedMinutes}m/${spendInfo.totalMinutes}m`
  return { lines, sent, summary }
}
