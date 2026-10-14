import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HOOK_DIR = dirname(fileURLToPath(import.meta.url))
const HOOK = join(HOOK_DIR, 'desk-standing-context.mjs')
const V2 = join(HOOK_DIR, '..', '..', '..')

function runHook(payload, env = {}) {
  return spawnSync(process.execPath, [HOOK], {
    cwd: V2,
    encoding: 'utf8',
    input: JSON.stringify(payload),
    env: { ...process.env, ...env },
  })
}

test('AC-1: desk-standing-context.mjs outputs build directive for desks/build, and directive + retro without full mission for laforge', () => {
  // desks/build fixture
  const resBuild = runHook({ cwd: join(V2, 'desks/build') })
  assert.equal(resBuild.status, 0, `hook failed: ${resBuild.stderr}`)
  assert.match(resBuild.stdout, /build directive/i, 'desks/build output must name the build directive')
  assert.match(resBuild.stdout, /mission/i, 'desks/build output includes mission pointer')

  // desks/build/laforge fixture
  const resLaforge = runHook({ cwd: join(V2, 'desks/build/laforge') })
  assert.equal(resLaforge.status, 0, `hook failed: ${resLaforge.stderr}`)
  assert.match(resLaforge.stdout, /build directive/i, 'laforge output must name build directive')
  assert.match(resLaforge.stdout, /retrospective/i, 'laforge output must name retrospective pointer')
  assert.doesNotMatch(resLaforge.stdout, /Mission:\s*read:\s*v2\/rules\/mission\/mission\.md/i, 'laforge output must not include mission pointer')
  assert.doesNotMatch(resLaforge.stdout, /An ever-evolving interface/i, 'laforge output must not include full mission body')
})

test('AC-3: configured entries for build, ideas, and laforge in desk-standing-context.json', () => {
  const configPath = join(V2, 'desk-standing-context.json')
  assert.ok(existsSync(configPath), 'desk-standing-context.json must exist')
  const config = JSON.parse(readFileSync(configPath, 'utf8'))

  const resolveBlocks = (key) => {
    const val = config[key]
    if (typeof val === 'string' && config[val]) return config[val]
    return Array.isArray(val) ? val : []
  }

  const isMissionPointer = (b) => /mission:\s*read:\s*v2\/rules\/mission\/mission\.md/i.test(b) || b.trim() === 'read: v2/rules/mission/mission.md'
  const isBuildDirective = (b) => /build directive/i.test(b)
  const isRetrospective = (b) => /retrospective/i.test(b)

  // build & ideas include mission pointer and build directive block
  for (const lane of ['build', 'ideas']) {
    const blocks = resolveBlocks(lane)
    assert.ok(blocks.some(isMissionPointer), `${lane} must include mission pointer`)
    assert.ok(blocks.some(isBuildDirective), `${lane} must include build directive block`)
  }

  // laforge includes build directive and retrospective pointer, without mission pointer
  const laforgeBlocks = resolveBlocks('laforge')
  assert.ok(laforgeBlocks.some(isBuildDirective), 'laforge must include build directive')
  assert.ok(laforgeBlocks.some(isRetrospective), 'laforge must include retrospective pointer')
  assert.ok(!laforgeBlocks.some(isMissionPointer), 'laforge must not include mission pointer')
})

test('AC-4: hook prints nothing for composer (Cursor lane), and dispatch.mjs dry-run prepends standing context', () => {
  // hook prints nothing for desks/build/sidekicks/composer
  const resComposer = runHook({ cwd: join(V2, 'desks/build/sidekicks/composer') })
  assert.equal(resComposer.status, 0, `hook failed: ${resComposer.stderr}`)
  assert.equal(resComposer.stdout.trim(), '', 'hook must print nothing for composer')

  // A ticket job's dry-run brief (a plain task stays unchanged). From desks/build.
  const ticket = join(V2, 'scripts', 'test-fixtures', 'gate-clean-pass.md')
  const dispatchRes = spawnSync(
    process.execPath,
    [join(V2, 'scripts', 'dispatch.mjs'), '--ticket-path', ticket, '--engine', 'cursor-gemini', '--dry-run'],
    {
      cwd: join(V2, 'desks', 'build'),
      encoding: 'utf8',
      env: { ...process.env, SLOPDOG_V2_ROOT: V2, DISPATCH_QUOTA_STATE_PATH: '' },
    }
  )
  assert.equal(dispatchRes.status, 0, `dispatch failed: ${dispatchRes.stderr}`)
  const first1400 = dispatchRes.stdout.slice(0, 1400)
  assert.match(first1400, /build directive/i, 'dispatch dry-run must contain build directive pointer in first 1400 chars')
  assert.match(first1400, /retrospective/i, 'dispatch dry-run must contain retrospective pointer in first 1400 chars')
})
