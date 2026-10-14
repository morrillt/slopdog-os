#!/usr/bin/env node
// start-batch — one command that sets the dispatcher going and keeps him going (Todd, 2026-10-05:
// "with just one or two commands, like start batch — and then he just takes a project file and
// starts going until it's done"). Deliberately simple: it does not dispatch anything itself, it
// keeps the dispatcher fed, because the dispatcher is the one who validates and chooses a builder.
//
//   node start-batch.mjs <batch>              print the plan for that batch, send nothing
//   node start-batch.mjs <batch> --go         nudge the dispatcher now with the next ticket
//   node start-batch.mjs <batch> --go --loop  keep nudging while the batch has ready tickets
//   node start-batch.mjs --list              which batches have ready tickets
//
// The queue rules live in ready-queue.mjs, the one place that answers "what can be dispatched".
// A nudge only goes out when the dispatcher's pane is idle, so it never interrupts a turn, and
// typeLine refuses outright if Todd has unsent text at that prompt.
import { execFileSync } from 'node:child_process'
import { readFileSync, readdirSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { findDeskPane, agentStatus, typeLine } from './lib/desk-pane.mjs'

const V2 = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const TASKS = process.env.TASKS_DIR || '~/slopdog/tasks'
const DISPATCHER = process.env.START_BATCH_LANE || 'build'
const argv = process.argv.slice(2)
const has = (f) => argv.includes(f)
const batchArg = argv.find((a) => !a.startsWith('--'))
const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

const fm = (t, k) => (t.match(new RegExp(`^\\s*${k}:\\s*["']?([^"'\\n]+)`, 'm')) || [])[1]?.trim()

// The queue, straight from ready-queue.mjs so the rules are never restated here.
function queue() {
  const out = execFileSync(process.execPath, [join(V2, 'scripts', 'ready-queue.mjs'), '--limit', '99'], { encoding: 'utf8' })
  const ids = [...out.matchAll(/\b(T-\d+(?:-\d+)?)\b/g)].map((m) => m[1])
  return ids.map((id) => {
    const file = readdirSync(join(TASKS, 'tickets')).find((f) => {
      if (!f.endsWith('.md')) return false
      return fm(readFileSync(join(TASKS, 'tickets', f), 'utf8'), 'id') === id
    })
    if (!file) return null
    const text = readFileSync(join(TASKS, 'tickets', file), 'utf8')
    const title = (text.match(/^#\s+(.+)$/m) || [])[1] || id
    const project = fm(text, 'project')
    const batch = fm(text, 'batch')
    // A batch name is not unique: 1-bridge exists in both slopdog-whatsapp and slopdog-gmail
    // (Todd found this on 2026-10-05). The key is always project/batch.
    return { id, file, title, project, batch, key: `${project || '?'}/${batch || '?'}`, points: fm(text, 'points') }
  }).filter(Boolean)
}

const all = queue()

if (has('--list') || !batchArg) {
  const by = new Map()
  for (const t of all) by.set(t.key, (by.get(t.key) || 0) + 1)
  if (!by.size) { console.log('no batch has a ready ticket — run ready-queue.mjs --why <id> to see what is stopping one.'); process.exit(0) }
  console.log('batches with ready tickets (project/batch):')
  for (const [b, n] of [...by].sort((a, b2) => b2[1] - a[1])) console.log(`  ${String(n).padStart(3)}  ${b}`)
  console.log('\nstart one with: node start-batch.mjs <project/batch> --go')
  process.exit(0)
}

const mine = all.filter((t) => t.key.includes(batchArg))
const keys = new Set(mine.map((t) => t.key))
if (!mine.length) { console.log(`${batchArg}: no ready tickets. Try --list.`); process.exit(0) }
if (keys.size > 1) {
  console.log(`"${batchArg}" matches ${keys.size} batches, so it is ambiguous. Name one:`)
  for (const k of keys) console.log(`  ${k}`)
  process.exit(1)
}

console.log(`${batchArg}: ${mine.length} ready`)
for (const t of mine) console.log(`  ${t.id.padEnd(8)} ${String(t.points).padStart(2)}pt  ${t.title.slice(0, 64)}`)
if (!has('--go')) { console.log('\nnothing sent. Add --go to nudge the dispatcher, --go --loop to keep him fed.'); process.exit(0) }

function nudge(remaining) {
  const pane = findDeskPane(DISPATCHER)
  if (!pane) { console.log(`no pane for lane ${DISPATCHER}`); return false }
  const status = agentStatus(pane)
  if (status && status !== 'idle' && status !== 'done') { console.log(`dispatcher is ${status}; not interrupting`); return false }
  const next = remaining[0]
  const line = `start-batch ${batchArg}: ${remaining.length} ready in this batch. Next is ${next.id} (${next.points}pt), ${next.title}. Validate and dispatch it, then take the one after without coming back — the full queue is \`node ~/slopdog/v2/scripts/start-batch.mjs ${batchArg}\`. Keep at least two builders loaded while the queue is not empty.`
  try { typeLine(pane, line); console.log(`nudged ${DISPATCHER} with ${next.id}`); return true }
  catch (e) { console.log(`not sent: ${e.message}`); return false }
}

nudge(mine)
if (!has('--loop')) process.exit(0)

// Dirty and simple on purpose: re-check every five minutes, nudge only when the batch still has
// ready tickets and the dispatcher is idle. Stops when the batch is empty.
while (true) {
  pause(5 * 60 * 1000)
  const left = queue().filter((t) => t.key.includes(batchArg))
  if (!left.length) { console.log(`${batchArg}: queue empty, done.`); break }
  nudge(left)
}
