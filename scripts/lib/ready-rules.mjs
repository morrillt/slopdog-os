// Shared ready-queue rules. ready-queue.mjs and dispatch.mjs both import these so a
// batch cap or a path overlap cannot pass in one script and fail in the other (T-663-2).
import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import os from 'node:os'

export const BATCHES_IN_FLIGHT_CAP = 2
export const BATCH_LANDED_MARK = '🟢'
export const BATCH_NOT_OPEN_MARKS = new Set(['⚪', '🔵'])
const BATCH_BUILT_MARKS = new Set(['🟩', BATCH_LANDED_MARK])

// A hotfix is a special case (Todd, 2026-10-08: "the hotfixes should be exempt... Do what you
// need to so there is no longer a limit"). One test for every gate: dispatch's focus gate, the
// two-batch cap below, ready-queue and verify-sweep all ask this, reading the front matter only.
export function isHotfix(text) {
  const fm = typeof text === 'string' ? text.match(/^---\r?\n([\s\S]*?)\r?\n---/) : null
  return !!fm && /^hotfix:\s*true\s*$/m.test(fm[1])
}

export function batchKeyFor(project, batch) {
  return `${project || '?'}/${batch || '?'}`
}

export function batchCountsAsInFlight(t) {
  if (!t.batch) return false
  if (t.paused) return false
  if (t.mark === BATCH_LANDED_MARK) return false
  if (BATCH_NOT_OPEN_MARKS.has(t.mark)) return false
  return true
}

export function ticketCountsForBatchCap(t, { anyProject, sprint }) {
  // A hotfix never holds one of the two slots, so it cannot stall sprint work either.
  if (t.hotfix || isHotfix(t.text)) return false
  if (!anyProject && t.project !== sprint) return false
  return batchCountsAsInFlight(t)
}

export function batchIsBuilt(tickets, batchKey) {
  return tickets
    .filter((t) => t.batchKey === batchKey)
    .every((t) => BATCH_BUILT_MARKS.has(t.mark))
}

export function batchesInFlightOf(tickets, opts) {
  return [...new Set(
    tickets.filter((t) => ticketCountsForBatchCap(t, opts)).map((t) => t.batchKey),
  )].filter((key) => !batchIsBuilt(tickets, key))
}

export function overBatchAllowance(tasksDir, batchKey) {
  const p = join(tasksDir, '.over-batch', batchKey.replace(/\//g, '--'))
  if (!existsSync(p)) return null
  const body = readFileSync(p, 'utf8').trim()
  return body || '(empty .over-batch file)'
}

function oldestUnfinishedInBatch(tickets, batchKey, listOrder) {
  const open = tickets
    .filter((t) => t.batchKey === batchKey && batchCountsAsInFlight(t))
    .sort((a, b) => (listOrder.get(a.id) ?? 1e9) - (listOrder.get(b.id) ?? 1e9))
  return open[0] || null
}

export function batchCapExcuse(t, { batchesInFlight, tickets, tasksDir, listOrder }) {
  if (!t.batch) return null
  if (t.hotfix || isHotfix(t.text)) return null
  const key = t.batchKey
  if (batchesInFlight.includes(key)) return null
  if (batchesInFlight.length < BATCHES_IN_FLIGHT_CAP) return null
  if (overBatchAllowance(tasksDir, key)) return null
  const open = batchesInFlight
    .map((bk) => {
      const anchor = oldestUnfinishedInBatch(tickets, bk, listOrder)
      const slug = bk.split('/').slice(1).join('/') || bk
      return `${slug} (oldest open ${anchor?.id || '?'})`
    })
    .join('; ')
  return `two batches already in flight — ${open} — would open a third (${key.split('/').slice(1).join('/') || key}); ask Todd for tasks/.over-batch/${key.replace(/\//g, '--')}`
}

// openOnly: skip lines under a ticked `- [x]` item. An in-flight ticket holds only the paths its
// unticked steps will still touch; T-552 held dispatch.mjs with only a proof step left open, and
// the queue refused twelve tickets on a file no one was editing (2026-10-08).
export function extractPathTokens(text, { openOnly = false } = {}) {
  const tokens = new Set()
  const home = process.env.HOME || os.homedir()
  const lines = text.split('\n')
  let ticked = false
  for (const line of lines) {
    const box = line.match(/^\s*- \[([ xX])\]/)
    if (box) ticked = box[1] !== ' '
    else if (line.trim() && !/^\s/.test(line)) ticked = false
    if (openOnly && ticked) continue
    if (!line.includes('Verify:') && !line.includes('(AC:')) continue
    // `git -C <repo>`, `--git-dir`, `--work-tree`, `make -C` name a directory to run in, not a path the ticket claims.
    // A systemd `ExecStart=` executable (`%h/.local/bin/node`, `/usr/bin/env`) and any `%h/...` specifier
    // path name the runtime, not a file the ticket claims; two daemon tickets collided on `/.local/bin/node`.
    const scrubbed = line
      .replace(/(?:^|\s)(?:-C|--git-dir|--work-tree)[= ]+(?:~?\/[^\s'"`)\],;:]+)/g, ' ')
      .replace(/ExecStart=[-@:+!]*[^\s'"`]+/g, ' ')
      .replace(/%[a-zA-Z](?:\/[^\s'"`)\],;:]+)+/g, ' ')
    const matches = scrubbed.matchAll(/(?:~(?:\/[^\s'"\`\)\],;:]+)+|\/(?:[a-zA-Z0-9_.\-@]+)(?:\/[^\s'"\`\)\],;:]+)+)/g)
    for (const m of matches) {
      let raw = m[0].replace(/[.,;:)]+$/, '')
      let p = raw.startsWith('~') ? join(home, raw.slice(1)) : raw
      if (p.length > 1 && p.endsWith('/')) p = p.slice(0, -1)
      tokens.add(p)
    }
  }
  return [...tokens]
}

export function tokensOverlap(a, b) {
  return a === b || a.startsWith(b + '/') || b.startsWith(a + '/')
}

// One hit per in-flight ticket: the first overlapping pair, same as the queue's old loop.
export function pathCollisions(pathTokens, inFlight) {
  const hits = []
  for (const inf of inFlight) {
    let hit = null
    for (const token of pathTokens) {
      for (const inToken of inf.openPathTokens || []) {
        if (tokensOverlap(token, inToken)) {
          hit = { id: inf.id, token, inToken }
          break
        }
      }
      if (hit) break
    }
    if (hit) hits.push(hit)
  }
  return hits
}
