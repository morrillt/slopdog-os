// herdr-agent-names.mjs — name unnamed herdr agents herdr-<lane> from cwd + agent kind.
// desk-pane.mjs finds desks only by that name; a pane restarted by hand keeps no name and
// is invisible to self-clear, unstucker and listDeskPanes until something names it again.

import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { herdr, herdrAgents } from './desk-pane.mjs'
import { chairForLane } from './chairs/index.mjs'

const norm = (p) => resolve(p)

/** Folder paths that may host a live desk cwd (main checkout, SLOPDOG_V2, caller's v2Root). */
export function laneFolderPaths(v2Root, folder) {
  const roots = [v2Root, process.env.SLOPDOG_V2, resolve(homedir(), 'slopdog', 'v2')].filter(Boolean)
  return [...new Set(roots.map((r) => norm(resolve(r, folder))))]
}

export function cwdMatchesLaneFolder(cwd, folder, v2Root) {
  if (!cwd) return false
  const here = norm(cwd)
  return laneFolderPaths(v2Root, folder).some((p) => p === here)
}

const META_KEYS = new Set(['_', 'seats'])

/** herdr --kind for a registry row: its chair's agent kind (lib/chairs, T-642), null with no chair. */
export function laneHerdrAgentKind(laneConfig) {
  return chairForLane(laneConfig ?? {})?.herdrKind ?? null
}

/** Lane keys with a folder and a wired herdr agent kind. */
export function lanesForHerdrNaming(lanesJson) {
  const out = []
  for (const [lane, cfg] of Object.entries(lanesJson || {})) {
    if (META_KEYS.has(lane) || !cfg?.folder) continue
    const kind = laneHerdrAgentKind(cfg)
    if (!kind) continue
    out.push({ lane, folder: cfg.folder, kind })
  }
  return out
}

function agentNameMissing(name) {
  return name == null || name === '' || name === 'undefined'
}

/**
 * @param {object[]} agents herdr agent list rows
 * @param {object} lanesJson parsed registry document
 * @param {string} v2Root absolute path to v2 (lanes folders resolve under it)
 */
export function planHerdrAgentRenames(agents, lanesJson, v2Root) {
  const lanes = lanesForHerdrNaming(lanesJson)
  const nameTaken = new Set((agents || []).filter((a) => a.name).map((a) => a.name))

  const renames = []
  const ambiguous = []

  for (const row of agents || []) {
    if (!row.pane_id || !row.agent) continue
    if (!agentNameMissing(row.name)) continue

    const cwd = row.cwd || row.foreground_cwd
    if (!cwd) continue

    const matches = lanes.filter((l) => cwdMatchesLaneFolder(cwd, l.folder, v2Root) && l.kind === row.agent)
    if (matches.length === 0) continue
    if (matches.length > 1) {
      ambiguous.push({ pane_id: row.pane_id, cwd, agent: row.agent, lanes: matches.map((m) => m.lane) })
      continue
    }

    const lane = matches[0].lane
    const targetName = `herdr-${lane}`
    if (nameTaken.has(targetName)) {
      ambiguous.push({ pane_id: row.pane_id, cwd, agent: row.agent, lanes: [lane], reason: `${targetName} already taken` })
      continue
    }

    renames.push({ pane_id: row.pane_id, lane, name: targetName })
    nameTaken.add(targetName)
  }

  return { renames, ambiguous }
}

/** Names every unnamed agent that uniquely matches a lane folder + kind. */
export function ensureHerdrAgentNames({ dryRun = false, lanesJson, v2Root, log = console.log } = {}) {
  const agents = herdrAgents()
  if (agents === null) return { renames: [], ambiguous: [] }

  const plan = planHerdrAgentRenames(agents, lanesJson, v2Root)

  for (const hit of plan.ambiguous) {
    const lanes = hit.lanes?.length ? ` lanes ${hit.lanes.join(', ')}` : ''
    const why = hit.reason ? ` (${hit.reason})` : ''
    log(`ensureHerdrAgentNames: skip ambiguous pane ${hit.pane_id} (${hit.agent} @ ${hit.cwd})${lanes}${why}`)
  }

  for (const { pane_id, name } of plan.renames) {
    if (dryRun) log(`ensureHerdrAgentNames: would rename ${pane_id} -> ${name}`)
    else {
      herdr(['agent', 'rename', pane_id, name])
      log(`ensureHerdrAgentNames: renamed ${pane_id} -> ${name}`)
    }
  }

  return plan
}
