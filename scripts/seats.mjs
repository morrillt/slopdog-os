#!/usr/bin/env node
// seats — read and swap the primary/sidekick builder seat in the registry (T-360).
//
//   node scripts/seats.mjs primary       prints the lane key in the primary seat
//   node scripts/seats.mjs sidekick      prints the lane key in the sidekick seat
//   node scripts/seats.mjs swap          flips the two seats in place
//   node scripts/seats.mjs route T-nnn   prints the dispatch command for the primary seat (T-361)
//
// slopdog.mjs reads `seats.primary`/`seats.sidekick` off the registry directly; this script
// is only for reading and flipping that one value from the command line or from a dispatch
// script (Tyrion's dispatch, the task runner).
//
// `swap` edits the `seats` line as text, not by JSON.parse + re-stringify: the registry keeps
// that line on one line for exactly this reason, so a swap is a one-line diff
// (`git diff --stat` on the registry file shows one line changed) and two swaps in a row restore
// the file byte-for-byte, instead of every other line getting reformatted along the way.
//
// `route` is the one command Tyrion's dispatch and the task-runner skill actually call: it
// reads the builder from v2/config/build-ladder.json (T-714) and prints the exact command to
// send it a ticket, so a ladder change changes what `route` prints without either caller
// composing a command by hand. The builder is chosen by the ticket's points (builders_by_points);
// every builder gets the one `dispatch.mjs --engine <engine> --write --ticket T-nnn` line (T-740):
// dispatch makes the ticket's own worktree and branch, builds, verifies, and merges a GREEN build itself.
// `route` prints only, never mutates git state. The path printed is absolute so the line runs
// from any cwd.
import { readLanesDocument, registryFilePath } from './lib/registry.mjs'
import { loadLadder, builderFor } from './lib/build-ladder.mjs'
import { findTicketPath } from './dispatch-ticket-updates.mjs'
import { homedir } from 'node:os'
import { readFileSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIR = dirname(dirname(fileURLToPath(import.meta.url)))   // v2/, parent of scripts/
const LANES_PATH = registryFilePath({ v2: DIR })

const SEATS_RE = /"seats":\s*\{\s*"primary":\s*"([^"]*)",\s*"sidekick":\s*"([^"]*)"\s*\}/

function readLanes() {
  return readLanesDocument({ v2: DIR })
}

const cmd = process.argv[2]

if (cmd === 'primary' || cmd === 'sidekick') {
  const lanes = readLanes()
  console.log(lanes.seats?.[cmd] ?? '')
} else if (cmd === 'swap') {
  const text = readFileSync(LANES_PATH, 'utf8')
  const match = text.match(SEATS_RE)
  if (!match) {
    console.error(`${LANES_PATH} has no \`seats\` line to swap`)
    process.exit(1)
  }
  const [whole, primary, sidekick] = match
  const swapped = `"seats": { "primary": "${sidekick}", "sidekick": "${primary}" }`
  writeFileSync(LANES_PATH, text.replace(whole, swapped))
  console.log(`swapped: primary is now ${sidekick}, sidekick is now ${primary}`)
} else if (cmd === 'route') {
  const ticketId = (process.argv[3] || '').replace(/^#/, '').trim()
  if (!/^T-\d+$/.test(ticketId)) {
    console.error('usage: seats.mjs route T-nnn')
    process.exit(1)
  }
  // T-714: the builder comes from v2/config/build-ladder.json, not from the seat. Todd, 2026-10-12:
  // builders_by_points picks it by the ticket's points, so route reads the ticket. Every builder,
  // Claude included, goes through dispatch.mjs, which fences the build into its own worktree (T-740),
  // builds, verifies and merges. A ticket the ladder escalates (8 points, two strikes) prints the same
  // line: dispatch hands it to Data itself and exits 3. With no ticket file found, the one `builder` stands.
  const ladder = loadLadder()
  const ticketPath = findTicketPath(process.env.TASKS_DIR || join(homedir(), 'slopdog', 'tasks'), ticketId)
  const rung = ticketPath ? builderFor(readFileSync(ticketPath, 'utf8'), ladder) : ladder.builder
  const engine = rung.rung === 'escalation' ? ladder.builder.engine : rung.engine
  const dispatchPath = join(DIR, 'scripts', 'dispatch.mjs')
  console.log(`node ${dispatchPath} --engine ${engine} --write --ticket ${ticketId}`)
} else {
  console.error('usage: seats.mjs <primary|sidekick|swap|route T-nnn>')
  process.exit(1)
}
