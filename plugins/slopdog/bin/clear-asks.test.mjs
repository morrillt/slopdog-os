import { test } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdtempSync, mkdirSync, writeFileSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'

const HERE = dirname(fileURLToPath(import.meta.url))
const BIN = join(HERE, 'clear-asks.mjs')

function run(args = [], env = {}, cwd = process.cwd()) {
  return spawnSync(process.execPath, [BIN, ...args], {
    encoding: 'utf8',
    cwd,
    env: { ...process.env, ...env },
  })
}

test('clear-asks: skips when invoked with unattended argument', () => {
  const res = run(['unattended'])
  assert.equal(res.status, 0)
  assert.match(res.stdout, /^skip\b/)
  assert.match(res.stdout, /unattended argument/)
})

test('clear-asks: skips for unattended lanes (watcher, dispatcher/build, scribe, etc.)', () => {
  const resWatcher = run([], { SLOPDOG_LANE: 'watcher' })
  assert.equal(resWatcher.status, 0)
  assert.match(resWatcher.stdout, /^skip\b/)

  const resBuild = run([], { SLOPDOG_LANE: 'build' })
  assert.equal(resBuild.status, 0)
  assert.match(resBuild.stdout, /^skip\b/)
})

test('clear-asks: skips when context tier is hard via SLOPDOG_CONTEXT_TIER env', () => {
  const res = run([], { SLOPDOG_CONTEXT_TIER: 'hard' })
  assert.equal(res.status, 0)
  assert.match(res.stdout, /^skip\b/)
  assert.match(res.stdout, /context hook at hard tier/)
})

test('clear-asks: skips at hard context tier when CLAUDE_TRANSCRIPT_PATH points to hard transcript', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'claude-transcript-'))
  const transcriptFile = join(tmp, 'hard.jsonl')
  const line = JSON.stringify({
    type: 'assistant',
    message: {
      usage: {
        input_tokens: 410000,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  })
  writeFileSync(transcriptFile, line + '\n')

  const res = run([], {
    SLOPDOG_LANE: 'ideas',
    SLOPDOG_CONTEXT_TIER: '',
    CLAUDE_TRANSCRIPT_PATH: transcriptFile,
  })

  assert.equal(res.status, 0)
  assert.match(res.stdout, /^skip\b/)
  assert.match(res.stdout, /context hook at hard tier/)
})

test('clear-asks: skips at hard context tier when CLAUDE_SESSION_ID is exact', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'claude-projects-'))
  const deskFolder = join(tmp, 'ideas')
  mkdirSync(deskFolder, { recursive: true })
  const slug = deskFolder.replace(/[^a-zA-Z0-9]/g, '-')
  const projDir = join(tmp, slug)
  mkdirSync(projDir, { recursive: true })

  const transcriptFile = join(projDir, 'session-123.jsonl')
  const line = JSON.stringify({
    type: 'assistant',
    message: {
      usage: {
        input_tokens: 410000,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  })
  writeFileSync(transcriptFile, line + '\n')

  const res = run([], {
    CLAUDE_PROJECTS_DIR: tmp,
    SLOPDOG_LANE: 'ideas',
    SLOPDOG_CONTEXT_TIER: '',
    CLAUDE_TRANSCRIPT_PATH: '',
    CLAUDE_SESSION_ID: 'session-123',
  }, deskFolder)

  assert.equal(res.status, 0)
  assert.match(res.stdout, /^skip\b/)
  assert.match(res.stdout, /context hook at hard tier/)
})

test('clear-asks: falls through to ask when transcript discovery without session ID is ambiguous', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'claude-projects-'))
  const deskFolder = join(tmp, 'ideas')
  mkdirSync(deskFolder, { recursive: true })
  const slug = deskFolder.replace(/[^a-zA-Z0-9]/g, '-')
  const projDir = join(tmp, slug)
  mkdirSync(projDir, { recursive: true })

  // Even if a hard-tier transcript exists in the project dir, without exact session ID it must not guess
  const transcriptFile = join(projDir, 'session-123.jsonl')
  const line = JSON.stringify({
    type: 'assistant',
    message: {
      usage: {
        input_tokens: 410000,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  })
  writeFileSync(transcriptFile, line + '\n')

  const res = run([], {
    CLAUDE_PROJECTS_DIR: tmp,
    SLOPDOG_LANE: 'ideas',
    SLOPDOG_CONTEXT_TIER: '',
    CLAUDE_TRANSCRIPT_PATH: '',
    CLAUDE_SESSION_ID: '',
  }, deskFolder)

  assert.equal(res.status, 0)
  assert.match(res.stdout, /^ask: plain invocation in a watched desk/)
})

test('clear-asks repro: 50k current session next to newer 450k other file falls through to ask', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'claude-projects-'))
  const deskFolder = join(tmp, 'ideas')
  mkdirSync(deskFolder, { recursive: true })
  const slug = deskFolder.replace(/[^a-zA-Z0-9]/g, '-')
  const projDir = join(tmp, slug)
  mkdirSync(projDir, { recursive: true })

  const sessionCurrent = join(projDir, 'session-current.jsonl')
  writeFileSync(sessionCurrent, JSON.stringify({
    type: 'assistant',
    message: {
      usage: {
        input_tokens: 50000,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  }) + '\n')

  const sessionOther = join(projDir, 'session-other.jsonl')
  writeFileSync(sessionOther, JSON.stringify({
    type: 'assistant',
    message: {
      usage: {
        input_tokens: 450000,
        cache_read_input_tokens: 0,
        cache_creation_input_tokens: 0,
      },
    },
  }) + '\n')

  const res = run([], {
    CLAUDE_PROJECTS_DIR: tmp,
    SLOPDOG_LANE: 'ideas',
    SLOPDOG_CONTEXT_TIER: '',
    CLAUDE_TRANSCRIPT_PATH: '',
    CLAUDE_SESSION_ID: '',
  }, deskFolder)

  assert.equal(res.status, 0)
  assert.match(res.stdout, /^ask: plain invocation in a watched desk/)
})

test('clear-asks: executes and outputs decision when invoked via a symlinked path (~/slopdog)', () => {
  const tmp = mkdtempSync(join(tmpdir(), 'symlink-bin-'))
  const symlinkBin = join(tmp, 'clear-asks-symlink.mjs')
  symlinkSync(BIN, symlinkBin)

  const res = spawnSync(process.execPath, [symlinkBin, 'unattended'], {
    encoding: 'utf8',
  })
  assert.equal(res.status, 0)
  assert.match(res.stdout, /^skip: unattended argument/)

  const resAsk = spawnSync(process.execPath, [symlinkBin], {
    encoding: 'utf8',
    env: { ...process.env, SLOPDOG_LANE: 'ideas', SLOPDOG_CONTEXT_TIER: 'nudge' },
  })
  assert.equal(resAsk.status, 0)
  assert.match(resAsk.stdout, /^ask: plain invocation in a watched desk/)
})

test('clear-asks: asks for a plain invocation in a watched desk', () => {
  const res = run([], { SLOPDOG_LANE: 'ideas', SLOPDOG_CONTEXT_TIER: 'nudge' })
  assert.equal(res.status, 0)
  assert.match(res.stdout, /^ask\b/)
})
