// Shared usage-ledger row shape and helpers (T-541). dispatch.mjs appends builder rows;
// usage-ledger-fill-verify.mjs patches verify-time fields after Tyrion's pass.
import { mkdirSync, readFileSync, readdirSync, writeFileSync, appendFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

export const BUILDER_ARMS = ['gemma', 'composer', 'grok', 'openrouter']

export function defaultLedgerPath(v2Dir) {
  return join(v2Dir, 'reports', 'usage', 'ledger.jsonl')
}

export function defaultArchivePath(v2Dir) {
  return join(v2Dir, 'reports', 'usage', 'ledger-pre-verify-standard.jsonl')
}

export function effortFromModel(m) {
  const mm = /-(low|medium|high)$/i.exec(m || '')
  return mm ? mm[1].toLowerCase() : 'medium'
}

export function usageBlockFrom(raw) {
  if (!raw || typeof raw !== 'object') return null
  return {
    input_tokens: raw.input_tokens ?? 0,
    output_tokens: raw.output_tokens ?? 0,
    thinking_tokens: raw.thinking_tokens ?? 0,
    cache_read_tokens: raw.cache_read_tokens ?? raw.cache_read_input_tokens ?? 0,
  }
}

// cursor-agent's `--output-format json` result line reports camelCase `usage` fields
// (inputTokens, outputTokens, cacheReadTokens, cacheWriteTokens); normalise to the ledger's names.
export function cursorUsageBlockFrom(raw) {
  if (!raw || typeof raw !== 'object') return null
  const block = usageBlockFrom({
    input_tokens: raw.input_tokens ?? raw.inputTokens,
    output_tokens: raw.output_tokens ?? raw.outputTokens,
    thinking_tokens: raw.thinking_tokens ?? raw.thinkingTokens,
    cache_read_tokens: raw.cache_read_tokens ?? raw.cacheReadTokens,
    cache_read_input_tokens: raw.cache_read_input_tokens,
  })
  const write = raw.cache_write_tokens ?? raw.cacheWriteTokens
  if (write !== undefined) block.cache_write_tokens = write
  return block
}

const CURSOR_ARMS = ['composer', 'grok', 'ideas-composer', 'ideas-grok']

function allZero(block) {
  return !block || Object.values(block).every((n) => !n)
}

/** department from the ticket's batch file `type:` line (tasks/batches/<project>/<batch>.md), else "unknown". */
export function departmentForTicket(ticketText, tasksDir) {
  const fm = (ticketText || '').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  const batch = fm?.[1].match(/^batch:\s*["']?([^"'#\n]+?)["']?\s*$/m)?.[1]?.trim()
  if (!batch || !tasksDir) return 'unknown'
  const root = join(tasksDir, 'batches')
  let projects
  try {
    projects = readdirSync(root)
  } catch {
    return 'unknown'
  }
  for (const proj of projects) {
    try {
      const text = readFileSync(join(root, proj, `${batch}.md`), 'utf8')
      const type = text.match(/^type:\s*["']?([\w-]+)/m)?.[1]
      if (type) return type
    } catch {
      /* not in this project */
    }
  }
  return 'unknown'
}

function priorTotals(ledgerPath, tid) {
  let turns = 0
  let requests = 0
  let text = ''
  try {
    text = readFileSync(ledgerPath, 'utf8')
  } catch {
    return { turns, requests }
  }
  for (const line of text.split('\n')) {
    if (!line.trim()) continue
    try {
      const r = JSON.parse(line)
      if (r.ticket !== tid) continue
      turns += Number(r.turns) || 0
      requests += Number(r.api_calls) || 0
    } catch {
      /* skip a bad line */
    }
  }
  return { turns, requests }
}

export function priceGemmaTokens(usageBlock, pricesFile) {
  const prices = pricesFile.models
  const uncachedInput = usageBlock.input_tokens || 0
  const cacheRead = usageBlock.cache_read_tokens || 0
  const outputWithThinking = (usageBlock.output_tokens || 0) + (usageBlock.thinking_tokens || 0)
  function priceFor(rates) {
    return (
      (uncachedInput / 1e6) * rates.uncached_input +
      (cacheRead / 1e6) * rates.cache_read +
      (outputWithThinking / 1e6) * rates.output
    )
  }
  const cost = {
    fable: Math.round(priceFor(prices.fable) * 1e6) / 1e6,
    sonnet5: Math.round(priceFor(prices.sonnet5) * 1e6) / 1e6,
    gemini_flash: Math.round(priceFor(prices.gemini_flash) * 1e6) / 1e6,
  }
  return { cost, prices_as_of: pricesFile.as_of }
}

export function dispatchArmForEngine(engine) {
  if (engine === 'gemini' || engine === 'agy') return { arm: 'gemma', lane: 'gemma' }
  if (engine === 'composer' || engine === 'grok') return { arm: engine, lane: engine }
  if (engine === 'ideas-composer' || engine === 'ideas-grok') return { arm: engine, lane: engine }
  if (engine === 'openrouter' || engine === 'ideas-openrouter') return { arm: 'openrouter', lane: engine }
  return { arm: engine, lane: engine }
}

export function appendDispatchLedgerRow({
  ledgerPath,
  pricesPath,
  tid,
  arm,
  lane,
  model,
  startedAt,
  finishedAt,
  usageBlock,
  source,
  turns = null,
  department = 'unknown',
  desk = null,
  role = 'build',
}) {
  const minutes = Math.round(((Date.parse(finishedAt) - Date.parse(startedAt)) / 60000) * 100) / 100
  const pricesFile = JSON.parse(readFileSync(pricesPath, 'utf8'))
  const priced = usageBlock && !allZero(usageBlock) ? priceGemmaTokens(usageBlock, pricesFile) : null
  const cursor = CURSOR_ARMS.includes(arm)
  const prior = priorTotals(ledgerPath, tid)
  const row = {
    ticket: tid,
    department: department || 'unknown',
    desk: desk || lane,
    role,
    arm,
    lane,
    model: model || 'default',
    effort: effortFromModel(model),
    window: { from: startedAt, to: finishedAt, source },
    generated_at: new Date().toISOString(),
    tokens: cursor ? (allZero(usageBlock) ? 'unknown' : usageBlock) : usageBlock || 'missing',
    api_calls: 1,
    minutes,
    cost: priced ? priced.cost : 'missing',
    prices_as_of: priced ? priced.prices_as_of : pricesFile.as_of,
    turns,
    cumulative_turns: prior.turns + (Number(turns) || 0),
    cumulative_requests: prior.requests + 1,
    correction_rounds: null,
    verify_minutes: null,
    passed_first_time: null,
  }
  mkdirSync(dirname(ledgerPath), { recursive: true })
  appendFileSync(ledgerPath, `${JSON.stringify(row)}\n`)
  return row
}

/** Patch verify-time fields on the last row matching ticket (T-541 AC-2). */
export function fillVerifyFieldsForTicket({
  ledgerPath,
  ticketId,
  turns,
  correction_rounds,
  verify_minutes,
  passed_first_time,
}) {
  const want = ticketId.startsWith('T-') ? ticketId : `T-${ticketId}`
  let lines
  try {
    lines = readFileSync(ledgerPath, 'utf8').split('\n')
  } catch (e) {
    throw new Error(`Could not read ${ledgerPath}: ${e.message}`)
  }
  let idx = -1
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i]
    if (!line.trim()) continue
    let row
    try {
      row = JSON.parse(line)
    } catch {
      continue
    }
    if (row.ticket === want) {
      idx = i
      break
    }
  }
  if (idx === -1) throw new Error(`No ledger row for ticket ${want}`)
  const row = JSON.parse(lines[idx])
  if (turns !== undefined) row.turns = turns
  if (correction_rounds !== undefined) row.correction_rounds = correction_rounds
  if (verify_minutes !== undefined) row.verify_minutes = verify_minutes
  if (passed_first_time !== undefined) row.passed_first_time = passed_first_time
  lines[idx] = JSON.stringify(row)
  const out = lines.join('\n')
  writeFileSync(ledgerPath, out.endsWith('\n') ? out : `${out}\n`)
  return row
}

/**
 * T-740 step 4: dispatch's auto-verify writes its outcome onto the ticket's last build row, so the
 * cheap lane's savings can be read against its failures. Every build row for the ticket before the
 * last one was a rebuild after a RED, so correction_rounds is their count, and only a GREEN on the
 * first build passed first time. A row with no role is a build row (rows from before T-541's role).
 */
export function recordVerifyOutcome({ ledgerPath, ticketId, green, verifyMinutes }) {
  const want = ticketId.startsWith('T-') ? ticketId : `T-${ticketId}`
  const lines = readFileSync(ledgerPath, 'utf8').split('\n')
  const builds = []
  lines.forEach((line, i) => {
    if (!line.trim()) return
    try {
      const row = JSON.parse(line)
      if (row.ticket === want && (row.role ?? 'build') === 'build') builds.push(i)
    } catch {}
  })
  if (!builds.length) throw new Error(`No build ledger row for ticket ${want}`)
  const idx = builds[builds.length - 1]
  const row = JSON.parse(lines[idx])
  row.correction_rounds = builds.length - 1
  row.passed_first_time = Boolean(green) && builds.length === 1
  row.verify_minutes = verifyMinutes
  lines[idx] = JSON.stringify(row)
  const out = lines.join('\n')
  writeFileSync(ledgerPath, out.endsWith('\n') ? out : `${out}\n`)
  return row
}

export function inputSideTokens(row) {
  const t = row.tokens
  if (t === 'missing' || !t || typeof t !== 'object') return 0
  if ('uncached_input' in t) {
    return (t.uncached_input || 0) + (t.cache_write || 0) + (t.cache_read || 0)
  }
  return (t.input_tokens || 0) + (t.cache_read_tokens || 0)
}
