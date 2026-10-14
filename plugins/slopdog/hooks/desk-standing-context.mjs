#!/usr/bin/env node
// desk-standing-context — SessionStart hook (startup|resume|clear).
// Injects each Claude desk's own standing context from configuration (T-655).
//
// Schema of v2/desk-standing-context.json:
// {
//   "$schema": "./desk-standing-context.schema.json",
//   "<profile-or-lane-key>": [
//     "<block-string-or-read-pointer>" | { "read": "<path>", "text": "<text>" }
//   ] | "<profile-alias-key>"
// }
//
// Rules:
// 1. Resolves session's lane from payload.cwd through registry.mjs (T-662).
// 2. Only Claude desks run this hook; non-Claude builders exit 0 silently
//    (their standing context is injected into the brief by dispatch.mjs).
// 3. Exits 0 if cwd is out of scope or lane has no entry in desk-standing-context.json.

import { readFileSync, existsSync, realpathSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { homedir } from 'node:os'
import { readLanesDocument } from '../../../scripts/lib/registry.mjs'

let payload = {}
try {
  payload = JSON.parse(readFileSync(0, 'utf8') || '{}')
} catch {}

const cwd = payload.cwd || process.cwd()

const V2 = (() => {
  try {
    return realpathSync(new URL('../../..', import.meta.url).pathname)
  } catch {
    return resolve(new URL('../../..', import.meta.url).pathname)
  }
})()

function inScope(targetCwd) {
  const home = homedir()
  const roots = [join(home, 'slopdog'), join(home, '.claude'), V2].map((p) => {
    try {
      return realpathSync(p)
    } catch {
      return p
    }
  })
  let real = targetCwd
  try {
    real = realpathSync(targetCwd)
  } catch {}
  return roots.some((root) => real === root || real.startsWith(root + '/'))
}

if (!inScope(cwd)) process.exit(0)

let lanes = {}
try {
  lanes = readLanesDocument({ v2: V2 })
} catch {
  process.exit(0)
}

function resolveLane(targetCwd) {
  let real = targetCwd
  try {
    real = realpathSync(targetCwd)
  } catch {}

  const buildDept = (() => {
    try {
      return realpathSync(join(V2, 'desks/build'))
    } catch {
      return join(V2, 'desks/build')
    }
  })()

  let best = null
  let bestLen = -1

  for (const [key, lane] of Object.entries(lanes)) {
    if (!lane || typeof lane !== 'object' || !lane.folder) continue
    let folder = join(V2, lane.folder)
    try {
      folder = realpathSync(folder)
    } catch {}
    if ((real === folder || real.startsWith(folder + '/')) && folder.length > bestLen) {
      best = key
      bestLen = folder.length
    }
  }

  // If cwd is the build department folder desks/build itself without matching a sub-lane, map to build
  if (!best && (real === buildDept || real.startsWith(buildDept + '/'))) {
    if ('build' in lanes) return 'build'
  }

  return best
}

const laneKey = resolveLane(cwd)
if (!laneKey) process.exit(0)

const laneData = lanes[laneKey]
if (!laneData || laneData.engine !== 'claude') process.exit(0)

const contextFile = process.env.SLOPDOG_STANDING_CONTEXT_FILE || join(V2, 'desk-standing-context.json')
if (!existsSync(contextFile)) process.exit(0)

let config = {}
try {
  config = JSON.parse(readFileSync(contextFile, 'utf8'))
} catch {
  process.exit(0)
}

let blocks = config[laneKey]
if (typeof blocks === 'string' && config[blocks]) {
  blocks = config[blocks]
}
if (!Array.isArray(blocks) || blocks.length === 0) process.exit(0)

const lines = []
for (const block of blocks) {
  if (typeof block === 'string') {
    lines.push(block)
  } else if (block && typeof block === 'object') {
    if (block.text) lines.push(block.text)
    else if (block.read) lines.push(`read: ${block.read}`)
  }
}

if (lines.length > 0) {
  console.log(lines.join('\n'))
}
