#!/usr/bin/env node
// build-step — record one finished ticket step: log it, tick it, commit it.
//   build-step.mjs <ticket-path|T-id> <N> "<what this step did>" --why "<one line>"
//                  [--decision "<choice> — <alternative rejected>"]... [--lane <lane>] -- <files…>
// 1. Appends `[Implementation] Step N: <what>` under ## Build log, plus one [Decision] line
//    per --decision.
// 2. Ticks the Nth top-level `- [ ]` under ## Steps.
// 3. Lists each file under ## Hand-off's Files changed as `- <repo-relative path> — <why>`
//    (a file already listed is left alone).
// 4. `git add` exactly the named files plus the ticket, and commits in the repo that holds
//    the files, in the shape the house commit-msg hook enforces:
//      <lane> T-<id> step <N>: <what>
//
//      Why: <why>
//      Decision: <choice> — <alternative rejected>
//    When the ticket lives in another repo (the usual case: tickets are in ~/slopdog/tasks),
//    the ticket gets its own commit there with the same message. Never `git add -A`.
// The lane is --lane, else $DISPATCH_LANE, else $DISPATCH_ENGINE, else the <lane> in a
// …/v2/.worktrees/<lane>/… path (the files' repo, then the cwd).
// Refuses (exit 1, writing nothing) when step N is already ticked or missing, no files are
// given, a named file is unchanged, the files span more than one repo, --why is missing,
// a --decision lacks " — ", or no lane resolves.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, relative, resolve } from 'node:path'
import { addFilesChanged, appendBuildLog, logLine, resolveTicket, tickStep, ticketId } from './ticket-lib.mjs'

const USAGE = 'usage: build-step.mjs <ticket-path|T-id> <N> "<what this step did>" --why "<one line>" [--decision "<choice> — <alternative rejected>"]... [--lane <lane>] -- <files…>'
const fail = (msg) => { console.error(`build-step: ${msg}`); process.exit(1) }
const oneLine = (s) => s.replace(/\s*\n\s*/g, ' ').trim()

const argv = process.argv.slice(2)
const dash = argv.indexOf('--')
if (dash === -1) fail(`no "--" before the file list\n${USAGE}`)

// Flags come out of the part before "--"; what is left is <ticket> <N> <what…>.
const head = argv.slice(0, dash)
let why = null
let lane = null
const decisions = []
const positional = []
for (let i = 0; i < head.length; i++) {
  const a = head[i]
  if (a === '--why' || a === '--lane' || a === '--decision') {
    const v = oneLine(head[i + 1] || '')
    if (!v || v.startsWith('--')) fail(`${a} needs a value`)
    if (a === '--why') why = v
    else if (a === '--lane') lane = v
    else decisions.push(v)
    i++
  } else positional.push(a)
}
const [ticketArg, nArg, ...words] = positional
const what = oneLine(words.join(' '))
const n = Number(nArg)
if (!ticketArg || !Number.isInteger(n) || n < 1 || !what) fail(USAGE)
if (!why) fail('--why "<one line>" is required: the reason this step was done, for the commit body and the Hand-off file list')
for (const d of decisions) if (!d.includes(' — ')) fail(`--decision "${d}" must read "<choice> — <alternative rejected>"`)

// realpath: ~/slopdog is a symlink into /storage, so compare resolved paths only.
const real = (p) => { const r = resolve(p); return existsSync(r) ? realpathSync(r) : resolve(realpathSync(dirname(r)), r.split('/').pop()) }
const files = argv.slice(dash + 1).map(real)
if (files.length === 0) fail('no files given; name exactly the files this step changed')

const found = resolveTicket(ticketArg)
if (!found) fail(`no ticket found for "${ticketArg}"`)
const ticketPath = realpathSync(found)
const original = readFileSync(ticketPath, 'utf8')
const id = ticketId(original)
if (!id) fail(`${ticketPath} has no id: in its front matter`)

const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
const repoOf = (p) => {
  const r = spawnSync('git', ['-C', dirname(p), 'rev-parse', '--show-toplevel'], { encoding: 'utf8' })
  return r.status === 0 ? r.stdout.trim() : null
}

// Every check runs before anything is written.
const repos = new Set()
for (const f of files) {
  const repo = repoOf(f)
  if (!repo) fail(`${f} is not inside a git repo`)
  repos.add(repo)
  if (f === ticketPath) fail('the ticket is added automatically; do not list it among the files')
  if (!git(repo, 'status', '--porcelain', '--', f)) fail(`${f} is unchanged; name only files this step changed`)
}
if (repos.size > 1) fail(`files span ${repos.size} repos (${[...repos].join(', ')}); split them into one step per repo`)
const repo = [...repos][0]
const ticketRepo = repoOf(ticketPath)
if (!ticketRepo) fail(`${ticketPath} is not inside a git repo`)

const fromWorktree = (p) => p.match(/\/v2\/\.worktrees\/([^/]+)\//)?.[1] || null
lane = lane || process.env.DISPATCH_LANE || process.env.DISPATCH_ENGINE ||
  fromWorktree(repo + '/') || fromWorktree(realpathSync(process.cwd()) + '/')
if (!lane) fail('no lane: pass --lane <lane>, or set DISPATCH_LANE or DISPATCH_ENGINE, or run inside v2/.worktrees/<lane>/')

let updated
try { updated = tickStep(original, n) } catch (e) { fail(e.message) }
updated = appendBuildLog(updated, logLine('Implementation', `Step ${n}: ${what}`))
for (const d of decisions) updated = appendBuildLog(updated, logLine('Decision', d))
updated = addFilesChanged(updated, files.map((f) => relative(repo, f)), why)

const subject = `${lane} ${id} step ${n}: ${what}`
const body = [`Why: ${why}`, ...decisions.map((d) => `Decision: ${d}`)].join('\n')
writeFileSync(ticketPath, updated)
const commit = (cwd, paths) => {
  git(cwd, 'add', '--', ...paths)
  git(cwd, 'commit', '-m', subject, '-m', body, '--', ...paths)
  return git(cwd, 'rev-parse', '--short', 'HEAD')
}
try {
  if (ticketRepo === repo) {
    console.log(`${commit(repo, [...files, ticketPath])} ${subject}`)
  } else {
    console.log(`${commit(repo, files)} ${subject}`)
    console.log(`${commit(ticketRepo, [ticketPath])} ${subject} (ticket, in ${ticketRepo})`)
  }
} catch (e) {
  // The ticket edit stays on disk so the builder can see it; say exactly what failed.
  fail(`git failed: ${(e.stderr || e.message).toString().trim()}`)
}
