#!/usr/bin/env node
// context-rot — the context gauge (UserPromptSubmit). Reads this session's transcript (the
// hook's stdin JSON carries transcript_path), takes the last assistant message's usage
// (input + cache read + cache creation = the context the model just saw), and names the
// tier the session is in (rules/desk-clear.md, T-141; tiers T-277, Todd 2026-09-25):
//
//   below SLOPDOG_CONTEXT_NUDGE     silent
//   nudge .. SLOPDOG_CONTEXT_CEILING  "aim to clear by <ceiling>": a nice-to-have
//   ceiling .. SLOPDOG_CONTEXT_HARD   "over target, clear at the next breakpoint"
//   at or past SLOPDOG_CONTEXT_HARD   exit 2: the prompt is refused, stderr is the reason,
//                                     until the desk clears; context-refusal-notify.mjs logs
//                                     the drop on the activity feed, Tyrion's inbox, and the
//                                     Slack thread when the prompt is from Slack. Let through:
//                                     a prompt that is
//                                     /slopdog:clear-to-close, /slopdog:pickup or /clear, or
//                                     that mentions self-clear.mjs; and every prompt when
//                                     <desk folder>/.over-ceiling exists (ticket id + reason),
//                                     which resume.mjs deletes on the next clear. Todd writes it
//                                     himself by typing a prompt that starts "run on" into the
//                                     desk's pane, at any tier past the nudge: the hook writes the
//                                     file and lets that prompt through, so a desk at the hard
//                                     limit can still be told to go longer (T-644). Tyrion, or a
//                                     desk on Todd's word, can still write it by hand.
//
// The numbers come from context-tiers.json beside this file, which /slopdog:pickup-resize
// rewrites weekly from real usage (T-278); the SLOPDOG_CONTEXT_* env vars override it, and the
// DEFAULTS line (Todd's T-277 numbers) is the fallback when the file is missing. The evidence is
// desks/research/reports/2026-09-25-clear-ceiling-cost.md (degradation tracks absolute tokens,
// and the cheapest clear point is about 2.5 to 3 times the post-pickup context).
// The desk folder: the deepest folder at or above the stdin `cwd`, inside
// ~/slopdog/v2/desks/, that is a lane folder or holds a CLAUDE.md (desks/build/laforge for LaForge), never a department folder like desks/build. resume.mjs
// resolves it the same way. Ported from v1 by T-153; runs through scoped.mjs.
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync, statSync, openSync, readSync, closeSync, existsSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'

// Loaded on demand. The hard-limit test copies this file alone into a scratch folder, so a
// static import of the registry would stop the hook before it can refuse the prompt.
const require = createRequire(import.meta.url)
function laneFolders(v2) {
  try {
    const { readLanesDocument } = require('../../../scripts/lib/registry.mjs')
    return Object.values(readLanesDocument({ v2 }))
      .filter((l) => l && typeof l === 'object' && l.folder).map((l) => join(v2, l.folder))
  } catch { return [] }
}
// The limits switch (scripts/lib/limits.mjs, inlined because the test copies this file alone):
// while ~/slopdog/v2/LIMITS-OFF exists there is no nudge, ceiling or hard refusal.
if (existsSync(process.env.SLOPDOG_LIMITS_OFF_FILE || join(homedir(), 'slopdog/v2/LIMITS-OFF'))) process.exit(0)
let input = ''
try { input = readFileSync(0, 'utf8') } catch {}
let j = {}; try { j = JSON.parse(input) } catch {}
const path = j.transcript_path
if (!path) process.exit(0)
const DEFAULTS = { nudge: 260000, ceiling: 300000, hard: 400000 }   // 26, 30 and 40 percent of the 1M window (Todd, 2026-10-06)
const desk = process.env.SLOPDOG_DESK_DIR || (j.cwd ? deskDir(j.cwd) : '')
let tiers = {}; try { tiers = JSON.parse(readFileSync(new URL('./context-tiers.json', import.meta.url), 'utf8')) } catch {}
// One desk may move its own tiers without touching the team's (Todd, 2026-10-12): a
// <desk folder>/.context-tiers.json such as {"nudge":450000,"ceiling":500000,"hard":600000}.
try { if (desk) tiers = { ...tiers, ...JSON.parse(readFileSync(join(desk, '.context-tiers.json'), 'utf8')) } } catch {}
const env = (name, key) => Number(process.env[name] || tiers[key] || DEFAULTS[key])
const nudge = env('SLOPDOG_CONTEXT_NUDGE', 'nudge')
const ceiling = env('SLOPDOG_CONTEXT_CEILING', 'ceiling')
const hard = env('SLOPDOG_CONTEXT_HARD', 'hard')
let ctx = 0
try {
  const size = statSync(path).size, want = Math.min(size, 3_000_000), fd = openSync(path, 'r'), buf = Buffer.alloc(want)
  readSync(fd, buf, 0, want, size - want); closeSync(fd)
  for (const line of buf.toString('utf8').split('\n').reverse()) {
    if (!line.includes('"usage"')) continue
    try { const o = JSON.parse(line); const u = o?.message?.usage; if (o.type === 'assistant' && u) { ctx = (u.input_tokens || 0) + (u.cache_read_input_tokens || 0) + (u.cache_creation_input_tokens || 0); break } } catch {}
  }
} catch { process.exit(0) }
if (!ctx || ctx < nudge) process.exit(0)
const k = (n) => `${Math.round(n / 1000)}k`
const out = (additionalContext, systemMessage) =>
  console.log(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext }, systemMessage }))

// The desk folder this session runs in, or '' when it is not a desk. Walking up from cwd, the
// first folder that is a registry lane folder or holds a CLAUDE.md, skipping a department
// folder (one with a lane folder under it that is not itself a lane's, T-684: desks/build holds
// the build department's shared CLAUDE.md, while Tyrion's desk is desks/build/tyrion).
// Self-contained on purpose: the tests run this file copied alone into a scratch folder.
function deskDir(cwd) {
  let v2, desks, d
  try { v2 = realpathSync(join(homedir(), 'slopdog/v2')); desks = join(v2, 'desks'); d = realpathSync(cwd) } catch { return '' }
  const folders = laneFolders(v2)
  for (; d.startsWith(desks + '/'); d = dirname(d)) {
    if (folders.includes(d)) return d
    if (folders.some((f) => f.startsWith(d + '/'))) continue
    if (existsSync(join(d, 'CLAUDE.md'))) return d
  }
  return ''
}

const REASON = 'run /slopdog:clear-to-close unattended then self-clear.mjs, or ask Todd to OK it (he types "run on" in this pane)'
const prompt = String(j.prompt || '').trim()
// "run on": Todd's on-command override (T-644). Only a prompt typed into the pane matches; a
// Slack or inbox message arrives wrapped (<channel …>, a header line) and never starts this way.
if (desk && /^run on\b/i.test(prompt)) {
  try { writeFileSync(join(desk, '.over-ceiling'), `Todd typed "run on" at ${k(ctx)} tokens, ${new Date().toISOString()}\n${prompt.slice(0, 300)}\n`) } catch {}
}
if (ctx >= hard) {
  const clearing = /^\/(slopdog:clear-to-close|slopdog:pickup|clear)\b/.test(prompt) || prompt.includes('self-clear.mjs')
  const authorized = desk && existsSync(join(desk, '.over-ceiling'))
  const line = `CONTEXT HARD LIMIT: this session's context is about ${k(ctx)} tokens, at or past the ${k(hard)} hard limit (SLOPDOG_CONTEXT_HARD): ${REASON}.`
  if (!clearing && !authorized) {
    process.stderr.write(`${line} This prompt was refused until the desk clears (rules/desk-clear.md).\n`)
    try {
      const { notifyContextRefusal, laneFor } = await import('./context-refusal-notify.mjs')
      notifyContextRefusal({
        lane: j.cwd ? laneFor(j.cwd) : null,
        ctx,
        hard,
        prompt,
        sessionId: j.session_id,
      })
    } catch {}
    process.exit(2)
  }
  out(`${line} ${authorized ? `Todd OK'd this desk to run on (${join(desk, '.over-ceiling')} is there); the next clear deletes that file.` : 'This prompt is let through because it clears the session.'} Finish the piece in hand, then clear.`,
      `🧠 context ${k(ctx)} tokens · past the ${k(hard)} hard limit · ${authorized ? "OK'd by Todd" : 'clearing'}`)
} else if (ctx >= ceiling) {
  out(`Context is about ${k(ctx)} tokens, over target, clear at the next breakpoint: the ${k(ceiling)} ceiling (SLOPDOG_CONTEXT_CEILING) is passed. Open no new work; at the next landed step run /slopdog:clear-to-close and, when it says ready, node ~/slopdog/v2/scripts/self-clear.mjs in the same turn. At ${k(hard)} the prompt is refused.`,
      `🧠 context ${k(ctx)} tokens · over target, clear at the next breakpoint`)
} else {
  out(`Context is about ${k(ctx)} tokens, past the ${k(nudge)} nudge: aim to clear by ${k(ceiling)}. Keep PICKUP.md current; at a sensible breakpoint run /slopdog:clear-to-close, then node ~/slopdog/v2/scripts/self-clear.mjs in the same turn; after the clear the desk runs /slopdog:pickup.`,
      `🧠 context ${k(ctx)} tokens · aim to clear by ${k(ceiling)}`)
}
