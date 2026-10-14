// Tests for plan-check.mjs (T-699). Four fixture tickets under the OS temp dir.
//   node --test ~/slopdog/v2/plugins/slopdog/session/build-ticket/scripts/plan-check.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { checkPlan, runCli } from './plan-check.mjs'

const HERE = dirname(fileURLToPath(import.meta.url))
const CLI = join(HERE, 'plan-check.mjs')

const BASE = `---
id: T-fix
project: scratch
---

# Fixture

## Acceptance Criteria

- [ ] AC-1 [unit] (FR-1): first automated criterion.
- [ ] AC-2 [unit] (FR-2): second automated criterion.
- [ ] AC-3 [manual] (FR-3): Todd only.

## Build log

`

const FOOTER = `
## Hand-off

## Progress notes

## Concerns
`

const gwt = (ac, body) => `- 2026-10-08 03:00: [Plan] ${ac} · Given a ticket When plan-check runs Then ${body}`

function ticket(logBody) {
  return `${BASE}${logBody}${FOOTER}`
}

const complete = ticket(`${gwt('AC-1', 'it passes')}\n${gwt('AC-2', 'it also passes')}\n`)

test('complete plan exits 0', () => {
  const r = checkPlan(complete)
  assert.equal(r.ok, true)
  assert.deepEqual(r.lines, [])
  const dir = mkdtempSync(join(tmpdir(), 'plan-check-'))
  const p = join(dir, 'ok.md')
  writeFileSync(p, complete)
  const cli = spawnSync('node', [CLI, p], { encoding: 'utf8' })
  assert.equal(cli.status, 0, cli.stdout + cli.stderr)
})

test('unplanned automated criterion exits 1 with one line naming it', () => {
  const t = ticket(`${gwt('AC-1', 'only one is planned')}\n`)
  const r = checkPlan(t)
  assert.equal(r.ok, false)
  assert.equal(r.lines.length, 1)
  assert.match(r.lines[0], /AC-2/)
  assert.match(r.lines[0], /no plan/i)
})

test('placeholder in a plan line exits 1 with one line naming it', () => {
  const t = ticket(`${gwt('AC-1', 'TODO fill this in')}\n${gwt('AC-2', 'fine')}\n`)
  const r = checkPlan(t)
  assert.equal(r.ok, false)
  assert.ok(r.lines.some((l) => /AC-1/.test(l) && /placeholder/i.test(l)))
})

test('over-long plan exits 1 with the word split', () => {
  const pad = 'x'.repeat(6401)
  const t = ticket(`${gwt('AC-1', pad)}\n${gwt('AC-2', 'short')}\n`)
  const r = checkPlan(t)
  assert.equal(r.ok, false)
  assert.ok(r.lines.some((l) => /split/i.test(l)))
})

test('runCli matches checkPlan on a path', () => {
  const dir = mkdtempSync(join(tmpdir(), 'plan-check-cli-'))
  const p = join(dir, 'bad.md')
  writeFileSync(p, ticket(''))
  const r = runCli(p)
  assert.equal(r.status, 1)
  assert.ok(r.lines.length >= 1)
})
