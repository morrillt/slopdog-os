#!/usr/bin/env node
// mode — the crew mode (SessionStart startup|resume|clear, UserPromptSubmit). Reads the one
// mode file, ~/slopdog/v2/mode.json (`{mode, until, set_by, note}`; T-264, T-643), and prints
// one sentence of context per mode so every desk behaves the same way on every prompt.
// spend (while `until` is still ahead): take initiative, spawn freely. conserve: short replies,
// one agent at a time, spawn only what a skill's own step calls for, and read with the cheapest
// sidekick that can do it. normal: standard house delegation and reply cap.
// Missing, unreadable, expired, or unknown mode values default to normal.
//
// The budget half: ~/.claude/statusline.py writes the rate_limits object it gets on every refresh
// to ~/.local/state/slopdog/usage.json; when that file is under ten minutes old, the five-hour
// percentage is appended ("five-hour window at 34%"). Flipping the mode from the number stays
// Todd's call, through /slopdog:mode. Override the file with SLOPDOG_MODE_FILE (tests). Plain
// stdout, exit 0 always; runs through scoped.mjs.
//
// The desk's standing focus (T-711): when the session's desk folder (found from stdin `cwd` the
// way context-rot.mjs finds it) holds a `current-focus.md`, its text is printed after the mode
// line, so a desk's standing orders ride every prompt and every start, clear, resume and compact.
import { createRequire } from 'node:module'
import { readFileSync, statSync, existsSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'

let hook = {}
try { hook = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch {}

// The desk folder for cwd, or '': walking up inside ~/slopdog/v2/desks/, the first registry lane
// folder or folder holding a CLAUDE.md, skipping a department folder with lane folders under it.
function deskDir(cwd) {
  let v2, desks, d
  try { v2 = realpathSync(join(homedir(), 'slopdog/v2')); desks = join(v2, 'desks'); d = realpathSync(cwd) } catch { return '' }
  let folders = []
  try {
    const { readLanesDocument } = createRequire(import.meta.url)('../../../scripts/lib/registry.mjs')
    folders = Object.values(readLanesDocument({ v2 }))
      .filter((l) => l && typeof l === 'object' && l.folder).map((l) => join(v2, l.folder))
  } catch {}
  for (; d.startsWith(desks + '/'); d = dirname(d)) {
    if (folders.includes(d)) return d
    if (folders.some((f) => f.startsWith(d + '/'))) continue
    if (existsSync(join(d, 'CLAUDE.md'))) return d
  }
  return ''
}

const REPLY_CAP =
  '. Reply cap: at most three tweet-length paragraphs, answer first; anything longer is a report he asks for, not a long reply'

const modeFile = process.env.SLOPDOG_MODE_FILE || join(homedir(), 'slopdog', 'v2', 'mode.json')

let record
try {
  record = JSON.parse(readFileSync(modeFile, 'utf8'))
} catch {
  record = null
}
if (!record || typeof record !== 'object') record = null

const untilMs = record ? Date.parse(record.until || '') : NaN
const untilValid = Number.isFinite(untilMs) && untilMs > Date.now()

const effectiveMode = () => {
  if (!record || !untilValid) return 'normal'
  const name = record.mode
  if (name === 'spend' || name === 'normal' || name === 'conserve') return name
  return 'normal'
}

const mode = effectiveMode()

let line
if (mode === 'spend') {
  const local = new Date(untilMs).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
  line =
    `Mode: spend until ${local} local (${record.until}). Take initiative, put questions on tickets instead of asking, use subagents and sidekicks freely, never block on Todd`
} else if (mode === 'conserve') {
  line =
    'Mode: conserve. Keep replies short and plain, one agent at a time, spawn only what a skill\'s own step calls for (the pickup\'s subagent, say), and send reading to the cheapest sidekick that can do it'
} else {
  line =
    'Mode: normal. Standard house delegation, keep replies short, use sidekicks for reading, have Claude check cheap builders before you trust their output'
}

line += REPLY_CAP

let budget = ''
try {
  const usage = join(homedir(), '.local', 'state', 'slopdog', 'usage.json')
  if (Date.now() - statSync(usage).mtimeMs < 10 * 60 * 1000) {
    const pct = JSON.parse(readFileSync(usage, 'utf8'))?.five_hour?.used_percentage
    if (typeof pct === 'number') budget = `; five-hour window at ${Math.round(pct)}%`
  }
} catch {}

console.log(`${line}${budget}.`)

try {
  const desk = hook.cwd ? deskDir(hook.cwd) : ''
  const focus = desk ? readFileSync(join(desk, 'current-focus.md'), 'utf8').trim() : ''
  if (focus) console.log(focus)
} catch {}
