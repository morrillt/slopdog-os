// clear-watch.mjs — the detached half of a self-clear, shared by scripts/self-clear.mjs and
// plugins/pickup/scripts/self-clear.mjs: wait for the pane to show the cleared prompt, then
// type the pickup line. See self-clear.mjs for why the pickup line is not simply queued.
import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { herdrBusy, isCleared, isRunning, notIdle, readPane, sessionOf, PICKUP_PENDING } from './desk-pane.mjs'

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

// Kills every other `self-clear.mjs --watch <pane>` process, read from /proc rather than
// `pkill -f`, whose pattern would also match the shell that launched it. The pane id is matched
// as a whole argv element, so herdr ids (`w1:p1C`) and tmux ids (`%5`) never collide. Returns
// the pids it killed.
export function retireOlderWatchers(pane, { machine, log = console.log, procDir = '/proc' } = {}) {
  const killed = []
  for (const pid of readdirSync(procDir).filter((d) => /^\d+$/.test(d))) {
    if (Number(pid) === process.pid) continue
    let argv
    try { argv = readFileSync(`${procDir}/${pid}/cmdline`, 'utf8').split('\0') } catch { continue }
    const at = argv.findIndex((a) => a.endsWith('self-clear.mjs'))
    if (at === -1 || argv[at + 1] !== '--watch' || argv[at + 2] !== pane) continue
    const watcherMachine = argv[at + 4] || undefined
    if (machine ? watcherMachine !== machine : Boolean(watcherMachine)) continue
    try { process.kill(Number(pid)); killed.push(Number(pid)); log(`retired an older watcher on ${pane} (pid ${pid})`) } catch {}
  }
  return killed
}

// Polls `target` until the clear has taken, then calls send(). Returns the process exit code:
// 0 sent or sequence over, 1 pane gone or timed out. Quits, typing nothing, when `note` was
// rewritten (a later clear owns the sequence).
//
// In herdr the clear has taken when the pane's Claude session id changes. The pickup line is then
// typed at once, even if the desk is already working: Claude Code queues a line typed mid-turn and
// runs it next, so the pickup can no longer be lost. Waiting for idle lost it on 2026-10-03: an async
// Stop hook from the pre-clear turn (turn-commit's asyncRewake) woke the fresh session first, the
// screen never showed the cleared prompt again, and the watcher waited forever.
// In tmux (no session id) it is the screen: the cleared prompt, idle; and it quits when the pane
// went idle and then started another turn (the /clear did not take).
export function watchForClear({ target, note, send, timeoutMs = 15 * 60 * 1000, pollMs = 500, settleMs = 400 }) {
  const noteStamp = () => (existsSync(note) ? statSync(note).mtimeMs : 0)
  const stampAtStart = noteStamp()
  // Hold every other waker until the pickup has run (desk-pane.mjs pickupPending).
  try { writeFileSync(join(dirname(note), PICKUP_PENDING), new Date().toISOString() + '\n') } catch {}
  const deadline = Date.now() + timeoutMs
  let idlePolls = 0
  const sessionAtStart = sessionOf(target)
  while (Date.now() < deadline) {
    if (noteStamp() !== stampAtStart) return 0
    if (sessionAtStart) {
      const now = sessionOf(target)
      if (now && now !== sessionAtStart) { pause(settleMs * 5); send(); return 0 }
      pause(pollMs)
      continue
    }
    let capture
    try { capture = readPane(target, { ansi: true }) } catch { return 1 }
    const busy = herdrBusy(target)
    if (isCleared(capture) && !busy) {
      pause(settleMs)
      send()
      return 0
    }
    if (notIdle(capture) === '' && !busy) idlePolls++
    else if (idlePolls >= 2 && isRunning(capture)) return 0
    pause(pollMs)
  }
  return 1
}
