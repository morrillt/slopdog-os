// Where a lane's folder is on disk (T-684). Every script resolves folders through the central registry.
import { join } from 'node:path'
import { readLanesDocument, V2_DIR } from './registry.mjs'
export { V2_DIR }

export function readLanesFile(arg) {
  if (typeof arg === 'string') return readLanesDocument({ path: arg })
  const opts = arg && typeof arg === 'object' ? arg : {}
  return readLanesDocument(opts.path ? { path: opts.path } : { v2: opts.v2 ?? V2_DIR })
}

export function laneDir(laneKey, { lanes, v2 = V2_DIR } = {}) {
  const doc = lanes ?? readLanesDocument({ v2 })
  const folder = doc?.[laneKey]?.folder
  return folder ? join(v2, folder) : null
}

export function laneInbox(laneKey, options) {
  const dir = laneDir(laneKey, options)
  return dir ? join(dir, 'inbox') : null
}
