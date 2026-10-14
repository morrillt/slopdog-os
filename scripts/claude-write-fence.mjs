#!/usr/bin/env node
// PreToolUse write fence for headless `claude -p` builds that dispatch.mjs starts (T-749 quick task).
// dispatch passes it with `--settings` and the env DISPATCH_FENCE_ROOT (the worktree) and
// DISPATCH_FENCE_ALLOW (extra allowed paths, colon-separated: the ticket file, task-list.md, the jobs dir).
// Hooks run in every permission mode, --dangerously-skip-permissions included; exit 2 blocks the call.
// Edit/Write/NotebookEdit: the target path must be inside the worktree, an allowed path, or /tmp.
// Bash: a command with a write sign (>, tee, sed -i, cp, mv, rm, touch, mkdir, ln, git add/commit/…)
// that names an absolute or ~ path outside those, or cds outside them, is refused. Not covered:
// writes made through variables, subshell-built paths, scripts that write on their own (node -e, python).
import { readFileSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve, dirname, basename, join } from 'node:path'

const root = process.env.DISPATCH_FENCE_ROOT
if (!root) process.exit(0)
let input = {}
try { input = JSON.parse(readFileSync(0, 'utf8')) } catch { process.exit(0) }
const tool = input.tool_name || ''
const ti = input.tool_input || {}
const cwd = input.cwd || root

const canon = (p) => {
  let abs = resolve(cwd, p.replace(/^~(?=\/|$)/, homedir()))
  // Resolve through symlinks (~/slopdog -> /storage/...), walking up until a part exists.
  let tail = ''
  for (let d = abs; ; d = dirname(d)) {
    try { return join(realpathSync(d), tail) } catch {}
    if (d === dirname(d)) return abs
    tail = tail ? join(basename(d), tail) : basename(d)
  }
}
const allowed = [root, '/tmp', '/dev/null', ...(process.env.DISPATCH_FENCE_ALLOW || '').split(':').filter(Boolean)].map(canon)
const inside = (p) => { const c = canon(p); return allowed.some((a) => c === a || c.startsWith(a + '/')) }
const refuse = (what) => {
  process.stderr.write(`write fence: ${what} is outside your worktree ${root}. Write only inside the worktree (plus the ticket file and task-list.md).\n`)
  process.exit(2)
}

if (['Edit', 'Write', 'MultiEdit', 'NotebookEdit'].includes(tool)) {
  const p = ti.file_path || ti.notebook_path
  if (p && !inside(p)) refuse(p)
} else if (tool === 'Bash') {
  const cmd = String(ti.command || '')
  const writes = /(^|[^0-9&<])>{1,2}(?!&)|\btee\b|\bsed\s+(-\w*\s+)*-i|\b(cp|mv|rm|rmdir|touch|mkdir|ln|install|truncate|chmod|rsync|dd)\b|\bgit\b.*\b(add|commit|push|checkout|reset|restore|stash|rm|mv|apply|am|merge|rebase|clean|switch)\b|\bnpm\s+(i|install|ci)\b/.test(cmd)
  if (writes) {
    const paths = cmd.match(/(?<![\w.-])(~|\/)[^\s'";|&<>()`]*/g) || []
    for (const p of paths) {
      if (p === '/' || /^\/(usr|bin|etc|proc|sys|lib|opt|dev)(\/|$)/.test(p)) continue
      if (!inside(p)) refuse(`Bash path ${p}`)
    }
  }
}
process.exit(0)
