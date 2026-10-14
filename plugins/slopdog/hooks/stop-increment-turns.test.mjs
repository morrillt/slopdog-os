import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import {
  incrementTurnsInTicket,
  runStopIncrement,
  isHeadless,
} from './stop-increment-turns.mjs'

const HOOK_DIR = dirname(fileURLToPath(import.meta.url))
const LAFORGE = join(HOOK_DIR, '..', '..', '..', 'desks', 'build', 'laforge')

const FIXTURE = `---
id: T-999
worker: laforge
turns: 1
---

# Probe

T-999 · 🟡 doing

## Progress notes
`

test('incrementTurnsInTicket bumps turns:', () => {
  const out = incrementTurnsInTicket(FIXTURE)
  assert.match(out, /^turns: 2/m)
})

test('runStopIncrement increments on a doing ticket and skips headless', () => {
  const tickets = mkdtempSync(join(tmpdir(), 'turns-hook-'))
  writeFileSync(join(tickets, 'probe.md'), FIXTURE)
  const live = runStopIncrement(
    { cwd: LAFORGE },
    { ...process.env, SLOPDOG_TICKETS_DIR: tickets, SLOPDOG_HOOK_INTERACTIVE: '1' },
  )
  assert.equal(live.ok, true)
  const after = readFileSync(join(tickets, 'probe.md'), 'utf8')
  assert.match(after, /^turns: 2/m)

  writeFileSync(join(tickets, 'probe.md'), FIXTURE)
  const headless = runStopIncrement(
    { cwd: LAFORGE },
    { ...process.env, SLOPDOG_TICKETS_DIR: tickets, SLOPDOG_TURNLOG: '1' },
  )
  assert.equal(headless.skipped, 'headless')
  assert.match(readFileSync(join(tickets, 'probe.md'), 'utf8'), /^turns: 1/m)
})

test('isHeadless respects SLOPDOG_TURNLOG', () => {
  assert.equal(isHeadless({ SLOPDOG_TURNLOG: '1' }, 1), true)
  assert.equal(isHeadless({}, 1), false)
})
