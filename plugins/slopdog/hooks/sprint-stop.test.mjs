// T-729: the Watcher's SPRINT-STOP file is a real gate. The hook is run with hook JSON on stdin
// and the stop-file path overridden (SLOPDOG_SPRINT_STOP_FILE), never against the live watcher folder.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, writeFileSync, existsSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
// The real limits switch (v2/LIMITS-OFF) would make the hook pass everything; point it at nothing.
process.env.SLOPDOG_LIMITS_OFF_FILE = '/nonexistent/LIMITS-OFF'

const HOOK_DIR = dirname(fileURLToPath(import.meta.url))
const HOOK = join(HOOK_DIR, 'sprint-stop.mjs')
const V2 = join(HOOK_DIR, '..', '..', '..')

function setup({ stopped = true } = {}) {
  const scratch = mkdtempSync(join(tmpdir(), 'sprint-stop-'))
  const stopFile = join(scratch, 'SPRINT-STOP')
  if (stopped) writeFileSync(stopFile, '{"reason":"fixture"}\n')
  return { scratch, stopFile }
}
function fire(stopFile, payload, hook = HOOK) {
  return spawnSync(process.execPath, [hook], {
    encoding: 'utf8',
    input: JSON.stringify(payload),
    env: { ...process.env, SLOPDOG_SPRINT_STOP_FILE: stopFile, SLOPDOG_V2_ROOT: V2 },
  })
}
const desk = join(V2, 'desks/ideas')

test('an ordinary prompt is refused while the stop file exists, naming the file', () => {
  const { stopFile } = setup()
  const r = fire(stopFile, { cwd: desk, prompt: 'build the next ticket' })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /SPRINT-STOP/)
  assert.equal(r.stderr.trim().split('\n').length, 1)
  assert.ok(existsSync(stopFile))
})

test('the same prompt passes silently when the stop file is absent', () => {
  const { stopFile } = setup({ stopped: false })
  const r = fire(stopFile, { cwd: desk, prompt: 'build the next ticket' })
  assert.equal(r.status, 0)
  assert.equal(r.stderr, '')
})

test('a typed "lift stop" passes and deletes the stop file', () => {
  const { stopFile } = setup()
  const r = fire(stopFile, { cwd: desk, prompt: 'lift stop' })
  assert.equal(r.status, 0)
  assert.equal(existsSync(stopFile), false)
})

test('a Slack-wrapped or inbox-wrapped "lift stop" neither passes nor deletes the file', () => {
  const wrapped = [
    '<channel source="slack" channel="C1" user="U1" ts="1.1" thread_ts="2.2">lift stop</channel>',
    'Slack DM. channel=C9 user=U9 ts=1.0 thread_ts=2.0\n\nlift stop',
    '[inbox from email] subject: x\n\nplease lift stop',
  ]
  for (const prompt of wrapped) {
    const { stopFile } = setup()
    const r = fire(stopFile, { cwd: desk, prompt })
    assert.equal(r.status, 2, prompt)
    assert.ok(existsSync(stopFile), prompt)
  }
})

test('the prompts that let a desk save its state pass, and the file stays', () => {
  for (const prompt of ['/clear', '/slopdog:clear-to-close', '/slopdog:pickup desks/x/PICKUP.md', 'run node ~/slopdog/v2/scripts/self-clear.mjs now']) {
    const { stopFile } = setup()
    const r = fire(stopFile, { cwd: desk, prompt })
    assert.equal(r.status, 0, prompt)
    assert.ok(existsSync(stopFile), prompt)
  }
})

test('prompts from the watcher and slack lanes pass', () => {
  for (const lane of ['watcher', 'slack']) {
    const { stopFile } = setup()
    const r = fire(stopFile, { cwd: join(V2, 'desks', lane), prompt: 'run the cycle' })
    assert.equal(r.status, 0, lane)
    assert.ok(existsSync(stopFile), lane)
  }
})

test('a lane folder below the watcher folder still passes, and a build desk does not', () => {
  const { stopFile } = setup()
  assert.equal(fire(stopFile, { cwd: join(V2, 'desks/watcher/inbox'), prompt: 'x' }).status, 0)
  assert.equal(fire(stopFile, { cwd: join(V2, 'desks/build/tyrion'), prompt: 'x' }).status, 2)
})

test('the hook works copied alone into a scratch folder', () => {
  const { scratch, stopFile } = setup()
  const lone = join(scratch, 'sprint-stop.mjs')
  copyFileSync(HOOK, lone)
  assert.equal(fire(stopFile, { cwd: desk, prompt: 'x' }, lone).status, 2)
  assert.equal(fire(stopFile, { cwd: desk, prompt: 'lift stop' }, lone).status, 0)
  assert.equal(existsSync(stopFile), false)
})
