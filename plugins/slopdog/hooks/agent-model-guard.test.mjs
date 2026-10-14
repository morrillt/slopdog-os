// agent-model-guard: an Agent call that names no model is refused; a fork or a named model passes.
// The hook is run as a child with hook JSON on stdin.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { join, dirname } from 'node:path'
import { mkdtempSync, readFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HOOK = join(dirname(fileURLToPath(import.meta.url)), 'agent-model-guard.mjs')
let LOG = join(mkdtempSync(join(tmpdir(), 'agent-guard-')), 'sub', 'subagent-launches.jsonl')
const fire = (payload, raw, env = {}) => spawnSync(process.execPath, [HOOK], { encoding: 'utf8', input: raw ?? JSON.stringify(payload), env: { ...process.env, ...env, SLOPDOG_SUBAGENT_LOG: env.SLOPDOG_SUBAGENT_LOG ?? LOG } })
const lines = () => (existsSync(LOG) ? readFileSync(LOG, 'utf8').trim().split('\n').map((l) => JSON.parse(l)) : [])
const agent = (tool_input) => ({ tool_name: 'Agent', tool_input })

test('an Agent call with no model is refused with one line naming the skill', () => {
  const r = fire(agent({ description: 'x', prompt: 'do it', subagent_type: 'general-purpose' }))
  assert.equal(r.status, 2)
  assert.match(r.stderr, /\/slopdog:spawn-subagent/)
  assert.match(r.stderr, /subagent-tiers\.md/)
  assert.equal(r.stderr.trim().split('\n').length, 1)
})

test('an Agent call with no subagent_type and no model is refused, and a blank model counts as none', () => {
  assert.equal(fire(agent({ prompt: 'do it' })).status, 2)
  assert.equal(fire(agent({ prompt: 'do it', model: '' })).status, 2)
  assert.equal(fire(agent({ prompt: 'do it', model: '  ' })).status, 2)
})

test('an Agent call that names a model passes', () => {
  for (const model of ['sonnet', 'opus', 'haiku']) assert.equal(fire(agent({ prompt: 'x', subagent_type: 'general-purpose', model })).status, 0)
})

test('a fork passes with no model', () => {
  assert.equal(fire(agent({ prompt: 'x', subagent_type: 'fork' })).status, 0)
})

test('another tool passes, and unreadable input fails open', () => {
  assert.equal(fire({ tool_name: 'Bash', tool_input: { command: 'ls' } }).status, 0)
  assert.equal(fire(null, 'not json').status, 0)
  assert.equal(fire(null, '').status, 0)
})

test('a refused call is not logged; an allowed call appends one line with the audit fields', () => {
  LOG = join(mkdtempSync(join(tmpdir(), 'agent-guard-')), 'sub', 'subagent-launches.jsonl')
  assert.equal(fire(agent({ prompt: 'x', description: 'no model' })).status, 2)
  assert.equal(lines().length, 0)
  const r = fire({ ...agent({ prompt: 'x', description: 'hard: review T-742 diff', subagent_type: 'general-purpose', model: 'sonnet', effort: 'high' }), cwd: '/some/desk' })
  assert.equal(r.status, 0)
  const [row] = lines()
  assert.equal(lines().length, 1)
  assert.deepEqual({ ...row, at: typeof row.at }, { at: 'string', cwd: '/some/desk', model: 'sonnet', effort: 'high', subagent_type: 'general-purpose', description: 'hard: review T-742 diff' })
  assert.ok(!Number.isNaN(Date.parse(row.at)))
  fire(agent({ prompt: 'x', description: 'a fork', subagent_type: 'fork' }))
  assert.equal(lines().length, 2)
  assert.equal(lines()[1].model, null)
})

test('logging never blocks a launch: an unwritable log path still exits 0', () => {
  const r = fire(agent({ prompt: 'x', model: 'sonnet' }), undefined, { SLOPDOG_SUBAGENT_LOG: join(HOOK, 'not-a-dir', 'launches.jsonl') })
  assert.equal(r.status, 0)
})
