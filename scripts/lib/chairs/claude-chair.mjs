// claude-chair.mjs — Claude desk messaging with optional remote machine prefix (T-642 / T-647).
import { spawnSync } from 'node:child_process'
import { herdrArgv, machineForLane, isRemoteMachine } from './herdr-route.mjs'
import { verifyPaneAgent, PaneAgentVerificationError } from './verify-pane-agent.mjs'
import { findLanePane } from './lane-pane.mjs'
import { promptScan, unsentText } from './claude-prompt.mjs'
import { jobsDir, loadClaudePin, saveClaudePin, claudePinsPath } from './session-pins.mjs'

export { PaneAgentVerificationError, verifyPaneAgent }

const herdrBin = () => process.env.HERDR_BIN_PATH || process.env.HERDR_BIN || 'herdr'

export function herdrJson(machine, args, { retries = 10, retryMs = 500 } = {}) {
  const argv = herdrArgv(machine, ...args)
  for (let attempt = 0; ; attempt++) {
    const r = spawnSync(herdrBin(), argv, { encoding: 'utf8' })
    if (r.error) {
      const e = new Error(`herdr unavailable: ${r.error.message}`)
      e.code = 'herdr_unavailable'
      throw e
    }
    const out = `${r.stdout || ''}`.trim()
    let json = null
    try { json = JSON.parse(out || `${r.stderr || ''}`.trim()) } catch {}
    const code = json?.error?.code
    if (r.status === 0 && !code) return json ?? out
    if (code === 'agent_pane_busy' && attempt < retries) {
      Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, retryMs)
      continue
    }
    const e = new Error(`herdr ${argv.slice(0, 4).join(' ')}: ${json?.error?.message || out || r.stderr || `exit ${r.status}`}`.trim())
    e.code = code || 'herdr_failed'
    throw e
  }
}

export function listPanesAndAgents(machine) {
  const panes = herdrJson(machine, ['pane', 'list'], { retries: 2 })?.result?.panes ?? []
  let agents = []
  try { agents = herdrJson(machine, ['agent', 'list'], { retries: 2 })?.result?.agents ?? [] } catch {}
  return { panes, agents }
}

/** Prefix herdr uses on the CLI when routing to another machine (for tests and logging). */
export function sendRoutePrefix(lane) {
  const machine = machineForLane(lane)
  return isRemoteMachine(machine) ? ['herdr', '--machine', machine] : ['herdr']
}

export function assertPaneReadyForDesk(lane, paneId) {
  const machine = machineForLane(lane)
  const { panes, agents } = listPanesAndAgents(machine)
  return verifyPaneAgent({
    panes,
    agents,
    paneId,
    expectedAgentName: `herdr-${lane.key ?? lane.id}`,
    expectedKind: 'claude',
  })
}

export function sendTextToPane(lane, paneId, text, { verify = true, enter = true } = {}) {
  const machine = machineForLane(lane)
  if (verify) assertPaneReadyForDesk(lane, paneId)
  herdrJson(machine, ['pane', 'send-text', paneId, text])
  if (!enter) return
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 300)
  try {
    herdrJson(machine, ['pane', 'send-keys', paneId, 'Enter'])
  } catch (e) {
    e.textDelivered = true
    throw e
  }
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500)
}

export function promptAgent(lane, message, { verifyPaneId } = {}) {
  const machine = machineForLane(lane)
  const laneId = lane.key ?? lane.id
  if (verifyPaneId) assertPaneReadyForDesk(lane, verifyPaneId)
  return herdrJson(machine, ['agent', 'prompt', `herdr-${laneId}`, message])
}

// ---- the Claude chair driver (T-642): the uniform shape chairs/index.mjs lists in CHAIR_METHODS.
// A Claude desk takes its inbox through hooks/inbox-watch.mjs, with the inbox watcher's pane
// typing as the backstop; it has no headless route. Clear-and-pickup is self-clear.mjs: /clear,
// then a detached watcher types /slopdog:pickup once the cleared prompt shows (lib/clear-watch.mjs).

export const claudeChair = Object.freeze({
  id: 'claude',
  herdrKind: 'claude',
  hook: true,         // inbox-watch.mjs delivers its inbox
  paneJobs: false,    // dispatch.mjs never types a job into a Claude desk
  foldsInbox: false,
  findPane: (lane, panes) => findLanePane('claude', lane, panes),
  // '' for an empty input box, the unsent text, or null with no Claude prompt on screen.
  promptText: (screen) => (promptScan(screen) ? unsentText(screen) : null),
  hasRoute: (lane, pane) => Boolean(pane),
  deliver: async (lane) => ({ error: `no headless route for the claude chair (${lane?.key}): its inbox goes through the inbox-watch hook or its pane` }),
  // Verified send: the pane must be the desk's live, named Claude agent (verify-pane-agent.mjs).
  message: async (lane, paneId, text) => sendTextToPane(lane, paneId, text, { verify: true }),
  clearProblem: () => '',
  // Sends /clear through `send` and hands back the pickup line for the watcher to type.
  clearAndPickup({ pickupLine, send }) {
    send('/clear')
    return { ok: true, watchFor: pickupLine }
  },
  sessionPinPath: (lane, opts) => claudePinsPath(opts),
  loadSessionPin: (lane, opts) => loadClaudePin(lane, opts),
  saveSessionPin: (lane, pin, opts) => saveClaudePin(lane, pin, opts),
  jobsDir: (lane, opts) => jobsDir(lane, opts),
  sidekickDir: (engine) => engine,
  replyTag: ({ engine }) => engine,
})
