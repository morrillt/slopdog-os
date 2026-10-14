import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, readdirSync, copyFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { tmpdir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseSlackTarget, notifyContextRefusal } from './context-refusal-notify.mjs'
// The real limits switch (v2/LIMITS-OFF) would make the hook pass everything; point it at nothing.
process.env.SLOPDOG_LIMITS_OFF_FILE = '/nonexistent/LIMITS-OFF'

const HOOK_DIR = dirname(fileURLToPath(import.meta.url))
const HOOK = join(HOOK_DIR, 'context-rot.mjs')
const V2 = join(HOOK_DIR, '..', '..', '..')

function testNotifyEnv(scratch) {
  return {
    SLOPDOG_V2_ROOT: V2,
    SLOPDOG_ACTIVITY_LOG_DIR: join(scratch, 'activity'),
    SLOPDOG_DISPATCH_INBOX_DIR: join(scratch, 'inbox'),
    SLOPDOG_CONTEXT_REFUSAL_STATE_DIR: join(scratch, 'state'),
    SLACK_BOT_TOKEN: '',
  }
}

function fire(payload, env = {}) {
  return spawnSync(process.execPath, [HOOK], {
    encoding: 'utf8',
    input: JSON.stringify(payload),
    env: { ...process.env, ...env },
  })
}

function transcriptAt(tokens) {
  const line = JSON.stringify({
    type: 'assistant',
    message: {
      usage: {
        input_tokens: tokens,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  })
  const dir = mkdtempSync(join(tmpdir(), 'ctx-rot-'))
  const path = join(dir, 't.jsonl')
  writeFileSync(path, line + '\n')
  return path
}

test('parseSlackTarget reads channel XML and inbox headers', () => {
  const xml = '<channel source="slack" channel="C1" user="U1" ts="111.1" thread_ts="222.2">hi</channel>'
  assert.deepEqual(parseSlackTarget(xml), { channel: 'C1', thread_ts: '222.2' })
  const head = 'Slack DM. channel=C9 user=U9 ts=1.0 thread_ts=2.0\n\nbody'
  assert.deepEqual(parseSlackTarget(head), { channel: 'C9', thread_ts: '2.0' })
})

test('hard limit refusal exits 2 and records context_refusal notification', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'ctx-refusal-'))
  const logDir = join(scratch, 'activity')
  const inbox = join(scratch, 'inbox')
  const state = join(scratch, 'state')
  mkdirSync(inbox, { recursive: true })

  const desk = join(V2, 'desks/ideas')
  const transcript = transcriptAt(360_000)
  const prompt =
    '<channel source="slack" channel="CDM" user="UT" ts="9.9" thread_ts="8.8">Todd said hello</channel>'

  const r = fire(
    { transcript_path: transcript, cwd: desk, prompt, session_id: 'abcd1234-0000' },
    {
      SLOPDOG_CONTEXT_NUDGE: '200000',
      SLOPDOG_CONTEXT_CEILING: '250000',
      SLOPDOG_CONTEXT_HARD: '350000',
      SLOPDOG_V2_ROOT: V2,
      SLOPDOG_ACTIVITY_LOG_DIR: logDir,
      SLOPDOG_DISPATCH_INBOX_DIR: inbox,
      SLOPDOG_CONTEXT_REFUSAL_STATE_DIR: state,
      SLACK_BOT_TOKEN: '',
    },
  )
  assert.equal(r.status, 2)
  assert.match(r.stderr, /refused until the desk clears/)

  // The notifier names the log by local date (today() in context-refusal-notify.mjs), not UTC.
  const localDay = new Date().toLocaleDateString('en-CA')
  const logLine = readFileSync(join(logDir, `${localDay}.jsonl`), 'utf8').trim()
  const row = JSON.parse(logLine)
  assert.equal(row.event, 'context_refusal')
  assert.equal(row.lane, 'ideas')
  assert.match(row.text, /Todd said hello/)

  const inboxFiles = readdirSync(inbox)
  assert.equal(inboxFiles.length, 1)
  assert.match(inboxFiles[0], /from-context-rot/)
  assert.match(readFileSync(join(inbox, inboxFiles[0]), 'utf8'), /ideas/)
})

test('clearing prompt at hard limit is let through', () => {
  const desk = join(V2, 'desks/ideas')
  const transcript = transcriptAt(360_000)
  const r = fire(
    { transcript_path: transcript, cwd: desk, prompt: '/slopdog:clear-to-close' },
    {
      SLOPDOG_CONTEXT_HARD: '350000',
      SLOPDOG_CONTEXT_NUDGE: '200000',
      SLOPDOG_CONTEXT_CEILING: '250000',
    },
  )
  assert.equal(r.status, 0)
  assert.match(r.stdout, /let through because it clears/)
})

test('notifyContextRefusal appends activity when log dir is set', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'ctx-refusal-mini-'))
  mkdirSync(join(scratch, 'inbox'), { recursive: true })
  mkdirSync(join(scratch, 'state'), { recursive: true })
  const env = testNotifyEnv(scratch)
  const prev = {}
  for (const key of Object.keys(env)) {
    prev[key] = process.env[key]
    process.env[key] = env[key]
  }
  const out = notifyContextRefusal({
    lane: 'ideas',
    ctx: 360_000,
    hard: 350_000,
    prompt: 'x',
    sessionId: 'session-1',
  })
  for (const key of Object.keys(env)) {
    if (prev[key] === undefined) delete process.env[key]
    else process.env[key] = prev[key]
  }
  assert.equal(out.activity, true)
  assert.equal(readdirSync(env.SLOPDOG_ACTIVITY_LOG_DIR).length, 1)
  assert.equal(readdirSync(env.SLOPDOG_DISPATCH_INBOX_DIR).length, 1)
})

test('hard limit refusal exits 2 with stderr when notify state dir is unwritable', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'ctx-refusal-bad-state-'))
  writeFileSync(join(scratch, 'not-a-dir'), 'blocks mkdir')
  const desk = join(V2, 'desks/ideas')
  const transcript = transcriptAt(360_000)
  const r2 = fire(
    { transcript_path: transcript, cwd: desk, prompt: 'hello again', session_id: 'sess-bad2' },
    {
      ...testNotifyEnv(scratch),
      SLOPDOG_CONTEXT_REFUSAL_STATE_DIR: join(scratch, 'not-a-dir'),
      SLOPDOG_CONTEXT_NUDGE: '200000',
      SLOPDOG_CONTEXT_CEILING: '250000',
      SLOPDOG_CONTEXT_HARD: '350000',
    },
  )
  assert.equal(r2.status, 2)
  assert.match(r2.stderr, /refused until the desk clears/)
})

test('hard limit refusal exits 2 with stderr when notify module is missing', () => {
  const isolated = mkdtempSync(join(tmpdir(), 'ctx-rot-isolated-'))
  copyFileSync(HOOK, join(isolated, 'context-rot.mjs'))
  copyFileSync(join(HOOK_DIR, 'context-tiers.json'), join(isolated, 'context-tiers.json'))
  const scratch = mkdtempSync(join(tmpdir(), 'ctx-refusal-no-notify-'))
  mkdirSync(join(scratch, 'inbox'), { recursive: true })
  const desk = join(V2, 'desks/ideas')
  const transcript = transcriptAt(360_000)
  const r = spawnSync(process.execPath, [join(isolated, 'context-rot.mjs')], {
    encoding: 'utf8',
    input: JSON.stringify({ transcript_path: transcript, cwd: desk, prompt: 'ping', session_id: 'x' }),
    env: {
      ...process.env,
      ...testNotifyEnv(scratch),
      SLOPDOG_CONTEXT_NUDGE: '200000',
      SLOPDOG_CONTEXT_CEILING: '250000',
      SLOPDOG_CONTEXT_HARD: '350000',
    },
  })
  assert.equal(r.status, 2)
  assert.match(r.stderr, /refused until the desk clears/)
})

test('"run on" at the hard limit writes .over-ceiling and lets the prompt and later ones through', () => {
  const desk = mkdtempSync(join(tmpdir(), 'ctx-runon-'))
  const transcript = transcriptAt(360_000)
  const env = { SLOPDOG_CONTEXT_HARD: '350000', SLOPDOG_CONTEXT_NUDGE: '200000', SLOPDOG_CONTEXT_CEILING: '250000', SLOPDOG_DESK_DIR: desk }
  const r = fire({ transcript_path: transcript, cwd: desk, prompt: 'run on, we are mid-plan' }, env)
  assert.equal(r.status, 0)
  assert.match(readFileSync(join(desk, '.over-ceiling'), 'utf8'), /run on/)
  const next = fire({ transcript_path: transcript, cwd: desk, prompt: 'keep going on the batch' }, env)
  assert.equal(next.status, 0)
  assert.match(next.stdout, /OK'd this desk to run on/)
})

test('a Slack-wrapped "run on" does not lift the hard limit', () => {
  const scratch = mkdtempSync(join(tmpdir(), 'ctx-runon-slack-'))
  const desk = join(scratch, 'desk'); mkdirSync(desk)
  const transcript = transcriptAt(360_000)
  const r = fire(
    { transcript_path: transcript, cwd: desk, prompt: '<channel source="slack" channel="C1" user="U1" ts="1.1">run on</channel>' },
    { ...testNotifyEnv(scratch), SLOPDOG_CONTEXT_HARD: '350000', SLOPDOG_CONTEXT_NUDGE: '200000', SLOPDOG_CONTEXT_CEILING: '250000', SLOPDOG_DESK_DIR: desk },
  )
  assert.equal(r.status, 2)
  assert.equal(readdirSync(desk).includes('.over-ceiling'), false)
})
