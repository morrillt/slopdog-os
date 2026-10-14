#!/usr/bin/env node
// red-check — the builder's first commit for an acceptance criterion: a check that fails (T-698).
//   red-check.mjs <ticket-path|T-id> <AC-n> --cmd "<command>" [--why "<one line>"] [--lane <lane>] -- <files…>
// The builder writes the check after reading the code, so the command is real, not drafted from
// memory by the ticket writer. red-check runs it with `sh -c` in the files' repo:
// - exit 0 → refused (exit 1): the check already passes, so it tests nothing new;
// - exit 126/127 → refused: the command could not run, which is not a failing check;
// - anything else → commits exactly the named files as `<lane> T-<id>: red check for AC-n`
//   with a Why: line, then writes `Red-check: AC-n · <command> · <hash>` under the ticket's
//   ## Hand-off. The ticket edit is left for the step's build-step.mjs commit.
// Refuses, writing nothing, on bad arguments, an unchanged file, files in two repos, or no lane.
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { resolveTicket, ticketId } from './ticket-lib.mjs'

const USAGE = 'usage: red-check.mjs <ticket-path|T-id> <AC-n> --cmd "<command>" [--why "<one line>"] [--lane <lane>] -- <files…>'
const fail = (msg) => { console.error(`red-check: ${msg}`); process.exit(1) }
const oneLine = (s) => s.replace(/\s*\n\s*/g, ' ').trim()

const argv = process.argv.slice(2)
const dash = argv.indexOf('--')
if (dash === -1) fail(`no "--" before the file list\n${USAGE}`)
const head = argv.slice(0, dash)
const opts = {}
const positional = []
for (let i = 0; i < head.length; i++) {
  const a = head[i]
  if (a === '--cmd' || a === '--why' || a === '--lane') {
    const v = oneLine(head[i + 1] || '')
    if (!v) fail(`${a} needs a value`)
    opts[a.slice(2)] = v
    i++
  } else positional.push(a)
}
const [ticketArg, ac] = positional
if (!ticketArg || !/^AC-\d+$/.test(ac || '') || !opts.cmd) fail(USAGE)

const real = (p) => { const r = resolve(p); return existsSync(r) ? realpathSync(r) : r }
const files = argv.slice(dash + 1).map(real)
if (!files.length) fail('no files given; name the check files this commit adds')

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
const repos = new Set()
for (const f of files) {
  const repo = repoOf(f)
  if (!repo) fail(`${f} is not inside a git repo`)
  repos.add(repo)
  if (f === ticketPath) fail('do not list the ticket among the check files')
  if (!git(repo, 'status', '--porcelain', '--', f)) fail(`${f} is unchanged; name only the check files you wrote`)
}
if (repos.size > 1) fail(`files span ${repos.size} repos; a red check lives in one`)
const repo = [...repos][0]

const fromWorktree = (p) => p.match(/\/v2\/\.worktrees\/([^/]+)\//)?.[1] || null
const lane = opts.lane || process.env.DISPATCH_LANE || process.env.DISPATCH_ENGINE ||
  fromWorktree(repo + '/') || fromWorktree(realpathSync(process.cwd()) + '/')
if (!lane) fail('no lane: pass --lane <lane>, or set DISPATCH_LANE or DISPATCH_ENGINE')

const r = spawnSync('sh', ['-c', opts.cmd], { cwd: repo, encoding: 'utf8', timeout: 300_000 })
const tail = (r.stdout + r.stderr).trim().split('\n').slice(-3).join('\n')
if (r.status === 0) fail(`${ac}: \`${opts.cmd}\` exits 0, so it tests nothing new; write a check that fails before the code exists`)
if (r.status === 126 || r.status === 127) fail(`${ac}: \`${opts.cmd}\` could not run (exit ${r.status}), which is not a failing check:\n${tail}`)
if (r.status === null) fail(`${ac}: \`${opts.cmd}\` did not finish (${r.signal || r.error?.code}); a red check must fail, not hang`)

const subject = `${lane} ${id}: red check for ${ac}`
const why = `Why: ${opts.why || `the failing check for ${ac}, written after reading the code and before changing it`}`
try {
  git(repo, 'add', '--', ...files)
  git(repo, 'commit', '-m', subject, '-m', why, '--', ...files)
} catch (e) {
  fail(`git failed: ${(e.stderr || e.message).toString().trim()}`)
}
const hash = git(repo, 'rev-parse', '--short', 'HEAD')

// One line at the end of ## Hand-off, created before ## Progress notes / ## Concerns if missing.
const line = `Red-check: ${ac} · ${opts.cmd} · ${hash}`
const lines = original.split('\n')
let start = lines.findIndex((l) => l.trim() === '## Hand-off')
if (start === -1) {
  const at = ['Progress notes', 'Concerns'].map((n) => lines.findIndex((l) => l.trim() === `## ${n}`)).filter((i) => i !== -1)
  start = at.length ? Math.min(...at) : lines.length
  lines.splice(start, 0, '## Hand-off', '', '')
}
let end = lines.findIndex((l, i) => i > start && /^## /.test(l))
if (end === -1) end = lines.length
let last = end - 1
while (last > start && lines[last].trim() === '') last--
lines.splice(last + 1, 0, ...(last === start ? ['', line] : [line]))
writeFileSync(ticketPath, lines.join('\n'))
console.log(`${hash} ${subject}\n${ac} fails as it should (exit ${r.status}); ${line}`)
