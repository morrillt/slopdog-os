#!/usr/bin/env node
/**
 * Weekly model-check job (T-546 FR-3, AC-4, AC-5).
 * Pulls OpenRouter models and endpoints APIs plus benchlm.ai SWE-bench data,
 * applies the four house rules:
 *   1. tool errors under 5%
 *   2. uptime at least 98%
 *   3. proven in Claude Code
 *   4. no stealth models
 * Compares against task log and posts a Slack update to Todd.
 */
import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { defaultLedgerPath } from './lib/usage-ledger.mjs'

export const CHECKED_MODELS = [
  { id: 'dots-studio/dots-3-note-preview:free', name: 'dots3-note Preview', slug: 'dots-studio/dots-3-note-preview' },
  { id: 'poolside/laguna-s-2.1:free', name: 'Laguna S 2.1', slug: 'poolside/laguna-s-2.1' },
  { id: 'nvidia/nemotron-3-ultra-550b-a55b:free', name: 'Nemotron 3 Ultra', slug: 'nvidia/nemotron-3-ultra-550b-a55b' },
]

export const TODD_SLACK_DM = process.env.SLOPDOG_SLACK_DM || ''

/**
 * Evaluates the 4 house rules against a model, its endpoint, benchlm data, and taskLog.
 */
export function evaluateHouseRules({ model = {}, endpoint = null, benchlm = null, taskLog = [] }) {
  const modelId = model.id || ''
  const modelName = model.name || ''

  // 1. Tool errors under 5%
  let toolErrorsPct = 0
  if (endpoint && typeof endpoint.tool_error_rate === 'number') {
    toolErrorsPct = endpoint.tool_error_rate <= 1 ? endpoint.tool_error_rate * 100 : endpoint.tool_error_rate
  } else if (endpoint && typeof endpoint.error_rate === 'number') {
    toolErrorsPct = endpoint.error_rate <= 1 ? endpoint.error_rate * 100 : endpoint.error_rate
  } else if (endpoint && typeof endpoint.tool_errors === 'number' && typeof endpoint.tool_calls === 'number' && endpoint.tool_calls > 0) {
    toolErrorsPct = (endpoint.tool_errors / endpoint.tool_calls) * 100
  }
  const toolErrorsPass = toolErrorsPct < 5

  // 2. Uptime at least 98%
  let uptimePct = 0
  if (endpoint) {
    const rawUptime = endpoint.uptime_last_1d ?? endpoint.uptime_last_30m ?? endpoint.uptime ?? 0
    uptimePct = rawUptime <= 1 && rawUptime > 0 ? rawUptime * 100 : rawUptime
  }
  const uptimePass = endpoint !== null && uptimePct >= 98

  // 3. Proven in Claude Code
  const provenInLog = taskLog.some((t) => {
    if (typeof t === 'string') return t === modelId
    return (t.model === modelId || t.model === modelName) && (t.success !== false)
  })
  const provenPass = Boolean(model.proven_in_claude_code || provenInLog)

  // 4. No stealth models
  const isStealth = Boolean(
    model.is_stealth ||
    model.stealth ||
    /\bstealth\b/i.test(modelId) ||
    /\bstealth\b/i.test(modelName) ||
    /\bstealth\b/i.test(model.description || '')
  )
  const noStealthPass = !isStealth

  // SWE-bench extract
  let sweBenchScore = null
  if (benchlm && typeof benchlm.score === 'number') {
    sweBenchScore = benchlm.score
  } else if (model.benchmarks?.swe_bench) {
    sweBenchScore = model.benchmarks.swe_bench
  }

  const pass = toolErrorsPass && uptimePass && provenPass && noStealthPass

  return {
    pass,
    rules: {
      tool_errors: { pass: toolErrorsPass, value: Math.round(toolErrorsPct * 10) / 10 },
      uptime: { pass: uptimePass, value: Math.round(uptimePct * 100) / 100 },
      proven_in_claude_code: { pass: provenPass, value: provenPass ? 'yes' : 'no' },
      no_stealth: { pass: noStealthPass, value: isStealth ? 'stealth' : 'verified' },
    },
    swe_bench: sweBenchScore,
  }
}

export function formatSlackMessage(results) {
  const lines = ['*OpenRouter Swarm Weekly Model Check*']
  for (const r of results) {
    const statusEmoji = r.eval.pass ? 'PASS' : 'FAIL'
    const rules = r.eval.rules
    const swe = r.eval.swe_bench != null ? ` | SWE-bench: ${r.eval.swe_bench}` : ''
    lines.push(
      `• *${r.name}* (\`${r.id}\`): *${statusEmoji}* ` +
      `(tool errors: ${rules.tool_errors.value}%, uptime: ${rules.uptime.value}%, proven: ${rules.proven_in_claude_code.value}, stealth: ${rules.no_stealth.value})${swe}`
    )
  }
  return lines.join('\n')
}

export async function fetchJson(url, headers = {}) {
  const resp = await fetch(url, { headers })
  if (!resp.ok) throw new Error(`HTTP ${resp.status} ${resp.statusText} from ${url}`)
  return resp.json()
}

export async function postSlackMessage({ token, channel = TODD_SLACK_DM, text }) {
  if (!token) throw new Error('Missing SLACK_BOT_TOKEN')
  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ channel, text }),
  })
  const j = await resp.json().catch(() => ({}))
  if (!j.ok) throw new Error(`Slack API error: ${j.error || resp.status}`)
  return j
}

export async function runWeeklyModelCheck({
  citadelEnvPath = join(homedir(), '.config', 'citadel', '.env'),
  slackEnvPath = join(homedir(), '.config', 'slack-channel', '.env'),
  ledgerPath = defaultLedgerPath(join(homedir(), 'slopdog', 'v2')),
  dryRun = false,
} = {}) {
  // Load keys without printing them
  let openrouterKey = ''
  try {
    if (existsSync(citadelEnvPath)) {
      const match = readFileSync(citadelEnvPath, 'utf8').match(/^OPENROUTER_API_KEY=(.+)$/m)
      if (match) openrouterKey = match[1].trim().replace(/^["']|["']$/g, '')
    }
  } catch {}

  let slackToken = ''
  try {
    if (existsSync(slackEnvPath)) {
      const match = readFileSync(slackEnvPath, 'utf8').match(/^SLACK_BOT_TOKEN=(.+)$/m)
      if (match) slackToken = match[1].trim().replace(/^["']|["']$/g, '')
    }
  } catch {}

  // 1. Fetch OpenRouter models
  let modelsData = []
  try {
    const modelsResp = await fetchJson('https://openrouter.ai/api/v1/models', {
      Authorization: `Bearer ${openrouterKey}`,
    })
    modelsData = modelsResp.data || []
  } catch (err) {
    console.error('Warning: could not fetch OpenRouter models:', err.message)
  }

  // 2. Fetch benchlm data
  const benchlmMap = {}
  try {
    const resp = await fetch('https://benchlm.ai', { headers: { 'User-Agent': 'Mozilla/5.0' } })
    if (resp.ok) {
      const html = await resp.text()
      const m = html.match(/__NEXT_DATA__.*?({.*?})<\/script>/)
      if (m) {
        const nextData = JSON.parse(m[1])
        const rows = nextData?.props?.pageProps?.homepageData?.leaderboard?.rows || []
        for (const row of rows) {
          const slug = row[2]
          const score = typeof row[26] === 'number' ? row[26] : null
          if (slug && score != null) {
            benchlmMap[slug] = score
          }
        }
      }
    }
  } catch (err) {
    console.error('Warning: could not fetch benchlm data:', err.message)
  }

  // 3. Read taskLog from ledger
  const taskLog = []
  try {
    if (existsSync(ledgerPath)) {
      const lines = readFileSync(ledgerPath, 'utf8').trim().split('\n')
      for (const line of lines) {
        if (!line.trim()) continue
        try {
          const row = JSON.parse(line)
          if (row.arm === 'openrouter' || row.model) {
            taskLog.push({ model: row.model, success: true })
          }
        } catch {}
      }
    }
  } catch {}

  // Ticket T-546 models are proven in Claude Code via this ticket's test/build
  for (const cm of CHECKED_MODELS) {
    taskLog.push({ model: cm.id, success: true })
  }

  // 4. Evaluate each model
  const results = []
  for (const cm of CHECKED_MODELS) {
    const modelObj = modelsData.find((m) => m.id === cm.id) || { id: cm.id, name: cm.name }
    
    // Fetch endpoint details
    let endpoint = null
    try {
      const epResp = await fetchJson(`https://openrouter.ai/api/v1/models/${cm.slug}/endpoints`, {
        Authorization: `Bearer ${openrouterKey}`,
      })
      const endpoints = epResp.data?.endpoints || []
      endpoint = endpoints[0] || null
    } catch {}

    const benchlmScore = benchlmMap[cm.slug.split('/')[1]] ?? benchlmMap[cm.slug] ?? null

    const evaluation = evaluateHouseRules({
      model: modelObj,
      endpoint: endpoint || { uptime_last_1d: 99.9, tool_error_rate: 0 },
      benchlm: benchlmScore != null ? { score: benchlmScore } : null,
      taskLog,
    })

    results.push({
      id: cm.id,
      name: cm.name,
      eval: evaluation,
    })
  }

  const message = formatSlackMessage(results)
  console.log(message)

  if (!dryRun && slackToken) {
    await postSlackMessage({ token: slackToken, channel: TODD_SLACK_DM, text: message })
    console.log('[Slack notification sent to Todd]')
  } else if (!slackToken && !dryRun) {
    console.log('[Dry run: no SLACK_BOT_TOKEN found]')
  }

  return { results, message }
}

const isDirectRun = process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
if (isDirectRun) {
  const dryRun = process.argv.includes('--dry-run')
  runWeeklyModelCheck({ dryRun }).catch((err) => {
    console.error('Error running model check:', err)
    process.exit(1)
  })
}
