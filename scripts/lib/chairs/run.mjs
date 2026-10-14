// run.mjs — run a chair's CLI headless with a hard timeout (moved from inbox-delivery-watch.mjs, T-642).
// Runs in its own process group so a timeout kills the whole tree: killing only cursor-agent's
// wrapper left its `worker-server` child running, and that worker can start just after the first
// kill, so the group is swept again three seconds later (seen 2026-09-28).
import { spawn } from 'node:child_process'

export const run = (cmd, args, cwd, timeout) => new Promise((resolve) => {
  const child = spawn(cmd, args, { cwd, detached: true, stdio: ['ignore', 'pipe', 'pipe'] })
  let stdout = '', stderr = '', killed = false
  child.stdout.on('data', (d) => { stdout += d })
  child.stderr.on('data', (d) => { stderr += d })
  const killGroup = () => { try { process.kill(-child.pid, 'SIGKILL') } catch {} }
  const timer = setTimeout(() => { killed = true; killGroup(); setTimeout(killGroup, 3000) }, timeout)
  child.on('error', (e) => { clearTimeout(timer); resolve({ err: e, stdout, stderr }) })
  child.on('close', (code) => {
    clearTimeout(timer)
    resolve({ err: killed ? { killed: true } : code ? { message: `exit ${code}` } : null, stdout, stderr })
  })
})
