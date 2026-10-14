#!/usr/bin/env node
// build-ladder — the one reader of v2/config/build-ladder.json (T-714; values T-715).
// Who builds, who verifies by points, how many strikes escalate, and where to. No other
// script keeps a copy of these values; check-build-ladder.mjs enforces that.
// BUILD_LADDER_PATH points a test at a fixture copy.
import { realpathSync as __rp } from 'node:fs'
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

export const DEFAULT_LADDER_PATH = join(dirname(dirname(dirname(fileURLToPath(import.meta.url)))), 'config', 'build-ladder.json')

export class BuildLadderError extends Error {
  constructor(msg) { super(`build-ladder: ${msg}`); this.name = 'BuildLadderError' }
}

export function ladderPath() {
  return process.env.BUILD_LADDER_PATH || DEFAULT_LADDER_PATH
}

function need(cond, msg) { if (!cond) throw new BuildLadderError(msg) }
/** The four Claude subagent tiers, cheapest first (Todd, 2026-10-13). sweep is Haiku for narrow many-item sweeps. */
export const SUBAGENT_TIERS = ['sweep', 'default', 'hard', 'ceiling']
const isRung = (r) => r && typeof r === 'object' && typeof r.engine === 'string' && typeof r.model === 'string'

export function validateLadder(c) {
  need(c && typeof c === 'object', 'config is not an object')
  need(isRung(c.builder), 'builder needs engine and model')
  need(c.verifiers_by_points && typeof c.verifiers_by_points === 'object', 'verifiers_by_points missing')
  const pts = Object.keys(c.verifiers_by_points)
  need(pts.length > 0, 'verifiers_by_points is empty')
  for (const p of pts) {
    const v = c.verifiers_by_points[p]
    need(/^\d+$/.test(p), `verifiers_by_points key ${p} is not a number`)
    need(v === 'escalate' || isRung(v), `verifiers_by_points.${p} needs engine and model, or "escalate"`)
  }
  need(c.builders_by_points === undefined || (c.builders_by_points && typeof c.builders_by_points === 'object' && Object.keys(c.builders_by_points).length > 0), 'builders_by_points must be a non-empty object when present')
  for (const p of Object.keys(c.builders_by_points || {})) {
    need(/^\d+$/.test(p), `builders_by_points key ${p} is not a number`)
    need(isRung(c.builders_by_points[p]) && typeof c.builders_by_points[p].effort === 'string', `builders_by_points.${p} needs engine, model and effort`)
  }
  need(c.subagent_tiers && typeof c.subagent_tiers === 'object', 'subagent_tiers missing')
  for (const t of SUBAGENT_TIERS) {
    const r = c.subagent_tiers[t]
    need(isRung(r) && typeof r.effort === 'string', `subagent_tiers.${t} needs engine, model and effort`)
  }
  for (const t of Object.keys(c.subagent_tiers)) need(SUBAGENT_TIERS.includes(t), `subagent_tiers.${t} is not a tier (sweep, default, hard, ceiling)`)
  need(Number.isInteger(c.escalate_after_failures) && c.escalate_after_failures > 0, 'escalate_after_failures must be a positive integer')
  need(c.escalate_above_steps === undefined || (Number.isInteger(c.escalate_above_steps) && c.escalate_above_steps > 0), 'escalate_above_steps must be a positive integer')
  need(c.escalate_from_points === undefined || (Number.isInteger(c.escalate_from_points) && c.escalate_from_points > 0), 'escalate_from_points must be a positive integer')
  need(Array.isArray(c.strike_categories) && c.strike_categories.length > 0, 'strike_categories missing')
  need(isRung(c.escalation), 'escalation needs engine and model')
  need(Array.isArray(c.escalation.steps) && c.escalation.steps.length > 0, 'escalation.steps missing')
  need(typeof c.escalation.independent_verify === 'boolean', 'escalation.independent_verify must be true or false')
  need(Array.isArray(c.disabled_engines), 'disabled_engines must be a list')
  need(!c.disabled_engines.includes(c.builder.engine), `builder engine ${c.builder.engine} is disabled`)
  need(c.engine_models && typeof c.engine_models === 'object', 'engine_models missing')
  need(c.quota_chains && Array.isArray(c.quota_chains.build) && Array.isArray(c.quota_chains.verify), 'quota_chains.build and .verify must be lists')
  for (const role of ['build', 'verify']) {
    for (const key of c.quota_chains[role]) {
      const model = key.split(':').slice(1).join(':')
      need(!c.disabled_engines.some((d) => model === d || key === d), `quota_chains.${role} names disabled engine ${key}`)
    }
  }
  return c
}

const cache = new Map()
export function loadLadder(path = ladderPath()) {
  if (!cache.has(path)) {
    let raw
    try { raw = JSON.parse(readFileSync(path, 'utf8')) } catch (e) { throw new BuildLadderError(`cannot read ${path}: ${e.message}`) }
    cache.set(path, validateLadder(raw))
  }
  return cache.get(path)
}

export function ticketPoints(ticketText) {
  const m = String(ticketText || '').match(/^estimate:\s*\n(?:[ \t]+[^\n]*\n)*?[ \t]+points:\s*(\d+)/m)
  return m ? Number(m[1]) : null
}

export function modelFor(engine, c = loadLadder()) {
  const e = String(engine || '')
  if (e === c.builder.engine) return c.builder.model
  return c.engine_models[e] ?? c.engine_models[e.replace(/^ideas-/, '')] ?? null
}

/** A rung's display label, e.g. "sonnet-medium". */
export function rungLabel(r) {
  if (r === 'escalate') return 'escalate'
  return r.effort ? `${r.model}-${r.effort}` : r.model
}

/** Verifier for a points value: exact key, else the next listed value up, else the largest. Unknown points take the smallest. */
export function verifierFor(points, c = loadLadder()) {
  const keys = Object.keys(c.verifiers_by_points).map(Number).sort((a, b) => a - b)
  const p = Number(points)
  const k = Number.isFinite(p) && p > 0 ? (keys.find((x) => x >= p) ?? keys[keys.length - 1]) : keys[0]
  return c.verifiers_by_points[String(k)]
}

/** The Claude subagent rung a tier names: `{ engine, model, effort }`. An unknown, blank or numeric
 *  tier takes `default`, where an unsure call lands (Todd, 2026-10-13: points no longer choose a
 *  subagent's model; tickets' builders still read builders_by_points). */
export function subagentTier(tier, c = loadLadder()) {
  const t = String(tier ?? '').trim().toLowerCase()
  return c.subagent_tiers[SUBAGENT_TIERS.includes(t) ? t : 'default']
}

/** The builder rung for a points value: exact key, else the next listed value up, else the largest;
 *  unknown points take the smallest. With no builders_by_points the single `builder` stands. */
export function builderRungFor(points, c = loadLadder()) {
  if (!c.builders_by_points) return c.builder
  const keys = Object.keys(c.builders_by_points).map(Number).sort((a, b) => a - b)
  const p = Number(points)
  const k = Number.isFinite(p) && p > 0 ? (keys.find((x) => x >= p) ?? keys[keys.length - 1]) : keys[0]
  return c.builders_by_points[String(k)]
}

export function shouldEscalate(failCount, c = loadLadder()) {
  return Number(failCount) >= c.escalate_after_failures
}

export function escalationTarget(c = loadLadder()) {
  return c.escalation
}

export function isEngineDisabled(engine, c = loadLadder()) {
  const e = String(engine || '').replace(/^ideas-/, '')
  return c.disabled_engines.includes(e)
}

function progressNotesBody(text) {
  const lines = String(text || '').split('\n')
  const start = lines.findIndex((l) => l === '## Progress notes')
  if (start === -1) return ''
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) if (/^## /.test(lines[i])) { end = i; break }
  return lines.slice(start + 1, end).join('\n')
}

/** Strikes: a categorised `verify failed [cat]` note after any builder's `started` note
 *  (one per start), with cat in strike_categories. Rounds by the escalation signer do not count.
 *  T-742: a `strike voided: <reason>` note takes back the latest strike still standing, for a RED the
 *  ticket's own cut caused; a void with no reason, or with no strike to void, changes nothing. */
export function countStrikes(ticketText, c = loadLadder()) {
  const NOTE = /^- \d{4}-\d{2}-\d{2} \d{2}:\d{2}\s*·\s*([^·]+)\s*·\s*(.*)$/
  const cats = c.strike_categories.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const STRIKE = new RegExp(`^verify failed \\[(${cats})\\]`, 'i')
  const signer = String(c.escalation.signer || '').toLowerCase()
  let n = 0
  let awaiting = false
  for (const line of progressNotesBody(ticketText).split('\n')) {
    const m = line.match(NOTE)
    if (!m) continue
    const author = m[1].trim().toLowerCase()
    const text = m[2].trim()
    if (/^started\.?$/i.test(text)) awaiting = author !== signer
    else if (awaiting && /verify failed/i.test(text)) {
      if (STRIKE.test(text)) n++
      awaiting = false
    } else if (n > 0 && /^strike voided:\s*\S/i.test(text)) n--
  }
  return n
}

/** Unticked `- [ ]` items under the ticket's `## Steps`. */
export function openSteps(ticketText) {
  const part = String(ticketText || '').split(/^## Steps\s*$/m)[1]
  if (!part) return 0
  return (part.split(/^## /m)[0].match(/^-\s*\[ \]/gm) || []).length
}

/** The rung that builds this ticket now: the escalation target when the ticket has escalate_from_points
 *  or more (Todd, T-715 q3: 8 points go straight to Opus), or more than escalate_above_steps open steps
 *  (off when the ladder has no such key; Todd, 2026-10-12), else after enough strikes;
 *  otherwise the builder for the ticket's points (builders_by_points, else the one `builder`). */
export function builderFor(ticketText, c = loadLadder()) {
  const strikes = countStrikes(ticketText, c)
  const points = ticketPoints(ticketText)
  if (c.escalate_from_points !== undefined && points != null && points >= c.escalate_from_points) return { ...c.escalation, rung: 'escalation', strikes, reason: 'points' }
  if (c.escalate_above_steps !== undefined && openSteps(ticketText) > c.escalate_above_steps) return { ...c.escalation, rung: 'escalation', strikes, reason: 'steps' }
  if (shouldEscalate(strikes, c)) return { ...c.escalation, rung: 'escalation', strikes, reason: 'strikes' }
  return { ...builderRungFor(points, c), rung: 'builder', strikes }
}

if (process.argv[1] && __rp(process.argv[1]) === __rp(fileURLToPath(import.meta.url))) {
  const c = loadLadder()
  // `--subagent [tier]` is how /slopdog:spawn-subagent reads the rung for the tier it picked: one line,
  // "<model> <effort>". No tier is default. A number is default too, with a stderr note: points no longer choose a model.
  if (process.argv[2] === '--subagent') {
    const arg = process.argv[3]
    if (arg !== undefined && /^\d+$/.test(String(arg).trim())) console.error(`build-ladder: points no longer choose a subagent model; printing the default tier. Pick sweep, default, hard or ceiling from v2/config/subagent-tiers.md.`)
    const r = subagentTier(arg, c)
    console.log(`${r.model} ${r.effort}`)
    process.exit(0)
  }
  console.log(`builder (no ticket): ${c.builder.engine} ${c.builder.model}`)
  for (const p of Object.keys(c.builders_by_points || {})) console.log(`builder ${p} points: ${c.builders_by_points[p].engine} ${rungLabel(c.builders_by_points[p])}`)
  for (const p of Object.keys(c.verifiers_by_points)) console.log(`verifier ${p} points: ${rungLabel(c.verifiers_by_points[p])}`)
  for (const t of SUBAGENT_TIERS) console.log(`subagent ${t}: ${rungLabel(c.subagent_tiers[t])}`)
  console.log(`escalate after ${c.escalate_after_failures} strikes (${c.strike_categories.join(', ')}) to ${rungLabel(c.escalation)} ${c.escalation.mode} on ${c.escalation.lane}; independent_verify ${c.escalation.independent_verify}`)
  console.log(c.escalate_above_steps !== undefined ? `escalate above ${c.escalate_above_steps} open steps straight to ${rungLabel(c.escalation)} ${c.escalation.mode}` : 'escalate on open-step count: off')
  console.log(`escalate from ${c.escalate_from_points} points straight to ${rungLabel(c.escalation)} ${c.escalation.mode} (points rule first, then strikes)`)
  console.log(`disabled: ${c.disabled_engines.join(', ') || 'none'}`)
}
