#!/usr/bin/env node
// second-opinion — a second reader for a NEW ASK, run by /slopdog:ideate over a ramble
// before it is routed. The ask (Todd's words) is shown to a cheap, fast model with one
// fixed checklist. Readers, tried in order until one answers: Gemini Flash over the REST API
// (~1s, when ~/.config/gemini/env holds a GEMINI_API_KEY); Gemini through the Antigravity CLI
// (`agy -p --mode plan` in the build desk's gemini/ folder, ~5s, the Google-account login, no key
// or credits); headless Claude, `claude -p --model haiku`, same prompt, its own longer budget.
// A reader that errors (a 402, an auth failure) is logged and skipped, never read as "no flags":
// does it make sense, is it clear, does it contradict or duplicate a planned ticket or a house
// principle. Prints "no flags" or one line per flag; the lane considers them, it does not
// recite them. Only new asks, never questions (Todd, 2026-09-08: "I like to be able to talk
// to you quickly").
//
//   second-opinion.mjs [--session <claude-session-id>] "<the ask in Todd's words>"
//
// Waits at most BUDGET_MS (CLAUDE_BUDGET_MS for the fallback); any error or timeout prints "no flags (<why>)" and exits 0 — it
// never blocks an ask. Each call is logged to ~/.local/state/second-opinion.log for tuning,
// with which reader ran. Key: ~/.config/gemini/env.
import { readFileSync, existsSync, appendFileSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import { join, dirname } from 'node:path'
import { homedir } from 'node:os'
import { laneDir } from '../../../../../scripts/lib/lane-folder.mjs'

const MODEL = 'gemini-3.8-flash'
const CLAUDE_MODEL = 'haiku'
const CLAUDE_BIN = join(homedir(), '.nvm', 'versions', 'node', 'v24.11.1', 'lib', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe')
const BUDGET_MS = 6000
const AGY = join(homedir(), '.local', 'bin', 'agy')
const AGY_LANE = laneDir('gemma') || join(homedir(), 'slopdog', 'v2', 'desks', 'build', 'sidekicks', 'gemini') // Gemma's registry folder, a trusted agy workspace; from elsewhere plan mode reaches for tools
const AGY_BUDGET_MS = 45000
const CLAUDE_BUDGET_MS = 90000 // a headless claude call is 30-60s on this ThinkPad (measured 2026-09-24); 6s never finishes
const HOME = homedir()
const LOG = join(HOME, '.local', 'state', 'second-opinion.log')
const log = (line) => { try { mkdirSync(dirname(LOG), { recursive: true }); appendFileSync(LOG, `${new Date().toISOString()} ${line}\n`) } catch {} }
const read = (p, max = 12000) => { try { return readFileSync(p, 'utf8').slice(0, max) } catch { return '' } }

const argv = process.argv.slice(2)
const si = argv.indexOf('--session'); const session = si === -1 ? '' : argv.splice(si, 2)[1]
const prompt = argv.join(' ').trim()
const done = (why) => { process.stdout.write(`no flags (${why})\n`); process.exit(0) }
if (!prompt) done('no ask given')

const key = (read(join(HOME, '.config', 'gemini', 'env')).match(/^\s*GEMINI_API_KEY\s*=\s*"?([^"\n]*)"?/m) || [])[1]
let reader = ''

// Context: the principles and the nearest task list (walk up from cwd; else the house list).
const principles = read(join(HOME, 'slopdog', 'v2', 'rules', 'principles.md'))
let taskList = ''
for (let d = process.cwd(); d && d !== '/'; d = dirname(d)) {
  if (existsSync(join(d, 'task-list.md'))) { taskList = read(join(d, 'task-list.md')); break }
}
if (!taskList) taskList = read(join(HOME, 'slopdog', 'tasks', 'task-list.md'))
const system = `You are a fast second reader for a software team. Todd, the product owner, just gave a Claude agent the new ask below. You are NOT answering him. You check the ask against the team's principles and its task list, and report only real problems. Be terse and specific.

Flag kinds:
- unclear: the ask is ambiguous in a way that would change what gets built (name the two readings).
- contradicts-principle: it goes against a listed principle (name it).
- duplicates-task: a ticket already covers this (name its T-nnn).
- contradicts-task: it conflicts with a planned ticket (name its T-nnn).

Dictated speech arrives garbled; read for intent and do not flag typos or grammar. Most asks are fine: then return an empty list. Respond with JSON only: {"flags":[{"kind":"...","note":"one sentence"}]}`

const user = `## Principles\n${principles}\n\n## Task list\n${taskList}\n\n## The new ask, in Todd's words\n${prompt}`

// Gemini when the key exists; otherwise headless Claude with the same prompt and budget.
async function askGemini(signal) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`, {
    method: 'POST', signal, headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ parts: [{ text: user }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.2, maxOutputTokens: 600, thinkingConfig: { thinkingBudget: 0 } },
    }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(`gemini ${res.status} ${(data?.error?.message || '').slice(0, 80)}`)
  return data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || ''
}
// Strict JSON first; if the model left a stray quote in a note, pick the flags out by regex.
function parseFlags(text) {
  try { return (JSON.parse(text).flags || []).filter((f) => f && f.note) } catch {}
  log(`${reader} unparseable :: ${text.slice(0, 200).replace(/\n/g, ' ')}`)
  return [...text.matchAll(/"kind"\s*:\s*"([^"]+)"\s*,\s*"note"\s*:\s*"(.*?)"\s*\}/gs)].map((m) => ({ kind: m[1], note: m[2] }))
}
function askAgy() {
  const r = spawnSync(AGY, ['--mode', 'plan', '--disable-slash-commands', '--output-format', 'text', '-p', `${system}\n\nDo not use any tools.\n\n${user}`],
    { cwd: AGY_LANE, input: '', encoding: 'utf8', timeout: AGY_BUDGET_MS, maxBuffer: 1 << 20 })
  if (r.error?.code === 'ETIMEDOUT') throw Object.assign(new Error('timeout'), { timeout: true })
  if (r.status !== 0 || !r.stdout.includes('{')) throw new Error((r.stderr || r.stdout || `exit ${r.status}`).trim().slice(0, 120))
  return r.stdout.slice(r.stdout.indexOf('{'), r.stdout.lastIndexOf('}') + 1)
}
function askClaude() {
  const env = { ...process.env }; delete env.CLAUDECODE // a nested session refuses to start otherwise
  const r = spawnSync(CLAUDE_BIN, ['-p', '--model', CLAUDE_MODEL, '--max-turns', '1', '--output-format', 'text', '--tools', '', '--no-session-persistence', '--system-prompt', system],
    { input: user, encoding: 'utf8', env, timeout: CLAUDE_BUDGET_MS, maxBuffer: 1 << 20 })
  if (r.error?.code === 'ETIMEDOUT') throw Object.assign(new Error('timeout'), { timeout: true })
  if (r.status !== 0) throw new Error((r.stderr || r.stdout || `exit ${r.status}`).trim().slice(0, 120))
  return r.stdout.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, '')
}

const t0 = Date.now()
const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), BUDGET_MS)
const readers = [
  ...(key ? [[MODEL, () => askGemini(ctl.signal)]] : []),
  ...(existsSync(AGY) ? [['agy:gemini', askAgy]] : []),
  [`claude:${CLAUDE_MODEL}`, askClaude],
]
try {
  let text = ''
  for (const [name, ask] of readers) {
    reader = name
    try { text = await ask(); clearTimeout(timer); break } catch (e) {
      if (name === readers.at(-1)[0]) throw e
      log(`${name} ${Date.now() - t0}ms skipped: ${(ctl.signal.aborted && name === MODEL) ? 'timeout' : (e?.message || e)}`)
    }
  }
  const flags = parseFlags(text)
  const ms = Date.now() - t0
  log(`${reader} ${ms}ms flags=${flags.length} :: ${prompt.slice(0, 80).replace(/\n/g, ' ')}${flags.length ? ' :: ' + JSON.stringify(flags) : ''}`)
  if (!flags.length) done(`${reader}, ${ms}ms`)
  process.stdout.write(`Second opinion (${reader}, ${ms}ms) — consider, don't recite; raise a point only if you agree it matters:\n`)
  for (const f of flags) process.stdout.write(`- ${f.kind}: ${f.note}\n`)
} catch (e) {
  const why = e?.timeout ? 'timeout' : 'error ' + (e?.message || e)
  log(`${reader} ${Date.now() - t0}ms ${why} :: ${prompt.slice(0, 80).replace(/\n/g, ' ')}`)
  done(why)
} finally { clearTimeout(timer) }
process.exit(0)
