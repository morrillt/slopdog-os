#!/usr/bin/env node
// pickup-guard — a non-Claude desk may write only its own PICKUP.md (Herdr.md, cell D4).
//
// On 2026-10-03 Barby (ideas-gemma, agy) rewrote Daphne's desks/ideas/PICKUP.md with
// write_to_file, and Chekov (it-gemini, agy) overwrote Scotty's. This hook refuses any file
// write or shell command that touches a PICKUP.md other than the one in the agent's own
// the registry folder. The rule itself is scripts/lib/pickup-owner.mjs; this file only adapts
// each engine's hook payload and answer.
//
//   pickup-guard.mjs agy      ~/.gemini/config/hooks.json, PreToolUse (write_to_file,
//                             replace_file_content, multi_replace_file_content, run_command)
//   pickup-guard.mjs cursor   ~/.cursor/hooks.json, preToolUse (Write|Delete) and
//                             beforeShellExecution
//   pickup-guard.mjs grok     ~/.grok/hooks/pickup-guard.json, PreToolUse
//
// The agent's folder is the payload's cwd (Grok sends one), else the cwd of the nearest ancestor
// process not sitting in the hook's own directory (the agy or cursor-agent process started in the
// desk folder; the hook itself runs in the engine's config dir), else the workspace root. Any
// error fails open: the guard must never stop a desk working because of its own bug. Refusals
// are logged to ~/.local/state/slopdog-pickup-guard.log. PICKUP_GUARD_TRACE=<file> appends
// every payload to <file>, for checking what an engine sends.
import { appendFileSync, readFileSync, readlinkSync } from 'node:fs'
import { join } from 'node:path'
import { commandProblem, writeProblem } from '../../../scripts/lib/pickup-owner.mjs'

const engine = process.argv[2]

const answer = {
  // agy blocks the tool when the answer has no decision (seen 2026-10-03), so allow says so.
  agy: { allow: () => ({ decision: 'allow' }), deny: (reason) => ({ decision: 'deny', reason }) },
  cursor: { allow: () => ({ permission: 'allow' }), deny: (reason) => ({ permission: 'deny', user_message: reason, agent_message: reason }) },
  grok: { allow: () => null, deny: (reason) => ({ decision: 'deny', reason }) },
}[engine]

function finish(reason) {
  if (!answer) process.exit(0)
  const out = reason ? answer.deny(reason) : answer.allow()
  if (out) process.stdout.write(JSON.stringify(out) + '\n')
  if (reason) {
    process.stderr.write(reason + '\n')
    try {
      const log = join(process.env.HOME, '.local/state/slopdog-pickup-guard.log')
      appendFileSync(log, `${new Date().toISOString()} ${engine} ${process.env.HERDR_PANE_ID || '-'} ${reason}\n`)
    } catch {}
  }
  process.exit(reason ? 2 : 0)
}

// agy sends tool args JSON-encoded a second time ("\"/path\""); take either form.
const unquote = (v) => {
  if (typeof v !== 'string') return v
  if (v.startsWith('"')) { try { return JSON.parse(v) } catch {} }
  return v
}

// The engine process's cwd: the nearest ancestor whose cwd differs from this hook's own (agy runs
// hooks in ~/.gemini/config and cursor-agent in ~/.cursor; the engine sits in the desk folder).
function engineCwd() {
  const mine = process.cwd()
  let pid = process.ppid
  for (let i = 0; i < 12 && pid > 1; i++) {
    try {
      const cwd = readlinkSync(`/proc/${pid}/cwd`)
      if (cwd !== mine) return cwd
      const stat = readFileSync(`/proc/${pid}/stat`, "utf8")
      pid = Number(stat.slice(stat.lastIndexOf(")") + 2).split(" ")[1])
    } catch { break }
  }
  return undefined
}

try {
  const raw = readFileSync(0, 'utf8') || '{}'
  if (process.env.PICKUP_GUARD_TRACE) appendFileSync(process.env.PICKUP_GUARD_TRACE, raw.trim() + '\n')
  const input = JSON.parse(raw)
  const tool = input.toolCall || {}
  const args = Object.fromEntries(Object.entries(tool.args || input.tool_input || input.toolInput || {}).map(([k, v]) => [k, unquote(v)]))
  const cwd = input.cwd || engineCwd() || input.workspacePaths?.[0] || input.workspace_roots?.[0] || input.workspaceRoot || process.cwd()
  const ctx = { cwd, engine }

  const command = input.command || args.CommandLine || args.command || args.cmd
  if (command) finish(commandProblem(String(command), { ...ctx, cwd: unquote(args.Cwd) || input.cwd || cwd }))

  const targets = [args.TargetFile, args.file_path, args.target_file, args.path, args.filePath]
  for (const t of targets.filter((t) => typeof t === 'string')) {
    const why = writeProblem(t.replace(/^file:\/\//, ''), ctx)
    if (why) finish(why)
  }
  finish('')
} catch (e) {
  try { process.stderr.write(`pickup-guard: failed open: ${e.message}\n`) } catch {}
  finish('')
}
