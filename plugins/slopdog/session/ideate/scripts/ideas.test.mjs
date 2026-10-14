// T-658: ideas.mjs carries feature slugs on each idea (node --test).
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'ideas.mjs')

function setup() {
  const dir = mkdtempSync(join(tmpdir(), 'ideas-test-'))
  const file = join(dir, 'ideas.json')
  const registry = join(dir, 'features.md')
  writeFileSync(registry, '---\nslugs:\n  - voice-ideation\n  - runner-board\n---\n# features\n')
  const run = (...args) =>
    spawnSync('node', [SCRIPT, ...args, '--no-commit'], {
      encoding: 'utf8',
      env: { ...process.env, IDEAS_FILE: file, IDEA_FEATURES_REGISTRY: registry },
    })
  const idea = (id) => JSON.parse(readFileSync(file, 'utf8')).ideas.find((x) => x.id === id)
  return { run, idea }
}

test('upsert writes a valid primary and secondary feature slug', () => {
  const { run, idea } = setup()
  const r = run('upsert', 'i-two', '--title', 'Two', '--feature', 'voice-ideation', '--feature2', 'runner-board')
  assert.equal(r.status, 0, r.stderr)
  assert.equal(r.stderr, '')
  assert.equal(idea('i-two').feature, 'voice-ideation')
  assert.equal(idea('i-two').feature2, 'runner-board')
})

test('an unknown slug warns but is kept and exits 0', () => {
  const { run, idea } = setup()
  const r = run('upsert', 'i-odd', '--feature', 'made-up-feature')
  assert.equal(r.status, 0)
  assert.match(r.stderr, /not in the canonical/)
  assert.equal(idea('i-odd').feature, 'made-up-feature')
})

test('more than two slugs is refused at the CLI', () => {
  const { run } = setup()
  const r = run('upsert', 'i-many', '--feature', 'voice-ideation,runner-board', '--feature2', 'swarm-engine')
  assert.equal(r.status, 2)
  assert.match(r.stderr, /at most two/)
  const r2 = run('upsert', 'i-many', '--feature', 'a,b,c')
  assert.equal(r2.status, 2)
})

test('none is the no-feature marker and cannot sit beside a slug', () => {
  const { run, idea } = setup()
  assert.equal(run('upsert', 'i-none', '--feature', 'none').status, 0)
  assert.equal(idea('i-none').feature, 'none')
  assert.equal(idea('i-none').feature2, null)
  const r = run('upsert', 'i-bad', '--feature', 'none', '--feature2', 'runner-board')
  assert.equal(r.status, 2)
})

test('correcting the primary slug replaces the pair, and list shows it', () => {
  const { run, idea } = setup()
  run('upsert', 'i-fix', '--title', 'Fix me', '--feature', 'voice-ideation', '--feature2', 'runner-board')
  assert.equal(run('upsert', 'i-fix', '--feature', 'runner-board').status, 0)
  assert.equal(idea('i-fix').feature, 'runner-board')
  assert.equal(idea('i-fix').feature2, null)
  const list = run('list')
  assert.match(list.stdout, /i-fix\taligning\t-\/10\trunner-board\tFix me/)
})

test('an idea with no feature lists as untagged; null clears a tag', () => {
  const { run } = setup()
  run('upsert', 'i-plain', '--title', 'Plain')
  run('upsert', 'i-clear', '--title', 'Clear', '--feature', 'voice-ideation')
  run('upsert', 'i-clear', '--feature', 'null')
  const out = run('list').stdout
  assert.match(out, /i-plain\t.*\tuntagged\tPlain/)
  assert.match(out, /i-clear\t.*\tuntagged\tClear/)
})
