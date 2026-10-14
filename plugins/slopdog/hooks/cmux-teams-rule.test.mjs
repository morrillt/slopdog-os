// The cmux-teams SessionStart hook prints the rule only when CMUX_SOCKET_PATH is set, and always exits 0.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'cmux-teams-rule.mjs')
const run = (extra) => {
  const env = { ...process.env, ...extra }
  if (!('CMUX_SOCKET_PATH' in extra)) delete env.CMUX_SOCKET_PATH
  return spawnSync('node', [HOOK], { env, encoding: 'utf8' })
}

test('silent outside cmux', () => {
  const r = run({})
  assert.equal(r.status, 0)
  assert.equal(r.stdout, '')
})

test('prints the rule inside cmux', () => {
  const r = run({ CMUX_SOCKET_PATH: '/tmp/cmux.sock' })
  assert.equal(r.status, 0)
  assert.match(r.stdout, /# Parallel agents in cmux/)
})
