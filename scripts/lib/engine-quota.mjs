// T-695 / T-710: quota is keyed by provider:model so one exhausted model does not block siblings.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { loadLadder, modelFor } from './build-ladder.mjs'

export const QUOTA_WINDOW_MS = 6 * 3600 * 1000
export const quotaStatePath = () => process.env.DISPATCH_QUOTA_STATE_PATH || join(homedir(), 'slopdog', 'v2', 'state', 'engine-quota.json')

const LEGACY_ENGINE_KEY = {
  gemini: 'agy:gemini',
  agy: 'agy:gemini',
  composer: 'cursor:composer',
  grok: 'cursor:grok-4.7',
  'ideas-composer': 'cursor:composer',
  'ideas-grok': 'cursor:grok-4.7',
  openrouter: 'openrouter:openrouter',
  'ideas-openrouter': 'openrouter:openrouter',
  'cursor-gemini': 'cursor:gemini-3.8-flash',
  'sonnet-cursor': 'cursor:claude-sonnet-5',
}

const readRaw = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return {} } }

function canonicalModel(provider, engine, model) {
  const m = String(model || '').trim()
  const e = String(engine || '').trim()
  if (provider === 'cursor') {
    if (m.startsWith('composer') || e === 'composer' || e === 'ideas-composer') return 'composer'
    if (m.includes('grok') || e === 'grok' || e === 'ideas-grok') return 'grok-4.7'
    if (m.includes('gemini') || e === 'cursor-gemini') return 'gemini-3.8-flash'
    if (m.includes('claude') || e === 'sonnet-cursor') return 'claude-sonnet-5'
    if (m) return m
    return e
  }
  if (provider === 'agy') return 'gemini'
  if (provider === 'openrouter') return m || 'openrouter'
  if (provider === 'anthropic') return m || 'opus'
  return m || e
}

export function providerForEngine(engine) {
  const e = String(engine || '').toLowerCase()
  if (['composer', 'grok', 'ideas-composer', 'ideas-grok', 'sonnet-cursor', 'cursor-gemini'].includes(e)) return 'cursor'
  if (e === 'gemini' || e === 'agy' || e === 'gemma') return 'agy'
  if (e === 'openrouter' || e === 'ideas-openrouter') return 'openrouter'
  if (e === 'kimi') return 'kimi'
  if (e === 'claude') return 'anthropic'   // the Claude Code builder shares the verifier's anthropic:<model> key
  return e
}

export function quotaKey(engine, model) {
  const provider = providerForEngine(engine)
  const canon = canonicalModel(provider, engine, model)
  return `${provider}:${canon}`
}

function normalizeEntry(entry, key) {
  const e = entry && typeof entry === 'object' ? { ...entry } : {}
  if (!e.key) e.key = key
  if (!e.time) e.time = new Date().toISOString()
  return e
}

function normalizeState(raw) {
  const out = {}
  for (const [k, v] of Object.entries(raw || {})) {
    if (k.includes(':')) {
      out[k] = normalizeEntry(v, k)
      continue
    }
    const mapped = LEGACY_ENGINE_KEY[k] || null
    const key = mapped || k
    if (!out[key]) out[key] = normalizeEntry(v, key)
  }
  return out
}

const read = (p) => normalizeState(readRaw(p))

export function parseResetFromReason(reason) {
  const m = String(reason || '').match(/Resets in (\d+)h(\d+)m(\d+)s/i)
  if (!m) return null
  const ms = (Number(m[1]) * 3600 + Number(m[2]) * 60 + Number(m[3])) * 1000
  return new Date(Date.now() + ms).toISOString()
}

export function recordQuota({ statePath = quotaStatePath(), engine, model, reason }) {
  const key = quotaKey(engine, model)
  const state = read(statePath)
  const resetAt = parseResetFromReason(reason)
  state[key] = {
    key,
    provider: key.split(':')[0],
    model: key.split(':').slice(1).join(':'),
    engine,
    time: new Date().toISOString(),
    resetAt,
    reason: String(reason || '').slice(0, 400),
  }
  mkdirSync(dirname(statePath), { recursive: true })
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n')
}

export function quotaOut(key, { statePath = quotaStatePath(), now = Date.now() } = {}) {
  const e = read(statePath)[key]
  if (!e) return false
  const until = e.resetAt ? Date.parse(e.resetAt) : Date.parse(e.time) + QUOTA_WINDOW_MS
  return now < until
}

export function exhaustedKeys({ statePath = quotaStatePath(), now = Date.now() } = {}) {
  const state = read(statePath)
  return Object.keys(state).filter((k) => quotaOut(k, { statePath, now }))
}

export function listQuotaEntries(statePath = quotaStatePath(), now = Date.now()) {
  const state = read(statePath)
  return Object.keys(state).sort().map((key) => {
    const e = state[key]
    const out = quotaOut(key, { statePath, now })
    const until = e.resetAt ? e.resetAt : new Date(Date.parse(e.time) + QUOTA_WINDOW_MS).toISOString()
    return { key, status: out ? 'exhausted' : 'available', resetAt: until, entry: e }
  })
}

export function keyToRun(key) {
  const [provider, ...rest] = key.split(':')
  const modelPart = rest.join(':')
  if (provider === 'cursor') {
    if (modelPart === 'composer') return { engine: 'composer', model: process.env.DISPATCH_COMPOSER_MODEL || modelFor('composer') }
    if (modelPart === 'grok-4.7') return { engine: 'grok', model: modelFor('grok') }
    if (modelPart === 'gemini-3.8-flash') return { engine: 'cursor-gemini', model: modelFor('cursor-gemini') }
    if (modelPart === 'claude-sonnet-5') return { engine: 'sonnet-cursor', model: modelFor('sonnet-cursor') }
    // T-714: an unknown Cursor model never falls back to a disabled engine; it goes to the ladder's builder.
    const { builder } = loadLadder()
    return { engine: builder.engine, model: builder.model }
  }
  if (provider === 'agy') return { engine: 'agy', model: modelFor('agy') }
  if (provider === 'openrouter') return { engine: 'openrouter', model: modelPart }
  return { engine: provider, model: modelPart }
}

// T-714: the fall-over chains live in v2/config/build-ladder.json (quota_chains); a disabled
// engine (Composer) is never in them.
function policyChain(role) {
  const r = String(role || process.env.DISPATCH_QUOTA_ROLE || 'build').toLowerCase()
  const chains = loadLadder().quota_chains
  return r === 'verify' ? chains.verify : chains.build
}

// Returns the engine/model to use and hops for Progress notes.
export function routeAroundQuota(engine, model, opts = {}) {
  const statePath = opts.statePath || quotaStatePath()
  const role = opts.role || process.env.DISPATCH_QUOTA_ROLE || 'build'
  const startKey = quotaKey(engine, model)
  const chain = policyChain(role, startKey)
  const tryKeys = chain.includes(startKey) ? chain.slice(chain.indexOf(startKey)) : [startKey, ...chain]
  const hops = []
  let picked = null
  for (let i = 0; i < tryKeys.length; i++) {
    const key = tryKeys[i]
    if (!quotaOut(key, { statePath, now: opts.now })) {
      picked = key
      break
    }
    const nextKey = tryKeys[i + 1]
    if (nextKey) {
      const fromRun = keyToRun(key)
      const toRun = keyToRun(nextKey)
      console.error(`dispatch: ${key} out of quota, using ${nextKey}`)
      hops.push({ from: fromRun.engine, to: toRun.engine, fromKey: key, toKey: nextKey })
    }
  }
  const finalKey = picked || tryKeys[tryKeys.length - 1]
  // No hop happened: keep the caller's engine and model. keyToRun maps a key back to a
  // canonical engine, which would collapse ideas-composer/ideas-grok into composer/grok.
  if (finalKey === startKey) return { engine, model, hops, startKey }
  const run = keyToRun(finalKey)
  return { engine: run.engine, model: run.model, hops, startKey }
}

export const QUOTA_RE = /\b429\b|\brate[ _]limit|\bquota exceeded\b|\bresource[ _]exhausted\b|\busage limit\b/i
export function quotaLine(stderr) {
  const line = String(stderr || '').split('\n').find((l) => QUOTA_RE.test(l))
  return line === undefined ? null : line.trim()
}

export function killTree(pid, signal = 'SIGKILL') {
  const ps = spawnSync('ps', ['-A', '-o', 'pid=,ppid='], { encoding: 'utf8' })
  const kids = new Map()
  for (const row of (ps.stdout || '').split('\n')) {
    const [p, pp] = row.trim().split(/\s+/).map(Number)
    if (p && pp) kids.set(pp, [...(kids.get(pp) || []), p])
  }
  const all = []; const walk = (p) => { all.push(p); for (const c of kids.get(p) || []) walk(c) }
  walk(pid)
  for (const p of all.reverse()) { try { process.kill(p, signal) } catch { /* already gone */ } }
}

export function appendRerouteNotes(ticketPath, hops, now = new Date()) {
  if (!ticketPath || !hops.length || !existsSync(ticketPath)) return
  // UTC from the machine clock, as delegation.md and every reader of Progress notes expect.
  const stamp = now.toISOString().slice(0, 16).replace('T', ' ')
  const lines = hops.map((h) => {
    const label = h.fromKey && h.toKey ? `${h.fromKey} → ${h.toKey}` : `${h.from} → ${h.to}`
    return `- ${stamp} · dispatch · ${label} out of quota, rerouted.`
  }).join('\n') + '\n'
  let text = readFileSync(ticketPath, 'utf8')
  const notesAt = text.search(/^## Progress notes\s*$/m)
  if (notesAt === -1) text = text.replace(/\n*$/, '\n\n## Progress notes\n\n') + lines
  else {
    const rest = text.slice(notesAt)
    const concerns = rest.search(/^## Concerns\s*$/m)
    if (concerns === -1) text = text.replace(/\n*$/, '\n') + lines
    else {
      const at = notesAt + concerns
      const before = text.slice(0, at).replace(/\n*$/, '\n')
      text = before + lines + '\n' + text.slice(at)
    }
  }
  writeFileSync(ticketPath, text)
}
