// Tests for red-check.mjs (T-698). Every case runs against a scratch git repo and a scratch
// ticket under the OS temp dir, never ~/slopdog/tasks.
//   node --test ~/slopdog/v2/plugins/slopdog/session/build-ticket/scripts/red-check.test.mjs
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const RED = join(HERE, 'red-check.mjs')

const TICKET = `---
id: T-999
project: scratch
---

# Scratch ticket

## Acceptance Criteria

- [ ] AC-1 [unit, test-first] (FR-1): Observable behaviour: add() sums; boundary: add.mjs in add.test.mjs.

## Steps

- [ ] Write add.mjs. (AC: AC-1)
  - Verify: add() sums two numbers.

## Build log

## Hand-off

<!-- Builder fills before verify. -->

## Progress notes

## Concerns
`

const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8' }).trim()

function scratch() {
  const repo = join(mkdtempSync(join(tmpdir(), 'red-check-')), 'repo')
  mkdirSync(repo)
  git(repo, 'init', '-q', '-b', 'main')
  git(repo, 'config', 'user.email', 't@example.com')
  git(repo, 'config', 'user.name', 'Test')
  git(repo, 'config', 'commit.gpgsign', 'false')
  const ticketPath = join(repo, 'ticket.md')
  writeFileSync(ticketPath, TICKET)
  git(repo, 'add', '.')
  git(repo, 'commit', '-qm', 'seed')
  const testFile = join(repo, 'add.test.mjs')
  writeFileSync(testFile, "import assert from 'node:assert'\nimport { add } from './add.mjs'\nassert.equal(add(1, 2), 3)\n")
  return { repo, ticketPath, testFile }
}

const run = (args, cwd) => spawnSync('node', [RED, ...args], { encoding: 'utf8', cwd, env: { ...process.env, DISPATCH_LANE: 'composer', DISPATCH_ENGINE: '' } })
const count = (repo) => Number(git(repo, 'rev-list', '--count', 'HEAD'))

test('red-check refuses a command that already passes: exit 1, nothing committed, ticket untouched', () => {
  const { repo, ticketPath, testFile } = scratch()
  const r = run([ticketPath, 'AC-1', '--cmd', 'true', '--', testFile], repo)
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.match(r.stderr, /exits 0/)
  assert.equal(count(repo), 1)
  assert.equal(readFileSync(ticketPath, 'utf8'), TICKET)
})

test('red-check refuses a command that cannot run at all (exit 127): not a red check', () => {
  const { repo, ticketPath, testFile } = scratch()
  const r = run([ticketPath, 'AC-1', '--cmd', 'no-such-binary-t698 x', '--', testFile], repo)
  assert.equal(r.status, 1, r.stdout + r.stderr)
  assert.equal(count(repo), 1)
})

test('red-check commits a failing check and writes the Red-check line under ## Hand-off', () => {
  const { repo, ticketPath, testFile } = scratch()
  const cmd = 'node add.test.mjs'
  const r = run([ticketPath, 'AC-1', '--cmd', cmd, '--', testFile], repo)
  assert.equal(r.status, 0, r.stdout + r.stderr)
  assert.equal(count(repo), 2)
  const hash = git(repo, 'rev-parse', '--short', 'HEAD')
  assert.match(git(repo, 'log', '-1', '--format=%s'), /^composer T-999: red check for AC-1/)
  assert.match(git(repo, 'log', '-1', '--format=%b'), /^Why: /m)
  assert.ok(git(repo, 'show', '--name-only', '--format=', 'HEAD').split('\n').includes('add.test.mjs'))
  const ticket = readFileSync(ticketPath, 'utf8')
  const handOff = ticket.slice(ticket.indexOf('## Hand-off'), ticket.indexOf('## Progress notes'))
  assert.ok(handOff.includes(`Red-check: AC-1 · ${cmd} · `), handOff)
  const line = handOff.split('\n').find((l) => l.includes('Red-check:'))
  const recorded = line.trim().split(' · ').pop()
  assert.ok(git(repo, 'log', '--format=%h %H').includes(recorded), `hash ${recorded} names a commit`)
  assert.ok(hash)
})
