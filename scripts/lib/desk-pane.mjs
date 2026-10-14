// desk-pane.mjs — find a desk's pane, read it, and type into it, in herdr first and tmux
// second. One module so self-clear.mjs, dispatch.mjs and unstucker.mjs stop each carrying
// their own `tmux list-panes … @peak_lane` lookup (Todd, 2026-10-03: tmux is being closed and
// herdr is where the desks work now).
//
// A target is `{ world: 'herdr' | 'tmux', pane }`. A herdr pane id looks like `w1:p1C`, a tmux
// one like `%5`, so `targetOf(id)` can tell the two apart from the id alone (the self-clear
// watcher gets only the id on its argv).
//
// Lookup order, `findDeskPane(lane)`:
//   1. herdr, when the `herdr` CLI answers: the pane labelled `<Name> (<lane>)` (durable across a
//      /clear), then the agent named `herdr-<lane>` (herdr drops that name when the session changes).
//   2. tmux, only while a tmux server still exists: the pane whose `@peak_lane` is the lane.
// `findDeskPane(lane, { self: true })` is a desk acting on its own pane: `HERDR_PANE_ID` when
// `HERDR_ENV=1`, else `$TMUX_PANE`.
//
// Typing. herdr: `herdr pane send-text <pane> <text>`, a pause, `herdr pane send-keys <pane>
// Enter`, not `herdr agent prompt`. Why: the callers type into a Claude desk mid-turn (where
// Claude Code queues the line, and `agent prompt` would wait on or reject a working agent), into
// a cleared prompt, and into a plain shell pane (dispatch.mjs), and only send-text works for all
// three. The pause matters: Claude Code
// reads keys that arrive within a few ms as one paste, and an Enter inside a paste is a newline,
// not a submit (self-clear.mjs, 2026-09-24).
//
// Read before type. `send-text` appends to whatever is already at the prompt (seen 2026-09-28,
// pane w1:pA), so `typeLine` reads the pane first and refuses when a Claude Code input box
// holds real unsent text. Claude Code's dim grey suggestion (`\e[2m` after the `❯`) is not
// typed input and does not count.
//
// A fresh pane answers `agent_pane_busy` for about a second; every herdr call retries on it.
//
// Test seams: HERDR_BIN_PATH (herdr sets it itself inside a pane) and SLOPDOG_TMUX_BIN.

import { spawnSync } from 'node:child_process'
import { assertNamedHerdrAgentPane, sendTextToNamedPane } from './pane-target-guard.mjs'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readLanesDocument, resolveRegistryFilePath } from './registry.mjs'
import { promptScan, unsentText, notIdle } from './chairs/claude-prompt.mjs'
import { clearProblemFor } from './chairs/index.mjs'
import { herdrArgv, machineForLane, isRemoteMachine } from './chairs/herdr-route.mjs'

const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)
const herdrBin = () => process.env.HERDR_BIN_PATH || 'herdr'
const tmuxBin = () => process.env.SLOPDOG_TMUX_BIN || 'tmux'

export const targetOf = (pane, machine) => ({ world: /^%\d+$/.test(String(pane)) ? 'tmux' : 'herdr', pane: String(pane), ...(machine ? { machine } : {}) })

// ---- herdr transport

// Runs one herdr command, retrying `agent_pane_busy`. Returns parsed JSON when the output is
// JSON, else the text. Throws an Error carrying `.code` (herdr's error code) on failure.
export function herdr(args, { retries = 10, retryMs = 500 } = {}) {
  for (let attempt = 0; ; attempt++) {
    const r = spawnSync(herdrBin(), args, { encoding: 'utf8' })
    if (r.error) { const e = new Error(`herdr unavailable: ${r.error.message}`); e.code = 'herdr_unavailable'; throw e }
    const out = `${r.stdout || ''}`.trim()
    let json = null
    try { json = JSON.parse(out || `${r.stderr || ''}`.trim()) } catch {}
    const code = json?.error?.code
    if (r.status === 0 && !code) return json ?? out
    if (code === 'agent_pane_busy' && attempt < retries) { pause(retryMs); continue }
    const e = new Error(`herdr ${args.slice(0, 2).join(' ')}: ${json?.error?.message || out || r.stderr || `exit ${r.status}`}`.trim())
    e.code = code || 'herdr_failed'
    throw e
  }
}

// The durable herdr reference, the equivalent of tmux's @peak_lane: the pane label, set at launch
// to `<Name> (<lane>)` (herdr-swarm.mjs, herdr-desk-windows.mjs). A label lives on the pane, so a
// /clear, which makes herdr see a new agent and drop the agent name (Daphne, 2026-10-03), keeps it.
// [{ pane, lane, status, agent }] for every pane whose label ends in `(<lane>)`, or null without herdr.
export const LANE_LABEL = /\(([a-z0-9][a-z0-9-]*)\)\s*$/
export function herdrLanePanes(machine) {
  try {
    const args = herdrArgv(machine, 'pane', 'list')
    const panes = herdr(args, { retries: 2 })?.result?.panes ?? []
    return panes.flatMap((p) => {
      const m = LANE_LABEL.exec(p.label || '')
      return m ? [{ pane: p.pane_id, lane: m[1], status: p.agent_status, agent: p.agent }] : []
    })
  } catch { return null }
}

// Every herdr agent, or null when herdr is not reachable (no binary, no server).
export function herdrAgents(machine) {
  try {
    const args = herdrArgv(machine, 'agent', 'list')
    return herdr(args, { retries: 2 })?.result?.agents ?? []
  } catch { return null }
}

// ---- tmux transport

const tmux = (...a) => {
  const r = spawnSync(tmuxBin(), a, { encoding: 'utf8' })
  if (r.error || r.status !== 0) throw new Error(`tmux ${a[0]}: ${(r.stderr || r.error?.message || '').trim()}`)
  return r.stdout
}

// [{ pane, lane, inMode }] for every tmux pane carrying @peak_lane, or null with no tmux server.
export function tmuxLanePanes() {
  try {
    return tmux('list-panes', '-a', '-F', '#{pane_id}\t#{pane_in_mode}\t#{@peak_lane}')
      .trim().split('\n').filter(Boolean)
      .map((l) => { const [pane, inMode, lane] = l.split('\t'); return { pane, lane, inMode: inMode === '1' } })
      .filter((p) => p.lane)
  } catch { return null }
}

// ---- lookup

export function resolveMachineForLane(lane) {
  if (!lane) return null
  if (typeof lane === 'object') return machineForLane(lane)
  try {
    const doc = readLanesDocument()
    const laneObj = doc.lanes?.[lane] || doc[lane]
    return machineForLane(laneObj)
  } catch { return null }
}

// { world, pane, status?, agent?, name?, machine? } for the lane's desk pane, or null.
export function findDeskPane(lane, { self = false } = {}) {
  const env = process.env
  if (self) {
    if (env.HERDR_ENV === '1' && env.HERDR_PANE_ID) return { world: 'herdr', pane: env.HERDR_PANE_ID }
    if (env.TMUX_PANE) return { world: 'tmux', pane: env.TMUX_PANE }
    return null
  }
  const key = typeof lane === 'string' ? lane : (lane?.key ?? lane?.id ?? '')
  const machine = resolveMachineForLane(lane)
  // Two panes claiming one lane (a hand-restarted pane labelled by hand) is refused, never a
  // silent first match: typing into the wrong one is the wrong-pane class of bug (Herdr.md, 28).
  const claims = herdrLanePanes(machine)?.filter((p) => p.lane === key) ?? []
  if (claims.length > 1) { process.stderr.write(`desk-pane: ${claims.length} panes are labelled (${key}): ${claims.map((c) => c.pane).join(', ')}; refusing to pick one\n`); return null }
  const byLabel = claims[0]
  if (byLabel) return { world: 'herdr', pane: byLabel.pane, status: byLabel.status, agent: byLabel.agent, name: `herdr-${key}`, ...(machine ? { machine } : {}) }
  const agents = herdrAgents(machine)
  const hit = agents?.find((a) => a.name === `herdr-${key}`)
  if (hit) return { world: 'herdr', pane: hit.pane_id, status: hit.agent_status, agent: hit.agent, name: hit.name, ...(machine ? { machine } : {}) }
  if (!isRemoteMachine(machine)) {
    const t = tmuxLanePanes()?.find((p) => p.lane === key)
    return t ? { world: 'tmux', pane: t.pane, inMode: t.inMode } : null
  }
  return null
}

// The lane the calling process runs in, or null: `SLOPDOG_LANE` wins, then (herdr) the agent whose
// pane is `$HERDR_PANE_ID`, named `herdr-<lane>`, then (tmux) `$TMUX_PANE`'s `@peak_lane`.
export function selfLane() {
  const env = process.env
  if (env.SLOPDOG_LANE) return env.SLOPDOG_LANE
  if (env.HERDR_ENV === '1' && env.HERDR_PANE_ID) {
    const l = herdrLanePanes()?.find((p) => p.pane === env.HERDR_PANE_ID)
    if (l) return l.lane
    const a = herdrAgents()?.find((x) => x.pane_id === env.HERDR_PANE_ID && x.name?.startsWith('herdr-'))
    if (a) return a.name.slice('herdr-'.length)
  }
  if (env.TMUX_PANE) return tmuxLanePanes()?.find((p) => p.pane === env.TMUX_PANE)?.lane ?? null
  return null
}

// Every desk pane: herdr agents named `herdr-<lane>`, then the tmux @peak_lane panes for lanes
// herdr does not already have, so one desk is never listed (or nudged) twice.
export function listDeskPanes() {
  const out = []
  for (const p of herdrLanePanes() ?? []) out.push({ world: 'herdr', pane: p.pane, lane: p.lane, status: p.status, agent: p.agent, inMode: false })
  for (const a of herdrAgents() ?? []) {
    if (!a.name?.startsWith('herdr-')) continue
    if (out.some((p) => p.pane === a.pane_id || p.lane === a.name.slice('herdr-'.length))) continue
    out.push({ world: 'herdr', pane: a.pane_id, lane: a.name.slice('herdr-'.length), status: a.agent_status, agent: a.agent, inMode: false })
  }
  const seen = new Set(out.map((p) => p.lane))
  for (const t of tmuxLanePanes() ?? []) if (!seen.has(t.lane)) out.push({ world: 'tmux', ...t })
  return out
}

// ---- reading

// The visible screen, ANSI kept when asked (the dim-suggestion check needs it).
export function readPane(target, { ansi = false } = {}) {
  if (target.world === 'herdr') {
    const args = herdrArgv(target.machine, 'pane', 'read', target.pane, '--source', 'visible', ...(ansi ? ['--ansi'] : []))
    const raw = herdr(args)
    const text = typeof raw === 'string' ? raw : (raw?.result?.text ?? raw?.result?.content ?? JSON.stringify(raw))
    return text.replace(/\r/g, '')
  }
  return tmux('capture-pane', '-p', ...(ansi ? ['-e'] : []), '-t', target.pane)
}

// herdr's agent_status for the pane (idle | working | blocked | done | unknown), or null.
export function agentStatus(target) {
  if (target.world !== 'herdr') return null
  try {
    const args = herdrArgv(target.machine, 'pane', 'get', target.pane)
    return herdr(args, { retries: 2 })?.result?.pane?.agent_status ?? null
  } catch { return null }
}

// Claude Code's prompt heuristics (promptScan, unsentText, notIdle, isCleared …) are the Claude
// chair's own (T-642): they live in chairs/claude-prompt.mjs and are re-exported here.
export { stripAnsi, promptScan, isSpinner, unsentText, notIdle, isRunning, isCleared } from './chairs/claude-prompt.mjs'

// 'working' | 'blocked' when herdr says the agent behind this pane is mid-turn or waiting on a
// background agent or a dialog, else ''. Always '' on tmux and when herdr cannot say. The screen
// alone cannot tell: a desk waiting on a background agent shows an idle empty prompt.
// The Claude session id running in a herdr pane, or '' (tmux, no agent, no herdr). A /clear
// changes it, which is the one sure sign the clear took, whatever the screen shows next.
export function sessionOf(target) {
  if (target?.world !== 'herdr') return ''
  try {
    const args = herdrArgv(target.machine, 'pane', 'list')
    const p = (herdr(args, { retries: 2 })?.result?.panes ?? []).find((x) => x.pane_id === target.pane)
    return p?.agent_session?.value || ''
  } catch { return '' }
}

// ---- self-clear's own-pane check (2026-10-03, the wrong-pane clear)
// HERDR_PANE_ID cannot be trusted on its own: Claude Code runs background jobs (`CLAUDE_JOB_DIR`)
// in daemon processes that inherit the environment of whichever pane first started the daemon,
// so a job in desks/it carried HERDR_PANE_ID=w1:p1B, Daphne's pane, and its self-clear cleared
// her. And an agy or Cursor desk can run self-clear too, though /clear and /slopdog:pickup are
// Claude Code commands. So before a desk types into "its own" pane, the pane must run claude and
// belong to the desk folder: its label's lane has that folder in the registry, or, with no lane
// label, the pane's cwd is that folder.
const V2_DIR = resolve(dirname(fileURLToPath(import.meta.url)), '../..')
export function laneFolders(lanesPath) {
  const p = lanesPath ?? resolveRegistryFilePath(V2_DIR)
  const j = readLanesDocument({ path: p })
  const lanes = j.lanes ?? j
  const base = dirname(p)
  return Object.fromEntries(Object.entries(lanes).filter(([, v]) => v?.folder).map(([k, v]) => [k, resolve(base, v.folder)]))
}

// '' when `target` is safe for the desk in `deskDir` to clear as itself, else the reason. tmux
// panes pass (no daemon there, and no server any more).
export function selfPaneProblem(target, deskDir) {
  // A background job (CLAUDE_JOB_DIR set) is never a desk's own pane: its worker inherited
  // HERDR_PANE_ID from whichever pane started the job daemon (Daphne's, on 2026-10-03).
  if (process.env.CLAUDE_JOB_DIR) return `this is a background job (CLAUDE_JOB_DIR set); its HERDR_PANE_ID ${target?.pane} is inherited, not its own pane`
  if (target?.world !== 'herdr') return ''
  let panes
  try { panes = herdr(['pane', 'list'], { retries: 2 })?.result?.panes ?? [] } catch (e) { return `cannot read herdr pane list to confirm ${target.pane} is this desk's pane (${e.message})` }
  const p = panes.find((x) => x.pane_id === target.pane)
  if (!p) return `HERDR_PANE_ID ${target.pane} is not a live herdr pane`
  const name = p.label || 'unlabelled'
  // Whether the chair in this pane can clear and pick up at all is the chair's call (T-642).
  const cant = clearProblemFor(p.agent, target.pane, name)
  if (cant) return cant
  const want = resolve(deskDir)
  const m = LANE_LABEL.exec(p.label || '')
  if (m) {
    let folder
    try { folder = laneFolders()[m[1]] } catch (e) { return `cannot read the registry to confirm ${target.pane} belongs to ${want} (${e.message})` }
    if (folder === want) return ''
    // A labelled desk not yet in the registry (a partner desk, 2026-10-04) is judged by its cwd, as an
    // unlabelled pane is: the label names a lane nobody can resolve, so it proves nothing either way.
    if (folder === undefined && p.cwd && resolve(p.cwd) === want) return ''
    return `HERDR_PANE_ID ${target.pane} is "${name}" (${folder ?? `lane ${m[1]} not in the registry`}), not this desk (${want}); a background job inherits HERDR_PANE_ID from the Claude daemon, so it can name another desk's pane`
  }
  if (p.cwd && resolve(p.cwd) === want) return ''
  return `pane ${target.pane} has no lane label and its cwd (${p.cwd || 'unknown'}) is not ${want}; cannot confirm it is this desk's pane`
}

export function herdrBusy(target) {
  const st = agentStatus(target)
  return st === 'working' || st === 'blocked' ? st : ''
}

// '' when the desk is idle at an empty prompt, else the reason. herdr adds its own agent state:
// a desk herdr calls working (a turn, or a background agent it is still waiting on) or blocked
// is not idle whatever the screen shows; idle and done both count as idle.
export function isIdleEmptyPrompt(target) {
  const st = herdrBusy(target)
  if (st) return `herdr says the agent is ${st}`
  return notIdle(readPane(target, { ansi: true }))
}

// ---- typing

export function sendKeys(target, ...keys) {
  if (target.world === 'herdr') return herdr(herdrArgv(target.machine, 'pane', 'send-keys', target.pane, ...keys))
  return tmux('send-keys', '-t', target.pane, ...keys)
}

// Types `text` (then Enter, unless enter:false). Refuses (throws, `.code = 'unsent_text'`, nothing
// sent) when the pane's prompt already holds unsent text, unless guard:false.
// The herdr agent row for this pane id, or null when herdr cannot resolve it.
// A label ending in (lane) counts as named even when a /clear has dropped the agent name.
export function lookupHerdrPane(paneId, machine) {
  const agents = herdrAgents(machine)
  if (agents == null) return null
  const agent = agents.find((a) => a.pane_id === paneId)
  let label = ''
  try {
    const args = herdrArgv(machine, 'pane', 'list')
    const panes = herdr(args, { retries: 1 })?.result?.panes ?? []
    const hit = panes.find((p) => (p.pane_id || p.pane) === paneId)
    label = hit?.label || ''
  } catch { /* a missing pane list still leaves the agent name to decide */ }
  if (!agent && !label) return null
  return { name: agent?.name || '', label }
}

export function assertCanTypeHerdrPane(paneId, machine) {
  return assertNamedHerdrAgentPane(paneId, (id) => lookupHerdrPane(id, machine))
}

export function typeLine(target, text, { enter = true, guard = true } = {}) {
  if (guard) {
    const left = unsentText(readPane(target, { ansi: true }))
    if (left) { const e = new Error(`${target.pane} has unsent text at its prompt: "${left.slice(0, 80)}"`); e.code = 'unsent_text'; throw e }
  }
  if (target.world === 'herdr') {
    const lookup = (id) => lookupHerdrPane(id, target.machine)
    const herdrWithMachine = (args) => herdr(herdrArgv(target.machine, ...args))
    sendTextToNamedPane(target.pane, text, { lookup, herdr: herdrWithMachine })
  } else {
    tmux('send-keys', '-t', target.pane, '-l', text)
  }
  if (!enter) return
  pause(300)
  sendKeys(target, 'Enter')
  pause(500)
}

// ---- pickup first (Todd, 2026-10-03: "the first thing that happens after a reset is the pickup")
// self-clear's watcher writes <desk folder>/.pickup-pending when it starts; pickup-report.mjs (step
// 1 of /slopdog:pickup) deletes it. While it is there and fresh, nothing else may wake the desk:
// the inbox hook, the inbox backstop and turn-commit's failure note all wait. Stale after 15
// minutes, so a pickup that never ran cannot hold a desk's mail forever.
export const PICKUP_PENDING = '.pickup-pending'
export const PICKUP_PENDING_MS = 15 * 60 * 1000
export function pickupPendingAgeMs(deskDir) {
  try { return Date.now() - statSync(join(deskDir, PICKUP_PENDING)).mtimeMs } catch { return -1 }
}
export function pickupPending(deskDir) {
  const f = join(deskDir, PICKUP_PENDING)
  try { return existsSync(f) && Date.now() - statSync(f).mtimeMs < PICKUP_PENDING_MS } catch { return false }
}
