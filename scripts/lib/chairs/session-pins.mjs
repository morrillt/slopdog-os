// session-pins.mjs — where a chair keeps its session pin and job records (T-642 FR-5).
//
// A sidekick chair keeps both in its own lane folder from lanes.json, the T-684 layout
// `desks/<desk>/sidekicks/<engine>/`: jobs in `<folder>/jobs/` (dispatch.mjs already writes there)
// and the headless delivery session in `<folder>/.chair-session.json` (gitignored). No `chairs/`
// folder is ever made under desks/. A Claude desk's pin is the shared `.slopdog-sessions.json`
// keyed by lane, which resume.mjs moves on every /clear; the Claude chair reads that one instead.
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { V2_DIR, readLanesDocument } from '../registry.mjs'

export const SESSION_PIN = '.chair-session.json'

// The lane record: a record passes through; a key is looked up in `lanes` or the registry.
export function laneRecord(lane, { v2 = V2_DIR, lanes } = {}) {
  if (lane && typeof lane === 'object') return lane
  const doc = lanes ?? readLanesDocument({ v2 })
  const rec = (doc.lanes ?? doc)[lane]
  return rec ? { key: lane, ...rec } : null
}

export function laneFolderPath(lane, opts = {}) {
  const rec = laneRecord(lane, opts)
  if (!rec?.folder) throw new Error(`chairs: lane ${typeof lane === 'string' ? lane : lane?.key} has no folder in the registry`)
  return join(opts.v2 ?? V2_DIR, rec.folder)
}

export const jobsDir = (lane, opts) => join(laneFolderPath(lane, opts), 'jobs')
export const sessionPinPath = (lane, opts) => join(laneFolderPath(lane, opts), SESSION_PIN)

// The pin, {} when there is none. `legacyStateDir` reads the pre-T-642 copy
// (~/.local/state/slopdog-inbox/delivery-<lane>.json) once and saves it into the lane folder, so a
// live delivery chat is kept and the next load reads the new file.
export function loadSessionPin(lane, opts = {}) {
  const path = sessionPinPath(lane, opts)
  try { return JSON.parse(readFileSync(path, 'utf8')) } catch {}
  const key = laneRecord(lane, opts)?.key
  if (opts.legacyStateDir && key) {
    const old = join(opts.legacyStateDir, `delivery-${key}.json`)
    if (existsSync(old)) {
      let pin
      try { pin = JSON.parse(readFileSync(old, 'utf8')) } catch {}
      if (pin) { try { saveSessionPin(lane, pin, opts) } catch {} ; return pin }
    }
  }
  return {}
}

export function saveSessionPin(lane, pin, opts = {}) {
  const path = sessionPinPath(lane, opts)
  writeFileSync(path, JSON.stringify(pin, null, 2))
  return path
}

// The Claude chair: the shared pins file, one session id per lane.
export const claudePinsPath = ({ v2 = V2_DIR } = {}) => join(v2, '.slopdog-sessions.json')
export function loadClaudePin(lane, opts = {}) {
  const key = laneRecord(lane, opts)?.key
  try { const id = JSON.parse(readFileSync(claudePinsPath(opts), 'utf8'))[key]; return id ? { id } : {} } catch { return {} }
}
export function saveClaudePin(lane, pin, opts = {}) {
  const key = laneRecord(lane, opts)?.key
  let all = {}
  try { all = JSON.parse(readFileSync(claudePinsPath(opts), 'utf8')) } catch {}
  all[key] = pin.id
  writeFileSync(claudePinsPath(opts), JSON.stringify(all, null, 2))
  return claudePinsPath(opts)
}
