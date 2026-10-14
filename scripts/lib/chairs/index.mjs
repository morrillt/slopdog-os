// chairs/index.mjs — the three chair drivers and how a lane, a person or a dispatch engine finds
// its chair (T-642). A chair is the terminal a person sits in, Claude Code, agy or Cursor, with its
// own plumbing: how to message it, its inbox route and its clear-and-pickup. Every engine switch
// for that plumbing lives here; callers ask `chairForLane(lane)` and call the driver.
//
// Exactly three drivers. Every `engine: cursor` lane, the Grok sidekicks included, is the Cursor
// chair; the retired Grok TUI engine name `grok` sits on it too, as herdr-swarm wires it. Engines
// with no chair (openrouter, opencode, the legacy kimi) resolve to null: they run headless only.
import { claudeChair } from './claude-chair.mjs'
import { agyChair } from './agy-chair.mjs'
import { cursorChair } from './cursor-chair.mjs'
import { loadRegistry } from '../registry.mjs'
import { clearRefusal } from './lane-pane.mjs'

export * from './herdr-route.mjs'
export * from './verify-pane-agent.mjs'
export * from './claude-chair.mjs'
export * from './git-inbox-fallback.mjs'
export { agyChair } from './agy-chair.mjs'
export { cursorChair } from './cursor-chair.mjs'
export { findLanePane, messageNamedPane, LANE_LABEL } from './lane-pane.mjs'
export { SESSION_PIN, jobsDir, sessionPinPath, loadSessionPin, saveSessionPin, laneFolderPath } from './session-pins.mjs'

export const CHAIRS = Object.freeze({ claude: claudeChair, agy: agyChair, cursor: cursorChair })

// The uniform driver: messaging (message), inbox routing (findPane, promptText, hasRoute, deliver),
// clear-and-pickup (clearProblem, clearAndPickup), and where its pins and jobs live.
export const CHAIR_METHODS = Object.freeze([
  'message', 'findPane', 'promptText', 'hasRoute', 'deliver',
  'clearProblem', 'clearAndPickup',
  'sessionPinPath', 'loadSessionPin', 'saveSessionPin', 'jobsDir', 'sidekickDir', 'replyTag',
])

// A lane's `engine` in lanes.json. No engine is a Claude desk (the registry's default).
const BY_ENGINE = { claude: 'claude', agy: 'agy', cursor: 'cursor', grok: 'cursor' }
export function chairForEngine(engine) {
  if (!engine) return CHAIRS.claude
  return CHAIRS[BY_ENGINE[engine]] ?? null
}

export const chairForLane = (lane) => (lane ? chairForEngine(lane.engine) : null)

// The chair behind a herdr pane, from the pane's `agent` kind; null for a shell or an unknown agent.
export const chairForAgent = (kind) => Object.values(CHAIRS).find((c) => c.herdrKind === kind) ?? null

// The chair a person sits in, from the registry (T-641); null for an unknown person.
export function chairForPerson(id, options) {
  const rec = loadRegistry(options).find((r) => r.id === id)
  return rec ? chairForEngine(rec.engine) : null
}

// dispatch.mjs's --engine values: which chair the sidekick it routes to sits in.
const BY_DISPATCH_ENGINE = {
  gemini: 'agy', agy: 'agy',
  composer: 'cursor', grok: 'cursor', 'ideas-composer': 'cursor', 'ideas-grok': 'cursor',
  'sonnet-cursor': 'cursor', 'cursor-gemini': 'cursor',
}
export const chairForDispatchEngine = (engine) => CHAIRS[BY_DISPATCH_ENGINE[engine]] ?? null

// '' when the chair in a pane running `kind` can clear and pick up, else the one-line refusal.
export function clearProblemFor(kind, paneId, name) {
  const chair = chairForAgent(kind)
  return chair ? chair.clearProblem(paneId, name) : clearRefusal(kind, paneId, name)
}
