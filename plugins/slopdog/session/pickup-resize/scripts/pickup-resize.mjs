#!/usr/bin/env node
// pickup-resize — re-size the clear tiers from the desks' real usage (T-278). The method is the
// clear-ceiling experiment's (desks/research/experiments/clear-ceiling/, report
// desks/research/reports/2026-09-25-clear-ceiling-cost.md §2a): pull every main-thread request
// from the last 14 days of desk transcripts, take the median context at the end of each pickup
// as the fresh-start size (BASE), replay the traffic under a sweep of
// ceilings, and take the cheapest. One model assumed: every stream is priced at the model with
// the most requests. Nudge is 0.8x the cheapest ceiling. Hard (the force tier, which refuses
// prompts) stays where the tiers file has it, 350k if none, unless --resize-hard is passed; then
// it is 1.4x the ceiling, the shape of 200k / 250k / 350k. The flag is off until Todd says (T-278 q1).
//
// Writes, unless --dry-run: the three numbers to hooks/context-tiers.json (context-rot.mjs reads
// it; SLOPDOG_CONTEXT_* env still overrides), and one line to resize-log.jsonl beside the
// experiment. Usage: node pickup-resize.mjs [--dry-run] [--resize-hard] [--days 14]
import { readdirSync, readFileSync, writeFileSync, appendFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { homedir } from 'node:os'

const DRY = process.argv.includes('--dry-run'), RESIZE_HARD = process.argv.includes('--resize-hard')
const argN = (k, d) => { const i = process.argv.indexOf(k); return i > 0 ? Number(process.argv[i + 1]) : d }
const DAYS = argN('--days', 14)
const TIERS = new URL('../../../hooks/context-tiers.json', import.meta.url)
const LOG = join(homedir(), 'slopdog/v2/desks/research/experiments/clear-ceiling/resize-log.jsonl')
const REWORK = 10000, SHARED = 30000, TTL = 3600e3
const PRICE = { // $ per million tokens, as simulate.mjs: cache write (1h) = 2x input
  'claude-opus-5-5': { read: 0.2, write: 8, out: 20 },
  'claude-fable-5-1': { read: 0.25, write: 20, out: 50 },
}
const CEILINGS = Array.from({ length: 17 }, (_, i) => 100000 + i * 25000)   // 100k .. 500k
const k = (n) => `${Math.round(n / 1000)}k`
const r10k = (n) => Math.round(n / 10000) * 10000

// 1. Extract: one row per assistant message id, and the context at the end of each pickup. A pickup
// starts at a prompt that IS the /slopdog:pickup command (a turn-log summariser quoting one is not)
// and ends at its restatement: the first sizeable text reply after a tool call. The skill carries
// on into the ticket in the same turn, so the end of the turn would count the work too.
const root = join(homedir(), '.claude/projects')
const SLUG = `${homedir().replace(/\//g, '-')}-slopdog-v2-desks-`
const since = Date.now() - DAYS * 864e5
const rows = [], pickups = []
for (const d of readdirSync(root).filter((d) => d.startsWith(SLUG) && /^[a-z-]+$/.test(d.slice(SLUG.length)))) {
  const desk = d.slice(SLUG.length)
  for (const f of readdirSync(join(root, d)).filter((f) => f.endsWith('.jsonl'))) {
    const p = join(root, d, f)
    if (statSync(p).mtimeMs < since) continue
    const seen = new Set()
    let inPickup = false, tools = 0, lastCtx = 0
    const endPickup = () => { if (inPickup && lastCtx) pickups.push(lastCtx); inPickup = false }
    for (const line of readFileSync(p, 'utf8').split('\n')) {
      let o; try { o = JSON.parse(line) } catch { continue }
      if (o.isSidechain) continue
      if (o.type === 'user' && !o.isMeta) {
        const c = o.message?.content
        const prompt = typeof c === 'string' ? c : Array.isArray(c) && !c.some((b) => b.type === 'tool_result') ? c.map((b) => b.text || '').join('') : null
        if (prompt === null) continue          // a tool result: the turn goes on
        endPickup()                            // a new prompt ends the turn before it
        if (/^\s*<command-message>slopdog:pickup</.test(prompt)) { inPickup = true; tools = 0; lastCtx = 0 }
        continue
      }
      const m = o.message, u = m?.usage
      if (o.type !== 'assistant' || !u) continue
      const ctx = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)
      if (inPickup) {
        const c = Array.isArray(m.content) ? m.content : []
        if (c.some((b) => b.type === 'tool_use')) tools++
        lastCtx = ctx
        if (tools && c.some((b) => b.type === 'text' && b.text.length > 80)) endPickup()
      }
      if (seen.has(m.id) || Date.parse(o.timestamp) < since) continue
      seen.add(m.id)
      rows.push({ desk, session: f, ts: Date.parse(o.timestamp), model: m.model, ctx, output: u.output_tokens || 0 })
    }
    endPickup()
  }
}
pickups.sort((a, b) => a - b)
if (!pickups.length) { console.error(`pickup-resize: no /slopdog:pickup turns in the last ${DAYS} days; nothing to size from, nothing written.`); process.exit(1) }
const BASE = pickups[Math.floor(pickups.length / 2)]
const counts = rows.reduce((a, r) => ((a[r.model] = (a[r.model] || 0) + 1), a), {})
const model = Object.keys(PRICE).sort((a, b) => (counts[b] || 0) - (counts[a] || 0))[0]
const p = PRICE[model]

// 2. Simulate, as simulate.mjs: per desk and model, sessions joined one after another; only the clears move.
const bySession = {}
for (const r of rows.filter((r) => PRICE[r.model])) (bySession[`${r.desk}|${r.model}|${r.session}`] ??= []).push(r)
const streams = {}
for (const [key, reqs] of Object.entries(bySession).sort((a, b) => a[1][0].ts - b[1][0].ts))
  (streams[key.split('|').slice(0, 2).join('|')] ??= []).push(...reqs.sort((a, b) => a.ts - b.ts))
function cost(reqs, ceiling) {
  let ctx = 0, lastTs = 0, read = 0, write = 0, out = 0
  const fresh = (extra) => { const c = BASE + extra; read += SHARED; write += c - SHARED; return c }
  for (let i = 0; i < reqs.length; i++) {
    const r = reqs[i], prev = reqs[i - 1]
    const delta = !prev || prev.session !== r.session ? 0 : Math.max(0, r.ctx - prev.ctx)
    if (i === 0) ctx = fresh(0)
    else if (ctx + delta >= ceiling) ctx = fresh(REWORK + delta)
    else { const cached = r.ts - lastTs <= TTL && r.ts >= lastTs ? ctx : 0; ctx += delta; read += cached; write += ctx - cached }
    out += r.output; lastTs = r.ts
  }
  return (read * p.read + write * p.write + out * p.out) / 1e6
}
const total = (ceiling) => Object.values(streams).reduce((a, s) => a + cost(s, ceiling), 0)

// 3. Pick the cheapest ceiling and compare it with the tiers in force.
const sweep = CEILINGS.filter((c) => c > BASE + REWORK).map((c) => ({ c, $: total(c) }))
const best = sweep.reduce((a, b) => (b.$ < a.$ ? b : a))
let current = {}; try { current = JSON.parse(readFileSync(TIERS, 'utf8')) } catch {}
const resizedHard = r10k(best.c * 14 / 10)
const proposed = { nudge: r10k(best.c * 8 / 10), ceiling: best.c, hard: RESIZE_HARD ? resizedHard : current.hard || 400000 }
// Todd set a floor on 2026-10-06 (warn 26%, clear by 30%, hard stop at 40% of the window),
// and a resize may raise a tier above it but never lower one below it.
const FLOOR = { nudge: 260000, ceiling: 300000, hard: 400000, why: "Todd set these on 2026-10-06 and pickup-resize must not lower them." }
const floor = current.floor && typeof current.floor === 'object' ? current.floor : FLOOR
const next = {
  nudge: Math.max(proposed.nudge, floor.nudge || 0),
  ceiling: Math.max(proposed.ceiling, floor.ceiling || 0),
  hard: Math.max(proposed.hard, floor.hard || 0),
}
for (const tier of ['nudge', 'ceiling', 'hard']) {
  if (next[tier] !== proposed[tier]) console.log(`floor held ${tier} at ${k(next[tier])}; the replay wanted ${k(proposed[tier])}`)
}
const now$ = current.ceiling ? total(current.ceiling) : null
const pct = now$ ? ((best.$ - now$) / now$) * 100 : null

console.log(`pickup-resize${DRY ? ' (dry run, nothing written)' : ''}: ${rows.length} requests over ${DAYS} days, ${pickups.length} pickups, median post-pickup context ${k(BASE)}, priced as ${model}.`)
console.log(`suggested tiers: nudge ${k(next.nudge)} · suggest ${k(next.ceiling)} · force ${k(next.hard)}${RESIZE_HARD ? ' (--resize-hard)' : ` (kept; --resize-hard would give ${k(resizedHard)})`}   (current: ${current.ceiling ? `${k(current.nudge)} · ${k(current.ceiling)} · ${k(current.hard)}` : 'none on file'})`)
console.log(now$ ? `cost delta: $${best.$.toFixed(0)} at a ${k(best.c)} ceiling vs $${now$.toFixed(0)} at the current ${k(current.ceiling)}, ${pct >= 0 ? '+' : ''}${pct.toFixed(1)}% over the same ${DAYS} days.` : `cost delta: none, no current tiers; $${best.$.toFixed(0)} at ${k(best.c)}.`)
if (DRY) process.exit(0)

const stamp = new Date().toISOString()
writeFileSync(TIERS, JSON.stringify({ ...next, updated: stamp, base: BASE, model, by: 'pickup-resize (T-278)', floor }, null, 2) + '\n')
appendFileSync(LOG, JSON.stringify({ ts: stamp, days: DAYS, requests: rows.length, pickups: pickups.length, base: BASE, model,
  from: current.ceiling ? { nudge: current.nudge, ceiling: current.ceiling, hard: current.hard } : null, to: next,
  cost: { current: now$ && +now$.toFixed(2), suggested: +best.$.toFixed(2), pct: pct && +pct.toFixed(1) } }) + '\n')
console.log(`wrote ${TIERS.pathname} and one line to ${LOG}`)
