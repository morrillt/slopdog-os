// Pure helpers for the desk goal pane time/turns chip (T-480). Imported by goal.mjs only via this module in tests.
import { maxTurnsForEstimate } from './turn-budget.mjs'

const GREEN = '\x1b[38;2;166;227;161m'
const YELLOW = '\x1b[38;2;249;226;175m'
const RED = '\x1b[38;2;243;139;168m'
const RESET = '\x1b[0m'

const COLOR = { green: GREEN, yellow: YELLOW, red: RED }

export function stripAnsi(s) {
  return String(s).replace(/\x1b\[[0-9;]*m/g, '')
}

export function formatElapsed(ms) {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const secs = Math.max(0, ms / 1000)
  if (secs < 90) return `${Math.round(secs)}s`
  if (secs < 5400) return `${Math.round(secs / 60)}m`
  if (secs < 86400) return `${(secs / 3600).toFixed(1)}h`
  return `${Math.round(secs / 86400)}d`
}

export function startedMsFromFront(front) {
  const raw = front?.started
  if (raw == null || raw === '') return null
  const ts = Date.parse(String(raw).replace(/^['"]|['"]$/g, ''))
  return Number.isNaN(ts) ? null : ts
}

export function turnBudgetColor(turns, maxTurns) {
  const t = Number(turns)
  const max = Number(maxTurns)
  if (!Number.isFinite(t) || !Number.isFinite(max) || max <= 0) return 'green'
  if (t > max) return 'red'
  if (t / max >= 0.8) return 'yellow'
  return 'green'
}

export function isClaudeWorkerLane(laneKey, lanesData) {
  if (!laneKey || !lanesData || typeof lanesData !== 'object') return false
  const row = lanesData[laneKey]
  if (!row || typeof row !== 'object') return false
  const engine = row.engine
  if (!engine) return true
  return engine === 'claude'
}

export function formatTimeTurnsChip({ elapsedMs, turns, maxTurns, showTurns }) {
  const elapsed = formatElapsed(elapsedMs)
  let body = `⏱ ${elapsed}`
  if (showTurns && maxTurns != null) {
    const color = COLOR[turnBudgetColor(turns ?? 0, maxTurns)]
    body += ` · ${color}${turns ?? 0}/${maxTurns}${RESET}`
  }
  return body
}

export function ticketTimeTurnsChip(ticketText, front, lanesData, nowMs = Date.now(), statusMark = null) {
  if (statusMark !== '🟡') return ''
  const start = startedMsFromFront(front)
  if (start === null) return ''
  const points = front?.estimate?.points ?? (typeof front?.estimate === 'number' ? front.estimate : null)
  const maxTurns = maxTurnsForEstimate(points)
  const worker = typeof front?.worker === 'string' ? front.worker : ''
  const showTurns = isClaudeWorkerLane(worker, lanesData) && maxTurns != null
  const chip = formatTimeTurnsChip({
    elapsedMs: nowMs - start,
    turns: front?.turns ?? 0,
    maxTurns,
    showTurns,
  })
  return chip ? ` ${chip}` : ''
}
