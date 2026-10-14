#!/usr/bin/env node
// clear-asks.mjs — decide whether /slopdog:clear-to-close should ask Todd or skip straight to clear.
// T-735: skip when invoked with "unattended", when in an unattended lane (watcher, build/dispatcher,
// scribe, sidekicks), or when at the hard context tier. Otherwise ask.
//
// Usage:
//   node clear-asks.mjs [unattended]
//   or import { shouldAskClear } from './clear-asks.mjs'
//
// Prints:
//   skip: <reason>
//   or
//   ask: <reason>

import { readFileSync, statSync, openSync, readSync, closeSync, existsSync, readdirSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

// Unattended lanes that never have Todd sitting at their keyboard:
// watcher (automated night watch)
// build / tyrion (the dispatcher desk)
// scribe (luwin, automated commit messages)
// sidekicks (gemma, composer, grok, openrouter, etc.)
export const UNATTENDED_LANES = new Set([
  'watcher',
  'build',
  'scribe',
  'gemma',
  'composer',
  'grok',
  'openrouter',
  'ideas-composer',
  'ideas-grok',
  'ideas-gemma',
  'it-gemini',
  'it-composer',
  'slack-gemini',
  'slack-composer',
  'research-gemini',
  'research-composer',
  'qa-gemini',
  'qa-composer',
  'errands-gemini',
  'errands-composer',
  'writing-gemini',
  'writing-composer',
])

export function getLane(cwd = process.cwd(), env = process.env) {
  if (env.SLOPDOG_LANE) return env.SLOPDOG_LANE
  try {
    const { laneFor } = require('../hooks/context-refusal-notify.mjs')
    const l = laneFor(cwd)
    if (l) return l
  } catch {}
  return null
}

export function findTranscript(cwd = process.cwd(), env = process.env) {
  if (env.CLAUDE_TRANSCRIPT_PATH && existsSync(env.CLAUDE_TRANSCRIPT_PATH)) {
    return env.CLAUDE_TRANSCRIPT_PATH
  }
  if (env.CLAUDE_SESSION_ID) {
    const projectsDir = env.CLAUDE_PROJECTS_DIR || join(homedir(), '.claude', 'projects')
    if (existsSync(projectsDir)) {
      const candidateFolders = [cwd]
      try { candidateFolders.push(realpathSync(cwd)) } catch {}
      for (const folder of candidateFolders) {
        const slug = folder.replace(/[^a-zA-Z0-9]/g, '-')
        const file = join(projectsDir, slug, `${env.CLAUDE_SESSION_ID}.jsonl`)
        if (existsSync(file)) return file
      }
      try {
        for (const d of readdirSync(projectsDir)) {
          const file = join(projectsDir, d, `${env.CLAUDE_SESSION_ID}.jsonl`)
          if (existsSync(file)) return file
        }
      } catch {}
    }
  }
  return null
}

export function getContextTier(env = process.env, transcriptPath = null, cwd = process.cwd()) {
  if (env.SLOPDOG_CONTEXT_TIER) return env.SLOPDOG_CONTEXT_TIER

  // Check env or context-tiers.json
  const DEFAULTS = { nudge: 260000, ceiling: 300000, hard: 400000 }
  let tiers = {}
  try {
    tiers = JSON.parse(readFileSync(new URL('../hooks/context-tiers.json', import.meta.url), 'utf8'))
  } catch {}

  const getLimit = (name, key) => Number(env[name] || tiers[key] || DEFAULTS[key])
  const hard = getLimit('SLOPDOG_CONTEXT_HARD', 'hard')
  const ceiling = getLimit('SLOPDOG_CONTEXT_CEILING', 'ceiling')
  const nudge = getLimit('SLOPDOG_CONTEXT_NUDGE', 'nudge')

  const tPath = transcriptPath || findTranscript(cwd, env)
  if (!tPath) return null

  let ctx = 0
  try {
    const size = statSync(tPath).size
    const want = Math.min(size, 3_000_000)
    const fd = openSync(tPath, 'r')
    const buf = Buffer.alloc(want)
    try {
      readSync(fd, buf, 0, want, size - want)
    } finally {
      closeSync(fd)
    }
    for (const line of buf.toString('utf8').split('\n').reverse()) {
      if (!line.includes('"usage"')) continue
      try {
        const o = JSON.parse(line)
        const u = o?.message?.usage
        if (o.type === 'assistant' && u) {
          ctx = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0)
          break
        }
      } catch {}
    }
  } catch {
    return null
  }

  if (ctx >= hard) return 'hard'
  if (ctx >= ceiling) return 'ceiling'
  if (ctx >= nudge) return 'nudge'
  return 'low'
}

export function shouldAskClear({ args = process.argv.slice(2), cwd = process.cwd(), env = process.env, transcriptPath = null } = {}) {
  // 1. Invoked with "unattended" argument
  if (args.some((a) => a.toLowerCase() === 'unattended' || a.toLowerCase() === '--unattended')) {
    return { ask: false, reason: 'unattended argument' }
  }

  // 2. Desk's lane is an unattended lane
  const lane = getLane(cwd, env)
  if (lane && UNATTENDED_LANES.has(lane)) {
    return { ask: false, reason: `unattended lane (${lane})` }
  }

  // 3. Context hook is at its hard tier
  const tier = getContextTier(env, transcriptPath, cwd)
  if (tier === 'hard') {
    return { ask: false, reason: 'context hook at hard tier' }
  }

  return { ask: true, reason: 'plain invocation in a watched desk' }
}

function isMain() {
  if (!process.argv[1]) return false
  try {
    return realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))
  } catch {
    return false
  }
}

if (isMain()) {
  const res = shouldAskClear()
  if (res.ask) {
    console.log(`ask: ${res.reason}`)
  } else {
    console.log(`skip: ${res.reason}`)
  }
}
