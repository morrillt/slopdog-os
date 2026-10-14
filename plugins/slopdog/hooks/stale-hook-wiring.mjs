#!/usr/bin/env node
// stale-hook-wiring — types /reload-plugins into this desk's own pane when hooks.json was
// committed after the claude process started and the wiring in memory is still old (T-559-3).
// Registered in hooks.json on SessionStart (record-loaded), UserPromptSubmit and Stop.
//
// Compares git's last commit time on v2/plugins/slopdog/hooks/hooks.json to the claude
// process start time; when the commit is newer and this process has not reloaded for that
// commit yet, a detached --watch child polls until the pane is idle, then types
// /reload-plugins through scripts/lib/desk-pane.mjs (herdr send-text or tmux send-keys).
import { execFileSync, spawn } from 'node:child_process'
import { readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  claudePid,
  hooksJsonCommit,
  processStartMs,
  readState,
  releaseWatcherLock,
  slopdogRootFromV2,
  takeWatcherLock,
  wiringIsStale,
  writeState,
} from '../../../scripts/lib/hook-wiring.mjs'
import { findDeskPane, isIdleEmptyPrompt, selfPaneProblem, targetOf, typeLine } from '../../../scripts/lib/desk-pane.mjs'

const V2 = realpathSync(join(dirname(fileURLToPath(import.meta.url)), '..', '..', '..'))
const SLOPDOG = slopdogRootFromV2(V2)
const POLL_MS = Number(process.env.SLOPDOG_HOOK_WIRING_POLL_MS || 500)
const RELOAD_LINE = '/reload-plugins'

let payload = {}
try { payload = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch {}

function interactiveDesk() {
  if (process.env.BROZ_TURNLOG) return false
  if (process.env.CLAUDE_JOB_DIR) return false
  const session = claudePid()
  try {
    const args = ` ${execFileSync('ps', ['-o', 'args=', '-p', String(session)], { encoding: 'utf8' }).trim()} `
    if (/ (-p|--print)( |=)/.test(args)) return false
  } catch {}
  return true
}

function recordLoaded(claude, commit) {
  if (!commit?.hash) return
  writeState(claude, { appliedCommit: commit.hash })
}

let watchDeskDir = ''

function tryReloadNow(target, claude, commit) {
  const why = isIdleEmptyPrompt(target)
  if (why) return false
  const deskDir = watchDeskDir || payload.cwd || process.cwd()
  const wrong = selfPaneProblem(target, deskDir)
  if (wrong) return false
  try {
    typeLine(target, RELOAD_LINE)
    writeState(claude, { appliedCommit: commit.hash })
    return true
  } catch {
    return false
  }
}

async function watchAndReload(pane, claude, commit) {
  const lock = takeWatcherLock(claude)
  if (!lock) process.exit(0)
  const target = targetOf(pane)
  const pause = (ms) => new Promise((r) => setTimeout(r, ms))
  try {
    for (;;) {
      if (!process.kill(claude, 0)) break
      if (tryReloadNow(target, claude, commit)) break
      await pause(POLL_MS)
    }
  } finally {
    releaseWatcherLock(lock)
  }
}

function scheduleReload(target, claude, commit, deskDir) {
  if (tryReloadNow(target, claude, commit)) return
  spawn(process.execPath, [fileURLToPath(import.meta.url), '--watch', target.pane, String(claude), commit.hash, deskDir], {
    detached: true,
    stdio: 'ignore',
  }).unref()
}

function checkAndMaybeReload() {
  if (!interactiveDesk()) return
  const prompt = String(payload.prompt || '').trim()
  if (prompt === RELOAD_LINE || prompt.startsWith(`${RELOAD_LINE} `)) return
  const claude = claudePid()
  const commit = hooksJsonCommit(SLOPDOG)
  if (!commit) return
  const startMs = processStartMs(claude)
  const appliedCommit = readState(claude).appliedCommit
  if (!wiringIsStale({ committedAtMs: commit.committedAtMs, processStartMs: startMs, appliedCommit, commitHash: commit.hash })) {
    return
  }
  const self = findDeskPane(null, { self: true })
  if (!self) return
  scheduleReload(self, claude, commit, payload.cwd || process.cwd())
}

// ---- modes
const args = process.argv.slice(2)
if (args[0] === '--watch') {
  const [, pane, claudeStr, hash, deskDir] = args
  watchDeskDir = deskDir || ''
  const claude = Number(claudeStr)
  const commit = hooksJsonCommit(SLOPDOG) || { hash }
  if (commit.hash !== hash) {
    // hooks.json moved again while waiting; still reload for the latest commit.
    commit.hash = hooksJsonCommit(SLOPDOG)?.hash || hash
  }
  await watchAndReload(pane, claude, commit)
  process.exit(0)
}

if (args[0] === 'record-loaded') {
  if (!interactiveDesk()) process.exit(0)
  recordLoaded(claudePid(), hooksJsonCommit(SLOPDOG))
  process.exit(0)
}

checkAndMaybeReload()
process.exit(0)
