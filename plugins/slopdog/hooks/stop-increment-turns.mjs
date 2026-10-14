#!/usr/bin/env node
// stop-increment-turns — on Claude desk Stop, bump `turns:` on the 🟡 ticket this lane holds (T-480).
// Headless runs (claude -p, BROZ_TURNLOG, background jobs) exit 0 without touching tickets.
import { readLanesDocument } from '../../../scripts/lib/registry.mjs'
import { readFileSync, writeFileSync, readdirSync, realpathSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
const V2 = join(dirname(realpathSync(fileURLToPath(import.meta.url))), '..', '..', '..')
function ticketsDir(env = process.env) {
  return env.SLOPDOG_TICKETS_DIR || join(homedir(), 'slopdog', 'tasks', 'tickets')
}
const FRONT = /^---\r?\n([\s\S]*?)\r?\n---/
const STATUS_DOING = /^(T-[\w.-]+) · 🟡/m

export function isHeadless(env, sessionPid) {
  if (env.BROZ_TURNLOG) return true
  if (env.CLAUDE_JOB_DIR) return true
  if (env.SLOPDOG_HOOK_INTERACTIVE) return false
  if (!sessionPid) return false
  try {
    const args = ` ${execFileSync('ps', ['-o', 'args=', '-p', String(sessionPid)], { encoding: 'utf8' }).trim()} `
    if (/ (-p|--print)( |=)/.test(args)) return true
  } catch {}
  return false
}

export function claudePid(startPid) {
  let pid = startPid
  for (let i = 0; i < 6 && pid > 1; i++) {
    try {
      const [ppid, ...comm] = execFileSync('ps', ['-o', 'ppid=,comm=', '-p', String(pid)], { encoding: 'utf8' }).trim().split(/\s+/)
      if (/claude/i.test(comm.join(' '))) return pid
      pid = Number(ppid)
    } catch { break }
  }
  return startPid
}

function deskLane(cwd) {
  if (!cwd) return null
  let lanes = {}
  try { lanes = readLanesDocument({ v2: V2 }) } catch { return null }
  let real = cwd
  try { real = realpathSync(cwd) } catch {}
  let best = null
  for (const [lane, v] of Object.entries(lanes)) {
    if (!v || typeof v !== 'object' || !v.folder) continue
    let folder
    try { folder = realpathSync(join(V2, v.folder)) } catch { continue }
    if ((real === folder || real.startsWith(folder + '/')) && (!best || folder.length > best.len)) {
      best = { lane, len: folder.length }
    }
  }
  return best?.lane ?? null
}

export function incrementTurnsInTicket(text) {
  const m = text.match(FRONT)
  if (!m) return text
  const lines = m[1].split('\n')
  const i = lines.findIndex((l) => /^turns:\s*/.test(l))
  const next = i === -1 ? 1 : (Number(lines[i].replace(/^turns:\s*/, '')) || 0) + 1
  if (i === -1) lines.push(`turns: ${next}`)
  else lines[i] = `turns: ${next}`
  return text.replace(m[0], `---\n${lines.join('\n')}\n---`)
}

export function findDoingTicketForWorker(ticketsDir, workerLane) {
  let files = []
  try { files = readdirSync(ticketsDir).filter((f) => f.endsWith('.md')) } catch { return null }
  for (const f of files) {
    let text
    try { text = readFileSync(join(ticketsDir, f), 'utf8') } catch { continue }
    if (!STATUS_DOING.test(text)) continue
    const worker = (text.match(/^worker:\s*(\S+)/m) || [])[1]
    if (worker === workerLane) return { path: join(ticketsDir, f), text }
  }
  return null
}

export function runStopIncrement(payload, env = process.env) {
  const session = claudePid(process.ppid)
  if (isHeadless(env, session)) return { skipped: 'headless' }
  const lane = deskLane(payload.cwd)
  if (!lane) return { skipped: 'no-desk' }
  const hit = findDoingTicketForWorker(ticketsDir(env), lane)
  if (!hit) return { skipped: 'no-ticket' }
  const updated = incrementTurnsInTicket(hit.text)
  if (updated === hit.text) return { skipped: 'unchanged' }
  writeFileSync(hit.path, updated)
  return { ok: true, path: hit.path }
}

const isMain = process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
if (isMain) {
  let payload = {}
  try { payload = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch {}
  try {
    runStopIncrement(payload)
  } catch {
    // Never block Stop.
  }
  process.exit(0)
}
