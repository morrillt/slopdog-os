// T-526: quarantine must leave a gitignored runtime file in place and still
// move a stray untracked file. The fixture is a throwaway repo under tmp,
// never a live service checkout.
import test from 'node:test'
import assert from 'node:assert/strict'
import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdtempSync, mkdirSync, writeFileSync, utimesSync, readFileSync, readdirSync, existsSync, rmSync, chmodSync, copyFileSync, symlinkSync, lstatSync, statSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir, tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { countStrikes, provisionNodeModules, stageWorktreeWork, quarantineTouchedFiles, snapshotFiles, uncommittedPaths } from './dispatch.mjs'
import { sandboxProcess } from './lib/test-sandbox.mjs'
sandboxProcess() // T-696: stub desk inboxes, herdr sends and model calls for this suite
const V2_DIR = dirname(fileURLToPath(import.meta.url))
const V2_ROOT = join(V2_DIR, '..')
const SLOPDOG_V2 = join(homedir(), 'slopdog', 'v2')
const LANES = JSON.parse(readFileSync(join(V2_ROOT, 'lanes.json'), 'utf8'))
const GOAL = join(V2_DIR, 'goal.mjs')

function makeTicketFixture() {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-t596-'))
  const root = join(scratch, 'tasks')
  const inbox = join(scratch, 'done-inbox')
  const jobs = join(scratch, 'jobs')
  const laneInbox = join(scratch, 'lane-inbox')
  const ledger = join(scratch, 'usage-ledger.jsonl')
  const cwd = join(scratch, 'cwd')
  mkdirSync(join(root, 'tickets'), { recursive: true })
  mkdirSync(inbox, { recursive: true })
  mkdirSync(jobs, { recursive: true })
  mkdirSync(laneInbox, { recursive: true })
  mkdirSync(cwd, { recursive: true })
  const ticketPath = join(root, 'tickets', 'fixture-t596.md')
  const body = `---
id: T-596-FIX
estimate:
  points: 1
readiness:
  state: ready
  by: tickets-validate
  updated: "2026-10-03"
  gaps: []
---

# Fixture for T-596

T-596-FIX · 🔵 ready

## Acceptance Criteria

- [ ] AC-1 [manual]: fixture criterion, so the estimate's tier check passes.

## Progress notes

`
  writeFileSync(ticketPath, body)
  writeFileSync(join(root, 'task-list.md'), `| Status | Ticket |\n| :--- | :--- |\n| 🔵 | [fixture](tickets/fixture-t596.md) |\n`)
  return { scratch, root, ticketPath, inbox, jobs, laneInbox, ledger, cwd }
}

// T-552 AC-1: --dry-run prints the brief a builder would receive and exits 0 without
// starting a builder, so the brief can be read and unit-tested before any engine runs.
const DISPATCH = join(import.meta.dirname, 'dispatch.mjs')

// T-740: the cheap lane has no preflight in the brief; the builder skips the skill's preflight too.
test('AC-1: --dry-run brief names the Plan/tick/commit loop and the Hand-off block, and no preflight', () => {
  const fixture = join(import.meta.dirname, 'test-fixtures', 't552-brief-gate-pass.md')
  const out = execFileSync('node', [DISPATCH, '--engine', 'openrouter', '--ticket-path', fixture, '--dry-run'], { encoding: 'utf8' })
  assert.doesNotMatch(out, /check-ticket\.mjs|PREFLIGHT/, 'no check-ticket preflight in the brief')
  assert.match(out, /skip the skill's preflight/, 'the builder is told to skip the skill preflight')
  assert.match(out, /\[Plan\]/, 'brief names the Plan line')
  assert.match(out, /tick/i, 'brief tells the builder to tick the step')
  assert.match(out, /step <N>:/, 'brief names the per-step commit')
  assert.match(out, /Commit as/, 'brief says to commit per step')
  assert.match(out, /## Hand-off/, 'brief names the Hand-off block')
})

test('T-546 gap 4: the brief keeps builder commits inside the worktree and leaves the ticket uncommitted', () => {
  const fixture = join(import.meta.dirname, 'test-fixtures', 'unstamped-after-t552.md')
  const out = execFileSync('node', [DISPATCH, '--engine', 'openrouter', '--ticket-path', fixture, '--dry-run'], { encoding: 'utf8' })
  assert.match(out, /Commit only inside your worktree\. Never run git add, commit or push in ~\/slopdog\/tasks; leave your ticket and task-list\.md edits uncommitted\./)
  const step = (n) => out.split('\n').find((l) => l.startsWith(`${n}. `))
  assert.match(step(4), /leave the ticket uncommitted/, 'step 4 ticks the ticket without committing it')
  assert.match(step(5), /in your worktree/, 'step 5 commits the work in the worktree only')
})

test('T-546 gap 4: only an openrouter brief changes steps 4 and 5; a grok brief keeps the old text', () => {
  const fixture = join(import.meta.dirname, 'test-fixtures', 'unstamped-after-t552.md')
  const brief = (engine) => execFileSync('node', [DISPATCH, '--engine', engine, '--ticket-path', fixture, '--dry-run'], { encoding: 'utf8' })
  const old6 = "4. Tick that step's `- [ ]` checkbox. Never tick the ## Acceptance Criteria checkboxes — those are for the verifier, not for you."
  const old7 = "5. Commit as `grok T-<id> step <N>: <what this step did>` with a second line `Why: <one line>`, where <id> is the ticket's id and N is the step number. Commit after every step, so each one is its own commit."
  const composer = brief('grok')
  assert.ok(composer.includes(old6) && composer.includes(old7), 'composer keeps the old steps 6 and 7')
  assert.doesNotMatch(composer, /Commit only inside your worktree|uncommitted/)
  const or = brief('openrouter')
  assert.ok(!or.includes(old6) && !or.includes(old7), 'openrouter gets the new steps 6 and 7')
  assert.match(or, /Commit only inside your worktree\./)
})

// T-552 grandfather: an unstamped ready ticket whose readiness.updated is on or before
// the T-552 merge date must not get the FR-4 stop. A later unstamped ticket still does.
// --ticket only resolves ids under the tasks folder, so these fixtures go in by --ticket-path.
// T-677: --job write uses a rewrite preamble and leaves build lifecycle mutations off.
test('T-677 AC-1: --job write dry-run uses a rewrite preamble without the build loop', () => {
  const fixture = join(import.meta.dirname, 'test-fixtures', 'gate-clean-pass.md')
  const writePrompt = execFileSync('node', [DISPATCH, '--dry-run', '--job', 'write', '--ticket-path', fixture], { encoding: 'utf8' })
  const defaultPrompt = execFileSync('node', [DISPATCH, '--dry-run', '--ticket-path', fixture], { encoding: 'utf8' })
  const buildPrompt = execFileSync('node', [DISPATCH, '--dry-run', '--job', 'build', '--ticket-path', fixture], { encoding: 'utf8' })
  assert.equal(defaultPrompt, buildPrompt)
  assert.match(writePrompt, /rewrite/i)
  assert.doesNotMatch(writePrompt, /## Hand-off/)
  assert.doesNotMatch(writePrompt, /PREFLIGHT/)
})


test('gitignored .data/db.sqlite stays and untracked scratch.txt moves to quarantine', () => {
  const repo = mkdtempSync(join(tmpdir(), 'dispatch-quarantine-'))
  try {
    execFileSync('git', ['init', '-q'], { cwd: repo })
    const gitignore = join(repo, '.gitignore')
    writeFileSync(gitignore, '.data/\n')
    const old = new Date(Date.now() - 60_000)
    utimesSync(gitignore, old, old)
    mkdirSync(join(repo, '.data'))
    const db = join(repo, '.data', 'db.sqlite')
    writeFileSync(db, 'live-database')
    const scratch = join(repo, 'scratch.txt')
    writeFileSync(scratch, 'stray')
    const quarantineDir = join(repo, 'quarantine')
    quarantineTouchedFiles({ root: repo, quarantineDir, sinceMs: Date.now() - 30_000 })
    assert.equal(existsSync(db), true)
    assert.equal(readFileSync(db, 'utf8'), 'live-database')
    assert.equal(existsSync(scratch), false)
    const moved = readdirSync(quarantineDir)
    assert.ok(moved.some((name) => name.endsWith('-scratch.txt')), `quarantine has ${moved.join(', ')}`)
    assert.equal(moved.some((name) => name.endsWith('db.sqlite')), false)
  } finally {
    rmSync(repo, { recursive: true, force: true })
  }
})

// 2026-10-11 (Process Versus Direct report 3.1): a timed-out or failed build in a checkout other desks
// are editing must leave their uncommitted work alone. The quarantine moves only untracked files the
// job itself created; a tracked file (even one whose mtime moved during the job) is never restored
// from git, and a file that existed before the job is never moved.
function makeDirtyRepo(parent) {
  const repo = mkdtempSync(join(parent, 'dirty-checkout-'))
  const git = (...a) => execFileSync('git', ['-C', repo, ...a], { encoding: 'utf8' }).trim()
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't')
  writeFileSync(join(repo, 'tracked.txt'), 'committed\n')
  git('add', '.'); git('commit', '-qm', 'base')
  const old = new Date(Date.now() - 60_000)
  return { repo, git, old }
}

test('quarantine never restores a tracked file and never moves a file that existed before the job', () => {
  const parent = mkdtempSync(join(tmpdir(), 'dispatch-safe-'))
  try {
    const { repo } = makeDirtyRepo(parent)
    const otherUntracked = join(repo, 'other-desk.js')
    writeFileSync(otherUntracked, 'another desk, untracked\n')
    const before = snapshotFiles(repo)
    const since = Date.now() - 1000
    // Another desk edits a tracked file and an untracked file while the job runs; the job writes one new file.
    writeFileSync(join(repo, 'tracked.txt'), 'another desk, uncommitted\n')
    writeFileSync(otherUntracked, 'another desk, untracked, edited\n')
    const jobFile = join(repo, 'job-made.js')
    writeFileSync(jobFile, 'job output\n')
    const quarantineDir = join(parent, 'quarantine')
    const moved = quarantineTouchedFiles({ root: repo, quarantineDir, sinceMs: since, baseline: before })
    assert.equal(readFileSync(join(repo, 'tracked.txt'), 'utf8'), 'another desk, uncommitted\n', 'tracked edit survives')
    assert.equal(readFileSync(otherUntracked, 'utf8'), 'another desk, untracked, edited\n', 'pre-existing untracked file survives')
    assert.equal(existsSync(jobFile), false, 'the file the job created is quarantined')
    assert.equal(moved.length, 1)
    assert.ok(readdirSync(quarantineDir).some((n) => n.endsWith('-job-made.js')))
    // Without a baseline a tracked file is still never touched.
    writeFileSync(join(repo, 'tracked.txt'), 'edited again\n')
    quarantineTouchedFiles({ root: repo, quarantineDir, sinceMs: since })
    assert.equal(readFileSync(join(repo, 'tracked.txt'), 'utf8'), 'edited again\n')
  } finally { rmSync(parent, { recursive: true, force: true }) }
})

test('uncommittedPaths lists modified and untracked files, skips ignored ones and the excepted folder', () => {
  const parent = mkdtempSync(join(tmpdir(), 'dispatch-safe-'))
  try {
    const { repo } = makeDirtyRepo(parent)
    assert.deepEqual(uncommittedPaths(repo), [])
    writeFileSync(join(repo, '.gitignore'), 'ignored/\n'); execFileSync('git', ['-C', repo, 'add', '.gitignore']); execFileSync('git', ['-C', repo, 'commit', '-qm', 'ignore'])
    mkdirSync(join(repo, 'ignored')); writeFileSync(join(repo, 'ignored', 'x'), 'x')
    mkdirSync(join(repo, 'wt')); writeFileSync(join(repo, 'wt', 'mine.js'), 'x')
    assert.deepEqual(uncommittedPaths(repo, join(repo, 'wt')), [])
    writeFileSync(join(repo, 'tracked.txt'), 'dirty\n'); writeFileSync(join(repo, 'new.js'), 'x')
    const dirty = uncommittedPaths(repo, join(repo, 'wt')).map((p) => p.slice(repo.length + 1)).sort()
    assert.deepEqual(dirty, ['new.js', 'tracked.txt'])
    assert.deepEqual(uncommittedPaths(parent), [], 'not a repo: nothing to protect')
  } finally { rmSync(parent, { recursive: true, force: true }) }
})

// End to end, with a stub engine that hangs until dispatch's own timeout kills it. dispatch only
// accepts a folder under ~/slopdog, so the throwaway repo lives in this checkout's gitignored
// .worktrees/, as the fence test does.
function runHangingBuild({ extraArgs = [], dirtyBefore, editDuringJob }) {
  const { scratch, cwd } = makeTicketFixture()
  mkdirSync(join(V2_ROOT, '.worktrees'), { recursive: true })
  const parent = mkdtempSync(join(V2_ROOT, '.worktrees', 'safe-build-'))
  const { repo, git } = makeDirtyRepo(parent)
  const stub = join(scratch, 'cursor-stub.mjs')
  writeFileSync(stub, `#!/usr/bin/env node\nimport { writeFileSync } from 'node:fs'\n${editDuringJob ? `writeFileSync(${JSON.stringify(join(repo, 'tracked.txt'))}, 'another desk, mid-job\\n')\n` : ''}setTimeout(() => {}, 60000)\n`)
  chmodSync(stub, 0o755)
  if (dirtyBefore) { writeFileSync(join(repo, 'tracked.txt'), 'another desk, uncommitted\n'); writeFileSync(join(repo, 'other-desk.js'), 'another desk, untracked\n') }
  const env = { ...dispatchTestEnv(scratch), DISPATCH_CURSOR_BIN: stub }
  const r = spawnSync(process.execPath, [DISPATCH, 'hanging build', '--engine', 'grok', '--write', '--dir', repo, '--timeout', '2', '--headless', ...extraArgs(repo)], { env, cwd, encoding: 'utf8', timeout: 60000 })
  const cleanup = () => {
    const wts = execFileSync('git', ['-C', repo, 'worktree', 'list', '--porcelain'], { encoding: 'utf8' }).split('\n').filter((l) => l.startsWith('worktree ')).map((l) => l.slice(9)).filter((w) => w !== repo)
    for (const w of wts) rmSync(w, { recursive: true, force: true })
    rmSync(parent, { recursive: true, force: true }); rmSync(scratch, { recursive: true, force: true })
  }
  return { r, repo, git, parent, cleanup }
}

test('a timed-out build in a dirty checkout runs in a worktree of its own and leaves other desks\' files untouched', () => {
  const x = runHangingBuild({ extraArgs: () => [], dirtyBefore: true, editDuringJob: false })
  try {
    assert.match(x.r.stdout + x.r.stderr, /TIMED OUT after 2s/)
    assert.equal(readFileSync(join(x.repo, 'tracked.txt'), 'utf8'), 'another desk, uncommitted\n')
    assert.equal(readFileSync(join(x.repo, 'other-desk.js'), 'utf8'), 'another desk, untracked\n')
    assert.match(x.git('status', '--short'), /M tracked\.txt/)
  } finally { x.cleanup() }
})

test('a timed-out build with an explicit --worktree beside the shared --dir does not restore another desk\'s edit to a tracked file', () => {
  const x = runHangingBuild({ extraArgs: (repo) => { mkdirSync(join(repo, 'mine')); return ['--worktree', join(repo, 'mine')] }, dirtyBefore: false, editDuringJob: true })
  try {
    assert.match(x.r.stdout + x.r.stderr, /TIMED OUT after 2s/)
    assert.equal(readFileSync(join(x.repo, 'tracked.txt'), 'utf8'), 'another desk, mid-job\n', 'tracked file is not checked out again')
  } finally { x.cleanup() }
})

test('a --write build with an explicit --worktree beside a dirty --dir is refused before the engine starts', () => {
  const x = runHangingBuild({ extraArgs: (repo) => { mkdirSync(join(repo, 'mine')); return ['--worktree', join(repo, 'mine')] }, dirtyBefore: true, editDuringJob: false })
  try {
    assert.equal(x.r.status, 2, x.r.stdout + x.r.stderr)
    assert.match(x.r.stderr, /refused, .* has 2 uncommitted changes/)
    assert.equal(readFileSync(join(x.repo, 'tracked.txt'), 'utf8'), 'another desk, uncommitted\n')
    assert.equal(readFileSync(join(x.repo, 'other-desk.js'), 'utf8'), 'another desk, untracked\n')
  } finally { x.cleanup() }
})

const ENGINE_CASES = [
  { engine: 'grok', laneKey: 'grok', dir: join(SLOPDOG_V2, 'desks', 'build'), agy: false },
  { engine: 'gemini', laneKey: 'gemma', dir: join(SLOPDOG_V2, 'desks', 'build'), agy: true },
  { engine: 'ideas-grok', laneKey: 'ideas-grok', dir: join(SLOPDOG_V2, 'desks', 'ideas'), agy: false },
]

function writeEngineStub({ scratch, agy, exitCode = 0 }) {
  const stubDir = join(scratch, 'engine-stub')
  mkdirSync(stubDir, { recursive: true })
  const stub = join(stubDir, 'engine.mjs')
  const stdout = agy
    ? "process.stdout.write(JSON.stringify({ response: 'ok' }) + '\\n')\n"
    : "process.stdout.write('{\"type\":\"result\",\"subtype\":\"success\"}\\n')\n"
  writeFileSync(stub, `#!/usr/bin/env node\n${stdout}process.exit(${exitCode})\n`)
  chmodSync(stub, 0o755)
  return stub
}

function dispatchTestEnv(scratch, inbox = join(scratch, 'inbox'), jobs = join(scratch, 'jobs'), laneInbox = join(scratch, 'lane-inbox'), ledger = join(scratch, 'ledger.jsonl')) {
  mkdirSync(laneInbox, { recursive: true })
  return {
    ...process.env,
    TASKS_DIR: join(scratch, 'tasks'),
    DISPATCH_INBOX_DIR: inbox,
    DISPATCH_JOBS_DIR: jobs,
    DISPATCH_SIDEKICK_INBOX_DIR: laneInbox,
    DISPATCH_LEDGER_PATH: ledger,
    DISPATCH_OPENROUTER_STATE_PATH: join(scratch, 'openrouter-rotation.json'),
    DISPATCH_STALL_SEC: '600',
  }
}

function runDispatchOnFixture({ engine, dir, agy, exitCode = 0, extraArgs = [] }) {
  const { scratch, root, ticketPath, inbox, jobs, laneInbox, ledger, cwd } = makeTicketFixture()
  const stub = writeEngineStub({ scratch, agy, exitCode })
  const env = dispatchTestEnv(scratch, inbox, jobs, laneInbox, ledger)
  if (agy) env.DISPATCH_AGY_BIN = stub
  else env.DISPATCH_CURSOR_BIN = stub
  const args = [
    DISPATCH,
    '--engine', engine,
    '--ticket-path', ticketPath,
    '--dir', dir,
    '--timeout', '30',
    '--headless',
    ...extraArgs,
  ]
  try {
    execFileSync(process.execPath, args, { env, cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (err) {
    if (err.status !== exitCode) throw err
  }
  return { scratch, root, ticketPath, inbox, text: readFileSync(ticketPath, 'utf8') }
}

test('T-677 job write: dispatch leaves ticket status, verifier and Progress notes unchanged', () => {
  const { scratch, ticketPath, inbox } = runDispatchOnFixture({
    engine: 'grok',
    dir: join(SLOPDOG_V2, 'desks', 'build'),
    agy: false,
    exitCode: 0,
    extraArgs: ['--job', 'write'],
  })
  try {
    const text = readFileSync(ticketPath, 'utf8')
    assert.match(text, /T-596-FIX · 🔵 ready/)
    assert.doesNotMatch(text, /^worker:/m)
    assert.doesNotMatch(text, /^verifier:/m)
    assert.doesNotMatch(text, /· Composer · started/)
    assert.doesNotMatch(text, /· 🔍/)
    const inboxFiles = readdirSync(inbox)
    assert.equal(inboxFiles.filter((f) => f.includes('T-596-FIX')).length, 0, 'no Tyrion done-file for a write job')
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('T-596 AC-1: dispatch.mjs records worker, Progress signature, and done-file from the engine lane', () => {
  for (const { engine, laneKey, dir, agy } of ENGINE_CASES) {
    const signerName = LANES[laneKey]?.name || laneKey
    const { scratch, root, ticketPath, inbox, text } = runDispatchOnFixture({ engine, dir, agy, exitCode: 3 })
    try {
      assert.match(text, new RegExp(`^worker: ${laneKey}\\s*$`, 'm'), `${engine} worker field`)
      assert.match(text, new RegExp(`· ${signerName} · started`), `${engine} progress signature`)
      const inboxFiles = readdirSync(inbox)
      const match = inboxFiles.find((f) => f.includes(`-from-${laneKey}-`))
      assert.ok(match, `${engine} done-file lane tag in ${inboxFiles.join(', ')}`)
      const header = readFileSync(join(inbox, match), 'utf8').split('\n')[0]
      assert.match(header, new RegExp(`From ${signerName}`), `${engine} done-file signer`)
      if (agy) assert.match(text, /stopped: agy exited 3/)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }
})

test('T-596 AC-3: goal.mjs grok lists the ticket after a grok dispatch fixture', () => {
  const { scratch, root, ticketPath, inbox, text } = runDispatchOnFixture({
    engine: 'grok',
    dir: join(SLOPDOG_V2, 'desks', 'build'),
    agy: false,
    exitCode: 3,
  })
  try {
    assert.match(text, /^worker: grok\s*$/m)
    const goalEnv = { ...process.env, SLOPDOG_TICKETS_DIR: join(root, 'tickets') }
    const composerOut = execFileSync(process.execPath, [GOAL, 'grok', '--once'], {
      encoding: 'utf8',
      cwd: V2_ROOT,
      env: goalEnv,
    })
    const gemmaOut = execFileSync(process.execPath, [GOAL, 'gemma', '--once'], {
      encoding: 'utf8',
      cwd: V2_ROOT,
      env: goalEnv,
    })
    assert.match(composerOut, /T-596-FIX/)
    assert.doesNotMatch(gemmaOut, /T-596-FIX/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

// herdr agent pane: a stub `herdr` (HERDR_BIN_PATH) lists an idle cursor agent named herdr-grok,
// records send-text, and on Enter plays the agent running the typed script, which writes the job
// file. The contract under test: the job goes into the pane (not headless), as one line, and
// dispatch returns the job file's result and exit code.
function herdrStub(dir, status) {
  const log = join(dir, 'herdr.log')
  const jobs = join(dir, 'jobs')
  const bin = join(dir, 'herdr')
  writeFileSync(bin, `#!${process.execPath}
const fs = require('fs')
const a = process.argv.slice(2)
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(a) + '\\n')
const out = (r) => console.log(JSON.stringify({ result: r }))
if (a[0] === 'agent' && a[1] === 'list') out({ agents: [{ name: 'herdr-grok', pane_id: 'w9:p1', agent: 'cursor', agent_status: ${JSON.stringify(status)} }] })
else if (a[0] === 'pane' && a[1] === 'read') out({ text: '' })
else if (a[0] === 'pane' && a[1] === 'send-keys') {
  fs.mkdirSync(${JSON.stringify(jobs)}, { recursive: true })
  fs.writeFileSync(${JSON.stringify(jobs)} + '/20261003-000000-1.md', '---\\nexit: 0\\n---\\n\\n## Task\\n\\nstubbed pane task\\n\\n## Result\\n\\npane ran it\\n')
} else out({})
`, { mode: 0o755 })
  return { bin, log, jobs }
}

test('--pane: an idle cursor agent pane gets the job as one typed line, not headless', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dispatch-herdr-'))
  try {
    const { bin, log, jobs } = herdrStub(dir, 'idle')
    const env = { ...dispatchTestEnv(dir, join(dir, 'inbox'), jobs, join(dir, 'lane-inbox'), join(dir, 'usage-ledger.jsonl')), HERDR_BIN_PATH: bin }
    const r = execFileSync('node', [DISPATCH, 'stubbed pane task', '--engine', 'grok', '--pane'], { encoding: 'utf8', env })
    assert.match(r, /sent to herdr pane w9:p1/)
    assert.match(r, /pane ran it/)
    const calls = readFileSync(log, 'utf8').trim().split('\n').map((l) => JSON.parse(l))
    const typed = calls.filter((c) => c[0] === 'pane' && c[1] === 'send-text')
    assert.equal(typed.length, 1)
    assert.doesNotMatch(typed[0][3], /\n/, 'one line')
    assert.match(typed[0][3], /sh \S*dispatch-pane-\d+\.sh$/)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

test('--pane: a working cursor agent pane is refused, nothing typed', () => {
  const dir = mkdtempSync(join(tmpdir(), 'dispatch-herdr-'))
  try {
    const { bin, log, jobs } = herdrStub(dir, 'working')
    const env = { ...dispatchTestEnv(dir, join(dir, 'inbox'), jobs, join(dir, 'lane-inbox'), join(dir, 'usage-ledger.jsonl')), HERDR_BIN_PATH: bin }
    assert.throws(() => execFileSync('node', [DISPATCH, 'stubbed pane task', '--engine', 'grok', '--pane'], { encoding: 'utf8', env, stdio: 'pipe' }), /pane was busy/)
    assert.equal(readFileSync(log, 'utf8').includes('send-text'), false)
  } finally { rmSync(dir, { recursive: true, force: true }) }
})

// T-684 AC-3: a desk dispatches only to sidekicks it owns, gemini included. The lanes come from a
// fixture (DISPATCH_LANES_FILE) so the test does not depend on the live lanes.json; the cwd is the
// desk folder in this tree, which is how dispatch.mjs finds the sender.
function ownerFixture() {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-t684-'))
  const lanes = { ...LANES }
  lanes['slack-gemini'] ??= { id: 'slack-gemini', name: 'Slack Gemini', folder: 'desks/slack/sidekicks/gemini', engine: 'agy', model: 'gemini-3.8-flash-medium', owner: 'slack' }
  const lanesFile = join(scratch, 'lanes.json')
  writeFileSync(lanesFile, JSON.stringify(lanes))
  return { scratch, env: { ...dispatchTestEnv(scratch), DISPATCH_LANES_FILE: lanesFile } }
}
function dryRun(desk, engine, env) {
  try {
    const r = execFileSync('node', [DISPATCH, 'noop', '--engine', engine, '--dry-run'], { cwd: join(V2_ROOT, 'desks', desk), env, encoding: 'utf8', stdio: 'pipe' })
    return { code: 0, stderr: '', stdout: r }
  } catch (err) { return { code: err.status, stderr: String(err.stderr), stdout: String(err.stdout) } }
}

test('T-684 AC-3/AC-4: gemini from desks/slack routes to slack-gemini; LaForge and Tyrion get build\'s lanes; the routing line names lane and folder', () => {
  const { scratch, env } = ownerFixture()
  try {
    const run = (desk, engine) => execFileSync('sh', ['-c', `node "${DISPATCH}" noop --engine ${engine} --dry-run 2>&1 >/dev/null`], { cwd: join(V2_ROOT, 'desks', desk), env, encoding: 'utf8' })
    assert.match(run('slack', 'gemini'), /^dispatch-routed lane=slack-gemini folder=desks\/slack\/sidekicks\/gemini$/m)
    assert.match(run('build/laforge', 'grok'), /^dispatch-routed lane=grok folder=desks\/build\/sidekicks\/grok$/m)
    assert.match(run('build/tyrion', 'gemini'), /^dispatch-routed lane=gemma folder=desks\/build\/sidekicks\/gemini$/m)
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('T-684 AC-3: a desk with no lane for the engine is refused and told the fix, gemini included', () => {
  const { scratch, env } = ownerFixture()
  try {
    for (const engine of ['gemini', 'grok']) {
      const r = dryRun('prototyper', engine, env)
      assert.notEqual(r.code, 0, `${engine} from prototyper must exit non-zero`)
      assert.match(r.stderr, new RegExp(`desk prototyper owns no ${engine} sidekick: add a lane with owner: prototyper and folder desks/prototyper/sidekicks/${engine} to the registry`))
      assert.doesNotMatch(r.stderr, /dispatch-routed/)
    }
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

// T-663-1: mechanical dispatch gate fixtures run in an isolated TASKS_DIR scratch tree.
const GATE_FIXTURES = join(import.meta.dirname, 'test-fixtures')

function installGateFixture(fixtureName, { listMark = '🔵', beforeCopy } = {}) {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-gate-'))
  const root = join(scratch, 'tasks')
  mkdirSync(join(root, 'tickets'), { recursive: true })
  const ticketPath = join(root, 'tickets', fixtureName)
  if (beforeCopy) beforeCopy(root)
  copyFileSync(join(GATE_FIXTURES, fixtureName), ticketPath)
  writeFileSync(
    join(root, 'task-list.md'),
    `| Status | Ticket |\n| :--- | :--- |\n| ${listMark} | [gate](tickets/${fixtureName}) |\n`,
  )
  const env = dispatchTestEnv(scratch)
  mkdirSync(env.DISPATCH_JOBS_DIR, { recursive: true })
  mkdirSync(env.DISPATCH_INBOX_DIR, { recursive: true })
  return { scratch, root, ticketPath, env }
}

function runGateDispatch(ticketPath, env, { dryRun = true } = {}) {
  const args = ['node', DISPATCH, '--engine', 'openrouter', '--ticket-path', ticketPath]
  if (dryRun) args.push('--dry-run')
  try {
    const stdout = execFileSync(args[0], args.slice(1), { env, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { code: 0, stdout, stderr: '' }
  } catch (err) {
    return { code: err.status ?? 1, stdout: String(err.stdout || ''), stderr: String(err.stderr || '') }
  }
}

function assertGateCheckRefuses(fixture, needle) {
  const { scratch, ticketPath, env } = installGateFixture(fixture)
  try {
    const r = runGateDispatch(ticketPath, env)
    assert.equal(r.code, 2)
    assert.match(r.stderr, new RegExp(needle, 'i'))
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

test('gate: check 5 refuses paused.md', () => {
  assertGateCheckRefuses('paused.md', 'check 5')
})

test('gate: check 6 refuses mark-mismatch.md', () => {
  assertGateCheckRefuses('mark-mismatch.md', 'check 6')
})

test('gate: check 12 refuses todd-only-proof.md', () => {
  assertGateCheckRefuses('todd-only-proof.md', 'check 12')
})

test('gate: check 3 refuses placeholder-path.md', () => {
  assertGateCheckRefuses('placeholder-path.md', 'check 3')
})

test('gate: check 7 refuses tier-overflow.md', () => {
  assertGateCheckRefuses('tier-overflow.md', 'check 7')
})

test('gate: check 7 ignores non-count check-ticket tier messages', () => {
  const { scratch, ticketPath, env } = installGateFixture('tier-fr-uncovered.md')
  try {
    const r = runGateDispatch(ticketPath, env)
    assert.equal(r.code, 0)
    assert.doesNotMatch(r.stderr, /check 7/i)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: check 10 refuses when a (new) path already exists', () => {
  const { scratch, ticketPath, env } = installGateFixture('creates-existing.md', {
    beforeCopy: (root) => writeFileSync(join(root, 'tickets', 'gate-existing-target.md'), 'exists\n'),
  })
  try {
    const r = runGateDispatch(ticketPath, env)
    assert.equal(r.code, 2)
    assert.match(r.stderr, /check 10/i)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: check 10 passes when only the (new) path is created', () => {
  const { scratch, ticketPath, env } = installGateFixture('creates-new-sibling.md', {
    beforeCopy: (root) => writeFileSync(join(root, 'tickets', 'gate-sibling-existing.md'), 'exists\n'),
  })
  try {
    const r = runGateDispatch(ticketPath, env)
    assert.equal(r.code, 0)
    assert.doesNotMatch(r.stderr, /check 10/i)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: dry run refuses and writes nothing', () => {
  const { scratch, ticketPath, env } = installGateFixture('paused.md')
  try {
    const before = readFileSync(ticketPath, 'utf8')
    const r = runGateDispatch(ticketPath, env, { dryRun: true })
    assert.equal(r.code, 2)
    assert.equal(readFileSync(ticketPath, 'utf8'), before)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: refusal writes readiness.gaps', () => {
  const { scratch, ticketPath, env } = installGateFixture('paused.md')
  try {
    const r = runGateDispatch(ticketPath, env, { dryRun: false })
    assert.equal(r.code, 2)
    const after = readFileSync(ticketPath, 'utf8')
    assert.match(after, /gaps:\s*\n\s+-\s+"dispatch gate check 5:/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: clean fixture passes', () => {
  const { scratch, ticketPath, env } = installGateFixture('gate-clean-pass.md')
  try {
    const r = runGateDispatch(ticketPath, env, { dryRun: true })
    assert.equal(r.code, 0)
    assert.match(r.stdout, /Follow .+build-ticket\/SKILL\.md/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

// T-740: check 2 (Verify commands run before the build) is gone; check 3 still refuses.
test('gate: T-557 regression names check 3 and no longer runs check 2', () => {
  const { scratch, ticketPath, env } = installGateFixture('failing-t557.md')
  try {
    const r = runGateDispatch(ticketPath, env)
    assert.equal(r.code, 2)
    assert.doesNotMatch(r.stderr, /check 2\b/i)
    assert.match(r.stderr, /check 3/i)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

// T-663-3: judgement warnings. Dry-run prints the line, exits 0, and writes nothing.
function assertJudgementWarning(fixture, check, { beforeCopy } = {}) {
  const { scratch, ticketPath, env } = installGateFixture(fixture, { beforeCopy })
  try {
    const before = readFileSync(ticketPath, 'utf8')
    const r = spawnSync(process.execPath, [DISPATCH, '--engine', 'openrouter', '--ticket-path', ticketPath, '--dry-run'], { env, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stderr, new RegExp(`judgement warning: check ${check} —`))
    assert.equal(readFileSync(ticketPath, 'utf8'), before)
    assert.match(before, /gaps:\s*\[\s*\]/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
}

test('gate: judgement warning check 1', () => {
  assertJudgementWarning('already-built.md', 1, {
    beforeCopy: (root) => writeFileSync(join(root, 'already-built-target.txt'), 'present\n'),
  })
})

test('gate: judgement warning check 4', () => {
  assertJudgementWarning('forbidden-lane.md', 4)
})

test('gate: judgement warning check 4 ignores a prohibition and a step-0 relay', () => {
  const { scratch, ticketPath, env } = installGateFixture('forbidden-lane.md')
  try {
    const text = readFileSync(ticketPath, 'utf8').replace(
      'Run ticket-add to write the sibling ticket.',
      'Do not run ticket-add. Relay step 0 to the Ideas desk.',
    )
    writeFileSync(ticketPath, text)
    const r = spawnSync(process.execPath, [DISPATCH, '--engine', 'openrouter', '--ticket-path', ticketPath, '--dry-run'], { env, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.doesNotMatch(r.stderr, /judgement warning: check 4/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: judgement warning check 9 stays quiet when a cited file exists', () => {
  const { scratch, ticketPath, env } = installGateFixture('conversation-source.md', {
    beforeCopy: (dir) => writeFileSync(join(dir, 'cited-source.txt'), 'on disk\n'),
  })
  try {
    const text = readFileSync(ticketPath, 'utf8').replace(
      'Record the request from that Slack thread.',
      'Record the request from that Slack thread. The on-disk copy is `cited-source.txt`.',
    )
    writeFileSync(ticketPath, text)
    const r = spawnSync(process.execPath, [DISPATCH, '--engine', 'openrouter', '--ticket-path', ticketPath, '--dry-run'], { env, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.doesNotMatch(r.stderr, /judgement warning: check 9/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: judgement warning check 8', () => {
  assertJudgementWarning('contradiction.md', 8)
})

test('gate: judgement warning check 9', () => {
  assertJudgementWarning('conversation-source.md', 9)
})

test('gate: judgement warning progress note lists every hit', () => {
  const { scratch, ticketPath, env } = installGateFixture('contradiction.md')
  const stub = join(scratch, 'claude-stub.mjs')
  writeFileSync(stub, '#!/usr/bin/env node\nprocess.stdout.write(\'{"type":"result","subtype":"success","result":"built"}\\n\')\n')
  chmodSync(stub, 0o755)
  env.DISPATCH_CLAUDE_BIN = stub
  env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
  env.DISPATCH_OPENROUTER_STATE_PATH = join(scratch, 'rotation.json')
  env.DISPATCH_STALL_SEC = '30'
  writeFileSync(env.DISPATCH_QUOTA_STATE_PATH, '{}\n')
  try {
    const r = spawnSync(process.execPath, [DISPATCH, '--engine', 'openrouter', '--ticket-path', ticketPath, '--headless', '--timeout', '30'], { env, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stderr, /judgement warning: check 8 —/)
    const text = readFileSync(ticketPath, 'utf8')
    const notes = (text.match(/^- .* · judgement warning: check 8 — ticket says 2 acceptance criteria but lists 3\.$/gm) || [])
    assert.equal(notes.length, 1)
    assert.match(text, /gaps:\s*\[\s*\]/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('T-684: ideas uses its own lanes and, owning no openrouter lane, is refused; a run outside any desk gets build\'s lane', () => {
  const { scratch, env } = ownerFixture()
  try {
    const routed = (cwd, engine) => execFileSync('sh', ['-c', `node "${DISPATCH}" noop --engine ${engine} --dry-run 2>&1 >/dev/null`], { cwd, env, encoding: 'utf8' })
    assert.match(routed(join(V2_ROOT, 'desks', 'ideas'), 'gemini'), /^dispatch-routed lane=ideas-gemma folder=desks\/ideas\/sidekicks\/gemini$/m)
    assert.match(routed(join(V2_ROOT, 'desks', 'ideas'), 'grok'), /^dispatch-routed lane=ideas-grok /m)
    const r = dryRun('ideas', 'openrouter', env)
    assert.notEqual(r.code, 0)
    assert.match(r.stderr, /desk ideas owns no openrouter sidekick: add a lane with owner: ideas and folder desks\/ideas\/sidekicks\/openrouter to the registry/)
    assert.match(routed(scratch, 'openrouter'), /^dispatch-routed lane=openrouter folder=desks\/build\/sidekicks\/openrouter$/m)
    assert.match(routed(scratch, 'gemini'), /^dispatch-routed lane=gemma /m)
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

// T-546 gap 4 (AC-6): the openrouter engine's post-run fence. A stub claude streams one Write
// tool_use; outside the worktree the job is refused (non-zero, ticket 🔴 not 🔍, stray path named
// in stderr and in a Concern), inside it the job goes 🔍 as before. The stub writes nothing.
function runOpenRouterFence(writePath) {
  const { scratch, root, ticketPath, inbox, jobs, laneInbox, ledger, cwd } = makeTicketFixture()
  // The tasks fixture is a git repo, so dispatch's own ticket commit can be checked.
  const git = (...a) => execFileSync('git', ['-C', root, ...a], { encoding: 'utf8' }).trim()
  git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't'); git('add', '.'); git('commit', '-qm', 'base')
  // dispatch only accepts a folder under ~/slopdog; this checkout's own gitignored .worktrees/ is one.
  mkdirSync(join(V2_ROOT, '.worktrees'), { recursive: true })
  const wt = mkdtempSync(join(V2_ROOT, '.worktrees', 'fence-test-'))
  const stub = join(scratch, 'claude-stub.mjs')
  const ev = { type: 'assistant', message: { content: [{ type: 'tool_use', name: 'Write', input: { file_path: writePath(wt) } }] } }
  writeFileSync(stub, `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(JSON.stringify(ev) + '\n')})\nprocess.stdout.write('{"type":"result","subtype":"success","result":"built"}\\n')\n`)
  chmodSync(stub, 0o755)
  const env = { ...dispatchTestEnv(scratch, inbox, jobs, laneInbox, ledger), DISPATCH_CLAUDE_BIN: stub }
  const args = [DISPATCH, '--engine', 'openrouter', '--ticket-path', ticketPath, '--write', '--worktree', wt, '--timeout', '30', '--headless', '--no-auto-verify']
  let code = 0, stderr = ''
  try { stderr = execFileSync(process.execPath, args, { env, cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) && '' }
  catch (err) { code = err.status; stderr = String(err.stderr || '') }
  const text = readFileSync(ticketPath, "utf8"); rmSync(wt, { recursive: true, force: true })
  return { scratch, code, stderr, text, lastCommit: git('log', '-1', '--format=%s'), dirty: git('status', '--short') }
}

test('T-546 AC-6: an openrouter run that wrote outside its worktree is refused and the stray path named', () => {
  const r = runOpenRouterFence(() => join(homedir(), 'slopdog', 'v2', 'rules', 'fence-test-stray.md'))
  try {
    assert.notEqual(r.code, 0)
    assert.match(r.stderr, /FENCE BREACH/)
    assert.match(r.stderr, /fence-test-stray\.md \(Write\)/)
    assert.doesNotMatch(r.text, /🔍/)
    assert.match(r.text, /T-596-FIX · 🔴/)
    assert.match(r.text, /## Concerns[\s\S]*fence breach[\s\S]*fence-test-stray\.md/)
    assert.equal(r.lastCommit, 'base', 'no ticket commit on a breach')
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('T-546 AC-6: an openrouter run that wrote only inside its worktree passes to 🔍', () => {
  const r = runOpenRouterFence((wt) => join(wt, 'inside.md'))
  try {
    assert.equal(r.code, 0, r.stderr)
    assert.match(r.text, /T-596-FIX · 🔍/)
    assert.doesNotMatch(r.text, /fence breach/)
    assert.equal(r.lastCommit, "T-596-FIX: builder's ticket updates (openrouter, committed by dispatch)")
    assert.equal(r.dirty, '', 'ticket and task-list.md committed')
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('T-546 gap 4: the openrouter engine passes no --add-dir', () => {
  const line = readFileSync(DISPATCH, 'utf8').split('\n').find((l) => l.includes("'--dangerously-skip-permissions', ...(model"))
  assert.ok(line, 'openrouter args line')
  assert.doesNotMatch(line, /--add-dir/)
})

test('T-477 AC-1: dispatch.mjs has no tmux pane fallback', () => {
  const src = readFileSync(DISPATCH, 'utf8')
  assert.doesNotMatch(src, /\btmux\b/)
})

test('T-477 AC-1: headless and --window routes are wired', () => {
  const src = readFileSync(DISPATCH, 'utf8')
  assert.match(src, /flag\('--headless'\)/)
  assert.match(src, /flag\('--window'\)/)
  assert.match(src, /Ghostty/)
})

function installPointsGateFixture(points) {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-points-'))
  const root = join(scratch, 'tasks')
  mkdirSync(join(root, 'tickets'), { recursive: true })
  const fixtureName = 'gate-clean-pass.md'
  const ticketPath = join(root, 'tickets', fixtureName)
  let t = readFileSync(join(GATE_FIXTURES, 'gate-clean-pass.md'), 'utf8')
  t = t.replace(/points: 5/, `points: ${points}`)
  t = t.replace(/T-GATE-CLEAN/g, `T-PT-${points}`)
  writeFileSync(ticketPath, t)
  writeFileSync(join(root, 'task-list.md'), `| Status | Ticket |\n| :--- | :--- |\n| 🔵 | [gate](tickets/${fixtureName}) |\n`)
  const env = dispatchTestEnv(scratch)
  mkdirSync(env.DISPATCH_JOBS_DIR, { recursive: true })
  mkdirSync(env.DISPATCH_INBOX_DIR, { recursive: true })
  return { scratch, ticketPath, env }
}

test('T-714: dispatch stamps the verifier by points from the ladder (3 is Opus low and 5 is Opus medium, Todd 2026-10-12; 8 is verified like 5 but never built here, T-715)', () => {
  for (const [points, want] of [[3, 'opus-low'], [5, 'opus-medium']]) {
    const { scratch, ticketPath, env } = installPointsGateFixture(points)
    try {
      const stub = writeEngineStub({ scratch, agy: false, exitCode: 0 })
      env.DISPATCH_CURSOR_BIN = stub
      env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
      env.DISPATCH_ESCALATION_LEDGER = join(scratch, 'esc.jsonl')
      execFileSync(process.execPath, [
        DISPATCH, '--engine', 'grok', '--ticket-path', ticketPath, '--no-auto-verify',
        '--dir', join(SLOPDOG_V2, 'desks', 'build'), '--headless', '--timeout', '30',
      ], { env, cwd: join(SLOPDOG_V2, 'desks', 'build'), encoding: 'utf8' })
      const text = readFileSync(ticketPath, 'utf8')
      assert.match(text, new RegExp(`^verifier: ${want}\\s*$`, 'm'), `${points}pt ticket`)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }
})

test('T-714: the ladder verifies an 8-point ticket like a 5-point one', async () => {
  const { loadLadder, verifierFor, rungLabel } = await import('./lib/build-ladder.mjs')
  const c = loadLadder()
  assert.equal(rungLabel(verifierFor(8, c)), rungLabel(verifierFor(5, c)))
})

test('Todd 2026-10-12: with no --engine a ticket builds on Claude Sonnet by points and a dry run names builder and verifier; 8 points go to Data', () => {
  // 1 and 2 points are covered in build-ladder.test.mjs; the dispatch gate wants one acceptance criterion for them, which this fixture lacks.
  const want = { 3: ['medium', 'opus-low'], 5: ['high', 'opus-medium'] }
  for (const [points, [effort, verifier]] of Object.entries(want)) {
    const { scratch, ticketPath, env } = installPointsGateFixture(points)
    try {
      env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
      const r = spawnSync(process.execPath, [DISPATCH, '--ticket-path', ticketPath, '--dir', join(SLOPDOG_V2, 'desks', 'build'), '--dry-run'], { env, cwd: join(SLOPDOG_V2, 'desks', 'build'), encoding: 'utf8' })
      assert.equal(r.status, 0, r.stderr)
      assert.match(r.stdout, new RegExp(`^builder: claude sonnet at ${effort} effort$`, 'm'), `${points}pt builder`)
      assert.match(r.stdout, new RegExp(`^auto-verify: ${verifier} via claude `, 'm'), `${points}pt verifier`)
      assert.match(r.stderr, new RegExp(`"builder":"claude sonnet-${effort}","verifier":"${verifier}","points":${points}`))
    } finally { rmSync(scratch, { recursive: true, force: true }) }
  }
  const { scratch, ticketPath, env } = installPointsGateFixture(8)
  try {
    env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
    const r = spawnSync(process.execPath, [DISPATCH, '--ticket-path', ticketPath, '--dir', join(SLOPDOG_V2, 'desks', 'build'), '--dry-run'], { env, cwd: join(SLOPDOG_V2, 'desks', 'build'), encoding: 'utf8' })
    assert.equal(r.status, 3, r.stderr)
    assert.match(r.stdout, /^route: data$/m)
    assert.match(r.stderr, /8 points \(escalate_from_points 8\)/)
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('Todd 2026-10-12: the claude builder runs `claude -p` headless at the ladder model and effort, and --engine still overrides', () => {
  for (const [points, effort] of [[3, 'medium'], [5, 'high']]) {
    const { scratch, ticketPath, env } = installPointsGateFixture(points)
    try {
      const stub = ladderArgvStub(scratch)
      env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
      env.DISPATCH_CLAUDE_BIN = stub.bin
      const r = spawnSync(process.execPath, [DISPATCH, '--ticket-path', ticketPath, '--no-auto-verify', '--dir', join(SLOPDOG_V2, 'desks', 'build'), '--headless', '--timeout', '30'], { env, encoding: 'utf8' })
      assert.equal(r.status, 0, r.stderr)
      const calls = stub.calls().filter((a) => a.includes('-p'))
      assert.equal(calls.length, 1, `one claude launch: ${JSON.stringify(calls)}`)
      assert.equal(modelAt(calls[0]), 'sonnet')
      assert.equal(calls[0][calls[0].indexOf('--effort') + 1], effort)
      assert.ok(calls[0].includes('--dangerously-skip-permissions'))
      assert.ok(calls[0].includes('stream-json'))
      assert.match(readFileSync(ticketPath, 'utf8'), new RegExp(`^verifier: ${points === 5 ? 'opus-medium' : 'opus-low'}\\s*$`, 'm'))
    } finally { rmSync(scratch, { recursive: true, force: true }) }
  }
  const { scratch, ticketPath, env } = installPointsGateFixture(3)
  try {
    const r = spawnSync(process.execPath, [DISPATCH, '--engine', 'gemini', '--ticket-path', ticketPath, '--dry-run'], { env, encoding: 'utf8' })
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stdout, /^builder: gemini /m, 'an explicit --engine gemini is still honoured')
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('T-477 AC-4: --engine prototyper and --engine data are refused', () => {
  for (const engine of ['prototyper', 'data']) {
    try {
      execFileSync('node', [DISPATCH, 'noop', '--engine', engine, '--dry-run'], { encoding: 'utf8', stdio: 'pipe' })
      assert.fail(`${engine} should refuse`)
    } catch (err) {
      assert.equal(err.status, 2)
      assert.match(String(err.stderr), /refused/i)
    }
  }
})

// T-695: dispatch remembers a 429 per engine and routes the next job elsewhere until the window ends.
function quotaRun(entries, engine = 'gemini') {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-t695-'))
  const statePath = join(scratch, 'engine-quota.json')
  writeFileSync(statePath, JSON.stringify(entries))
  const r = execFileSync('sh', ['-c', `node "${join(V2_DIR, 'dispatch.mjs')}" noop --engine ${engine} --dry-run 2>&1 >/dev/null`],
    { cwd: join(V2_ROOT, 'desks', 'build'), env: { ...dispatchTestEnv(scratch), DISPATCH_QUOTA_STATE_PATH: statePath }, encoding: 'utf8' })
  return r
}
// T-740: the build chain is Gemini alone, so an out-of-quota Gemini is never swapped for Grok.
test('T-695 AC-1: a fresh out of quota entry for gemini does not route the build to grok', () => {
  const out = quotaRun({ 'agy:gemini': { key: 'agy:gemini', time: new Date().toISOString(), reason: '429 rate limit' } })
  assert.doesNotMatch(out, /cursor:grok/)
  assert.match(out, /dispatch-routed lane=gemma/)
})
test('T-695 AC-2: out of quota entry older than the window is ignored', async () => {
  const old = new Date(Date.now() - 48 * 3600 * 1000).toISOString()
  const out = quotaRun({ 'agy:gemini': { key: 'agy:gemini', time: old, reason: '429 rate limit' } })
  assert.doesNotMatch(out, /out of quota/)
  const { recordQuota } = await import('./lib/engine-quota.mjs')
  const statePath = join(mkdtempSync(join(tmpdir(), 'dispatch-t695-')), 'engine-quota.json')
  recordQuota({ statePath, engine: 'gemini', reason: '429 rate limit' })
  const saved = JSON.parse(readFileSync(statePath, 'utf8'))['agy:gemini']
  assert.equal(saved.key, 'agy:gemini'); assert.equal(saved.reason, '429 rate limit'); assert.ok(Date.parse(saved.time))
})

// T-695 attempt 2: dispatch-level runs with a stub engine. The stub's stderr decides whether the
// engine is out of quota; stdout and the result text never do. Each run is sandboxed: a temp ticket,
// a temp quota-state file, cwd outside every desk folder so no real lane inbox is written.
function quotaStubRun({ stderr = '', stdout = '{"type":"result","subtype":"success","result":"ok"}\n', exitCode = 1, hang = false, engine = 'grok', state = null, timeout = '20', extraEnv = {} }) {
  const { scratch, ticketPath, inbox, jobs, laneInbox, ledger, cwd } = makeTicketFixture()
  writeFileSync(ticketPath, readFileSync(ticketPath, 'utf8') + '- 2026-10-08 00:00 · fixture · first note.\n\n## Concerns\n')
  const statePath = join(scratch, 'engine-quota.json')
  if (state) writeFileSync(statePath, JSON.stringify(state))
  const stub = join(scratch, 'quota-stub.mjs')
  writeFileSync(stub, `#!/usr/bin/env node
process.stdout.write(${JSON.stringify(stdout)})
process.stderr.write(${JSON.stringify(stderr)})
${hang ? 'setInterval(() => {}, 1000)' : `setTimeout(() => process.exit(${exitCode}), 50)`}
`)
  chmodSync(stub, 0o755)
  const env = { ...dispatchTestEnv(scratch, inbox, jobs, laneInbox, ledger), DISPATCH_CURSOR_BIN: stub, DISPATCH_QUOTA_STATE_PATH: statePath, ...extraEnv }
  if (extraEnv.DISPATCH_AGY_BIN === true) env.DISPATCH_AGY_BIN = stub
  const t0 = Date.now()
  let code = 0, err = ''
  try { execFileSync(process.execPath, [DISPATCH, '--engine', engine, '--ticket-path', ticketPath, '--timeout', timeout, '--headless'], { env, cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 40000 }) }
  catch (e) { code = e.status; err = String(e.stderr || '') }
  const ms = Date.now() - t0
  const saved = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf8')) : {}
  return { scratch, code, err, ms, saved, text: readFileSync(ticketPath, 'utf8') }
}

test('T-695 attempt 2: a stub that fails with a real 429 on stderr records the quota state and says so', () => {
  const r = quotaStubRun({ stderr: 'Error: 429 Too Many Requests: rate limit reached for this model\n' })
  try {
    assert.notEqual(r.code, 0)
    assert.equal(r.saved['cursor:grok-4.7']?.engine, 'grok', `state file: ${JSON.stringify(r.saved)}`)
    assert.match(r.saved['cursor:grok-4.7'].reason, /429/)
    assert.match(r.err, /grok out of quota/)
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('T-695 attempt 2: a stub that fails with a hex string containing 4290 does not record quota', () => {
  const r = quotaStubRun({ stderr: 'segfault at 0x4290ab, worker 14290\n' })
  try {
    assert.notEqual(r.code, 0)
    assert.equal(r.saved['cursor:grok-4.7'], undefined, `state file: ${JSON.stringify(r.saved)}`)
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('T-695 attempt 2: a 429 in the stdout result text, not stderr, does not record quota', () => {
  const r = quotaStubRun({ stdout: '{"type":"result","subtype":"error","result":"tests: 429 passed, quota exceeded in fixture"}\n', stderr: 'build failed\n' })
  try {
    assert.notEqual(r.code, 0)
    assert.equal(r.saved['cursor:grok-4.7'], undefined, `state file: ${JSON.stringify(r.saved)}`)
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('T-695 attempt 2: a stub that prints 429 on stderr and then hangs is killed fast, not at the timeout', () => {
  const r = quotaStubRun({ stderr: 'HTTP 429: resource exhausted\n', hang: true, timeout: '20' })
  try {
    assert.ok(r.ms < 3000, `dispatch took ${r.ms}ms`)
    assert.notEqual(r.code, 0)
    assert.equal(r.saved['cursor:grok-4.7']?.engine, 'grok')
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

// The verify chain still falls over (cursor Flash to agy), and each hop leaves its note.
test('T-695 attempt 2: each reroute appends a Progress note naming the lane that refused and the lane used', () => {
  const now = new Date().toISOString()
  const r = quotaStubRun({ engine: 'cursor-gemini', exitCode: 0, state: { 'cursor:gemini-3.8-flash': { key: 'cursor:gemini-3.8-flash', time: now, reason: '429' } }, extraEnv: { DISPATCH_AGY_BIN: true } })
  try {
    assert.match(r.text, /## Progress notes\n[\s\S]*\n- \d{4}-\d{2}-\d{2} \d{2}:\d{2} · dispatch · cursor:gemini-3\.8-flash → agy:gemini out of quota, rerouted\.\n[\s\S]*## Concerns/)
    const notes = r.text.split('## Progress notes')[1].split('## Concerns')[0]
    assert.equal((notes.match(/· dispatch · /g) || []).length, 1, notes)
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

// T-714 / T-715: the build ladder from v2/config/build-ladder.json — strikes from any builder,
// escalation to Opus solo at escalate_after_failures, verifier by points, Composer refused.
function strikeNotes(rounds, author = 'Gemma') {
  const lines = []
  for (let i = 0; i < rounds; i++) {
    const day = String(8 + i).padStart(2, '0')
    lines.push(`- 2026-10-${day} 10:00 · ${author} · started.`)
    lines.push(`- 2026-10-${day} 12:00 · Sonnet · verify failed [code-defect] AC-1: round ${i + 1} miss.`)
  }
  return lines.join('\n')
}

function installLadderTicket(scratch, { rounds = 0, ticketId, author }) {
  const root = join(scratch, 'tasks')
  mkdirSync(join(root, 'tickets'), { recursive: true })
  let text = readFileSync(join(GATE_FIXTURES, 'gate-clean-pass.md'), 'utf8')
  text = text.replace(/T-GATE-CLEAN/g, ticketId)
  text = text.replace('## Progress notes\n\n', `## Progress notes\n\n${strikeNotes(rounds, author)}\n\n`)
  const ticketPath = join(root, 'tickets', `${ticketId.toLowerCase()}.md`)
  writeFileSync(ticketPath, text)
  writeFileSync(join(root, 'task-list.md'), `| Status | Ticket |\n| :--- | :--- |\n| 🔵 | [ladder](tickets/${ticketId.toLowerCase()}.md) |\n`)
  return { root, ticketPath }
}

function ladderEnv(scratch) {
  for (const d of ['jobs', 'inbox', 'lane-inbox', 'slopdog-inbox']) mkdirSync(join(scratch, d), { recursive: true })
  const quota = join(scratch, 'quota.json')
  if (!existsSync(quota)) writeFileSync(quota, '{}\n')
  return {
    ...dispatchTestEnv(scratch),
    SLOPDOG_INBOX_DIR: join(scratch, 'slopdog-inbox'),
    DISPATCH_ESCALATION_LEDGER: join(scratch, 'escalation.jsonl'),
    DISPATCH_DATA_INBOX_DIR: join(scratch, 'data-inbox'),
    DISPATCH_QUOTA_STATE_PATH: quota,
  }
}

function ladderArgvStub(scratch) {
  const log = join(scratch, 'cursor-argv.log')
  const bin = join(scratch, 'cursor-agent.cjs')
  writeFileSync(bin, `#!/usr/bin/env node
const fs = require('fs')
const a = process.argv.slice(2)
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(a) + '\\n')
if (a[0] === 'create-chat') { process.stdout.write('aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee\\n'); process.exit(0) }
process.stdout.write('{"type":"result","subtype":"success","result":"ok"}\\n')
process.exit(0)
`)
  chmodSync(bin, 0o755)
  return { bin, calls: () => existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [] }
}

function ladderDispatch({ ticketPath, env, bin, cwd, dryRun = false, engine = 'grok' }) {
  const args = [DISPATCH, '--engine', engine, '--ticket-path', ticketPath, '--dir', join(SLOPDOG_V2, 'desks', 'build'), '--headless', '--timeout', '30', '--no-auto-verify']
  if (dryRun) args.push('--dry-run')
  const r = spawnSync(process.execPath, args, { env: { ...env, DISPATCH_CURSOR_BIN: bin }, cwd, encoding: 'utf8' })
  return { code: r.status, stdout: r.stdout || '', stderr: r.stderr || '' }
}

test('strike count ignores uncategorised verify failed notes', () => {
  const notes = [
    '- 2026-10-08 10:00 · Gemma · started.',
    '- 2026-10-08 12:00 · Sonnet · verify failed AC-1: no category.',
    '- 2026-10-09 10:00 · Gemma · started.',
    '- 2026-10-09 12:00 · Sonnet · verify failed: still none.',
  ].join('\n')
  assert.equal(countStrikes(`## Progress notes\n\n${notes}\n`), 0)
})

test('strike count ignores stale-base and env-quota verify failures, and counts any builder', () => {
  const notes = [
    '- 2026-10-08 10:00 · Grok · started.',
    '- 2026-10-08 12:00 · Sonnet · verify failed [stale-base] AC-1.',
    '- 2026-10-09 10:00 · Gemma · started.',
    '- 2026-10-09 12:00 · Sonnet · verify failed [env-quota] AC-1.',
    '- 2026-10-10 10:00 · Grok · started.',
    '- 2026-10-10 12:00 · Sonnet · verify failed [not-built] AC-1.',
  ].join('\n')
  assert.equal(countStrikes(`## Progress notes\n\n${notes}\n`), 1)
})

test('strike count does not credit a fail after the escalation rung (Data) started', () => {
  const notes = [
    '- 2026-10-08 10:00 · Gemma · started.',
    '- 2026-10-08 11:00 · Data · started.',
    '- 2026-10-08 12:00 · Sonnet · verify failed [code-defect] AC-1.',
  ].join('\n')
  assert.equal(countStrikes(`## Progress notes\n\n${notes}\n`), 0)
})

test('T-714: one strike still builds; exactly two strikes escalate to Opus solo and do not build', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-ladder-esc-'))
  try {
    const stub = ladderArgvStub(scratch)
    const one = installLadderTicket(scratch, { rounds: 1, ticketId: 'T-LADDER-1' })
    const stay = ladderDispatch({ ticketPath: one.ticketPath, env: ladderEnv(scratch), bin: stub.bin, cwd: scratch })
    assert.equal(stay.code, 0, stay.stderr)
    assert.ok(stub.calls().length >= 1, 'one strike: the builder runs')
    assert.match(stay.stderr, /Log: ladder-rung-selected \{"ring":"builder","builder":"grok","verifier":"opus-medium"/)

    const s2 = mkdtempSync(join(tmpdir(), 'dispatch-ladder-esc2-'))
    try {
      const stub2 = ladderArgvStub(s2)
      const two = installLadderTicket(s2, { rounds: 2, ticketId: 'T-LADDER-2' })
      const env2 = ladderEnv(s2)
      const runs = [0, 1].map(() => ladderDispatch({ ticketPath: two.ticketPath, env: env2, bin: stub2.bin, cwd: s2 }))
      for (const r of runs) {
        assert.equal(r.code, 3, r.stderr)
        assert.match(r.stdout, /^route: data$/m)
        assert.match(r.stderr, /escalated to opus-high solo on data \(2 failed verify rounds\); the hand-off is in data's inbox/)
        assert.match(r.stderr, /Log: ladder-rung-selected \{"ring":"escalation"/)
      }
      const handOffs = readdirSync(env2.DISPATCH_DATA_INBOX_DIR)
      assert.equal(handOffs.length, 1, `one hand-off across repeat dispatches: ${handOffs}`)
      assert.match(handOffs[0], /-from-build-t-ladder-2-escalated\.md$/)
      assert.match(readFileSync(join(env2.DISPATCH_DATA_INBOX_DIR, handOffs[0]), 'utf8'), /Why: 2 failed verify rounds/)
      assert.equal(stub2.calls().filter((a) => a.includes('-p')).length, 0, 'escalation never launches the cheap builder')
      const text = readFileSync(two.ticketPath, 'utf8')
      assert.match(text, /^worker: data\s*$/m)
      assert.equal(text.split('\n').filter((l) => /escalated to opus-high solo/.test(l)).length, 1, 'one note across repeat dispatches')
      const rows = readFileSync(env2.DISPATCH_ESCALATION_LEDGER, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l))
      assert.equal(rows.length, 1)
      assert.deepEqual(Object.keys(rows[0]).sort(), ['correction_rounds', 'from_ring', 'reason', 'ticket_id', 'to_ring'])
      assert.equal(rows[0].correction_rounds, 2)
    } finally { rmSync(s2, { recursive: true, force: true }) }
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('T-714: an escalation dry run prints the route, exits 3 and leaves the ticket alone', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-ladder-dry-'))
  try {
    const stub = ladderArgvStub(scratch)
    const t = installLadderTicket(scratch, { rounds: 2, ticketId: 'T-LADDER-DRY' })
    const before = readFileSync(t.ticketPath, 'utf8')
    const r = ladderDispatch({ ticketPath: t.ticketPath, env: ladderEnv(scratch), bin: stub.bin, cwd: scratch, dryRun: true })
    assert.equal(r.code, 3, r.stderr)
    assert.match(r.stdout, /^route: data$/m)
    assert.equal(readFileSync(t.ticketPath, 'utf8'), before)
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('T-715: an 8-point ticket with zero strikes dispatches straight to the escalation rung (dry run), a 5-point one does not', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-ladder-points-'))
  try {
    const stub = ladderArgvStub(scratch)
    const t = installLadderTicket(scratch, { rounds: 0, ticketId: 'T-LADDER-EIGHT' })
    const text = readFileSync(t.ticketPath, 'utf8')
    assert.match(text, /^\s+points:\s*5\s*$/m, 'fixture starts at 5 points')
    const stays = ladderDispatch({ ticketPath: t.ticketPath, env: ladderEnv(scratch), bin: stub.bin, cwd: scratch, dryRun: true })
    assert.equal(stays.code, 0, stays.stderr)
    assert.match(stays.stderr, /"ring":"builder"/)
    writeFileSync(t.ticketPath, text.replace(/^(\s+points:)\s*5\s*$/m, '$1 8'))
    const r = ladderDispatch({ ticketPath: t.ticketPath, env: ladderEnv(scratch), bin: stub.bin, cwd: scratch, dryRun: true })
    assert.equal(r.code, 3, r.stderr)
    assert.match(r.stdout, /^route: data$/m)
    assert.match(r.stderr, /"ring":"escalation"[^\n]*"points":8,"strikes":0/)
    assert.equal(stub.calls().length, 0, 'the cheap builder never runs')
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('T-714: a fixture ladder changes the strike count and escalation lane with no code edit', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-ladder-fixture-'))
  try {
    const cfg = JSON.parse(readFileSync(new URL('../config/build-ladder.json', import.meta.url), 'utf8'))
    cfg.escalate_after_failures = 1
    cfg.escalation.lane = 'laforge'
    const cfgPath = join(scratch, 'ladder.json')
    writeFileSync(cfgPath, JSON.stringify(cfg))
    const stub = ladderArgvStub(scratch)
    const t = installLadderTicket(scratch, { rounds: 1, ticketId: 'T-LADDER-FX' })
    const r = ladderDispatch({ ticketPath: t.ticketPath, env: { ...ladderEnv(scratch), BUILD_LADDER_PATH: cfgPath }, bin: stub.bin, cwd: scratch, dryRun: true })
    assert.equal(r.code, 3, r.stderr)
    assert.match(r.stdout, /^route: laforge$/m)
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('T-714: a ticket with no estimate is refused with an add-estimate message, not given the cheapest verifier', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-ladder-noest-'))
  try {
    const stub = ladderArgvStub(scratch)
    const t = installLadderTicket(scratch, { rounds: 0, ticketId: 'T-LADDER-NOEST' })
    const text = readFileSync(t.ticketPath, 'utf8').replace(/^estimate:\n(?:[ \t]+[^\n]*\n)*/m, '')
    assert.doesNotMatch(text, /^estimate:/m, 'fixture has no estimate')
    writeFileSync(t.ticketPath, text)
    const r = ladderDispatch({ ticketPath: t.ticketPath, env: ladderEnv(scratch), bin: stub.bin, cwd: scratch })
    assert.equal(r.code, 2, r.stderr)
    assert.match(r.stderr, /has no estimate; add estimate:/)
    assert.equal(stub.calls().length, 0, 'no builder launched')
    assert.doesNotMatch(readFileSync(t.ticketPath, 'utf8'), /^verifier:/m)
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('T-714: --engine composer is refused, naming the ladder file', () => {
  for (const engine of ['composer', 'ideas-composer']) {
    const r = spawnSync(process.execPath, [DISPATCH, 'noop', '--engine', engine, '--dry-run'], { encoding: 'utf8' })
    assert.equal(r.status, 2, r.stderr)
    assert.match(r.stderr, /disabled in .*build-ladder\.json/)
  }
})

// T-707: Cursor chat id on the ticket, resumed only for the same lane, model and ring.
const T707_CREATED = 'aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee'
const T707_STORED = '11111111-2222-4333-8444-555555555555'
const T707_FAILURE = 'verify failed [code-defect] AC-1: the resume fixture missed the stored chat.'

function cursorArgvStub(dir, { createId = T707_CREATED, failResumeIds = [] } = {}) {
  const log = join(dir, 'cursor-argv.log')
  const bin = join(dir, 'cursor-agent.cjs')
  writeFileSync(bin, `#!/usr/bin/env node
const fs = require('fs')
const a = process.argv.slice(2)
fs.appendFileSync(${JSON.stringify(log)}, JSON.stringify(a) + '\\n')
if (a[0] === 'create-chat') {
  process.stdout.write(${JSON.stringify(createId)} + '\\n')
  process.exit(0)
}
const i = a.indexOf('--resume')
if (i !== -1 && ${JSON.stringify(failResumeIds)}.includes(a[i + 1])) {
  process.stderr.write('Failed to resume chat: chat not found\\n')
  process.exit(1)
}
process.stdout.write('{"type":"result","subtype":"success","result":"ok"}\\n')
process.exit(0)
`)
  chmodSync(bin, 0o755)
  return {
    bin,
    log,
    calls: () => existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [],
  }
}

function t707Ticket(extraFront = '', notes = '') {
  return `---
id: T-707-FIX
estimate:
  points: 1
readiness:
  state: ready
  by: tickets-validate
  updated: "2026-10-08"
  gaps: []
${extraFront}---

# Fixture for T-707

T-707-FIX · 🔵 ready

## Acceptance Criteria

- [ ] AC-1 [manual]: fixture criterion, so the estimate's tier check passes.

## Progress notes

${notes}`
}

function runCursorTicket({ ticketBody, createId, failResumeIds = [] }) {
  const { scratch, root, ticketPath, inbox, jobs, laneInbox, ledger, cwd } = makeTicketFixture()
  writeFileSync(ticketPath, ticketBody)
  const stub = cursorArgvStub(scratch, { createId, failResumeIds })
  const quota = join(scratch, 'quota.json')
  writeFileSync(quota, '{}')
  const env = {
    ...dispatchTestEnv(scratch, inbox, jobs, laneInbox, ledger),
    DISPATCH_CURSOR_BIN: stub.bin,
    DISPATCH_QUOTA_STATE_PATH: quota,
  }
  let code = 0
  let stderr = ''
  try {
    execFileSync(process.execPath, [DISPATCH, '--engine', 'grok', '--ticket-path', ticketPath, '--timeout', '30', '--headless'], {
      env, cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 20000,
    })
  } catch (err) {
    code = err.status ?? 1
    stderr = String(err.stderr || '')
  }
  const jobFiles = existsSync(jobs) ? readdirSync(jobs).map((f) => `## ${f}\n${readFileSync(join(jobs, f), 'utf8')}`) : []
  return { scratch, root, ticketPath, code, stderr, text: readFileSync(ticketPath, 'utf8'), calls: stub.calls(), jobs: jobFiles.join('\n'), bin: stub.bin }
}

function cursorChatBlock(text) {
  const m = text.match(/^cursor_chat:\n((?:  [^\n]+\n)*)/m)
  if (!m) return null
  const field = (k) => (m[1].match(new RegExp(`^  ${k}: (.+)$`, 'm')) || [])[1] || ''
  return { id: field('id'), lane: field('lane'), model: field('model'), ring: field('ring') }
}

test('T-707 AC-1: first attempt records cursor_chat; same-lane retry resumes that id with the failure text and never --continue', () => {
  const first = runCursorTicket({ ticketBody: t707Ticket(), createId: T707_CREATED })
  try {
    assert.equal(first.code, 0, first.stderr + first.jobs)
    const chat = cursorChatBlock(first.text)
    assert.ok(chat, 'first attempt writes a cursor_chat block')
    assert.equal(chat.id, T707_CREATED)
    assert.equal(chat.lane, 'grok')
    assert.ok(first.calls.some((a) => a[0] === 'create-chat'), 'first attempt creates a chat')
    for (const call of first.calls) assert.equal(call.includes('--continue'), false)
  } finally { rmSync(first.scratch, { recursive: true, force: true }) }

  const stored = `cursor_chat:\n  id: ${T707_STORED}\n  lane: grok\n  model: grok-4.7-medium\n  ring: ring one\n`
  const retry = runCursorTicket({
    ticketBody: t707Ticket(stored, `- 2026-10-08 12:00 · LaForge · ${T707_FAILURE}\n`),
    createId: T707_CREATED,
  })
  try {
    assert.equal(retry.code, 0, retry.stderr)
    const resumed = retry.calls.find((a) => a.includes('--resume'))
    assert.ok(resumed, 'same-lane retry passes --resume')
    assert.equal(resumed[resumed.indexOf('--resume') + 1], T707_STORED)
    const prompt = resumed[resumed.indexOf('-p') + 1]
    assert.equal(prompt, T707_FAILURE)
    assert.doesNotMatch(prompt, /check-ticket/)
    assert.equal(retry.calls.some((a) => a[0] === 'create-chat'), false, 'same-lane retry does not create a new chat')
    for (const call of retry.calls) assert.equal(call.includes('--continue'), false)
  } finally { rmSync(retry.scratch, { recursive: true, force: true }) }
})

test('T-707 AC-2: a lane, model or ring change overwrites cursor_chat with a new id and no --resume; a failed resume starts fresh and notes it', () => {
  const oldId = T707_STORED
  const cases = [
    { label: 'lane', front: `cursor_chat:\n  id: ${oldId}\n  lane: grok\n  model: claude-sonnet-5-5-medium\n  ring: ring one\n` },
    { label: 'model', front: `cursor_chat:\n  id: ${oldId}\n  lane: grok\n  model: claude-sonnet-5-5-medium\n  ring: ring one\n` },
    { label: 'ring', front: `cursor_chat:\n  id: ${oldId}\n  lane: grok\n  model: grok-4.7-medium\n  ring: ring two\n` },
  ]
  for (const c of cases) {
    const run = runCursorTicket({ ticketBody: t707Ticket(c.front), createId: T707_CREATED })
    try {
      assert.equal(run.code, 0, `${c.label}: ${run.stderr}`)
      const chat = cursorChatBlock(run.text)
      assert.ok(chat, `${c.label}: cursor_chat overwritten`)
      assert.equal(chat.id, T707_CREATED, `${c.label}: new id`)
      assert.notEqual(chat.id, oldId)
      assert.equal(chat.lane, 'grok', `${c.label}: lane is the builder that ran`)
      const resumedOld = run.calls.some((a) => a.includes('--resume') && a[a.indexOf('--resume') + 1] === oldId)
      assert.equal(resumedOld, false, `${c.label}: does not --resume the old id`)
      for (const call of run.calls) assert.equal(call.includes('--continue'), false)
    } finally { rmSync(run.scratch, { recursive: true, force: true }) }
  }

  const matching = `cursor_chat:\n  id: ${oldId}\n  lane: grok\n  model: grok-4.7-medium\n  ring: ring one\n`
  const failed = runCursorTicket({
    ticketBody: t707Ticket(matching, `- 2026-10-08 12:00 · LaForge · ${T707_FAILURE}\n`),
    createId: T707_CREATED,
    failResumeIds: [oldId],
  })
  try {
    assert.equal(failed.code, 0, failed.stderr)
    const chat = cursorChatBlock(failed.text)
    assert.equal(chat?.id, T707_CREATED)
    assert.match(failed.text, /fresh/i)
    assert.match(failed.text, /## Progress notes[\s\S]*chat is gone/)
    const launches = failed.calls.filter((a) => a.includes('-p'))
    assert.ok(launches.length >= 1)
    assert.equal(launches.some((a) => a.includes('--resume') && a[a.indexOf('--resume') + 1] === oldId && a.includes(T707_FAILURE)), true, 'tries the stored chat once')
    const fresh = launches.filter((a) => !(a.includes('--resume') && a[a.indexOf('--resume') + 1] === oldId))
    assert.ok(fresh.length >= 1, 'a later launch is a fresh session')
    for (const call of failed.calls) assert.equal(call.includes('--continue'), false)
  } finally { rmSync(failed.scratch, { recursive: true, force: true }) }
})

// T-663-2: one gate entry for the stale-assumptions refusal, the two-batch cap, and a collision warning.
function gateTicket({ id, batch, stale, pathLine, status = '🔵 ready' }) {
  const staleFm = stale ? `stale_assumptions:\n  - ${stale}\n` : ''
  const batchFm = batch ? `batch: ${batch}\n` : ''
  const step = pathLine
    ? `- [ ] Step one touches ${pathLine}. (AC: AC-1)\n  - Verify: \`node -e "process.exit(1)"\``
    : `- [ ] Step one. (AC: AC-1)\n  - Verify: \`node -e "process.exit(1)"\``
  return `---
id: ${id}
project: shaping-and-delivery
${batchFm}estimate:
  points: 5
readiness:
  state: ready
  by: tickets-validate
  gaps: []
${staleFm}---

# ${id}

${id} · ${status}

## User Story

As Tyrion, I want this fixture to exercise the dispatch gate.

## Functional Requirements

- FR-1: The gate sees this fixture.
- FR-2: The five-point shape stays valid.

## Acceptance Criteria

- [ ] AC-1 [unit] (FR-1): \`node -e "process.exit(1)"\` fails until built.
- [ ] AC-2 [manual] (FR-1): Todd confirms.
- [ ] AC-3 [unit] (FR-2): \`node -e "process.exit(1)"\` fails until built.

## Steps

${step}

## Progress notes

## Concerns
`
}

function writeBoardTicket(root, name, body, mark, id) {
  const ticketPath = join(root, 'tickets', name)
  writeFileSync(ticketPath, body)
  // task-list hashes are #T plus the id without its leading T- (ready-queue.mjs row parse).
  const hash = `#T${id.replace(/^T-/, '')}`
  return { ticketPath, row: `| ${mark} | [gate](tickets/${name})<br>${hash} |` }
}

test('gate: one entry point refuses stale assumptions and a third batch, and warns on a 🟡 collision', () => {
  const src = readFileSync(DISPATCH, 'utf8')
  const queue = readFileSync(join(import.meta.dirname, 'ready-queue.mjs'), 'utf8')
  assert.match(src, /lib\/ready-rules\.mjs/)
  assert.match(queue, /lib\/ready-rules\.mjs/)
  assert.doesNotMatch(src, /function tokensOverlap/)
  assert.doesNotMatch(queue, /function tokensOverlap/)

  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-gate-entry-'))
  const root = join(scratch, 'tasks')
  mkdirSync(join(root, 'tickets'), { recursive: true })
  const quota = join(scratch, 'quota.json')
  writeFileSync(quota, '{}\n')
  const env = {
    ...dispatchTestEnv(scratch),
    DISPATCH_QUOTA_STATE_PATH: quota,
    DISPATCH_OPENROUTER_STATE_PATH: join(scratch, 'rotation.json'),
  }
  mkdirSync(env.DISPATCH_JOBS_DIR, { recursive: true })
  mkdirSync(env.DISPATCH_INBOX_DIR, { recursive: true })

  const run = (ticketPath) => runGateDispatch(ticketPath, env, { dryRun: true })

  try {
    const stale = writeBoardTicket(root, 'stale.md', gateTicket({ id: 'T-GATE-STALE', stale: 'A-1' }), '🔵', 'T-GATE-STALE')
    writeFileSync(join(root, 'task-list.md'), `| Status | Ticket |\n| :--- | :--- |\n${stale.row}\n`)
    const staleRun = run(stale.ticketPath)
    assert.equal(staleRun.code, 2)
    assert.match(staleRun.stderr, /dispatch: T-GATE-STALE has stale assumptions A-1/)
    assert.doesNotMatch(staleRun.stdout, /build-ticket\/SKILL\.md/)

    const flyA = writeBoardTicket(
      root,
      'fly-a.md',
      gateTicket({ id: 'T-GATE-FLY-A', batch: '2a-rings-and-builders', status: '🟡 doing' }),
      '🟡',
      'T-GATE-FLY-A',
    )
    const flyB = writeBoardTicket(
      root,
      'fly-b.md',
      gateTicket({ id: 'T-GATE-FLY-B', batch: '2b-cost-and-the-dispatch-gate', status: '🟡 doing' }),
      '🟡',
      'T-GATE-FLY-B',
    )
    const third = writeBoardTicket(
      root,
      'third.md',
      gateTicket({ id: 'T-GATE-THIRD', batch: '2c-registry-and-desk-identity' }),
      '🔵',
      'T-GATE-THIRD',
    )
    writeFileSync(join(root, 'task-list.md'), `| Status | Ticket |\n| :--- | :--- |\n${flyA.row}\n${flyB.row}\n${third.row}\n`)
    const thirdRun = run(third.ticketPath)
    assert.equal(thirdRun.code, 2, thirdRun.stderr)
    assert.match(thirdRun.stderr, /two batches already in flight/)
    assert.match(thirdRun.stderr, /refused: check 13/)
    assert.doesNotMatch(thirdRun.stdout, /build-ticket\/SKILL\.md/)

    const shared = '~/slopdog/v2/scripts/dispatch.mjs'
    const fly = writeBoardTicket(
      root,
      'collide-fly.md',
      gateTicket({ id: 'T-GATE-FLY', batch: '2b-cost-and-the-dispatch-gate', pathLine: shared, status: '🟡 doing' }),
      '🟡',
      'T-GATE-FLY',
    )
    const hit = writeBoardTicket(
      root,
      'collide-hit.md',
      gateTicket({ id: 'T-GATE-HIT', batch: '2b-cost-and-the-dispatch-gate', pathLine: shared }),
      '🔵',
      'T-GATE-HIT',
    )
    writeFileSync(join(root, 'task-list.md'), `| Status | Ticket |\n| :--- | :--- |\n${fly.row}\n${hit.row}\n`)
    // execFileSync drops stderr when the process exits 0, and a collision warning is a passing dispatch.
    const hitRun = spawnSync(process.execPath, [DISPATCH, '--engine', 'openrouter', '--ticket-path', hit.ticketPath, '--dry-run'], { env, encoding: 'utf8' })
    assert.equal(hitRun.status, 0, hitRun.stderr)
    assert.match(hitRun.stderr, /collision warning: T-GATE-FLY/)
    assert.match(hitRun.stdout, /build-ticket\/SKILL\.md/)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

function runForced(ticketPath, env, extra = []) {
  return spawnSync(process.execPath, [
    DISPATCH, '--engine', 'openrouter', '--ticket-path', ticketPath, '--headless', '--timeout', '30', ...extra,
  ], { env, encoding: 'utf8' })
}

test('gate: --force dry-run prints the forced lines and the brief and writes nothing', () => {
  const { scratch, ticketPath, env } = installGateFixture('failing-t557.md')
  env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
  writeFileSync(env.DISPATCH_QUOTA_STATE_PATH, '{}\n')
  try {
    const before = readFileSync(ticketPath, 'utf8')
    const r = runForced(ticketPath, env, ['--force', '--dry-run'])
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stderr, /forced past: check 3/)
    assert.match(r.stdout, /build-ticket\/SKILL\.md/)
    assert.equal(readFileSync(ticketPath, 'utf8'), before)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: --force on a real dispatch appends one Progress note and a stub builder runs', () => {
  const { scratch, ticketPath, env } = installGateFixture('failing-t557.md')
  const stub = join(scratch, 'claude-stub.mjs')
  writeFileSync(stub, '#!/usr/bin/env node\nprocess.stdout.write(\'{"type":"result","subtype":"success","result":"built"}\\n\')\n')
  chmodSync(stub, 0o755)
  env.DISPATCH_CLAUDE_BIN = stub
  env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
  env.DISPATCH_OPENROUTER_STATE_PATH = join(scratch, 'rotation.json')
  env.DISPATCH_STALL_SEC = '30'
  writeFileSync(env.DISPATCH_QUOTA_STATE_PATH, '{}\n')
  try {
    const r = runForced(ticketPath, env, ['--force'])
    assert.equal(r.status, 0, r.stderr)
    assert.match(r.stderr, /forced past: check 3/)
    const text = readFileSync(ticketPath, 'utf8')
    assert.match(text, /^- \d{4}-\d{2}-\d{2} \d{2}:\d{2} · OpenRouter · dispatched with --force past check 3\.$/m)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

test('gate: --force still refuses a stale_assumptions fixture and writes nothing', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-force-stale-'))
  const root = join(scratch, 'tasks')
  mkdirSync(join(root, 'tickets'), { recursive: true })
  const body = gateTicket({ id: 'T-GATE-STALE', stale: 'A-1' })
  const ticketPath = join(root, 'tickets', 'stale.md')
  writeFileSync(ticketPath, body)
  writeFileSync(join(root, 'task-list.md'), '| Status | Ticket |\n| :--- | :--- |\n| 🔵 | [gate](tickets/stale.md)<br>#TGATE-STALE |\n')
  const env = {
    ...dispatchTestEnv(scratch),
    DISPATCH_QUOTA_STATE_PATH: join(scratch, 'quota.json'),
  }
  mkdirSync(env.DISPATCH_JOBS_DIR, { recursive: true })
  mkdirSync(env.DISPATCH_INBOX_DIR, { recursive: true })
  writeFileSync(env.DISPATCH_QUOTA_STATE_PATH, '{}\n')
  try {
    const before = readFileSync(ticketPath, 'utf8')
    const r = runForced(ticketPath, env, ['--force', '--dry-run'])
    assert.equal(r.status, 2)
    assert.match(r.stderr, /dispatch: T-GATE-STALE has stale assumptions A-1/)
    assert.doesNotMatch(r.stderr, /forced past:/)
    assert.equal(readFileSync(ticketPath, 'utf8'), before)
  } finally {
    rmSync(scratch, { recursive: true, force: true })
  }
})

// T-697: a --sender reply must land in DISPATCH_INBOX_DIR (else SLOPDOG_INBOX_DIR), never the live desk inbox.
function inboxNames(dir) {
  return existsSync(dir) ? readdirSync(dir).slice().sort() : []
}

test('sender reply honours the inbox override', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-sender-inbox-'))
  const stub = join(scratch, 'engine.mjs')
  writeFileSync(stub, '#!/usr/bin/env node\nprocess.stdout.write(\'{"type":"result","subtype":"success","result":"ok"}\\n\')\nprocess.exit(0)\n')
  chmodSync(stub, 0o755)
  const ideasInbox = join(V2_ROOT, 'desks', 'ideas', 'inbox')
  const liveIdeasInbox = join(homedir(), 'slopdog', 'v2', 'desks', 'ideas', 'inbox')
  const watched = [ideasInbox, liveIdeasInbox]
  const before = new Map(watched.map((dir) => [dir, inboxNames(dir)]))
  const added = []
  const run = (which) => {
    const inbox = join(scratch, which)
    mkdirSync(inbox, { recursive: true })
    const env = {
      ...process.env,
      SLOPDOG_DIR: V2_ROOT,
      DISPATCH_CURSOR_BIN: stub,
      DISPATCH_QUOTA_STATE_PATH: join(scratch, 'quota.json'),
      DISPATCH_LEDGER_PATH: join(scratch, 'ledger.jsonl'),
      DISPATCH_JOBS_DIR: join(scratch, 'jobs'),
      DISPATCH_SIDEKICK_INBOX_DIR: join(scratch, 'sidekick-inbox'),
      DISPATCH_STALL_SEC: '30',
    }
    writeFileSync(env.DISPATCH_QUOTA_STATE_PATH, '{}\n')
    mkdirSync(env.DISPATCH_JOBS_DIR, { recursive: true })
    mkdirSync(env.DISPATCH_SIDEKICK_INBOX_DIR, { recursive: true })
    if (which === 'dispatch-inbox') {
      env.DISPATCH_INBOX_DIR = inbox
      delete env.SLOPDOG_INBOX_DIR
    } else {
      delete env.DISPATCH_INBOX_DIR
      env.SLOPDOG_INBOX_DIR = inbox
    }
    const r = spawnSync(process.execPath, [
      DISPATCH, 'sender reply ping', '--engine', 'grok', '--headless', '--sender', 'ideas', '--timeout', '30',
    ], { env, encoding: 'utf8' })
    for (const dir of watched) {
      const fresh = inboxNames(dir).filter((name) => !before.get(dir).includes(name))
      for (const name of fresh) added.push(join(dir, name))
    }
    const replies = inboxNames(inbox).filter((name) => name.includes('-from-'))
    assert.ok(replies.length > 0, `${which}: reply missing from override inbox (status ${r.status})\n${r.stderr}`)
    for (const dir of watched) {
      const now = inboxNames(dir)
      const fresh = now.filter((name) => !before.get(dir).includes(name))
      assert.deepEqual(now, before.get(dir), `${which}: new file in ${dir}: ${fresh.join(', ')}`)
    }
  }
  try {
    run('dispatch-inbox')
    run('slopdog-inbox')
  } finally {
    for (const file of added) rmSync(file, { force: true })
    rmSync(scratch, { recursive: true, force: true })
  }
})

// 2026-10-08 quick task (dispatch-wakes-tyrion-on-finish): a finished job from any desk but
// build leaves one -from-<lane>- file in Tyrion's inbox naming the ticket, kind, exit and verdict.
// T-740: when the auto-verify follows, it alone reports, so the wake runs with --no-auto-verify here.
function wakeRun({ sender, stdout, extra = [] }) {
  const { scratch, ticketPath, inbox, jobs, laneInbox, ledger, cwd } = makeTicketFixture()
  const tyrion = join(scratch, 'tyrion-inbox')
  const stub = join(scratch, 'wake-stub.mjs')
  writeFileSync(stub, `#!/usr/bin/env node\nprocess.stdout.write(${JSON.stringify(JSON.stringify({ type: 'result', subtype: 'success', result: `${stdout}\nVerify log:\n- Ran: fixture check\n- Saw (happy): pass\n- Saw (unhappy): none possible: fixture\n- Verdict: GREEN, the fixture ran\nVerdict: GREEN` }) + '\n')})\n`)
  chmodSync(stub, 0o755)
  const env = { ...dispatchTestEnv(scratch, inbox, jobs, laneInbox, ledger), DISPATCH_CURSOR_BIN: stub, DISPATCH_CLAUDE_BIN: stub, DISPATCH_AGY_BIN: stub, DISPATCH_TYRION_INBOX_DIR: tyrion, DISPATCH_QUOTA_STATE_PATH: join(scratch, 'engine-quota.json') }
  try { execFileSync(process.execPath, [DISPATCH, "--engine", "grok", "--ticket", "T-596-FIX", "--timeout", "30", "--headless", "--sender", sender, ...extra], { env, cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }) } catch (e) { if (process.env.WAKE_DEBUG) console.error(e.status, String(e.stderr)) }
  const files = existsSync(tyrion) ? readdirSync(tyrion) : []
  return { scratch, files, read: (f) => readFileSync(join(tyrion, f), 'utf8') }
}

test('quick task: a finished ticket job from another desk wakes Tyrion with ticket, kind and exit', () => {
  const r = wakeRun({ sender: 'ideas', stdout: 'built step 1', extra: ['--no-auto-verify'] })
  try {
    const wakes = r.files.filter(f => /-build-done-/.test(f))
    assert.equal(wakes.length, 1, `files: ${r.files}`)
    assert.match(wakes[0], /-from-ideas-t-596-fix-build-done-\d+\.md$/)
    assert.equal(r.files.length, 1, `files: ${r.files}`)
    const body = r.read(wakes[0])
    assert.match(body, /^Ticket: T-596-FIX$/m)
    assert.match(body, /^Kind: build$/m)
    assert.match(body, /^Exit: \d+$/m)
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('T-740: a build the auto-verify follows sends no wake; the verify outcome is the one report', () => {
  const r = wakeRun({ sender: 'ideas', stdout: 'built step 1' })
  try {
    assert.equal(r.files.filter(f => /-build-done-/.test(f)).length, 0, `files: ${r.files}`)
    assert.deepEqual(r.files.map(f => f.replace(/^.*-(ready-to-merge)-\d+\.md$/, '$1')), ['ready-to-merge'], `files: ${r.files}`)
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('quick task: a job dispatched by the build desk itself does not wake Tyrion', () => {
  const r = wakeRun({ sender: 'build', stdout: 'built step 1' })
  try {
    assert.equal(r.files.filter(f => /-build-done-/.test(f)).length, 0, `files: ${r.files}`)
    assert.deepEqual(r.files.map(f => f.replace(/^.*-from-[a-z-]+?-(ready-to-merge)-\d+\.md$/, '$1')), ['ready-to-merge'], `files: ${r.files}`)
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('quick task: tyrionWakeMessage reads a verify verdict and skips when it should', async () => {
  const { tyrionWakeMessage, verifyVerdict } = await import('./dispatch-ticket-updates.mjs')
  assert.equal(verifyVerdict('Verdict: GREEN\nall lines pass'), 'GREEN')
  assert.equal(verifyVerdict('**RED** step 2 missing'), 'RED')
  assert.equal(verifyVerdict('verify failed [code-defect]: x'), 'RED')
  assert.equal(verifyVerdict('nothing here'), 'unknown')
  const m = tyrionWakeMessage({ senderKey: 'ideas', tid: 'T-9', kind: 'verify', code: 0, resultText: 'GREEN' })
  assert.match(m.text, /^Verdict: GREEN$/m); assert.match(m.slug, /^t-9-verify-green-/)
  assert.equal(tyrionWakeMessage({ senderKey: 'ideas', tid: null, kind: 'verify', code: 0 }).skip, 'no ticket')
  assert.equal(tyrionWakeMessage({ senderKey: 'build', tid: 'T-9', kind: 'build', code: 0 }).skip, 'sender is the build desk')
  assert.match(tyrionWakeMessage({ senderKey: 'ideas', tid: 'T-9', kind: 'build', code: 0, reportDir: '/x/inbox', buildInbox: '/x/inbox' }).skip, /already/)
})

// T-710: quota keyed by provider:model; routing skips only the exhausted key.
function t710CursorStub(scratch, { failModels = [] }) {
  const stub = join(scratch, 't710-cursor-stub.mjs')
  writeFileSync(stub, `#!/usr/bin/env node
const fail = new Set(${JSON.stringify(failModels)})
const i = process.argv.indexOf('--model')
const model = i >= 0 ? process.argv[i + 1] : ''
const short = model === 'claude-sonnet-5-5-medium' ? 'composer' : model.startsWith('grok') ? 'grok' : model
if (fail.has(model) || fail.has(short)) {
  process.stderr.write('Error: resource_exhausted for ' + model + '\\n')
  process.exit(1)
}
process.stdout.write('{"type":"result","subtype":"success","result":"ok"}\\n')
process.exit(0)
`)
  chmodSync(stub, 0o755)
  return stub
}

test('T-710 AC-1 Grok exhaustion leaves other Cursor models running', () => {
  const r1 = quotaStubRun({
    stderr: 'Error: resource_exhausted for grok-4.7-medium\n',
    engine: 'grok',
  })
  try {
    assert.ok(r1.saved['cursor:grok-4.7'], JSON.stringify(r1.saved))
    assert.equal(r1.saved['cursor:gemini-3.8-flash'], undefined)
    const r2 = quotaStubRun({
      engine: 'cursor-gemini',
      exitCode: 0,
      state: r1.saved,
    })
    try {
      assert.equal(r2.code, 0)
      assert.equal(r2.saved['cursor:gemini-3.8-flash'], undefined)
    } finally { rmSync(r2.scratch, { recursive: true, force: true }) }
  } finally { rmSync(r1.scratch, { recursive: true, force: true }) }
})

test('T-710 AC-2 reset time parsed from the quota message', async () => {
  const { parseResetFromReason, quotaOut, recordQuota } = await import('./lib/engine-quota.mjs')
  const reason = 'RESOURCE_EXHAUSTED: quota reached. Resets in 50h57m5s'
  const resetAt = parseResetFromReason(reason)
  assert.ok(resetAt)
  const delta = Date.parse(resetAt) - Date.now()
  assert.ok(delta > 49 * 3600 * 1000 && delta < 52 * 3600 * 1000)
  const ac2Scratch = mkdtempSync(join(tmpdir(), 't710-ac2-'))
  const statePath = join(ac2Scratch, 'q.json')
  recordQuota({ statePath, engine: 'agy', model: 'gemini-3.8-flash-medium', reason })
  assert.ok(quotaOut('agy:gemini', { statePath }))
  const agyScratch = mkdtempSync(join(tmpdir(), 't710-agy-'))
  const agyStub = join(agyScratch, 'agy.mjs')
  writeFileSync(agyStub, `#!/usr/bin/env node\nprocess.stderr.write('rate limit 429\\n'); process.exit(1)\n`)
  chmodSync(agyStub, 0o755)
  const { scratch, ticketPath, inbox, jobs, laneInbox, ledger, cwd } = makeTicketFixture()
  const statePath2 = join(scratch, 'engine-quota.json')
  const env = { ...dispatchTestEnv(scratch, inbox, jobs, laneInbox, ledger), DISPATCH_AGY_BIN: agyStub, DISPATCH_QUOTA_STATE_PATH: statePath2 }
  try {
    execFileSync(process.execPath, [DISPATCH, '--engine', 'agy', '--ticket-path', ticketPath, '--timeout', '10', '--headless'], { env, cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  } catch (e) { /* expect failure */ }
  const saved = existsSync(statePath2) ? JSON.parse(readFileSync(statePath2, 'utf8')) : {}
  try {
    assert.ok(saved['agy:gemini'])
    assert.equal(saved['agy:gemini'].resetAt, null)
    const withReset = mkdtempSync(join(tmpdir(), 't710-ac2b-'))
    const sp = join(withReset, 'q.json')
    recordQuota({ statePath: sp, engine: 'agy', model: 'gemini-3.8-flash-medium', reason })
    assert.ok(quotaOut('agy:gemini', { statePath: sp }))
    rmSync(withReset, { recursive: true, force: true })
  } finally {
    rmSync(scratch, { recursive: true, force: true })
    rmSync(agyScratch, { recursive: true, force: true })
    rmSync(ac2Scratch, { recursive: true, force: true })
  }
})

test('T-710 AC-3 exhausted key routes to a policy-allowed substitute', () => {
  const scratch = mkdtempSync(join(tmpdir(), 't710-ac3-'))
  const statePath = join(scratch, 'engine-quota.json')
  const now = new Date().toISOString()
  writeFileSync(statePath, JSON.stringify({ 'agy:gemini': { key: 'agy:gemini', time: now, reason: '429' } }))
  const buildOut = execFileSync('sh', ['-c', `node "${DISPATCH}" noop --engine gemini --dry-run 2>&1 >/dev/null`],
    { env: { ...dispatchTestEnv(scratch), DISPATCH_QUOTA_STATE_PATH: statePath }, encoding: 'utf8' })
  assert.doesNotMatch(buildOut, /using cursor:/, 'T-740: the build chain is Gemini alone, no silent Grok or Composer')
  writeFileSync(statePath, JSON.stringify({ 'cursor:gemini-3.8-flash': { key: 'cursor:gemini-3.8-flash', time: now, reason: '429' } }))
  const verifyOut = execFileSync('sh', ['-c', `node "${DISPATCH}" noop --engine cursor-gemini --dry-run 2>&1 >/dev/null`],
    { env: { ...dispatchTestEnv(scratch), DISPATCH_QUOTA_STATE_PATH: statePath, DISPATCH_QUOTA_ROLE: 'verify' }, encoding: 'utf8' })
  assert.match(verifyOut, /cursor:gemini-3\.8-flash out of quota, using agy:gemini/)
  rmSync(scratch, { recursive: true, force: true })
})

test('T-710 AC-4 quota flag prints every key', () => {
  const scratch = mkdtempSync(join(tmpdir(), 't710-ac4-'))
  const statePath = join(scratch, 'engine-quota.json')
  const now = new Date().toISOString()
  writeFileSync(statePath, JSON.stringify({
    'cursor:composer': { key: 'cursor:composer', time: now, reason: '429', resetAt: new Date(Date.now() + 3600_000).toISOString() },
    'cursor:grok-4.7': { key: 'cursor:grok-4.7', time: new Date(Date.now() - 48 * 3600 * 1000).toISOString(), reason: 'ok' },
  }))
  const out = execFileSync(process.execPath, [DISPATCH, '--quota'], { env: { ...dispatchTestEnv(scratch), DISPATCH_QUOTA_STATE_PATH: statePath }, encoding: 'utf8' })
  assert.match(out, /cursor:composer\texhausted\t/)
  assert.match(out, /cursor:grok-4\.7\tavailable\t/)
  rmSync(scratch, { recursive: true, force: true })
})

// T-708: after a clean ticket build, dispatch starts verify by itself (Flash on another lane).
const T708_CHAT = 'aaaaaaaa-bbbb-4ccc-8ddd-ffffffffffff'
const T708_BRANCH = 'sidekick/grok/T-708-FIX'
const T708_VERIFY_FAIL = 'verify failed [code-defect] AC-1: fixture red path for auto-verify resume.'

function t708Ticket(extraFront = '', notes = '') {
  return `---
id: T-708-FIX
estimate:
  points: 1
readiness:
  state: ready
  by: tickets-validate
  updated: "2026-10-08"
  gaps: []
${extraFront}---

# Fixture for T-708

T-708-FIX · 🔵 ready

## Acceptance Criteria

- [ ] AC-1 [manual]: fixture criterion, so the estimate's tier check passes.

## Progress notes

${notes}`
}

function t708CursorStub(scratch, { steps = [], createId = T708_CHAT } = {}) {
  const log = join(scratch, 't708-cursor.log')
  const counter = join(scratch, 't708-cursor.n')
  writeFileSync(counter, '0')
  const bin = join(scratch, 'cursor-agent.mjs')
  writeFileSync(bin, `#!/usr/bin/env node
import { appendFileSync, readFileSync, writeFileSync } from 'node:fs'
const log = ${JSON.stringify(log)}
const counter = ${JSON.stringify(counter)}
const steps = ${JSON.stringify(steps)}
const createId = ${JSON.stringify(createId)}
const argv = process.argv.slice(2)
appendFileSync(log, JSON.stringify(argv) + '\\n')
if (argv[0] === 'create-chat') {
  process.stdout.write(createId + '\\n')
  process.exit(0)
}
const n = Number(readFileSync(counter, 'utf8') || '0')
writeFileSync(counter, String(n + 1))
const step = steps[n] || { exit: 0, out: '{"type":"result","subtype":"success","result":"ok"}\\n' }
if (step.stderr) process.stderr.write(step.stderr)
if (step.out) process.stdout.write(step.out)
process.exit(step.exit ?? 0)
`)
  chmodSync(bin, 0o755)
  return {
    bin,
    calls: () => existsSync(log) ? readFileSync(log, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [],
  }
}

function t708Env(scratch, inbox, jobs, laneInbox, ledger, tyrion, stubBin) {
  const pilot = join(scratch, 'pilot.json')
  writeFileSync(pilot, '{"remaining":0}\n')
  const quota = join(scratch, 'quota.json')
  writeFileSync(quota, '{}')
  return {
    ...dispatchTestEnv(scratch, inbox, jobs, laneInbox, ledger),
    DISPATCH_CURSOR_BIN: stubBin,
    DISPATCH_CLAUDE_BIN: stubBin,
    DISPATCH_TYRION_INBOX_DIR: tyrion,
    DISPATCH_QUOTA_STATE_PATH: quota,
    DISPATCH_PILOT_STATE_PATH: pilot,
  }
}

function modelAt(call) {
  const i = call.indexOf('--model')
  return i === -1 ? '' : call[i + 1]
}

function promptAt(call) {
  const i = call.indexOf('-p')
  return i === -1 ? '' : call[i + 1]
}

function runT708Dispatch({ ticketBody, extraArgs = [], steps = [], engine = 'grok', buildExit = 0, extraEnv = {} }) {
  const { scratch, ticketPath, inbox, jobs, laneInbox, ledger, cwd } = makeTicketFixture()
  writeFileSync(ticketPath, ticketBody)
  const tyrion = join(scratch, 'tyrion-inbox')
  mkdirSync(tyrion, { recursive: true })
  const stub = t708CursorStub(scratch, {
    steps: buildExit === 0 ? steps : [{ exit: buildExit, stderr: 'build failed\n', out: '' }, ...steps],
  })
  const env = { ...t708Env(scratch, inbox, jobs, laneInbox, ledger, tyrion, stub.bin), DISPATCH_ESCALATION_LEDGER: join(scratch, 'escalation.jsonl'), DISPATCH_DATA_INBOX_DIR: join(scratch, 'data-inbox'), ...extraEnv }
  let code = 0
  let stderr = ''
  try {
    execFileSync(process.execPath, [
      DISPATCH, '--engine', engine, '--ticket-path', ticketPath, '--timeout', '30', '--headless', ...extraArgs,
    ], { env, cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 120000 })
  } catch (err) {
    code = err.status ?? 1
    stderr = String(err.stderr || '')
  }
  const tyrionFiles = existsSync(tyrion) ? readdirSync(tyrion) : []
  const tyrionBodies = tyrionFiles.map((f) => readFileSync(join(tyrion, f), 'utf8'))
  return {
    scratch,
    ticketPath,
    code,
    stderr,
    text: readFileSync(ticketPath, 'utf8'),
    calls: stub.calls(),
    tyrionFiles,
    tyrionBodies,
  }
}

function flashVerifyCalls(calls) {
  return calls.filter((a) => a.includes('-p') && /^opus$/.test(modelAt(a)))
}

test('T-708 AC-1 clean build starts one Flash verify on another lane', () => {
  const okSteps = [
    { out: '{"type":"result","subtype":"success","result":"built ok"}\\n' },
    { out: '{"type":"result","subtype":"success","result":"Verify log:\\n- Ran: node --test fixture.test.mjs\\n- Saw (happy): # pass 1\\n- Saw (unhappy): none possible: fixture\\n- Verdict: GREEN, the fixture check ran\\nVerdict: GREEN\\n"}\n' },
  ]
  const clean = runT708Dispatch({ ticketBody: t708Ticket(), steps: okSteps })
  try {
    assert.equal(clean.code, 0, clean.stderr)
    assert.match(clean.text, /🔍 verifying/, 'clean build leaves the ticket at verify status')
    const flash = flashVerifyCalls(clean.calls)
    assert.equal(flash.length, 1, `expected one Flash verify launch, calls: ${JSON.stringify(clean.calls)}`)
    assert.ok(flash[0].includes('--effort'), 'verify carries the ladder effort')
    const builderLaunches = clean.calls.filter((a) => a.includes('-p') && modelAt(a) === 'grok-4.7-medium')
    assert.ok(builderLaunches.length >= 1, 'builder still ran on grok')
  } finally { rmSync(clean.scratch, { recursive: true, force: true }) }

  const fail = runT708Dispatch({ ticketBody: t708Ticket(), buildExit: 3, steps: okSteps })
  try {
    assert.notEqual(fail.code, 0, 'non-zero build should fail dispatch')
    assert.equal(flashVerifyCalls(fail.calls).length, 0, 'failed build must not start verify')
  } finally { rmSync(fail.scratch, { recursive: true, force: true }) }
})

test('T-708 AC-2 green verify writes ready-to-merge note', () => {
  const branchLine = `Branch: ${T708_BRANCH}`
  const run = runT708Dispatch({
    ticketBody: t708Ticket(`branch: ${T708_BRANCH}\n`),
    steps: [
      { out: '{"type":"result","subtype":"success","result":"built ok"}\\n' },
      { out: `{"type":"result","subtype":"success","result":"Verify log:\\n- Ran: node --test fixture.test.mjs\\n- Saw (happy): # pass 1\\n- Saw (unhappy): none possible: fixture\\n- Verdict: GREEN, the fixture check ran\\nVerdict: GREEN\\n${branchLine}\\n"}\n` },
    ],
  })
  try {
    assert.equal(run.code, 0, run.stderr)
    const merge = run.tyrionBodies.find((b) => /ready-to-merge/i.test(b))
    assert.ok(merge, `tyrion inbox files: ${run.tyrionFiles.join(', ')}`)
    assert.match(merge, /T-708-FIX/)
    assert.match(merge, new RegExp(T708_BRANCH.replace(/\//g, '\\/')))
    assert.match(merge, /GREEN/i)
  } finally { rmSync(run.scratch, { recursive: true, force: true }) }
})

// T-740: GREEN merges the build branch to main and sets the ticket 🟩 with the verifier's evidence;
// a branch that conflicts with main is left alone and Tyrion gets the ready-to-merge note instead.
// The repo is a scratch one with its own main, and the build's worktree is handed over with --worktree.
function t740GreenRun({ conflict }) {
  const { scratch, ticketPath, inbox, jobs, laneInbox, ledger, cwd } = makeTicketFixture()
  // dispatch only writes under ~/slopdog, so the scratch repo lives in this checkout's gitignored v2/.worktrees/.
  mkdirSync(join(V2_ROOT, '.worktrees'), { recursive: true })
  const box = mkdtempSync(join(V2_ROOT, '.worktrees', 't740-test-'))
  const repo = join(box, 'repo')
  const wt = join(box, 'wt')
  const git = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  mkdirSync(repo)
  git(repo, 'init', '-q', '-b', 'main')
  writeFileSync(join(repo, 'a.txt'), 'one\n')
  git(repo, 'add', 'a.txt'); git(repo, 'commit', '-q', '-m', 'base')
  git(repo, 'worktree', 'add', '-q', '-b', 'build-t740', wt)
  writeFileSync(join(wt, conflict ? 'a.txt' : 'b.txt'), 'builder\n')
  git(wt, 'add', '-A'); git(wt, 'commit', '-q', '-m', 'builder work')
  writeFileSync(join(repo, conflict ? 'a.txt' : 'c.txt'), 'main moved\n')
  git(repo, 'add', '-A'); git(repo, 'commit', '-q', '-m', 'main moved')
  const tyrion = join(scratch, 'tyrion-inbox')
  mkdirSync(tyrion, { recursive: true })
  const stub = t708CursorStub(scratch, {
    steps: [
      { out: '{"type":"result","subtype":"success","result":"built ok"}\n' },
      { out: '{"type":"result","subtype":"success","result":"all lines pass\\nVerify log:\\n- Ran: node --test fixture.test.mjs\\n- Saw (happy): # pass 1\\n- Saw (unhappy): none possible: fixture\\n- Verdict: GREEN, the fixture check ran\\nVerdict: GREEN\\nEvidence: As a user, you can now see b.txt. Checked by reading it on the branch."}\n' },
    ],
  })
  const env = { ...t708Env(scratch, inbox, jobs, laneInbox, ledger, tyrion, stub.bin), SLOPDOG_MAX_BUILDERS: '99' }
  const r = spawnSync(process.execPath, [DISPATCH, '--engine', 'grok', '--ticket-path', ticketPath, '--write', '--worktree', wt, '--timeout', '30'],
    { env, cwd, encoding: 'utf8', timeout: 120000 })
  const tyrionBodies = readdirSync(tyrion).map((f) => readFileSync(join(tyrion, f), 'utf8'))
  return { scratch, box, r, repo, git, calls: stub.calls(), text: readFileSync(ticketPath, 'utf8'), list: readFileSync(join(scratch, 'tasks', 'task-list.md'), 'utf8'), tyrionBodies,
    ledgerRows: existsSync(ledger) ? readFileSync(ledger, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [] }
}

test('T-740: a GREEN verify merges the build branch to main and sets the ticket 🟩 with the evidence', () => {
  const run = t740GreenRun({ conflict: false })
  try {
    assert.equal(run.r.status, 0, run.r.stderr)
    const verify = flashVerifyCalls(run.calls)
    assert.equal(verify.length, 1)
    assert.match(promptAt(verify[0]), /on branch build-t740/, 'the verifier is told the branch')
    assert.ok(verify[0].includes('low'), 'the verifier runs at low effort')
    assert.equal(run.git(run.repo, 'rev-parse', 'main').trim(), run.git(run.repo, 'rev-parse', 'build-t740').trim(), 'main fast-forwarded to the build')
    assert.ok(existsSync(join(run.repo, 'b.txt')), 'the builder work is on main in the checkout')
    assert.match(run.text, /T-596-FIX · 🟩 verified/)
    assert.match(run.list, /^\| 🟩 \|/m)
    assert.doesNotMatch(run.text, /^(verifier|started):/m)
    assert.match(run.text, /· Verifier \(opus-low\) · verified GREEN on build-t740; merged to main at [0-9a-f]+ \(not pushed\)\.\n- [^\n]+ · Verifier \(opus-low\) · As a user, you can now see b\.txt\./)
    assert.equal(run.tyrionBodies.length, 0, 'a merged GREEN needs no note')
    const build = run.ledgerRows.filter((row) => row.ticket === 'T-596-FIX' && (row.role ?? 'build') === 'build').at(-1)
    assert.ok(build, 'the build wrote a ledger row under the ticket file id')
    assert.equal(build.passed_first_time, true, 'T-740 step 4: a GREEN on the first build passed first time')
    assert.equal(build.correction_rounds, 0)
    assert.equal(typeof build.verify_minutes, 'number')
  } finally { rmSync(run.scratch, { recursive: true, force: true }); rmSync(run.box, { recursive: true, force: true }) }
})

test('T-740: a GREEN build that conflicts with main is not merged and Tyrion gets the ready-to-merge note', () => {
  const run = t740GreenRun({ conflict: true })
  try {
    assert.equal(run.r.status, 0, run.r.stderr)
    assert.notEqual(run.git(run.repo, 'rev-parse', 'main').trim(), run.git(run.repo, 'rev-parse', 'build-t740').trim())
    assert.equal(readFileSync(join(run.repo, 'a.txt'), 'utf8'), 'main moved\n', 'the main checkout is untouched')
    assert.match(run.text, /🔍 verifying/)
    const note = run.tyrionBodies.find((b) => /ready-to-merge/.test(b))
    assert.ok(note, 'ready-to-merge note')
    assert.match(note, /Branch: build-t740/)
    assert.match(note, /Not merged by dispatch: merging main into build-t740 conflicts/)
  } finally { rmSync(run.scratch, { recursive: true, force: true }); rmSync(run.box, { recursive: true, force: true }) }
})

test('T-708 verify with no verdict writes a note and asks for one', () => {
  const run = runT708Dispatch({
    ticketBody: t708Ticket(`branch: ${T708_BRANCH}\n`),
    steps: [
      { out: '{"type":"result","subtype":"success","result":"built ok"}\\n' },
      { out: '{"type":"result","subtype":"success","result":"T-708-FIX passes; the file is there."}\n' },
    ],
  })
  try {
    assert.equal(run.code, 0, run.stderr)
    const flash = flashVerifyCalls(run.calls)
    assert.equal(flash.length, 1)
    assert.match(promptAt(flash[0]), /Verdict: GREEN/)
    assert.equal(run.tyrionBodies.filter((b) => /ready-to-merge/i.test(b)).length, 0)
    assert.ok(run.tyrionBodies.find((b) => /no verdict/i.test(b)), `tyrion inbox files: ${run.tyrionFiles.join(', ')}`)
  } finally { rmSync(run.scratch, { recursive: true, force: true }) }
})

// T-742 / T-741 rows 18 and 19: every verdict leaves the §4 verify log on the ticket, and a verify
// that proves nothing either way sends the ticket back to 🟡 with no strike, never leaving 🔍.
const t742Reply = (body) => ({ out: `${JSON.stringify({ type: 'result', subtype: 'success', result: body })}\n` })

test('T-742: a no-verdict reply leaves the ticket 🟡, not 🔍, with a note and no strike', () => {
  const run = runT708Dispatch({
    ticketBody: t708Ticket(`branch: ${T708_BRANCH}\n`),
    steps: [t742Reply('built ok'), t742Reply('T-708-FIX passes; the file is there.')],
  })
  try {
    assert.equal(run.code, 0, run.stderr)
    assert.match(run.text, /T-708-FIX · 🟡/)
    assert.doesNotMatch(run.text, /🔍 verifying/)
    assert.match(run.text, /· verify log\n  - Ran: not given by the verifier[\s\S]*  - Verdict: INCONCLUSIVE, no verdict/)
    assert.match(run.text, /verify inconclusive: The verifier ran but its reply had no verdict line; no strike/)
    assert.equal(countStrikes(run.text), 0)
  } finally { rmSync(run.scratch, { recursive: true, force: true }) }
})

test('T-742: INCONCLUSIVE, two verdicts, and GREEN with no log all go back to 🟡 without merging or a strike', () => {
  const replies = {
    inconclusive: 'Verify log:\n- Ran: node --test x.test.mjs\n- Saw (happy): fixture only\n- Saw (unhappy): none possible: no real data\n- Verdict: INCONCLUSIVE, only fixtures ran\nVerdict: INCONCLUSIVE\nReason: no real data reachable',
    both: 'Verdict: GREEN\nlooked again\nVerdict: RED',
    bareGreen: 'Verdict: GREEN',
  }
  for (const [name, body] of Object.entries(replies)) {
    const run = runT708Dispatch({ ticketBody: t708Ticket(`branch: ${T708_BRANCH}\n`), steps: [t742Reply('built ok'), t742Reply(body)] })
    try {
      assert.equal(run.code, 0, `${name}: ${run.stderr}`)
      assert.match(run.text, /T-708-FIX · 🟡/, name)
      assert.match(run.text, /  - Verdict: INCONCLUSIVE, /, name)
      assert.equal(countStrikes(run.text), 0, name)
      assert.equal(run.tyrionBodies.filter((b) => /ready-to-merge/i.test(b)).length, 0, name)
      assert.ok(run.tyrionBodies.some((b) => /inconclusive/i.test(b)), `${name}: ${run.tyrionFiles.join(', ')}`)
      assert.equal(run.calls.filter((a) => a.includes('-p') && modelAt(a) === 'grok-4.7-medium').length, 1, `${name}: no rebuild`)
    } finally { rmSync(run.scratch, { recursive: true, force: true }) }
  }
})

test('T-741 row 11: a RED with a non-strike or unknown category writes the log and the note, records no strike and builds nothing more', () => {
  for (const said of ['bad-verify-line', 'made-up-category']) {
    const run = runT708Dispatch({
      ticketBody: t708Ticket(),
      steps: [t742Reply('built ok'), t742Reply(`Verify log:\n- Ran: grep -q x f\n- Saw (happy): grep exit 1\n- Saw (unhappy): none possible: n/a\n- Verdict: RED, the Verify line greps the wrong file\nVerdict: RED\nAC: AC-1\nCategory: ${said}\nthe Verify line greps the wrong file`)],
    })
    try {
      assert.equal(run.code, 0, run.stderr)
      const want = said === 'bad-verify-line' ? 'bad-verify-line' : 'verifier-error'
      assert.match(run.text, new RegExp(`· verify log\\n[\\s\\S]*  - Verdict: RED, the Verify line greps the wrong file\\n- [^\\n]+ · verify failed \\[${want}\\] AC-1: the Verify line greps the wrong file`))
      assert.equal(countStrikes(run.text), 0)
      assert.match(run.text, /T-708-FIX · 🟡/)
      assert.equal(run.calls.filter((a) => a.includes('-p') && modelAt(a) === 'grok-4.7-medium').length, 1, 'no rebuild')
      assert.ok(run.tyrionBodies.some((b) => /without a strike/.test(b)))
    } finally { rmSync(run.scratch, { recursive: true, force: true }) }
  }
})

test('T-741 row 13: when main moved, a failing Red-check after the merge stops the fast-forward', async () => {
  const { mergeBuildToMain, runRedChecks } = await import('./dispatch.mjs')
  mkdirSync(join(V2_ROOT, '.worktrees'), { recursive: true })
  const box = mkdtempSync(join(V2_ROOT, '.worktrees', 't741-recheck-'))
  try {
    const repo = join(box, 'repo')
    const wt = join(box, 'wt')
    const git = (dir, ...a) => execFileSync('git', ['-C', dir, ...a], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    mkdirSync(repo)
    git(repo, 'init', '-q', '-b', 'main')
    writeFileSync(join(repo, 'a.txt'), 'one\n'); git(repo, 'add', 'a.txt'); git(repo, 'commit', '-q', '-m', 'base')
    git(repo, 'worktree', 'add', '-q', '-b', 'build-t741', wt)
    writeFileSync(join(wt, 'b.txt'), 'builder\n'); git(wt, 'add', '-A'); git(wt, 'commit', '-q', '-m', 'builder work')
    writeFileSync(join(repo, 'broken.txt'), 'main broke it\n'); git(repo, 'add', '-A'); git(repo, 'commit', '-q', '-m', 'main moved')
    const ticketText = '## Hand-off\n\nRed-check: AC-1 · test -f b.txt && ! test -f broken.txt · 0c7e7c81\n'
    const before = git(repo, 'rev-parse', 'main').trim()
    const r = mergeBuildToMain({ buildDir: wt, branch: 'build-t741', removeWorktree: false, recheck: (cwd) => runRedChecks(ticketText, cwd) })
    assert.equal(r.ok, false)
    assert.match(r.why, /after merging main into build-t741, AC-1's Red-check failed: test -f b\.txt/)
    assert.equal(git(repo, 'rev-parse', 'main').trim(), before, 'main did not move')
    // Main unchanged since the build: no recheck runs and the merge goes ahead.
    assert.equal(runRedChecks('Red-check: AC-1 · true · 0c7e7c81', wt).ok, true)
  } finally { rmSync(box, { recursive: true, force: true }) }
})

test('T-708 AC-3 / T-740: red verify records a strike and builds again on the same builder lane', () => {
  const stored = `cursor_chat:\n  id: ${T708_CHAT}\n  lane: grok\n  model: grok-4.7-medium\n  ring: ring one\n`
  const run = runT708Dispatch({
    ticketBody: t708Ticket(stored),
    steps: [
      { out: '{"type":"result","subtype":"success","result":"built ok"}\\n' },
      { out: `{"type":"result","subtype":"success","result":"Verdict: RED\\n${T708_VERIFY_FAIL}\\n"}\n` },
      { out: '{"type":"result","subtype":"success","result":"fix attempt ok"}\\n' },
      { out: '{"type":"result","subtype":"success","result":"no verdict here"}\\n' },
    ],
  })
  try {
    assert.equal(run.code, 0, run.stderr)
    const flash = flashVerifyCalls(run.calls)
    assert.equal(flash.length, 2, 'the first build and the rebuild are each verified once')
    const isResume = (a) => a.includes('--resume') && a[a.indexOf('--resume') + 1] === T708_CHAT
    const resumed = run.calls.findLast(isResume)
    assert.ok(resumed, `expected --resume ${T708_CHAT}, calls: ${JSON.stringify(run.calls)}`)
    assert.ok(run.calls.indexOf(resumed) > run.calls.indexOf(flash[0]), 'the resume comes after the Flash verify call')
    assert.equal(promptAt(resumed), T708_VERIFY_FAIL)
    const otherLaunches = run.calls.filter((a) => a.includes('-p') && !a.includes('--resume') && modelAt(a) !== 'grok-4.7-medium' && modelAt(a) !== 'opus')
    assert.equal(otherLaunches.length, 0, 'no different builder before round limit')
    assert.match(run.text, /· Verifier \(opus-low\) · verify failed \[code-defect\] AC-1: fixture red path for auto-verify resume\./)
    assert.equal(countStrikes(run.text), 1, 'the RED verify is one strike')
    assert.equal((run.text.match(/· started\./g) || []).length, 2, 'the second build is a fresh start on the ticket')
  } finally { rmSync(run.scratch, { recursive: true, force: true }) }
})

test('T-740: the second RED verify hands the ticket to Data through its inbox and builds nothing more', () => {
  const run = runT708Dispatch({
    ticketBody: t708Ticket('', strikeNotes(1, 'Grok')),
    steps: [
      { out: '{"type":"result","subtype":"success","result":"built ok"}\\n' },
      { out: `{"type":"result","subtype":"success","result":"Verdict: RED\\nAC: AC-1\\nCategory: not-built\\nstep one has no commit\\n"}\n` },
    ],
  })
  try {
    assert.equal(run.code, 3, run.stderr)
    assert.match(run.text, /verify failed \[not-built\] AC-1: step one has no commit/)
    assert.match(run.text, /escalated to opus-high solo \(data\) after 2 failed verify rounds/)
    assert.match(run.text, /^worker: data\s*$/m)
    assert.equal(run.calls.filter((a) => a.includes('-p') && modelAt(a) === 'grok-4.7-medium').length, 1, 'no rebuild after the second strike')
    const inbox = join(run.scratch, 'data-inbox')
    const files = readdirSync(inbox)
    assert.equal(files.length, 1, `data inbox: ${files}`)
    assert.match(readFileSync(join(inbox, files[0]), 'utf8'), /T-708-FIX: escalated to you[\s\S]*Why: 2 failed verify rounds/)
  } finally { rmSync(run.scratch, { recursive: true, force: true }) }
})

test('T-708 AC-4 unavailable verifier writes a note and exits clean', () => {
  const run = runT708Dispatch({
    ticketBody: t708Ticket(),
    steps: [
      { out: '{"type":"result","subtype":"success","result":"built ok"}\\n' },
      { exit: 1, stderr: 'Error: resource_exhausted for opus\\n', out: '' },
    ],
  })
  try {
    assert.equal(run.code, 0, `dispatch should exit clean after verify cannot start: ${run.stderr}`)
    const note = run.tyrionBodies.find((b) => /quota|verif/i.test(b) && !/ready-to-merge/i.test(b))
    assert.ok(note, `expected a Tyrion note naming why verify could not start; files: ${run.tyrionFiles.join(', ')}`)
    assert.match(note, /opus|quota|unavailable/i)
    assert.ok(flashVerifyCalls(run.calls).length <= 1, 'at most the one failed Flash attempt')
    assert.ok(!run.tyrionBodies.some((b) => /ready-to-merge/i.test(b)), 'no ready-to-merge note when verify never ran')
  } finally { rmSync(run.scratch, { recursive: true, force: true }) }
})

test('T-708 AC-5 no-auto-verify starts nothing', () => {
  const steps = [
    { out: '{"type":"result","subtype":"success","result":"built ok"}\\n' },
    { out: '{"type":"result","subtype":"success","result":"Verdict: GREEN\\n"}\n' },
  ]
  const flagged = runT708Dispatch({ ticketBody: t708Ticket(), steps, extraArgs: ['--no-auto-verify'] })
  try {
    assert.equal(flagged.code, 0, flagged.stderr)
    assert.equal(flashVerifyCalls(flagged.calls).length, 0, 'flagged run must not launch Flash verify')
    assert.ok(!flagged.tyrionBodies.some((b) => /ready-to-merge/i.test(b)), 'no ready-to-merge note')
    const verifyCantStart = flagged.tyrionBodies.filter((b) => /verif.*(quota|unavailable|could not)/i.test(b))
    assert.equal(verifyCantStart.length, 0, 'no verify-start failure note')
  } finally { rmSync(flagged.scratch, { recursive: true, force: true }) }

  const normal = runT708Dispatch({ ticketBody: t708Ticket(), steps })
  try {
    assert.equal(flashVerifyCalls(normal.calls).length, 1, 'without the flag, auto-verify should run')
  } finally { rmSync(normal.scratch, { recursive: true, force: true }) }
})

test('T-708 dry-run names the ladder verifier for auto-verify', () => {
  const scratch = mkdtempSync(join(tmpdir(), 't708-dry-'))
  try {
    const fixture = join(scratch, 'T-708-FIX.md')
    writeFileSync(fixture, t708Ticket())
    const env = { ...process.env, DISPATCH_QUOTA_STATE_PATH: join(scratch, 'q.json'), DISPATCH_ESCALATION_LEDGER: join(scratch, 'l.jsonl'), DISPATCH_SIDEKICK_INBOX_DIR: join(scratch, 'inbox') }
    const ladder = JSON.parse(readFileSync(join(dirname(DISPATCH), '..', 'config', 'build-ladder.json'), 'utf8'))
    const v = ladder.verifiers_by_points['1']
    const out = execFileSync('node', [DISPATCH, '--engine', 'openrouter', '--ticket-path', fixture, '--dry-run'], { encoding: 'utf8', env, cwd: scratch })
    const line = out.split('\n').find((l) => l.startsWith('auto-verify:'))
    assert.ok(line, 'dry run prints an auto-verify line')
    assert.match(line, new RegExp(v.model))
    assert.match(line, new RegExp(`lane ${ladder.auto_verify_lane}`))
    const off = execFileSync('node', [DISPATCH, '--engine', 'openrouter', '--ticket-path', fixture, '--dry-run', '--no-auto-verify'], { encoding: 'utf8', env, cwd: scratch })
    assert.match(off, /^auto-verify: off/m)
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

// T-720 Step 4: proven existing dispatch tests (T-708 AC and T-720 AC suites) pass cleanly with scratch inboxes
test('T-720 AC-1: fixture environment builders isolate sidekick inboxes and leave repo inboxes untouched', () => {
  // AC-1: Observable behaviour: a ticket dispatch of a sidekick-folding engine (Composer, Grok and Gemma
  // each) from a fixture that builds its own environment leaves the scratch lane inbox as it was (T-740:
  // ticket builds never fold the inbox) and the repository's lane inbox untouched; boundary: dispatch.mjs readGemmaInbox()
  // run through the fixture environment builders in ~/slopdog/v2/scripts/dispatch.test.mjs, test named T-720 AC-1.
  for (const engine of ['composer', 'grok', 'gemini']) {
    const { scratch, ticketPath, env } = installGateFixture('gate-clean-pass.md')
    try {
      assert.ok(env.DISPATCH_SIDEKICK_INBOX_DIR, `fixture env must set DISPATCH_SIDEKICK_INBOX_DIR for engine ${engine}`)
      const scratchInbox = join(env.DISPATCH_SIDEKICK_INBOX_DIR, 'inbox')
      const scratchArchive = join(env.DISPATCH_SIDEKICK_INBOX_DIR, 'inbox-archive')
      mkdirSync(scratchInbox, { recursive: true })
      const msgName = `2026-10-10-0900-from-ideas-test-msg-${engine}.md`
      writeFileSync(join(scratchInbox, msgName), `Test message for ${engine}\n`)

      const stub = writeEngineStub({ scratch, agy: engine === 'gemini', exitCode: 0 })
      env.DISPATCH_CURSOR_BIN = stub
      env.DISPATCH_AGY_BIN = stub
      env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
      writeFileSync(env.DISPATCH_QUOTA_STATE_PATH, '{}\n')

      const cfg = JSON.parse(readFileSync(new URL('../config/build-ladder.json', import.meta.url), 'utf8'))
      cfg.disabled_engines = []
      const cfgPath = join(scratch, 'ladder.json')
      writeFileSync(cfgPath, JSON.stringify(cfg))
      env.BUILD_LADDER_PATH = cfgPath

      const r = spawnSync(process.execPath, [
        DISPATCH, '--engine', engine, '--ticket-path', ticketPath, '--headless', '--timeout', '10', '--no-auto-verify',
      ], { env, encoding: 'utf8' })

      assert.equal(r.status, 0, `dispatch should exit clean: ${r.stderr}\n${r.stdout}`)
      // T-740: a --ticket build is the ticket and nothing else, so the inbox is left for a plain job.
      assert.ok(existsSync(join(scratchInbox, msgName)), `a ticket build leaves the scratch inbox alone for ${engine}`)
      assert.ok(!existsSync(join(scratchArchive, msgName)), `nothing is archived by a ticket build for ${engine}`)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }
})

test('T-720 AC-2: repository sidekick inboxes and inbox-archives are untouched across dispatch child process runs', () => {
  // AC-2: Observable behaviour: the listing of every desks/*/sidekicks/*/inbox/ and inbox-archive/ folder
  // read before and after the dispatch tests that start child processes is identical; boundary:
  // a before-and-after listing check wrapped around those tests in ~/slopdog/v2/scripts/dispatch.test.mjs,
  // test named T-720 AC-2.
  const desksDir = join(V2_ROOT, 'desks')
  const sidekickDirs = []
  if (existsSync(desksDir)) {
    for (const desk of readdirSync(desksDir)) {
      const sidekicksDir = join(desksDir, desk, 'sidekicks')
      if (!existsSync(sidekicksDir)) continue
      for (const sk of readdirSync(sidekicksDir)) {
        for (const sub of ['inbox', 'inbox-archive']) {
          const target = join(sidekicksDir, sk, sub)
          if (existsSync(target)) sidekickDirs.push(target)
        }
      }
    }
  }
  assert.ok(sidekickDirs.length > 0, 'must find repository sidekick inbox directories')

  const snapshot = () => {
    const map = new Map()
    for (const d of sidekickDirs) {
      map.set(d, readdirSync(d).sort())
    }
    return map
  }

  const before = snapshot()

  for (const engine of ['composer', 'grok', 'gemini']) {
    const { scratch, ticketPath, env } = installGateFixture('gate-clean-pass.md')
    try {
      const stub = writeEngineStub({ scratch, agy: engine === 'gemini', exitCode: 0 })
      env.DISPATCH_CURSOR_BIN = stub
      env.DISPATCH_AGY_BIN = stub
      env.DISPATCH_QUOTA_STATE_PATH = join(scratch, 'quota.json')
      writeFileSync(env.DISPATCH_QUOTA_STATE_PATH, '{}\n')

      const cfg = JSON.parse(readFileSync(new URL('../config/build-ladder.json', import.meta.url), 'utf8'))
      cfg.disabled_engines = []
      const cfgPath = join(scratch, 'ladder.json')
      writeFileSync(cfgPath, JSON.stringify(cfg))
      env.BUILD_LADDER_PATH = cfgPath

      const r = spawnSync(process.execPath, [
        DISPATCH, '--engine', engine, '--ticket-path', ticketPath, '--headless', '--timeout', '10', '--no-auto-verify',
      ], { env, encoding: 'utf8' })
      assert.equal(r.status, 0, `dispatch should exit clean: ${r.stderr}\n${r.stdout}`)
    } finally {
      rmSync(scratch, { recursive: true, force: true })
    }
  }

  const after = snapshot()
  for (const [dir, filesBefore] of before.entries()) {
    const filesAfter = after.get(dir)
    assert.deepEqual(filesAfter, filesBefore, `listing for ${dir} changed after dispatch child process runs`)
  }
})


// 2026-10-11 quick task (dispatch-loud-builder-jobs): a timeout is loud on the ticket. A ticket with
// more open steps than escalate_above_steps goes to the escalation rung (T-740; it was gate check 14).
test('loud timeout: a job that exits 124 leaves a 🔴 Progress note naming the engine and the timeout', () => {
  const r = quotaStubRun({ hang: true, timeout: '2' })
  try {
    assert.equal(r.code, 124, r.err)
    const notes = r.text.split('## Progress notes')[1].split('## Concerns')[0]
    assert.match(notes, /\n- \d{4}-\d{2}-\d{2} \d{2}:\d{2} · [^\n]+ · 🔴 timed out after 2s \(exit 124, engine grok\); the build did not finish and the ticket is blocked\./)
    assert.match(r.text, /🔴 blocked/)
  } finally { rmSync(r.scratch, { recursive: true, force: true }) }
})

test('T-740: builderFor sends a ticket with more open steps than escalate_above_steps to the escalation rung, when a ladder sets it', async () => {
  const { builderFor, openSteps, loadLadder, DEFAULT_LADDER_PATH } = await import('./lib/build-ladder.mjs')
  const steps = (n, ticked = 0) => `---\nestimate:\n  points: 3\n---\n## Steps\n\n${Array.from({ length: n }, (_, i) => `- [${i < ticked ? 'x' : ' '}] Step ${i + 1}.`).join('\n')}\n\n## Progress notes\n`
  const real = loadLadder()
  assert.equal(real.escalate_above_steps, undefined, 'Todd, 2026-10-12: the step-count trigger is off in the real ladder')
  assert.equal(builderFor(steps(9), real).rung, 'builder', 'nine open steps build on the points rung')
  const scratch = mkdtempSync(join(tmpdir(), 'ladder-steps-'))
  try {
    const cfg = JSON.parse(readFileSync(DEFAULT_LADDER_PATH, 'utf8'))
    cfg.escalate_above_steps = 4
    const p = join(scratch, 'ladder.json')
    writeFileSync(p, JSON.stringify(cfg))
    const c = loadLadder(p)
    assert.equal(openSteps(steps(7, 3)), 4, 'ticked steps do not count')
    assert.deepEqual([builderFor(steps(5), c).rung, builderFor(steps(5), c).reason], ['escalation', 'steps'])
    assert.equal(builderFor(steps(4), c).rung, 'builder')
    assert.equal(builderFor(steps(7, 3), c).rung, 'builder')
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('Todd 2026-10-12: a dry run of a five-step ticket no longer routes to Data on step count', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'dispatch-shard-'))
  const root = join(scratch, 'tasks')
  mkdirSync(join(root, 'tickets'), { recursive: true })
  const quota = join(scratch, 'quota.json')
  writeFileSync(quota, '{}\n')
  const env = { ...dispatchTestEnv(scratch), DISPATCH_QUOTA_STATE_PATH: quota }
  mkdirSync(env.DISPATCH_JOBS_DIR, { recursive: true })
  mkdirSync(env.DISPATCH_INBOX_DIR, { recursive: true })
  try {
    const one = gateTicket({ id: 'T-GATE-SEVEN' }).match(/- \[ \] Step one\.[^\n]*\n[^\n]*\n/)[0]
    const seven = gateTicket({ id: 'T-GATE-SEVEN' }).replace(one, Array.from({ length: 5 }, (_, i) => `- [ ] Step ${i + 1}. (AC: AC-1)\n  - Verify: \`node -e "process.exit(1)"\`\n`).join(''))
    const t = writeBoardTicket(root, 'seven.md', seven, '🔵', 'T-GATE-SEVEN')
    writeFileSync(join(root, 'task-list.md'), `| Status | Ticket |\n| :--- | :--- |\n${t.row}\n`)
    const run = (engine) => spawnSync(process.execPath, [DISPATCH, '--engine', engine, '--ticket-path', t.ticketPath, '--dry-run'], { env, encoding: 'utf8' })
    const gemma = run('gemini')
    assert.equal(gemma.status, 0, gemma.stderr)
    assert.doesNotMatch(gemma.stdout, /^route: data$/m)
    assert.doesNotMatch(gemma.stderr, /open steps/)
    assert.doesNotMatch(gemma.stderr, /check 14/)
  } finally { rmSync(scratch, { recursive: true, force: true }) }
})

test('comms-worktree-real-app: a worktree gets node_modules as a hardlink copy, and a leftover symlink is replaced', () => {
  const root = mkdtempSync(join(tmpdir(), 'nm-'))
  const main = join(root, 'main'); const wt = join(root, 'wt')
  mkdirSync(join(main, 'node_modules', 'pkg'), { recursive: true }); mkdirSync(wt)
  writeFileSync(join(main, 'node_modules', 'pkg', 'index.js'), 'x')
  symlinkSync(join(main, 'node_modules'), join(wt, 'node_modules'))
  assert.equal(provisionNodeModules(main, wt), 'hardlinked')
  assert.equal(lstatSync(join(wt, 'node_modules')).isSymbolicLink(), false)
  assert.equal(statSync(join(wt, 'node_modules', 'pkg', 'index.js')).ino, statSync(join(main, 'node_modules', 'pkg', 'index.js')).ino)
  assert.equal(lstatSync(join(main, 'node_modules')).isDirectory(), true)
  assert.equal(provisionNodeModules(main, wt), 'kept')
  rmSync(root, { recursive: true, force: true })
})

test('comms-worktree-real-app: the uncommitted-work sweep never stages node_modules or a symlink pointing out of the worktree', () => {
  const root = mkdtempSync(join(tmpdir(), 'sweep-'))
  const wt = join(root, 'wt'); mkdirSync(wt)
  const g = (...a) => execFileSync('git', ['-C', wt, ...a], { encoding: 'utf8' })
  g('init', '-q'); writeFileSync(join(wt, '.gitignore'), 'node_modules/\n')
  mkdirSync(join(root, 'outside')); symlinkSync(join(root, 'outside'), join(wt, 'node_modules'))
  symlinkSync(join(root, 'outside'), join(wt, 'escape'))
  writeFileSync(join(wt, 'real.txt'), 'x'); symlinkSync('real.txt', join(wt, 'inside-link'))
  const bad = stageWorktreeWork(wt)
  const staged = g('diff', '--cached', '--name-only').split('\n').filter(Boolean).sort()
  assert.deepEqual(bad.sort(), ['escape', 'node_modules'])
  assert.deepEqual(staged, ['.gitignore', 'inside-link', 'real.txt'])
  rmSync(root, { recursive: true, force: true })
})
