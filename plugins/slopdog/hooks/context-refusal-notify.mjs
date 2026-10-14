// context-refusal-notify — when context-rot refuses a prompt at SLOPDOG_CONTEXT_HARD,
// surface it on the activity feed, Tyrion's inbox, and (when the prompt is from Slack) the
// sender's thread. Fail silent on any I/O or network error so the hook's exit 2 still fires.
import { readFileSync, writeFileSync, appendFileSync, mkdirSync, existsSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { laneInbox } from '../../../scripts/lib/lane-folder.mjs'
import { readLanesDocument } from '../../../scripts/lib/registry.mjs'

const HOME = homedir()
const DISPATCH_COOLDOWN_MS = 10 * 60 * 1000
const SLACK_COOLDOWN_MS = 10 * 60 * 1000
const TEXT_MAX = 200

function paths() {
  const v2 = process.env.SLOPDOG_V2_ROOT || join(HOME, 'slopdog/v2')
  // Tyrion's inbox is wherever the registry puts the build lane (T-684: desks/build/tyrion).
  let buildInbox = process.env.SLOPDOG_DISPATCH_INBOX_DIR || null
  if (!buildInbox) try { buildInbox = laneInbox('build', { v2 }) } catch {}
  return {
    v2,
    buildInbox,
    logDir: process.env.SLOPDOG_ACTIVITY_LOG_DIR || join(HOME, 'slopdog/logs/activity'),
    stateDir: process.env.SLOPDOG_CONTEXT_REFUSAL_STATE_DIR || join(HOME, '.local/state/slopdog/context-refusal'),
  }
}

function slackAttrs(s) {
  const out = {}
  for (const m of String(s).matchAll(/(\w+)="([^"]*)"/g)) out[m[1]] = m[2]
  return out
}

export function laneFor(cwd) {
  if (!cwd) return null
  const { v2 } = paths()
  let lanes
  try { lanes = readLanesDocument({ v2 }) } catch { return null }
  let real = cwd
  try { real = realpathSync(cwd) } catch {}
  let best = null, bestLen = -1
  for (const [key, lane] of Object.entries(lanes)) {
    if (!lane || typeof lane !== 'object' || !lane.folder) continue
    let folder = resolve(v2, lane.folder)
    try { folder = realpathSync(folder) } catch {}
    if ((real === folder || real.startsWith(folder + '/')) && folder.length > bestLen) {
      best = key; bestLen = folder.length
    }
  }
  return best
}

export function parseSlackTarget(prompt) {
  const s = String(prompt || '')
  const header = s.match(/^Slack\b.*\bchannel=([^\s]+)\s+user=\S+\s+ts=\S+\s+thread_ts=(\S+)/m)
  if (header) return { channel: header[1], thread_ts: header[2] }
  const open = s.match(/<channel\s+([^>]+)>/i)
  if (!open) return null
  const a = slackAttrs(open[1])
  if (a.source !== 'slack') return null
  const channel = a.channel
  const thread_ts = a.thread_ts || a.ts
  return channel && thread_ts ? { channel, thread_ts } : null
}

function today() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function trim(s) {
  return String(s || '').replace(/\s*\n+\s*/g, ' ').trim().slice(0, TEXT_MAX)
}

function stamp() {
  const d = new Date()
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}

function cooldownOk(stateDir, file, ms) {
  try {
    mkdirSync(stateDir, { recursive: true })
    const path = join(stateDir, file)
    const now = Date.now()
    let last = 0
    try { last = JSON.parse(readFileSync(path, 'utf8')).at || 0 } catch {}
    if (now - last < ms) return false
    writeFileSync(path, JSON.stringify({ at: now }))
    return true
  } catch {
    return false
  }
}

function loadSlackToken() {
  if ('SLACK_BOT_TOKEN' in process.env) return process.env.SLACK_BOT_TOKEN
  const envFile = join(HOME, '.config/slack-channel/.env')
  try {
    for (const line of readFileSync(envFile, 'utf8').split('\n')) {
      const m = line.match(/^\s*SLACK_BOT_TOKEN\s*=\s*(.*?)\s*$/)
      if (m) return m[1].replace(/^["']|["']$/g, '')
    }
  } catch {}
  return ''
}

async function postSlack({ channel, thread_ts, text }) {
  const token = loadSlackToken()
  if (!token) return false
  const resp = await fetch('https://slack.com/api/chat.postMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ channel, thread_ts, text }),
  })
  const j = await resp.json().catch(() => ({}))
  return Boolean(j.ok)
}

export function notifyContextRefusal({ lane, ctx, hard, prompt, sessionId }) {
  try {
    const { buildInbox, logDir, stateDir } = paths()
    const k = (n) => `${Math.round(n / 1000)}k`
    const preview = trim(prompt)
    const row = {
      ts: new Date().toISOString(),
      session: sessionId ? String(sessionId).slice(0, 8) : '?',
      agent: null,
      lane,
      event: 'context_refusal',
      name: null,
      ticket: null,
      text: preview,
    }
    try {
      mkdirSync(logDir, { recursive: true })
      appendFileSync(join(logDir, `${today()}.jsonl`), JSON.stringify(row) + '\n')
    } catch {}

    if (lane && cooldownOk(stateDir, `dispatch-${lane}.json`, DISPATCH_COOLDOWN_MS)) {
      try {
        mkdirSync(buildInbox, { recursive: true })
        const slug = 'context-hard-refusal'
        const file = join(buildInbox, `${stamp()}-from-context-rot-${slug}.md`)
        const body =
          `Context hard limit refused a prompt on the *${lane}* desk (~${k(ctx)} tokens, hard ${k(hard)}). ` +
          `The message never reached the model. Clear the desk (/slopdog:clear-to-close then self-clear.mjs), ` +
          `or write .over-ceiling on Todd's OK, then resend anything that was dropped.\n\n` +
          `Prompt preview: ${preview}\n`
        writeFileSync(file, body)
      } catch {}
    }

    const slack = parseSlackTarget(prompt)
    if (slack && cooldownOk(stateDir, `slack-${slack.channel}-${slack.thread_ts}.json`, SLACK_COOLDOWN_MS)) {
      const text =
        `This desk is past its context limit (~${k(ctx)}; hard stop ${k(hard)}) and could not take your message yet. ` +
        `Slop Dog is clearing or needs a manual clear — you should get a real answer once the desk picks up. ` +
        `If nothing moves in a few minutes, ping Todd.`
      postSlack({ channel: slack.channel, thread_ts: slack.thread_ts, text }).catch(() => {})
    }

    return { activity: true, lane, slack: slack ? slack.channel : null }
  } catch {
    return { activity: false, lane, slack: null }
  }
}
