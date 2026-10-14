// hook-wiring.mjs — when hooks.json was committed after this Claude process started, the
// desk's in-memory plugin wiring is stale until /reload-plugins. Compares git's last commit
// on hooks.json to the claude process start time, and remembers which commit was last applied
// so a reload is not retyped every turn (T-559-3).

import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync, openSync, closeSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const HOOKS_JSON_GIT_PATH = 'v2/plugins/slopdog/hooks/hooks.json'

export function slopdogRootFromV2(v2Dir) {
  return join(v2Dir, '..')
}

export function hooksJsonCommit(slopdogRoot, hooksGitPath = HOOKS_JSON_GIT_PATH) {
  try {
    const out = execFileSync(
      'git',
      ['-C', slopdogRoot, 'log', '-1', '--format=%ct%x00%H', '--', hooksGitPath],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] },
    ).trim()
    if (!out) return null
    const [ts, hash] = out.split('\0')
    const committedAtMs = Number(ts) * 1000
    if (!hash || !Number.isFinite(committedAtMs)) return null
    return { hash, committedAtMs }
  } catch {
    return null
  }
}

export function processStartMs(pid) {
  try {
    const stat = readFileSync(`/proc/${pid}/stat`, 'utf8')
    const close = stat.lastIndexOf(')')
    const rest = stat.slice(close + 2).split(' ')
    const startTick = Number(rest[19])
    const hz = Number(execFileSync('getconf', ['CLK_TCK'], { encoding: 'utf8' }).trim())
    const boot = Number(readFileSync('/proc/stat', 'utf8').match(/^btime (\d+)/m)?.[1])
    if (!startTick || !hz || !boot) return null
    return (boot + startTick / hz) * 1000
  } catch {
    return null
  }
}

export function claudePid() {
  let pid = process.ppid
  for (let i = 0; i < 6 && pid > 1; i++) {
    try {
      const line = execFileSync('ps', ['-o', 'ppid=,comm=', '-p', String(pid)], { encoding: 'utf8' }).trim()
      const [ppid, ...comm] = line.split(/\s+/)
      if (/claude/i.test(comm.join(' '))) return pid
      pid = Number(ppid)
    } catch {
      break
    }
  }
  return process.ppid
}

export function stateDir() {
  return join(homedir(), '.local', 'state', 'slopdog-hook-wiring')
}

export function statePath(claude) {
  return join(stateDir(), `${claude}.json`)
}

export function readState(claude) {
  try {
    return JSON.parse(readFileSync(statePath(claude), 'utf8'))
  } catch {
    return {}
  }
}

export function writeState(claude, patch) {
  mkdirSync(stateDir(), { recursive: true })
  const next = { ...readState(claude), ...patch }
  writeFileSync(statePath(claude), JSON.stringify(next))
  return next
}

// True when hooks.json's last commit is newer than this claude process and we have not yet
// reloaded for that commit.
export function wiringIsStale({ committedAtMs, processStartMs, appliedCommit, commitHash }) {
  if (!commitHash || !Number.isFinite(committedAtMs) || !Number.isFinite(processStartMs)) return false
  if (committedAtMs <= processStartMs) return false
  if (appliedCommit === commitHash) return false
  return true
}

export function takeWatcherLock(claude) {
  mkdirSync(stateDir(), { recursive: true })
  const lock = join(stateDir(), `watch-${claude}.lock`)
  try {
    const fd = openSync(lock, 'wx')
    writeFileSync(fd, String(process.pid))
    closeSync(fd)
    return lock
  } catch {
    return null
  }
}

export function releaseWatcherLock(lock, pid = process.pid) {
  if (!lock) return
  try {
    if (readFileSync(lock, 'utf8').trim() === String(pid)) unlinkSync(lock)
  } catch {}
}
