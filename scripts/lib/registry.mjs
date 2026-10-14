// The registry of every person in the house (T-641): reads the lane document on disk, checks its
// schema, and resolves a pane id live. A pane id is never stored: herdr assigns them positionally,
// so a stored one is stale after the next `sdh --rebuild`.
import { createRequire } from 'node:module'
import { readFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)

const LANES_PATH = new URL('../../lanes.json', import.meta.url)
const ENGINES = ['claude', 'agy', 'cursor', 'opencode', 'grok', 'openrouter']

export const V2_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', '..')

export function registryFilePath({ v2 = V2_DIR } = {}) {
  return join(v2, 'lanes.json')
}

export function resolveRegistryFilePath(v2 = V2_DIR) {
  if (process.env.DISPATCH_LANES_FILE) return resolve(process.env.DISPATCH_LANES_FILE)
  if (process.env.SLOPDOG_LANES_JSON) return resolve(process.env.SLOPDOG_LANES_JSON)
  return registryFilePath({ v2 })
}

/** Full parsed lane document (includes `seats`, `_`, and every lane key). */
export function readLanesDocument({ path, v2 = V2_DIR } = {}) {
  const p = path ?? resolveRegistryFilePath(v2)
  return JSON.parse(readFileSync(p, 'utf8'))
}

export function localMachineLabel() {
  return process.env.SLOPDOG_LOCAL_MACHINE || 'thinkpad'
}

function readLanes() { return JSON.parse(readFileSync(LANES_PATH, 'utf8')) }

// Every lane record, normalized to person, desk and chair fields. `options.lanes` swaps in a parsed
// lanes object (tests); otherwise the live registry document is read. Throws on a schema break.
export function loadRegistry({ lanes = readLanes() } = {}) {
  const names = new Map()
  const records = []
  for (const [key, v] of Object.entries(lanes)) {
    if (key === '_' || key === 'seats') continue
    if (v.id !== key) throw new Error(`registry: lane "${key}" has id "${v.id}", which must equal its key`)
    if ('pane_id' in v) throw new Error(`registry: lane "${key}" stores a pane_id; pane ids resolve live through findDeskPane()`)
    for (const f of ['name', 'title', 'icon', 'folder', 'engine']) {
      if (!v[f]) throw new Error(`registry: lane "${key}" is missing ${f}`)
    }
    if (!ENGINES.includes(v.engine)) throw new Error(`registry: lane "${key}" has engine "${v.engine}", expected one of ${ENGINES.join(', ')}`)
    if (names.has(v.name)) throw new Error(`registry: duplicate name "${v.name}" on lanes "${names.get(v.name)}" and "${key}"`)
    names.set(v.name, key)
    if (v.owner && !(v.owner in lanes && v.owner !== '_' && v.owner !== 'seats')) throw new Error(`registry: lane "${key}" has owner "${v.owner}", which is not a lane`)
    if ('purpose' in v && (typeof v.purpose !== 'string' || !v.purpose.trim())) throw new Error(`registry: lane "${key}" has a purpose that is not a sentence`)
    if ('toolbox' in v && !(Array.isArray(v.toolbox) && v.toolbox.every((t) => typeof t === 'string' && t))) throw new Error(`registry: lane "${key}" has a toolbox that is not a list of skill names`)
    records.push({
      id: v.id, name: v.name, title: v.title, icon: v.icon,
      folder: v.folder, owner: v.owner ?? null,
      engine: v.engine, model: v.model ?? null, host: v.host ?? null,
      // Optional: the desk-tooltip sentence and the footer drawer's top-three skills.
      ...('purpose' in v ? { purpose: v.purpose } : {}),
      ...('toolbox' in v ? { toolbox: v.toolbox } : {}),
    })
  }
  return records
}

// The existing `<Name> (<lane>)` pane label, which desk-pane.mjs parses.
export function getPaneLabel(lane, options) {
  const rec = loadRegistry(options).find((r) => r.id === lane)
  if (!rec) throw new Error(`registry: no lane "${lane}"`)
  return `${rec.name} (${rec.id})`
}

// The lane's herdr pane id right now, or null when herdr has no pane for it. `options.lookup` is
// injectable so a test needs no running herdr. desk-pane.mjs imports this module, so findDeskPane
// is loaded only when paneId runs: a static import would cycle lane-folder → registry → desk-pane → registry.
export function paneId(lane, { lookup } = {}) {
  const find = lookup ?? require('./desk-pane.mjs').findDeskPane
  return find(lane)?.pane ?? null
}

// Herdr screen topology (`sdh`): which lanes get agent panes. Not every registry lane has one
// (scribe, openrouter gateways, and similar have no herdr pane).
export const HERDR_SWARM_TABS = [
  { label: 'swarm-mgmt', lanes: ['ideas', 'ideas-gemma', 'build'], workspace: 'w1' },
  { label: 'Builders', lanes: ['composer', 'gemma', 'laforge'], workspace: 'XFeatures' },
]
export const HERDR_WINDOW_DESKS = [
  'it', 'it-gemini', 'watcher', 'research', 'slack', 'errands', 'qa', 'writing', 'prototyper', 'mac', 'data', 'slopdog',
]

/** Lane keys that `herdr-up` brings up and `herdr-desk-cards` names in the sidebar. */
export function herdrPaneLanes() {
  return [...HERDR_SWARM_TABS.flatMap((t) => t.lanes), ...HERDR_WINDOW_DESKS]
}

/** Sidebar card rows: name, title, icon and folder from the registry for every herdr pane lane. */
export function desksForHerdrCards(options) {
  const byId = new Map(loadRegistry(options).map((r) => [r.id, r]))
  return herdrPaneLanes().map((id) => {
    const rec = byId.get(id)
    if (!rec) throw new Error(`registry: herdr pane lane "${id}" is missing from the registry`)
    return { id: rec.id, cwd: rec.folder, name: rec.name, title: rec.title, avatar: rec.icon }
  })
}
