// Tests for build-log.mjs and build-step.mjs. Every case runs against a scratch git repo
// and a scratch ticket under the OS temp dir, never ~/slopdog/tasks.
//   node --test ~/slopdog/v2/plugins/slopdog/session/build-ticket/scripts/
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const HERE = dirname(fileURLToPath(import.meta.url))
const LOG = join(HERE, 'build-log.mjs')
const STEP = join(HERE, 'build-step.mjs')

const TICKET = `---
id: T-999
project: scratch
---

# Scratch ticket

T-999 · 🟡 building

## Steps

- [ ] Write a.txt. (AC: AC-1)
  - Verify: cat a.txt
- [ ] Write b.txt. (AC: AC-1)
  - Verify: cat b.txt

## Notes

- none

## Build log

<!-- Line format: \`- YYYY-MM-DD HH:MM: [Plan|...] <what happened>\` -->

## Hand-off

<!-- Builder fills before verify. -->

## Progress notes

## Concerns
`

const git = (cwd, ...a) => execFileSync('git', ['-C', cwd, ...a], { encoding: 'utf8' }).trim()

function scratch({ ticket = TICKET, ticketInRepo = true } = {}) {
  const root = mkdtempSync(join(tmpdir(), 'build-ticket-'))
  const repo = join(root, 'repo')
  mkdirSync(repo)
  git(repo, 'init', '-q', '-b', 'main')
  git(repo, 'config', 'user.email', 't@example.com')
  git(repo, 'config', 'user.name', 'Test')
  git(repo, 'config', 'commit.gpgsign', 'false')
  writeFileSync(join(repo, 'seed.txt'), 'seed\n')
  let ticketPath
  let tasks = null
  if (ticketInRepo) {
    ticketPath = join(repo, 'ticket.md')
  } else {
    tasks = join(root, 'tasks')
    mkdirSync(join(tasks, 'tickets'), { recursive: true })
    git(tasks, 'init', '-q', '-b', 'main')
    git(tasks, 'config', 'user.email', 't@example.com')
    git(tasks, 'config', 'user.name', 'Test')
    git(tasks, 'config', 'commit.gpgsign', 'false')
    ticketPath = join(tasks, 'tickets', 'scratch.md')
    writeFileSync(ticketPath, ticket)
    git(tasks, 'add', '.')
    git(tasks, 'commit', '-qm', 'seed')
  }
  if (ticketInRepo) writeFileSync(ticketPath, ticket)
  git(repo, 'add', '.')
  git(repo, 'commit', '-qm', 'seed')
  return { root, repo, tasks, ticketPath }
}

// Lane defaults to composer via DISPATCH_LANE; a test that checks lane resolution overrides it.
const run = (script, args, env = {}) => spawnSync('node', [script, ...args], { encoding: 'utf8', env: { ...process.env, DISPATCH_LANE: 'composer', DISPATCH_ENGINE: '', ...env } })

// build-log.mjs

test('build-log appends one stamped line under ## Build log, before ## Hand-off', () => {
  const { ticketPath } = scratch()
  const r = run(LOG, [ticketPath, 'Plan', 'write a.txt for step 1'])
  assert.equal(r.status, 0, r.stderr)
  const t = readFileSync(ticketPath, 'utf8')
  const log = t.slice(t.indexOf('## Build log'), t.indexOf('## Hand-off'))
  assert.match(log, /^- \d{4}-\d{2}-\d{2} \d{2}:\d{2}: \[Plan\] write a\.txt for step 1$/m)
  run(LOG, [ticketPath, 'Decision', 'second line'])
  const t2 = readFileSync(ticketPath, 'utf8')
  const lines = t2.slice(t2.indexOf('## Build log'), t2.indexOf('## Hand-off')).split('\n').filter((l) => l.startsWith('- '))
  assert.equal(lines.length, 2)
  assert.match(lines[1], /\[Decision\] second line$/)
  assert.match(t2, /second line\n\n## Hand-off/)
})

test('build-log creates ## Build log in template position when missing', () => {
  const { ticketPath } = scratch({ ticket: TICKET.replace(/## Build log\n\n<!--.*-->\n\n/, '') })
  assert.ok(!readFileSync(ticketPath, 'utf8').includes('## Build log'))
  const r = run(LOG, [ticketPath, 'Blocker', 'AC-2 names no command'])
  assert.equal(r.status, 0, r.stderr)
  const t = readFileSync(ticketPath, 'utf8')
  assert.ok(t.indexOf('## Notes') < t.indexOf('## Build log'))
  assert.ok(t.indexOf('## Build log') < t.indexOf('## Hand-off'))
  assert.match(t, /## Build log\n\n- .*\[Blocker\] AC-2 names no command\n\n## Hand-off/)
})

test('build-log refuses an unknown tag and writes nothing', () => {
  const { ticketPath } = scratch()
  const before = readFileSync(ticketPath, 'utf8')
  const r = run(LOG, [ticketPath, 'Gotcha', 'nope'])
  assert.equal(r.status, 1)
  assert.match(r.stderr, /unknown tag/)
  assert.equal(readFileSync(ticketPath, 'utf8'), before)
})

test('build-log resolves a T-id from SLOPDOG_TASKS_DIR/tickets', () => {
  const { tasks, ticketPath } = scratch({ ticketInRepo: false })
  const r = run(LOG, ['T-999', 'Assumption', 'by id'], { SLOPDOG_TASKS_DIR: tasks })
  assert.equal(r.status, 0, r.stderr)
  assert.match(readFileSync(ticketPath, 'utf8'), /\[Assumption\] by id/)
})

// build-step.mjs

test('build-step logs, ticks step N, commits exactly the named files plus the ticket', () => {
  const { repo, ticketPath } = scratch()
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  writeFileSync(join(repo, 'stray.txt'), 'not mine\n')
  const r = run(STEP, [ticketPath, '1', 'wrote a.txt', '--why', 'a is the fixture', '--', join(repo, 'a.txt')])
  assert.equal(r.status, 0, r.stderr)
  assert.equal(git(repo, 'log', '-1', '--format=%s'), 'composer T-999 step 1: wrote a.txt')
  assert.deepEqual(git(repo, 'show', '--name-only', '--format=', 'HEAD').split('\n').sort(), ['a.txt', 'ticket.md'])
  assert.match(git(repo, 'status', '--porcelain'), /\?\? stray\.txt/)
  const t = readFileSync(ticketPath, 'utf8')
  assert.match(t, /^- \[x\] Write a\.txt\./m)
  assert.match(t, /^- \[ \] Write b\.txt\./m)
  assert.match(t, /\[Implementation\] Step 1: wrote a\.txt/)
})

test('build-step leaves other staged work out of its commit', () => {
  const { repo, ticketPath } = scratch()
  writeFileSync(join(repo, 'other.txt'), 'another desk\n')
  git(repo, 'add', 'other.txt')
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  const r = run(STEP, [ticketPath, '1', 'wrote a.txt', '--why', 'a is the fixture', '--', join(repo, 'a.txt')])
  assert.equal(r.status, 0, r.stderr)
  assert.ok(!git(repo, 'show', '--name-only', '--format=', 'HEAD').includes('other.txt'))
  assert.match(git(repo, 'status', '--porcelain'), /^A {2}other\.txt/m)
})

test('build-step commits the ticket in its own repo when it lives elsewhere, found by T-id', () => {
  const { repo, tasks, ticketPath } = scratch({ ticketInRepo: false })
  writeFileSync(join(repo, 'b.txt'), 'b\n')
  const r = run(STEP, ['T-999', '2', 'wrote b.txt', '--why', 'b is the fixture', '--', join(repo, 'b.txt')], { SLOPDOG_TASKS_DIR: tasks })
  assert.equal(r.status, 0, r.stderr)
  assert.equal(git(repo, 'log', '-1', '--format=%s'), 'composer T-999 step 2: wrote b.txt')
  assert.equal(git(repo, 'show', '--name-only', '--format=', 'HEAD'), 'b.txt')
  assert.equal(git(tasks, 'log', '-1', '--format=%s'), 'composer T-999 step 2: wrote b.txt')
  assert.match(readFileSync(ticketPath, 'utf8'), /^- \[x\] Write b\.txt\./m)
})

test('build-step --why lists each file under ## Hand-off Files changed', () => {
  const { repo, ticketPath } = scratch()
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  const r = run(STEP, [ticketPath, '1', 'wrote a.txt', '--why', 'holds the a fixture', '--', join(repo, 'a.txt')])
  assert.equal(r.status, 0, r.stderr)
  assert.equal(git(repo, 'log', '-1', '--format=%s'), 'composer T-999 step 1: wrote a.txt')
  const t = readFileSync(ticketPath, 'utf8')
  const handoff = t.slice(t.indexOf('## Hand-off'), t.indexOf('## Progress notes'))
  assert.match(handoff, /\*\*Files changed:\*\*\n- a\.txt — holds the a fixture/)
  writeFileSync(join(repo, 'b.txt'), 'b\n')
  writeFileSync(join(repo, 'a.txt'), 'a2\n')
  run(STEP, [ticketPath, '2', 'wrote b.txt', '--why', 'the b fixture', '--', join(repo, 'b.txt'), join(repo, 'a.txt')])
  const t2 = readFileSync(ticketPath, 'utf8')
  const h2 = t2.slice(t2.indexOf('## Hand-off'), t2.indexOf('## Progress notes'))
  assert.equal((h2.match(/^\*\*Files changed:\*\*/gm) || []).length, 1)
  assert.match(h2, /- a\.txt — holds the a fixture\n- b\.txt — the b fixture\n/)
  assert.equal((h2.match(/a\.txt/g) || []).length, 1)
})

for (const [name, setup, args, err, env = {}] of [
  ['step N is already ticked', (s) => { writeFileSync(s.ticketPath, TICKET.replace('- [ ] Write a.txt', '- [x] Write a.txt')); git(s.repo, 'commit', '-qam', 'tick') ; writeFileSync(join(s.repo, 'a.txt'), 'a\n') }, (s) => [s.ticketPath, '1', 'again', '--why', 'w', '--', join(s.repo, 'a.txt')], /already ticked/],
  ['no files are given', () => {}, (s) => [s.ticketPath, '1', 'nothing', '--why', 'w', '--'], /no files given/],
  ['a named file is unchanged', () => {}, (s) => [s.ticketPath, '1', 'seed', '--why', 'w', '--', join(s.repo, 'seed.txt')], /unchanged/],
  ['--why is missing', (s) => writeFileSync(join(s.repo, 'a.txt'), 'a\n'), (s) => [s.ticketPath, '1', 'x', '--', join(s.repo, 'a.txt')], /--why/],
  ['a --decision has no rejected alternative', (s) => writeFileSync(join(s.repo, 'a.txt'), 'a\n'), (s) => [s.ticketPath, '1', 'x', '--why', 'w', '--decision', 'used json', '--', join(s.repo, 'a.txt')], /alternative rejected/],
  ['no lane resolves', (s) => writeFileSync(join(s.repo, 'a.txt'), 'a\n'), (s) => [s.ticketPath, '1', 'x', '--why', 'w', '--', join(s.repo, 'a.txt')], /no lane/, { DISPATCH_LANE: '', DISPATCH_ENGINE: '' }],
  ['step N does not exist', (s) => writeFileSync(join(s.repo, 'a.txt'), 'a\n'), (s) => [s.ticketPath, '7', 'x', '--why', 'w', '--', join(s.repo, 'a.txt')], /step 7 not found/],
]) {
  test(`build-step refuses, writing nothing, when ${name}`, () => {
    const s = scratch()
    setup(s)
    const before = readFileSync(s.ticketPath, 'utf8')
    const head = git(s.repo, 'rev-parse', 'HEAD')
    const r = run(STEP, args(s), env)
    assert.equal(r.status, 1)
    assert.match(r.stderr, err)
    assert.equal(readFileSync(s.ticketPath, 'utf8'), before)
    assert.equal(git(s.repo, 'rev-parse', 'HEAD'), head)
  })
}

test('build-step writes Why and Decision lines into the commit body and Decision lines into the Build log', () => {
  const { repo, ticketPath } = scratch()
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  const r = run(STEP, [ticketPath, '1', 'wrote a.txt', '--why', 'step 1 needs the fixture',
    '--decision', 'plain text — JSON rejected, nothing parses it', '--decision', 'one file — two files rejected',
    '--', join(repo, 'a.txt')])
  assert.equal(r.status, 0, r.stderr)
  assert.equal(git(repo, 'log', '-1', '--format=%b'),
    'Why: step 1 needs the fixture\nDecision: plain text — JSON rejected, nothing parses it\nDecision: one file — two files rejected')
  const t = readFileSync(ticketPath, 'utf8')
  assert.match(t, /\[Decision\] plain text — JSON rejected, nothing parses it/)
  assert.match(t, /\[Decision\] one file — two files rejected/)
})

test('build-step lane: --lane beats DISPATCH_LANE, DISPATCH_ENGINE is the fallback', () => {
  const s1 = scratch()
  writeFileSync(join(s1.repo, 'a.txt'), 'a\n')
  assert.equal(run(STEP, [s1.ticketPath, '1', 'x', '--why', 'w', '--lane', 'laforge', '--', join(s1.repo, 'a.txt')]).status, 0)
  assert.equal(git(s1.repo, 'log', '-1', '--format=%s'), 'laforge T-999 step 1: x')
  const s2 = scratch()
  writeFileSync(join(s2.repo, 'a.txt'), 'a\n')
  assert.equal(run(STEP, [s2.ticketPath, '1', 'x', '--why', 'w', '--', join(s2.repo, 'a.txt')], { DISPATCH_LANE: '', DISPATCH_ENGINE: 'grok' }).status, 0)
  assert.equal(git(s2.repo, 'log', '-1', '--format=%s'), 'grok T-999 step 1: x')
})

test('build-step lane comes from a v2/.worktrees/<lane>/ repo path when nothing else names it', () => {
  const root = mkdtempSync(join(tmpdir(), 'build-ticket-wt-'))
  const repo = join(root, 'v2', '.worktrees', 'gemini', 'T-999')
  mkdirSync(repo, { recursive: true })
  git(repo, 'init', '-q', '-b', 'main')
  git(repo, 'config', 'user.email', 't@example.com')
  git(repo, 'config', 'user.name', 'Test')
  writeFileSync(join(repo, 'ticket.md'), TICKET)
  git(repo, 'add', '.')
  git(repo, 'commit', '-qm', 'seed')
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  const r = run(STEP, [join(repo, 'ticket.md'), '1', 'x', '--why', 'w', '--', join(repo, 'a.txt')], { DISPATCH_LANE: '', DISPATCH_ENGINE: '' })
  assert.equal(r.status, 0, r.stderr)
  assert.equal(git(repo, 'log', '-1', '--format=%s'), 'gemini T-999 step 1: x')
})

test('trailGaps flags a step ticked without its Build log line or commit, and passes a build-step run', async () => {
  const { trailGaps } = await import('./ticket-lib.mjs')
  const handTicked = TICKET.replace('- [ ] Write a.txt', '- [x] Write a.txt')
  assert.deepEqual(trailGaps(TICKET, handTicked, []), [
    'step 1 ticked with no [Implementation] Step 1 line in ## Build log',
    'step 1 ticked with no "T-999 step 1:" commit',
  ])
  const { repo, ticketPath } = scratch()
  writeFileSync(join(repo, 'a.txt'), 'a\n')
  assert.equal(run(STEP, [ticketPath, '1', 'wrote a.txt', '--why', 'w', '--', join(repo, 'a.txt')]).status, 0)
  const subjects = git(repo, 'log', '--format=%s').split('\n')
  assert.deepEqual(trailGaps(TICKET, readFileSync(ticketPath, 'utf8'), subjects), [])
})

// verify-fail.mjs

const VFAIL = join(HERE, 'verify-fail.mjs')
const vf = (ticketPath, ...a) => run(VFAIL, [ticketPath, '--verifier', 'LaForge', ...a])

test('verify-fail writes one categorised line under ## Progress notes', () => {
  const { ticketPath } = scratch()
  const r = vf(ticketPath, '--category', 'code-defect', '--ac', 'AC-2', '--reason', 'ran `cat b.txt` and it printed nothing.')
  assert.equal(r.status, 0, r.stderr)
  const t = readFileSync(ticketPath, 'utf8')
  assert.match(t.slice(t.indexOf('## Progress notes')), /^- \d{4}-\d{2}-\d{2} \d{2}:\d{2} · LaForge · verify failed \[code-defect\] AC-2: ran `cat b\.txt` and it printed nothing\.$/m)
})

test('verify-fail stamps UTC, not local time', () => {
  const { ticketPath } = scratch()
  const before = Date.now()
  const r = run(VFAIL, [ticketPath, '--verifier', 'LaForge', '--category', 'code-defect', '--ac', 'AC-1', '--reason', 'x'], { TZ: 'Pacific/Kiritimati' })
  assert.equal(r.status, 0, r.stderr)
  const m = readFileSync(ticketPath, 'utf8').match(/^- (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) · LaForge · verify failed/m)
  const d = new Date(before)
  const p = (n) => String(n).padStart(2, '0')
  const utc = `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())} ${p(d.getUTCHours())}:${p(d.getUTCMinutes())}`
  const next = new Date(before + 60000)
  const utc2 = `${next.getUTCFullYear()}-${p(next.getUTCMonth() + 1)}-${p(next.getUTCDate())} ${p(next.getUTCHours())}:${p(next.getUTCMinutes())}`
  assert.ok([utc, utc2].includes(m[1]), `stamp ${m[1]} is not UTC ${utc}`)
})

test('verify-fail refuses a missing or unknown category, or no reason, and writes nothing', () => {
  const { ticketPath } = scratch()
  const before = readFileSync(ticketPath, 'utf8')
  for (const args of [['--ac', 'AC-1', '--reason', 'x'], ['--category', 'bogus', '--ac', 'AC-1', '--reason', 'x'], ['--category', 'code-defect', '--ac', 'AC-1']]) {
    assert.equal(vf(ticketPath, ...args).status, 1)
  }
  assert.equal(readFileSync(ticketPath, 'utf8'), before)
})
