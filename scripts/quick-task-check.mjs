#!/usr/bin/env node
// quick-task-check.mjs — a done quick task must say what was done, how it was verified, and what
// worries remain; a done task that does not is sent back to its desk.
//
// Todd, 2026-10-06: "It should specifically say what it did to verify, and were there any
// concerns; those should be forced, part of the steps when a task is done." And later the same
// day: "When they mark things done there needs to be a note about what they did... the verifier
// can't allow things to be marked done that didn't pass... the verifier passes back to the caller
// and puts something in the inbox of the calling desk about why it was rejected."
//
//   node ~/slopdog/v2/scripts/quick-task-check.mjs <file>     check one task
//   node ~/slopdog/v2/scripts/quick-task-check.mjs --sweep    send back every failing done task
//
// For a task whose front matter says `status: done`, the `## Notes` section must hold:
//   - at least one note about what was done: a `- ` line other than the first (the creation
//     line), a bare "started" line, a "Rejected by quick-task-check" line, and the two below;
//   - a line starting `Verified:` or `Not verified:`;
//   - a line starting `Concerns:`.
// Each may carry a `- <timestamp> · ` (or `- <timestamp>: `) prefix. One check exits 0 printing
// "ok", or 1 naming each missing item. A task that is not done (queued, doing, blocked, or
// reviewed, which only Todd sets from bw) always passes.
//
// --sweep acts on every `status: done` file in quick-tasks/ (never archive/, never reviewed) that
// fails: sets it back to doing, appends "Rejected by quick-task-check: <missing>" inside Notes,
// writes the task's desk an inbox message saying what is missing and how to fix it, then commits
// and pushes those paths. A rejected task is no longer done, so a second sweep finds nothing:
// the sweep is idempotent. bw runs it at most once a minute in the background, and the systemd
// user timer quick-task-sweep.timer runs it every two minutes so it works without bw open.
// QT_SWEEP_NO_COMMIT=1 skips the commit, for a test run. A lock in /tmp stops two sweeps (bw and
// the timer) rejecting the same file twice.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmdirSync, statSync, realpathSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, resolve, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { laneDir } from './lib/lane-folder.mjs'
import { isMain } from './lib/is-main.mjs'

const V2 = resolve(import.meta.dirname, '..')
const QUICK = join(V2, 'quick-tasks')
const PREFIX = String.raw`^\s*(?:-\s*)?(?:\d{4}-\d\d-\d\d(?:[ T]\d\d:\d\d)?\s*[·:]\s*)?`
const VERIFIED = new RegExp(PREFIX + '(?:Verified|Not verified):', 'i')
const CONCERNS = new RegExp(PREFIX + 'Concerns:', 'i')
const REJECTED = new RegExp(PREFIX + 'Rejected by quick-task-check', 'i')
const STARTED = new RegExp(PREFIX + 'started\\b.{0,3}$', 'i')

const LABEL = {
  Plan: 'a ## Plan section with three to seven numbered lines',
  'what was done': 'a Notes line saying what was done (beyond the created line)',
  Verified: 'a "Verified:" or "Not verified:" line',
  Concerns: 'a "Concerns:" line',
}

const PLAN_CUTOFF = '2026-10-08'

export function planLines(text) {
  const section = (text.split(/^## Plan\s*$/m)[1] || '').split(/^## /m)[0]
  return section.split('\n').map((l) => l.trim()).filter((l) => /^\d+\.\s+\S/.test(l))
}

function needsPlan(fm) {
  const created = ((fm.match(/^created:\s*(.*)$/m) || [])[1] || '').trim()
  return created >= PLAN_CUTOFF
}

// Returns { ok, status, missing: ['what was done', 'Verified', 'Concerns'] } for the task's text.
export function checkQuickTaskText(text) {
  const fm = (text.match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''
  const status = ((fm.match(/^status:\s*(.*)$/m) || [])[1] || '').trim()
  if (status !== 'done') return { ok: true, status, missing: [] }
  // A directive is a group, not work: it is done when its children are, so it has nothing of its
  // own to verify and the Plan/Verified/Concerns gate does not apply (notiontime, 2026-10-11).
  if (((fm.match(/^kind:\s*(.*)$/m) || [])[1] || '').trim() === 'directive') return { ok: true, status, missing: [] }
  const notes = (text.split(/^## Notes\s*$/m)[1] || '').split(/^## /m)[0]
  const lines = notes.split('\n').filter((l) => /^\s*-\s+\S/.test(l))
  const missing = []
  if (needsPlan(fm)) {
    const plan = planLines(text)
    if (plan.length < 3 || plan.length > 7) missing.push('Plan')
  }
  const work = lines.slice(1).filter((l) => !VERIFIED.test(l) && !CONCERNS.test(l) && !REJECTED.test(l) && !STARTED.test(l))
  if (!work.length) missing.push('what was done')
  if (!lines.some((l) => VERIFIED.test(l))) missing.push('Verified')
  if (!lines.some((l) => CONCERNS.test(l))) missing.push('Concerns')
  return { ok: missing.length === 0, status, missing }
}

export function checkQuickTask(path) {
  return checkQuickTaskText(readFileSync(path, 'utf8'))
}

const p2 = (n) => String(n).padStart(2, '0')
const localStamp = () => { const d = new Date(); return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())} ${p2(d.getHours())}:${p2(d.getMinutes())}` }

// The note goes at the end of the Notes section: before the next ## heading, or at the end.
function appendNote(text, line) {
  const at = text.search(/^## Notes\s*$/m)
  if (at < 0) return text.replace(/\s*$/, `\n\n## Notes\n${line}\n`)
  const after = text.slice(at).search(/\n## (?!Notes)/)
  const end = after < 0 ? text.length : at + after
  return text.slice(0, end).replace(/\s*$/, `\n${line}\n`) + (after < 0 ? '' : '\n' + text.slice(end).replace(/^\n+/, ''))
}

// Writes the desk's inbox message: inbox-write.mjs for a lane in the registry, by hand otherwise
// (the way a partner desk note was written), in the same YYYY-MM-DD-HHMM-from-<lane>-<slug>.md name.
function writeInbox(desk, slug, text) {
  try {
    return execFileSync(process.execPath, [join(V2, 'scripts', 'inbox-write.mjs'), '--to', desk, '--slug', slug, '--from', 'prototyper', '--text', text], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 15000 }).trim()
  } catch {
    let deskFolder = join(V2, 'desks', desk)
    try { deskFolder = laneDir(desk, { v2: V2 }) || deskFolder } catch {}
    const inbox = join(deskFolder, 'inbox')
    if (!existsSync(deskFolder)) throw new Error(`no lane or desk folder for '${desk}'`)
    mkdirSync(inbox, { recursive: true })
    const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')
    const path = join(inbox, `${stamp}-from-prototyper-${slug}.md`)
    writeFileSync(path, `# From prototyper\n\n${text}\n`)
    return path
  }
}

function git(args) {
  for (let i = 0; ; i++) {
    try { return execFileSync('git', ['-C', resolve(V2, '..'), ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], timeout: 60000 }) }
    catch (e) { if (i < 5 && /index\.lock/.test(String(e.stderr))) { execFileSync('sleep', ['2']); continue } throw e }
  }
}

export function sweep({ commit = !process.env.QT_SWEEP_NO_COMMIT, log = console.log } = {}) {
  const lock = join('/tmp', 'quick-task-sweep.lock')
  try { mkdirSync(lock) } catch {
    // A lock older than five minutes belongs to a sweep that died.
    if (Date.now() - statSync(lock).mtimeMs < 300000) return []
  }
  const sent = []
  try {
    const files = readdirSync(QUICK).filter((f) => /^\d{4}-\d\d-\d\d-.+\.md$/.test(f)).sort()
    for (const f of files) {
      const path = join(QUICK, f)
      let text = readFileSync(path, 'utf8')
      const r = checkQuickTaskText(text)
      if (r.ok) continue
      const fm = (text.match(/^---\n([\s\S]*?)\n---/) || [])[1] || ''
      const desk = ((fm.match(/^desk:\s*(.*)$/m) || [])[1] || '').trim() || 'prototyper'
      const title = ((fm.match(/^title:\s*(.*)$/m) || [])[1] || f).trim()
      const what = r.missing.join(', ')
      text = text.replace(/^(---\n[\s\S]*?\n---)/, (h) => h.replace(/^status:.*$/m, 'status: doing').replace(/^done:.*$/m, 'done:'))
      text = appendNote(text, `- ${localStamp()} · Rejected by quick-task-check: missing ${what}`)
      writeFileSync(path, text)
      const slug = 'quick-task-rejected-' + f.replace(/^\d{4}-\d\d-\d\d-/, '').replace(/\.md$/, '')
      const msg = [
        `Your quick task was marked done but failed quick-task-check, so it is back to doing.`,
        ``,
        `Task: ${title}`,
        `Path: ${path}`,
        ``,
        `Missing: ${r.missing.map((m) => LABEL[m]).join('; ')}.`,
        ``,
        `How to fix: add the missing Notes lines (what you actually did, then a "Verified:" line saying what you checked and how, then a "Concerns:" line), and run /slopdog:quick-task-do ${path} again. Never set status: reviewed; only Todd sets that, from bw.`,
      ].join('\n')
      let inbox = null
      try { inbox = writeInbox(desk, slug, msg) } catch (e) { log(`inbox for ${desk} failed: ${e.message}`) }
      log(`rejected ${f} (${desk}): missing ${what}${inbox ? ` -> ${inbox}` : ''}`)
      sent.push({ path, desk, inbox, missing: r.missing })
      if (commit) {
        const arch = inbox && inbox.replace(/\/inbox\//, '/inbox-archive/')
        const paths = [path, inbox, arch].filter((p) => p && existsSync(p))
        try {
          git(['add', '--', ...paths])
          git(['commit', '-q', '-m', `prototyper: quick-task-check sent ${basename(f, '.md')} back to ${desk}, missing ${what}`, '-m', 'Auto: quick-task-check', '--', ...paths])
        } catch (e) { log(`commit failed: ${String(e.stderr || e.message).trim().slice(0, 200)}`) }
      }
    }
    if (commit && sent.length) try { git(['push', '-q', 'origin', 'main']) } catch (e) { log(`push failed: ${String(e.stderr || e.message).trim().slice(0, 200)}`) }
  } finally { try { rmdirSync(lock) } catch {} }
  return sent
}

if (isMain(import.meta.url)) {
  const arg = process.argv[2]
  if (!arg) { console.error('usage: quick-task-check.mjs <file> | --sweep'); process.exit(2) }
  if (arg === '--sweep') { const s = sweep(); if (!s.length) console.log('sweep: nothing to send back'); process.exit(0) }
  const r = checkQuickTask(arg)
  if (r.ok) { console.log('ok'); process.exit(0) }
  for (const m of r.missing) console.log(`missing: ${LABEL[m]} in ## Notes`)
  process.exit(1)
}
