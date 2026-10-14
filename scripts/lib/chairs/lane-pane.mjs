// lane-pane.mjs — how every chair finds its desk's pane and types one line into it (T-642).
//
// A desk's pane is found by its herdr pane label `<Name> (<lane>)`, then by its agent name
// `herdr-<lane>`, never by cwd: agy panes for writing, gemma and a partner desk's gemini run with
// cwd ~, so a cwd match never found them (2026-10-10). The pane must also run the chair's
// own agent: a labelled pane whose agent has exited is a bare shell, and typing there runs the
// message as a command. An unlabelled, unnamed pane is never a target (pane-target-guard.mjs).
import { sendTextToNamedPane } from '../pane-target-guard.mjs'

export const LANE_LABEL = /\(([a-z0-9][a-z0-9-]*)\)\s*$/

const laneKey = (lane) => (typeof lane === 'string' ? lane : lane?.key ?? lane?.id)

// The pane row for `lane` among `panes` (herdr pane list rows, with `name` merged in from the
// agent list when the caller has it), or undefined. The lane's own label wins over the agent name.
export function findLanePane(kind, lane, panes) {
  const key = laneKey(lane)
  const mine = (panes || []).filter((p) => p && p.agent === kind)
  return mine.find((p) => LANE_LABEL.exec(p.label || '')?.[1] === key) ||
    mine.find((p) => p.name === `herdr-${key}`)
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Types `text` into the named pane, a pause, then Enter: Claude Code and the agy/Cursor TUIs read
// keys arriving within a few ms as one paste, where an Enter is a newline, not a submit.
// `herdr(args)` may be sync or async; `lookup(paneId)` returns { name, label } for the guard.
export async function messageNamedPane(paneId, text, { herdr, lookup, pauseMs = 500 }) {
  await sendTextToNamedPane(paneId, text, { lookup, herdr })
  await sleep(pauseMs)
  await herdr(['pane', 'send-keys', paneId, 'enter'])
}

// The one refusal an agy or Cursor chair gives for clear-and-pickup: neither TUI has a /clear a
// script can type and no SessionStart hook to pick up after it (measured, T-642 Notes). One line.
export function clearRefusal(kind, paneId, name) {
  return `pane ${paneId} (${name || 'unlabelled'}) runs ${kind || 'no agent herdr can see'}, not claude; /clear and /slopdog:pickup are Claude Code commands, so a non-Claude desk does not self-clear`
}
