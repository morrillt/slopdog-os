import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const SCRIPT = join(HERE, 'set-focus.mjs')

const INITIAL_CONTEXT = `# Header comments must be preserved
focus: "Initial focus line"
focus_tasks:
  - ticket: T-100
    status: doing
`

test('AC-2: running set-focus with --batches writes the list and leaves the focus line untouched', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'set-focus-test-'))
  const contextPath = join(scratch, 'context.yaml')
  writeFileSync(contextPath, INITIAL_CONTEXT)

  execFileSync('node', [SCRIPT, '--batches', '1-shaping,2a-rings-and-builders,2b-cost-and-the-dispatch-gate'], {
    env: { ...process.env, CONTEXT_FILE: contextPath },
    encoding: 'utf8',
  })

  const updated = readFileSync(contextPath, 'utf8')
  assert.match(updated, /^# Header comments must be preserved/m)
  assert.match(updated, /^focus: "Initial focus line"$/m)
  assert.match(updated, /^focus_batches:\n  - B1-shaping\n  - B2a-rings-and-builders\n  - B2b-cost-and-the-dispatch-gate$/m)
})

test('AC-2: running set-focus without --batches leaves the list untouched', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'set-focus-test-'))
  const contextPath = join(scratch, 'context.yaml')
  const seeded = `# Comments
focus: "Old focus"
focus_batches:
  - B1-shaping
  - B2a-rings-and-builders
focus_tasks: []
`
  writeFileSync(contextPath, seeded)

  execFileSync('node', [SCRIPT, 'New focus line'], {
    env: { ...process.env, CONTEXT_FILE: contextPath },
    encoding: 'utf8',
  })

  const updated = readFileSync(contextPath, 'utf8')
  assert.match(updated, /^focus: "New focus line"$/m)
  assert.match(updated, /^focus_batches:\n  - B1-shaping\n  - B2a-rings-and-builders$/m)
})

test('AC-2: running set-focus with empty --batches writes empty list', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'set-focus-test-'))
  const contextPath = join(scratch, 'context.yaml')
  const seeded = `# Comments
focus: "Old focus"
focus_batches:
  - B1-shaping
focus_tasks: []
`
  writeFileSync(contextPath, seeded)

  execFileSync('node', [SCRIPT, '--batches', ''], {
    env: { ...process.env, CONTEXT_FILE: contextPath },
    encoding: 'utf8',
  })

  const updated = readFileSync(contextPath, 'utf8')
  assert.match(updated, /^focus: "Old focus"$/m)
  assert.match(updated, /^focus_batches: \[\]$/m)
})

test('AC-2: running set-focus with both --batches and focus updates both', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'set-focus-test-'))
  const contextPath = join(scratch, 'context.yaml')
  writeFileSync(contextPath, INITIAL_CONTEXT)

  execFileSync('node', [SCRIPT, '--batches', '2a-rings-and-builders', 'Updated focus line'], {
    env: { ...process.env, CONTEXT_FILE: contextPath },
    encoding: 'utf8',
  })

  const updated = readFileSync(contextPath, 'utf8')
  assert.match(updated, /^focus: "Updated focus line"$/m)
  assert.match(updated, /^focus_batches:\n  - B2a-rings-and-builders$/m)
})

test('cap: a fourth focus batch is refused, exit 1, and the file is left exactly as it was', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'set-focus-test-'))
  const contextPath = join(scratch, 'context.yaml')
  const seeded = `# Comments
focus: "Old focus"
focus_batches:
  - B2a-rings-and-builders
focus_tasks: []
`
  writeFileSync(contextPath, seeded)

  let failure
  try {
    execFileSync('node', [SCRIPT, '--batches', '1-shaping,2a-rings-and-builders,2b-cost-and-the-dispatch-gate,3-fourth', 'New focus line'], {
      env: { ...process.env, CONTEXT_FILE: contextPath },
      encoding: 'utf8',
      stdio: 'pipe',
    })
  } catch (err) {
    failure = err
  }

  assert.ok(failure, 'four batches must be refused')
  assert.equal(failure.status, 1)
  assert.match(failure.stderr, /at most 3 run at once/)
  assert.equal(readFileSync(contextPath, 'utf8'), seeded)
})

test('cap: three batches are accepted, and a repeated tag counts and is written once', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'set-focus-test-'))
  const contextPath = join(scratch, 'context.yaml')
  writeFileSync(contextPath, INITIAL_CONTEXT)

  execFileSync('node', [SCRIPT, '--batches', '1-a,2-b,3-c,3-c'], {
    env: { ...process.env, CONTEXT_FILE: contextPath },
    encoding: 'utf8',
  })

  const updated = readFileSync(contextPath, 'utf8')
  assert.match(updated, /^focus_batches:\n  - B1-a\n  - B2-b\n  - B3-c$/m)
})

test('T-740: --finish-by writes finish_by after the focus_batches list, replaces it, and "none" removes it', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'set-focus-test-'))
  const contextPath = join(scratch, 'context.yaml')
  const seeded = `# Comments
focus: "Old focus"
focus_batches:
  - B2a-rings-and-builders
focus_tasks: []
`
  writeFileSync(contextPath, seeded)
  const run = (...args) => execFileSync('node', [SCRIPT, ...args], { env: { ...process.env, CONTEXT_FILE: contextPath }, encoding: 'utf8' })

  run('--finish-by', '2026-10-11T23:00:00Z')
  assert.match(readFileSync(contextPath, 'utf8'), /^focus_batches:\n  - B2a-rings-and-builders\nfinish_by: "2026-10-11T23:00:00.000Z"\nfocus_tasks: \[\]$/m)
  assert.match(readFileSync(contextPath, 'utf8'), /^focus: "Old focus"$/m)

  run('--finish-by', '2026-10-12T02:00:00Z')
  const twice = readFileSync(contextPath, 'utf8')
  assert.equal(twice.match(/^finish_by:/gm).length, 1)
  assert.match(twice, /^finish_by: "2026-10-12T02:00:00.000Z"$/m)

  run('--finish-by', 'none')
  assert.equal(readFileSync(contextPath, 'utf8'), seeded)
})

test('T-740: an unparseable --finish-by is refused, exit 1, file unchanged', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'set-focus-test-'))
  const contextPath = join(scratch, 'context.yaml')
  writeFileSync(contextPath, INITIAL_CONTEXT)
  let failure
  try {
    execFileSync('node', [SCRIPT, '--finish-by', 'tonight'], { env: { ...process.env, CONTEXT_FILE: contextPath }, encoding: 'utf8', stdio: 'pipe' })
  } catch (err) {
    failure = err
  }
  assert.equal(failure?.status, 1)
  assert.match(failure.stderr, /not a date/)
  assert.equal(readFileSync(contextPath, 'utf8'), INITIAL_CONTEXT)
})
