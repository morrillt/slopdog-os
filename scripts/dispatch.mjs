#!/usr/bin/env node
// dispatch — send one job to a worker lane and log it: the Gemini lane is the default.
//
//   dispatch.mjs "<task>" [--engine gemini] [--job build|write] [--dir <folder>] [--worktree <folder>] [--read <folder>]... [--model <alias>] [--write] [--headless|--pane|--window]
//
// Where the job runs (T-177, Todd 2026-09-24: "get them in a place where I have some
// visibility into what they're doing"). By default, for either engine, the job is typed into
// its sidekick's visible herdr pane (lib/desk-pane.mjs, agent `herdr-<lane>` or the pane
// labelled `<Name> (<lane>)`), so it streams where Todd can watch. An idle cursor/agy agent
// pane takes the job as a prompt telling it to run the inner command; headless is the
// fallback when no pane is available. A busy or prompting sidekick pane is refused (T-510): no
// keystrokes, a reply file in the sending desk's inbox naming the pane and why, exit
// non-zero. A missing herdr pane still falls back to headless and says so on stderr.
// `--pane` asks for the pane explicitly; `--headless` opts out and runs the job in this process
// with nothing on screen, which is also what the typed inner command uses so it never
// loops back here. The inner run is the ordinary one: same log in <lane>/jobs/, same CLAUDE_*
// scrub, same quarantine. --dir and --read are checked before any of that (a folder outside
// ~/slopdog is refused on exit 2 with nothing typed). This outer process waits for that job file and exits with the
// job's exit code, so a background Bash caller still wakes on exit exactly as it does
// headless. `--window` is the Mac-only Ghostty equivalent and exits 2 elsewhere.
// Exception: a --write job on composer, grok or agy never goes to a pane; it always runs
// headless as this process's child (T-490-1 follow-up), and one that shows an approval prompt
// or goes silent for 300s is killed with an `APPROVAL/STALLED after Ns` reply.
//
// --engine gemini runs the Antigravity CLI (agy) in one of two modes, cwd always
// desks/build/sidekicks/gemini/ (T-390 fix, Todd 2026-09-26: every Gemma job, write mode included,
// launches from her own desk folder so GEMINI.md always loads — before this, --write set
// cwd to --dir/--worktree instead, and she ran with no house rules). Default: `--mode
// plan` — read-only: read, search, list, never write or run; --dir is read-only and the
// reply is the report. --write (needs --dir or --worktree): `--dangerously-skip-permissions`,
// so it edits files and runs that folder's skills and scripts unprompted — headless `-p`
// cannot answer an approval prompt. --dir/--worktree are handed to her as `--add-dir`
// folders (they no longer equal cwd, so the `folders.filter((d) => d !== E.cwd)` line below
// no longer strips them out) — that is how the task skills still find their list, by
// walking up from the folder agy was told to work in, not from cwd. The quarantine backstop
// below runs in write mode exactly as for Lu (non-markdown writes moved to
// gemini/quarantine/, tracked files restored), so a Gemini job ships markdown, not code —
// except inside `--worktree` (T-358), a path handed to a desk like Gemma's own, which is
// hers and is kept whatever it contains; the quarantine walk always scans `writeDir()`
// (--dir or --worktree), never cwd, so this was unaffected by the cwd fix. Either way the
// reply is logged to gemini/jobs/. No API key: agy
// is logged in on the machine it runs on (the gemini CLI 0.59 dropped personal OAuth and the
// key's project is out of quota, 2026-09-10). When agy is not installed the engine says
// "agy missing" and exits 2 instead of failing on a dead key. Built 2026-09-08 for #g102,
// driving desks/build/sidekicks/gemini/tasks/, a copy of the tasks folder.
//
// Her inbox (T-390): she has no plugin hooks, so nothing else ever reads
// desks/build/sidekicks/gemini/inbox/ for her. Before a plain (non-ticket) gemini-lane job runs,
// dispatch.mjs itself scans that inbox for `-from-<desk>-` files (inbox-watch.mjs's own naming
// and pattern), folds their text into the job's prompt, and moves them to inbox-archive/ beside
// it. A --ticket build never folds the inbox (T-740): the brief is the ticket and nothing else.
//
import { spawn, spawnSync } from 'node:child_process'
import { mkdirSync, writeFileSync, appendFileSync, readFileSync, readdirSync, lstatSync, renameSync, existsSync, copyFileSync, realpathSync, rmSync, unlinkSync, readlinkSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir, tmpdir } from 'node:os'

import { DIR } from './session.mjs'
import {
  appendDispatchLedgerRow,
  defaultLedgerPath,
  dispatchArmForEngine,
  usageBlockFrom,
  cursorUsageBlockFrom,
  departmentForTicket,
  recordVerifyOutcome,
} from './lib/usage-ledger.mjs'
import {
  OPENROUTER_MODELS,
  resolveOpenRouterModel,
  selectNextModel,
  recordRotationOutcome,
} from './lib/openrouter-rotation.mjs'
import {
  findTicketPath,
  laneSignerName,
  markVerified,
  postJobTicketUpdate,
  preJobTicketUpdate,
  setTicketStatus,
  tyrionWakeMessage,
  voidStrike,
  workerLaneForDispatch,
} from './dispatch-ticket-updates.mjs'
import { readLanesDocument } from './lib/registry.mjs'
import { appendFenceConcern, commitTicketUpdates, fenceAllowed, fenceCheck, fenceReport } from './lib/openrouter-fence.mjs'

export {
  laneSignerName,
  postJobTicketUpdate,
  preJobTicketUpdate,
  statusEmojiFromTicketText,
  taskListRowEmoji,
  workerLaneForDispatch,
} from './dispatch-ticket-updates.mjs'
import { assertCanTypeHerdrPane, herdr, herdrAgents, herdrLanePanes, readPane, typeLine } from './lib/desk-pane.mjs'
import { laneDir } from './lib/lane-folder.mjs'
import { dispatchBudgetRefusal } from './lib/team-budget.mjs'
import { limitsPaused } from './lib/limits.mjs'
import { runDispatchMechanicalGate, writeReadinessGaps } from './dispatch-gate.mjs'
import {
  batchCapExcuse,
  batchKeyFor,
  batchesInFlightOf,
  extractPathTokens,
  isHotfix,
  pathCollisions,
} from './lib/ready-rules.mjs'
import { recordQuota, routeAroundQuota, quotaKey, quotaLine, quotaOut, killTree, appendRerouteNotes, listQuotaEntries } from './lib/engine-quota.mjs'
import { CHAIRS, chairForAgent, chairForDispatchEngine } from './lib/chairs/index.mjs'
import { loadLadder, modelFor, verifierFor, rungLabel, ticketPoints, countStrikes, builderFor, openSteps, escalationTarget, isEngineDisabled, ladderPath } from './lib/build-ladder.mjs'
// T-742: the verify brief, the one verdict parser and the verify log all come from one module.
import { verifyBrief, parseVerdict, parseVerifyLog, logIsComplete, renderVerifyLog, verdictSentence, parseRedDetails, strikeCategoryFor, redCheckCommands } from './lib/verify-brief.mjs'
// T-714: who builds, who verifies and when a ticket escalates all come from v2/config/build-ladder.json.
const LADDER = loadLadder()
// build-ticket: the one build order every builder follows; verify-fail.mjs records a failed verify.
const BUILD_TICKET_SKILL = join(homedir(), '.claude', 'skills', 'slopdog', 'session', 'build-ticket', 'SKILL.md')
const VERIFY_FAIL = join(DIR, 'plugins', 'slopdog', 'session', 'build-ticket', 'scripts', 'verify-fail.mjs')
// Gemini runs through the Antigravity CLI since 2026-09-10: the gemini CLI 0.59 dropped personal
// OAuth and the API key's project is out of quota; agy is logged in and needs no key.
// DISPATCH_AGY_BIN overrides the binary — a stub, for testing the quarantine fence without
// spending real agy quota (T-358).
const AGY = process.env.DISPATCH_AGY_BIN || join(homedir(), '.local', 'bin', 'agy')
// T-490-1: Composer and Grok are one binary, the Cursor CLI, told apart only by --model;
// `--engine agy` is accepted as Gemma's real name (Tyrion's answer on the ticket: "agy" is
// her, not a second instance) — it runs the same as `--engine gemini` always did. All three
// are unattended (--force / agy's --dangerously-skip-permissions), so a --write job on any
// of them gets its own fresh `git worktree` unless the caller already passed one (below):
// T-481 showed what an unattended job pointed straight at a shared folder like ~/slopdog
// can quarantine — another process's own files, mid-write.
const CURSOR_BIN = process.env.DISPATCH_CURSOR_BIN || join(homedir(), '.local', 'bin', 'cursor-agent')
const CURSOR_MODELS = { composer: process.env.DISPATCH_COMPOSER_MODEL || modelFor('composer', LADDER), grok: modelFor('grok', LADDER) }
const CLAUDE_BIN = process.env.DISPATCH_CLAUDE_BIN || join(homedir(), '.local', 'bin', 'claude')
function getCitadelEnv() {
  const out = {}
  try {
    const envPath = join(homedir(), '.config', 'citadel', '.env')
    if (existsSync(envPath)) {
      for (const line of readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/)
        if (m) out[m[1]] = m[2]
      }
    }
  } catch {}
  return out
}
const SIDEKICK_ENGINES = ['composer', 'grok', 'agy', 'ideas-composer', 'ideas-grok', 'openrouter', 'ideas-openrouter', 'claude']
// T-521: each dispatcher desk (`build`, `ideas`, …) owns three sidekick lanes in the registry.
function sidekickLaneKeysForOwner(ownerDesk) {
  return Object.entries(lanesData)
    .filter(([key, lane]) => key !== '_' && key !== 'seats' && lane?.owner === ownerDesk)
    .map(([key]) => key)
}
function laneServesEngine(lane, engine) {
  if (engine === 'composer') return lane.engine === 'cursor' && ((lane.model || '').includes('composer') || lane.id === 'composer')
  if (engine === 'grok') return lane.engine === 'cursor' && (lane.model || '').includes('grok')
  if (engine === 'cursor-gemini') return lane.engine === 'cursor'
  if (engine === 'gemini' || engine === 'agy') return lane.engine === 'agy'
  if (engine === 'openrouter' || engine === 'ideas-openrouter') return lane.engine === 'openrouter'
  return false
}
// T-684: a desk's department is the first two segments of its folder (desks/build for
// desks/build/tyrion, desks/ideas for desks/ideas). A sender may use a sidekick when it is
// the owner or its own folder sits in the owner's department, so LaForge and Data
// (desks/build/laforge, desks/build/data) use build's sidekicks and slack never does.
function departmentOf(laneKey) {
  const folder = lanesData[laneKey]?.folder
  return folder ? folder.split('/').slice(0, 2).join('/') : null
}
function senderMayUse(senderKey, ownerDesk) {
  if (senderKey === ownerDesk) return true
  const own = lanesData[senderKey]?.folder, dept = departmentOf(ownerDesk)
  return !!(own && dept && (own === dept || own.startsWith(dept + '/')))
}
function sidekickLaneForEngine(engine, senderKey) {
  if (!senderKey) return null
  for (const [key, lane] of Object.entries(lanesData)) {
    if (key === '_' || key === 'seats' || !lane?.owner) continue
    if (senderMayUse(senderKey, lane.owner) && laneServesEngine(lane, engine)) return key
  }
  return null
}
// The desk a sender acts for: build for LaForge, Data and Tyrion (lane key `build`, folder
// desks/build/tyrion), since their folders sit in build's department.
function ownerDeskOf(senderKey) {
  if (lanesData[senderKey]?.owner) return lanesData[senderKey].owner
  const owners = new Set(Object.values(lanesData).map((l) => l?.owner).filter(Boolean))
  return [...owners].find((o) => senderMayUse(senderKey, o)) || senderKey
}
// the registry is the only map from lane to folder. A lane it does not name has no folder:
// the caller refuses rather than creating one.
function laneFolder(laneKey) {
  const rel = lanesData[laneKey]?.folder
  if (!rel) return null
  const target = join(DIR, rel)
  if (!existsSync(target)) {
    try { mkdirSync(target, { recursive: true }) } catch {}
  }
  return existsSync(target) ? target : DIR
}
// Every folder she is handed must sit under ROOT; nothing under a secrets or harness
// config tree is ever handed to her, read or write.
const ROOT = join(homedir(), 'slopdog')
const FORBIDDEN = [join(homedir(), '.config'), join(homedir(), '.claude'), join(homedir(), '.kimi-code'), join(homedir(), '.gemini'), join(homedir(), '.ssh')]
const checkFolder = (d) => {
  const r = resolve(d)
  if (!existsSync(r)) { console.error(`dispatch: folder does not exist: ${r}`); process.exit(2) }
  // ~/slopdog is a symlink into /storage (2026-10-06), so a ~/slopdog path is
  // the same tree: compare real paths too, or a caller whose cwd resolved through the link is refused.
  const under = (p, base) => p === base || p.startsWith(base + '/')
  const real = realpathSync(r)
  if (!(under(r, ROOT) || under(real, realpathSync(ROOT)))) { console.error(`dispatch: ${r} is outside ${ROOT}; she only works under ~/slopdog`); process.exit(2) }
  if (FORBIDDEN.some((f) => under(r, f) || under(real, f))) { console.error(`dispatch: ${r} is a secrets/config tree`); process.exit(2) }
  return r
}

// T-490-1 FR-1: which desk sent this job, so a plain (non --ticket) dispatch to composer,
// grok or agy can leave its reply in that desk's own inbox/ — the same file-inbox shape
// v2/CLAUDE.md gives every desk, done by hand here since none of the three sidekicks has
// the inbox-watch.mjs hook to notice on its own. Found from the registry (keyed by folder,
// the same lookup ticket-usage.mjs already does off cwd) rather than trusted from the
// caller, since a --sender the caller made up would misdeliver the reply.
// DISPATCH_LANES_FILE points a test at a fixture registry document, never the live one.
let lanesData = {}
try { lanesData = readLanesDocument({ path: process.env.DISPATCH_LANES_FILE ? resolve(process.env.DISPATCH_LANES_FILE) : undefined, v2: DIR }) } catch { /* no registry: no sender inbox */ }
function findSenderKey(cwd) {
  const real = resolve(cwd)
  let best = null, bestLen = -1
  for (const [key, l] of Object.entries(lanesData)) {
    if (key === '_' || key === 'seats' || !l?.folder) continue
    const folder = resolve(join(DIR, l.folder))
    if ((real === folder || real.startsWith(folder + '/')) && folder.length > bestLen) { best = key; bestLen = folder.length }
  }
  return best
}

// T-526: git check-ignore runs before the mtime, worktree, and extension checks.
// Exit 0 means git is ignoring the path (.data/, .next, test-results — a live
// service's database) and the file is left where it is. Markdown stays.
// 2026-10-11 (Process Versus Direct report 3.1): the quarantine only ever moves a file the job
// itself created. A file that is git-tracked is never touched (the old `git checkout --` restore
// destroyed another desk's uncommitted edits to tracked files), and neither is a file that
// already existed before the job started (`baseline`, from snapshotFiles): its mtime moving
// proves only that somebody wrote it, not that the job did. Without a baseline, every
// untracked file is judged by mtime alone, as before.
// 2026-10-12 (quick task comms-worktree-real-app): a worktree gets node_modules as a hardlink copy
// of the main checkout's (`cp -al`), never a symlink. Turbopack's `next dev` refuses a node_modules
// symlink that points outside the worktree ("points out of the filesystem root"), which kept T-747's
// builder from running the real app. A symlink already there (a resumed build) is replaced the same
// way; a real folder is left alone. CAVEAT: the hardlinked files are the same inodes as main's, so
// an in-place write under the worktree's node_modules changes main's copy too. A worktree never runs
// npm install; a ticket that needs a new dependency adds it on main. Off one filesystem `cp -al`
// fails, and a plain `cp -a` copy is the fallback. Returns what it did, for the test.
export function provisionNodeModules(repoRoot, wtPath) {
  const src = join(repoRoot, 'node_modules')
  const dst = join(wtPath, 'node_modules')
  if (!existsSync(src)) return 'none'
  let st = null
  try { st = lstatSync(dst) } catch {}
  if (st && !st.isSymbolicLink()) return 'kept'
  if (st) unlinkSync(dst)
  if (spawnSync('cp', ['-al', src, dst]).status === 0) return 'hardlinked'
  rmSync(dst, { recursive: true, force: true })
  return spawnSync('cp', ['-a', src, dst]).status === 0 ? 'copied' : 'failed'
}

// 2026-10-12 (quick task comms-worktree-real-app): the uncommitted-work sweep stages everything
// except node_modules (any depth) and any symlink that points outside the worktree. On T-747
// (1e736a4) it staged the worktree's node_modules symlink, because comms' `.gitignore` said
// `node_modules/` and a trailing-slash pattern does not match a link; merging that would have
// replaced main's node_modules with a link to itself. Returns the paths it unstaged.
export function stageWorktreeWork(wt) {
  spawnSync('git', ['-C', wt, 'add', '-A'])
  const names = (spawnSync('git', ['-C', wt, 'diff', '--cached', '--name-only', '--diff-filter=AMT', '-z'], { encoding: 'utf8' }).stdout || '').split('\0').filter(Boolean)
  const root = resolve(wt)
  const bad = names.filter((n) => {
    if (n.split('/').includes('node_modules')) return true
    try {
      if (!lstatSync(join(wt, n)).isSymbolicLink()) return false
      const to = resolve(dirname(join(root, n)), readlinkSync(join(wt, n)))
      return to !== root && !to.startsWith(root + '/')
    } catch { return false }
  })
  if (bad.length) spawnSync('git', ['-C', wt, 'reset', '-q', '--', ...bad])
  return bad
}

export function snapshotFiles(root) {
  const seen = new Set()
  const walk = (d) => {
    let names
    try { names = readdirSync(d) } catch { return }
    for (const f of names) {
      if (f === 'node_modules' || f === '.git') continue
      const p = join(d, f)
      let st
      try { st = lstatSync(p) } catch { continue }
      if (st.isSymbolicLink()) continue
      st.isDirectory() ? walk(p) : seen.add(p)
    }
  }
  walk(root)
  return seen
}

// Uncommitted paths (modified, staged, deleted, untracked and not ignored) under `dir`, as absolute
// paths, minus anything under `except`. A --write build refuses to start when this is not empty:
// the checkout belongs to every desk working in it, and a dispatch that ran in it and then timed
// out is how Data's T-675 work and a finished T-709 build were lost (2026-10-11). Not a git repo
// gives [] (nothing to protect).
export function uncommittedPaths(dir, except = null) {
  const top = spawnSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim()
  if (!top) return []
  const out = spawnSync('git', ['-C', dir, 'status', '--porcelain=v1', '-z', '--', '.'], { encoding: 'utf8' }).stdout || ''
  const paths = []
  const parts = out.split('\0').filter(Boolean)
  for (let i = 0; i < parts.length; i++) {
    const code = parts[i].slice(0, 2)
    paths.push(join(top, parts[i].slice(3)))
    if (code[0] === 'R' || code[0] === 'C') i++   // a rename lists its source as a second entry
  }
  return except ? paths.filter((p) => p !== except && !p.startsWith(except + '/')) : paths
}

export function quarantineTouchedFiles({ root, quarantineDir, sinceMs, inWorktree = () => false, baseline = null }) {
  const gitIgnored = (p) => spawnSync('git', ['check-ignore', '-q', '--', p], { cwd: dirname(p), stdio: 'ignore' }).status === 0
  const walk = (d, out = []) => {
    for (const f of readdirSync(d)) {
      if (f === 'node_modules' || f === '.git') continue
      const p = join(d, f); const st = lstatSync(p)
      if (st.isSymbolicLink()) continue
      st.isDirectory() ? walk(p, out) : out.push({ p, m: st.mtimeMs })
    }
    return out
  }
  const moved = []
  for (const { p, m } of walk(root)) {
    if (baseline && baseline.has(p)) continue
    if (gitIgnored(p)) continue
    if (m < sinceMs || inWorktree(p) || /\.(md|markdown)$/i.test(p)) continue
    const tracked = spawnSync('git', ['ls-files', '--error-unmatch', p], { cwd: dirname(p), stdio: 'ignore' }).status === 0
    if (tracked) continue
    mkdirSync(quarantineDir, { recursive: true })
    const to = join(quarantineDir, `${Date.now()}-${p.split('/').pop()}`)
    copyFileSync(p, to)
    renameSync(p, to)
    moved.push(`${p} → ${to}`)
  }
  return moved
}

// T-714: strikes are counted by lib/build-ladder.mjs (countStrikes), from any builder.
function progressNotesBody(ticketText) {
  const lines = ticketText.split('\n')
  const start = lines.findIndex((l) => l === '## Progress notes')
  if (start === -1) return ''
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { end = i; break }
  }
  return lines.slice(start + 1, end).join('\n')
}
function ticketAlreadyPromotedToRingTwo(ticketText) {
  if (/^worker:\s*sonnet-cursor\s*$/m.test(ticketText)) return true
  return /promoted to ring two/i.test(progressNotesBody(ticketText))
}
const CURSOR_CHAT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function readCursorChat(text) {
  const fm = String(text || '').match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return null
  const block = fm[1].match(/^cursor_chat:\s*\n((?:[ \t]+[^\n]*\n?)*)/m)
  if (!block) return null
  const field = (k) => {
    const m = block[1].match(new RegExp(`^\\s*${k}:\\s*"?([^"\\n]*?)"?\\s*$`, 'm'))
    return m ? m[1].trim() : ''
  }
  const id = field('id')
  if (!CURSOR_CHAT_ID.test(id)) return null
  return { id, lane: field('lane'), model: field('model'), ring: field('ring') }
}

export function writeCursorChat(text, rec) {
  const block = ['cursor_chat:', `  id: ${rec.id}`, `  lane: ${rec.lane}`, `  model: ${rec.model}`, `  ring: ${rec.ring}`].join('\n')
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n/)
  if (!fm) throw new Error('ticket has no front matter')
  const body = fm[1].replace(/^cursor_chat:\s*\n(?:[ \t]+[^\n]*\n?)*/m, '').replace(/\n+$/, '')
  return text.replace(fm[0], `---\n${body}\n${block}\n---\n`)
}

export function cursorChatRing(text) {
  return ticketAlreadyPromotedToRingTwo(text) ? 'ring two' : 'ring one'
}

export function cursorChatSame(stored, identity) {
  return !!(stored && stored.id && stored.lane === identity.lane && stored.model === identity.model && stored.ring === identity.ring)
}

export function cursorRetryFailureText(text) {
  const lines = progressNotesBody(text).split('\n').map((l) => l.trim()).filter((l) => /^- /.test(l))
  for (let i = lines.length - 1; i >= 0; i--) {
    if (!/verify failed|stopped:/i.test(lines[i])) continue
    const m = lines[i].match(/^-\s+\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}\s+·\s+[^·]+·\s+(.*)$/)
    return (m ? m[1] : lines[i]).trim()
  }
  return ''
}

// --resume always carries the chat id. A bare resume and the most-recent-chat flag are not produced.
export function cursorLaunchArgs({ prompt, folders, cwd, model, resumeId }) {
  const args = ['-p', prompt, '--force', '--trust', '--model', model, '--output-format', 'stream-json']
  if (resumeId) args.push('--resume', resumeId)
  for (const d of folders || []) if (d !== cwd) args.push('--add-dir', d)
  return args
}
function escalationLedgerPath() {
  return process.env.DISPATCH_ESCALATION_LEDGER || join(DIR, 'escalation-ledger.jsonl')
}
const RING_TWO_FM = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
function setFrontMatterScalar(text, key, rawValue) {
  const m = text.match(RING_TWO_FM)
  if (!m) throw new Error('ticket has no front matter')
  const re = new RegExp(`^${key}:`)
  const lines = m[1].split('\n')
  const i = lines.findIndex((l) => re.test(l))
  const line = `${key}: ${rawValue}`
  if (i === -1) lines.push(line)
  else lines[i] = line
  return text.replace(m[0], `---\n${lines.join('\n')}\n---\n`)
}
function appendProgressNote(text, line) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => l === '## Progress notes')
  if (start === -1) return `${text.replace(/\s+$/, '')}\n\n## Progress notes\n\n${line}\n`
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^## /.test(lines[i])) { end = i; break }
  }
  let last = start
  for (let i = start + 1; i < end; i++) { if (lines[i].trim() !== '') last = i }
  const insert = last === start ? ['', line] : [line]
  lines.splice(last + 1, 0, ...insert)
  return lines.join('\n')
}
// T-714: after escalate_after_failures strikes the ticket goes to the config's escalation rung
// (Opus solo on the data lane today). Recorded once per ticket: a front-matter stamp, a Progress
// note and one escalation-ledger row.
function escalatedAlready(ticketText) {
  return /escalated to /i.test(progressNotesBody(ticketText))
}
function recordEscalation({ ticketPath, ticketText, strikes, reason }) {
  const target = escalationTarget(LADDER)
  const label = `${rungLabel(target)} ${target.mode}`
  const tid = (ticketText.match(/^id:\s*"?([\w-]+)/m) || [])[1] || 'ticket'
  const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
  let text = setFrontMatterScalar(ticketText, 'worker', target.lane)
  text = appendProgressNote(text, `- ${stamp} · Tyrion · escalated to ${label} (${target.lane}) after ${reason}; steps: ${target.steps.join(', ')}.`)
  writeFileSync(ticketPath, text)
  const ledger = escalationLedgerPath()
  mkdirSync(dirname(ledger), { recursive: true })
  appendFileSync(ledger, `${JSON.stringify({ ticket_id: tid, from_ring: 'builder', to_ring: label, reason, correction_rounds: strikes })}\n`)
  console.error(`Log: escalated ${JSON.stringify({ ticket_id: tid, to: label, lane: target.lane, strikes })}`)
}

export { countStrikes }

// T-740: GREEN merges the build branch to main without risking the shared tree. main is merged into
// the branch inside the build's own worktree first, so a conflict happens (and is aborted) there;
// then main fast-forwards to the branch, which never conflicts and refuses rather than overwrite a
// file another desk has uncommitted. Either refusal returns { ok: false, why } and the caller falls
// back to a ready-to-merge note. The auto-fenced worktree and its branch are removed once merged.
// T-741 row 13: when merging main changed the branch, the merged code was never verified, so
// `recheck` (the ticket's Red-check commands, run in the worktree) must pass before main moves.
export function mergeBuildToMain({ buildDir, branch, removeWorktree = true, recheck = null }) {
  const g = (cwd, ...a) => spawnSync('git', ['-C', cwd, ...a], { encoding: 'utf8' })
  const common = g(buildDir, 'rev-parse', '--path-format=absolute', '--git-common-dir').stdout.trim()
  if (!common) return { ok: false, why: `${buildDir} is not a git checkout` }
  const repoRoot = dirname(common)
  const head = g(repoRoot, 'symbolic-ref', '--short', 'HEAD').stdout.trim()
  if (head !== 'main') return { ok: false, why: `${repoRoot} has ${head || 'a detached HEAD'} checked out, not main` }
  const before = g(buildDir, 'rev-parse', 'HEAD').stdout.trim()
  if (g(buildDir, 'merge', '--no-edit', 'main').status !== 0) {
    g(buildDir, 'merge', '--abort')
    return { ok: false, why: `merging main into ${branch} conflicts` }
  }
  if (recheck && g(buildDir, 'rev-parse', 'HEAD').stdout.trim() !== before) {
    const re = recheck(buildDir)
    if (!re.ok) return { ok: false, why: `after merging main into ${branch}, ${re.why}` }
  }
  const ff = g(repoRoot, 'merge', '--ff-only', branch)
  if (ff.status !== 0) return { ok: false, why: `main would not fast-forward to ${branch}: ${(ff.stderr || '').trim().split('\n')[0]}` }
  const sha = g(repoRoot, 'rev-parse', '--short', 'HEAD').stdout.trim()
  const pushed = g(repoRoot, 'push', '-q', 'origin', 'main').status === 0
  if (removeWorktree) {
    g(repoRoot, 'worktree', 'remove', buildDir)
    g(repoRoot, 'branch', '-d', branch)
  }
  return { ok: true, sha, pushed }
}

/** T-741 row 13: run a ticket's Red-check commands in a checkout; the first failure names its command. */
export function runRedChecks(ticketText, cwd, { timeoutSec = Number(process.env.DISPATCH_RECHECK_TIMEOUT_SEC || 600) } = {}) {
  for (const { ac, cmd } of redCheckCommands(ticketText)) {
    const r = spawnSync('sh', ['-c', cmd], { cwd, encoding: 'utf8', timeout: timeoutSec * 1000, killSignal: 'SIGKILL' })
    if (r.status !== 0) return { ok: false, why: `${ac}'s Red-check failed: ${cmd}` }
  }
  return { ok: true }
}

// T-701: a ticket batch matches a focus tag when the stems are the same. set-focus writes
// `B<stem>` (`B2a-rings-and-builders`); ticket front matter stores the stem (`2a-rings-and-builders`).
function batchStem(tag) {
  return String(tag).trim().replace(/^['"]|['"]$/g, '').replace(/^B(?=\d)/, '')
}

export function readFocusBatches(contextText) {
  if (!contextText) return []
  const lines = String(contextText).split('\n')
  const at = lines.findIndex((l) => /^focus_batches:/.test(l))
  if (at === -1) return []
  const inline = lines[at].match(/^focus_batches:\s*(.*)$/)?.[1]?.trim() ?? ''
  if (inline === '[]') return []
  if (inline.startsWith('[')) {
    return inline.replace(/^\[|\]$/g, '').split(',').map((s) => s.trim().replace(/^['"]|['"]$/g, '')).filter(Boolean)
  }
  const items = []
  for (let i = at + 1; i < lines.length; i++) {
    const m = lines[i].match(/^\s+-\s+(\S+)/)
    if (m) { items.push(m[1].replace(/^['"]|['"]$/g, '')); continue }
    if (lines[i].trim() === '' || lines[i].trim().startsWith('#')) continue
    break
  }
  return items
}

// Empty or missing focus list, no ticket text, no batch, and hotfix: true all pass.
// A miss returns one line naming the ticket's batch and the focus batches.
export function checkFocusBatchGate({ ticketText, focusBatches } = {}) {
  if (!Array.isArray(focusBatches) || focusBatches.length === 0) return { ok: true }
  if (!ticketText || typeof ticketText !== 'string') return { ok: true }
  const fm = ticketText.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return { ok: true }
  const batch = fm[1].match(/^batch:\s*["']?([^"'#\n]+?)["']?\s*$/m)?.[1]?.trim()
  if (!batch) return { ok: true }
  if (isHotfix(ticketText)) return { ok: true }
  if (focusBatches.some((tag) => batchStem(tag) === batchStem(batch))) return { ok: true }
  return { ok: false, reason: `dispatch: batch ${batch} is not in focus batches ${focusBatches.join(', ')}` }
}

// Importing this file (the unit test) must not start a job. The runner below is
// the direct `node dispatch.mjs` invocation only.
// realpath both sides: ~/slopdog is a symlink into /storage, and import.meta.url is always the
// resolved path, so a plain resolve() never matched and every direct run exited 0 silently.
const isDirectRun = process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))
if (isDirectRun) {
const argv = process.argv.slice(2)
const USAGE = 'usage: dispatch.mjs "<task>" [--engine gemini|agy|composer|grok|ideas-composer|ideas-grok|openrouter|ideas-openrouter] [--job build|--job write] [--dir <folder>] [--worktree <folder>] [--read <folder>]... [--model <alias>] [--write] [--timeout <sec>] [--headless|--pane|--window] [--dry-run] [--force] [--quota] [--ticket <id>] [--ticket-path <file>]'
if (argv.includes('--help') || argv.includes('-h')) { console.log(USAGE); process.exit(0) }
// Everything after a `--` is task text, never options. Without this, an option scan that
// uses indexOf finds `--dir` or `--window` ANYWHERE in the argv — including inside a task
// string relayed from a Slack message — and silently consumes it plus the word after it.
// Callers passing untrusted text must send it after `--`; callers that don't are unchanged.
const sepAt = argv.indexOf('--')
const args = sepAt === -1 ? [...argv] : argv.slice(0, sepAt)
const literal = sepAt === -1 ? [] : argv.slice(sepAt + 1)
const opt = (name) => { const i = args.indexOf(name); return i === -1 ? null : args.splice(i, 2)[1] }
const opts = (name) => { const out = []; for (let v; (v = opt(name)) !== null;) out.push(v); return out }
const flag = (name) => { const i = args.indexOf(name); if (i === -1) return false; args.splice(i, 1); return true }
const window = flag('--window')
const paneAsked = flag('--pane')
const headless = flag('--headless')
// T-552: --dry-run prints the brief a builder would receive and exits 0 without starting
// a builder, so the brief can be read and unit-tested before any engine is touched.
const dryRun = flag('--dry-run')
const quotaReport = flag('--quota')
if (quotaReport) {
  for (const row of listQuotaEntries()) console.log(`${row.key}\t${row.status}\t${row.resetAt}`)
  process.exit(0)
}
// T-742: `--void-strike <T-id|ticket path> --reason "<why>"` takes back the ticket's latest strike (a RED
// the ticket's own cut caused) so it no longer counts toward escalation. It runs no job, so the sprint stop
// and the gates do not apply. Refused without --reason.
const voidStrikeArg = opt('--void-strike')
if (voidStrikeArg !== null) {
  const vsReason = opt('--reason')
  const vsTasks = process.env.TASKS_DIR ? resolve(process.env.TASKS_DIR) : join(ROOT, 'tasks')
  const vsPath = existsSync(resolve(voidStrikeArg)) ? resolve(voidStrikeArg) : findTicketPath(vsTasks, voidStrikeArg.replace(/^#/, ''))
  if (!vsPath) { console.error(`dispatch: --void-strike: no ticket found for ${voidStrikeArg}`); process.exit(2) }
  try {
    voidStrike({ ticketPath: vsPath, who: opt('--sender') || 'Tyrion', reason: vsReason })
  } catch (e) { console.error(`dispatch: --void-strike: ${e.message}`); process.exit(2) }
  console.log(`dispatch: voided the latest strike on ${vsPath}`)
  process.exit(0)
}
// T-663-2: override the gate's numbered refusals and leave one Progress note. Stale assumptions stay refused.
const force = flag('--force')
// T-729: the Watcher's weekly-usage stop is a gate. While SPRINT-STOP exists no job starts: a hotfix
// ticket, --force and --dry-run included. Todd lifts it by typing "lift stop" into a desk pane.
// While the limits switch is paused (v2/LIMITS-OFF, scripts/limits-toggle.mjs) this refusal and the
// team-budget one are skipped; the maxConcurrentBuilders cap below still holds, since it guards memory.
const SPRINT_STOP = process.env.SLOPDOG_SPRINT_STOP_FILE || join(homedir(), 'slopdog/v2/desks/watcher/SPRINT-STOP')
if (!limitsPaused() && existsSync(SPRINT_STOP)) { console.error(`dispatch: refused, the Watcher stopped the sprint at the weekly usage cap (${SPRINT_STOP} exists); Todd lifts it by typing "lift stop" in a desk pane.`); process.exit(2) }
// 2026-10-11 memory ceiling (Todd approved, Process Versus Direct report 3.1): 32 OOM kills in under three
// hours with swap full coincided with every stall. A write job refuses to start while this many other write
// jobs already run, so the builders never outgrow the machine. The cap is `maxConcurrentBuilders` in the
// Watcher's sprint-watch.json (default 3); SLOPDOG_MAX_BUILDERS overrides it; --dry-run is never counted.
if (args.includes('--write') && !dryRun) {   // args.includes, not flag(): flag() splices the argument out, which made every later --write read false
  let cap = Number(process.env.SLOPDOG_MAX_BUILDERS)
  if (!cap) { try { cap = Number(JSON.parse(readFileSync(join(homedir(), 'slopdog/v2/desks/watcher/sprint-watch.json'), 'utf8')).maxConcurrentBuilders) } catch { /* no file: default */ } }
  if (!cap) cap = 3
  let running = 0
  try {
    running = String(spawnSync('ps', ['-eo', 'pid=,args='], { encoding: 'utf8' }).stdout || '').split('\n')
      // DISPATCH_PARENT_PIDS: a correction round is a child of the dispatch that verified RED, which still holds its slot.
      .filter((l) => /^\s*\d+\s+\S*node\s+\S*dispatch\.mjs\b.*--write\b/.test(l) && ![String(process.pid), ...String(process.env.DISPATCH_PARENT_PIDS || '').split(',')].includes(l.trim().split(/\s+/)[0])).length
  } catch { /* ps unavailable: do not block */ }
  if (running >= cap) { console.error(`dispatch: refused, ${running} write jobs already run (cap ${cap}, maxConcurrentBuilders in desks/watcher/sprint-watch.json); try again when one finishes`); process.exit(75) }
}
// T-708: opt out of auto-verify after build
const noAutoVerify = flag('--no-auto-verify')
// T-677: --job write selects a writing preamble and skips build ticket lifecycle mutations;
// omitted or --job build keeps today's build brief and pre/post ticket updates.
const jobKind = opt('--job') || 'build'
if (!['build', 'write'].includes(jobKind)) { console.error(`dispatch: unknown --job ${jobKind} (build|write)`); process.exit(2) }
// --sender is internal: the outer process (whose cwd is the real caller's) sets it so the
// inner headless run it types into a sidekick pane — cwd now that pane's lane folder, not the
// caller's — still knows who to reply to.
let senderKey = opt('--sender') || findSenderKey(process.cwd())
// T-359: dispatch.mjs --ticket T-nnn carries a ticket built by Gemma along the board itself,
// rather than trusting her reply to say so (T-055 showed a rule enforced by a field is not
// enforced): 🟡 before the job, 🔍 (or 🔴, or a board question) after it, and a report left in
// Tyrion's inbox either way. TASKS_DIR/DISPATCH_INBOX_DIR are overridable so a test runs
// against a scratch copy of the tasks folder and a scratch inbox, never the live board or
// Tyrion's real one. DISPATCH_SIDEKICK_INBOX_DIR overrides the lane inbox readGemmaInbox()
// scans before a job (composer/grok/agy), so a test never moves files out of a live sidekick
// inbox. --ticket always runs headless (below) — it is driven by a script, not
// watched in a pane — and the timeout is dispatch's own kill, since a hung stub or a hung agy
// must still land the ticket on 🔴 rather than hang the caller.
const ticketId = (opt('--ticket') || '').replace(/^#/, '').trim()
// --ticket only resolves an id under TASKS_DIR/tickets. --ticket-path points at a ticket
// file directly so a test can dry-run a fixture that is not on the live board.
const ticketPathArg = opt('--ticket-path')
const timeoutSec = Number(opt('--timeout') || 1200)
const TASKS_DIR = process.env.TASKS_DIR ? resolve(process.env.TASKS_DIR) : join(ROOT, 'tasks')
const INBOX_DIR = process.env.DISPATCH_INBOX_DIR ? resolve(process.env.DISPATCH_INBOX_DIR) : join(laneDir('build', { lanes: lanesData, v2: DIR }) || DIR, 'inbox')
// T-363: Gemma's own ledger row, appended straight from agy's `usage` reply — never from a
// transcript scan (ticket-usage.mjs's method, which is LaForge-only and reads the wrong
// source for her). DISPATCH_LEDGER_PATH overrides it so a test never touches the real ledger.
const LEDGER_PATH = process.env.DISPATCH_LEDGER_PATH ? resolve(process.env.DISPATCH_LEDGER_PATH) : defaultLedgerPath(DIR)
const PRICES_PATH = join(DIR, 'reports', 'usage', 'prices.json')
// In view unless told otherwise: the sidekick pane is the default, --headless the opt-out.
// A --ticket job is never typed into a pane — it runs here so this process can act on the
// ticket once it closes.
// (`pane` itself is decided below, once --engine and --write are read.)
// The same job, re-run headless in another tty: `--headless` goes before any `--`, or it
// would be read as task text.
const innerArgv = (drop) => {
  const a = argv.filter((x) => x !== drop)
  const extra = senderKey && !a.includes('--sender') ? ['--sender', senderKey] : []
  const i = a.indexOf('--')
  return i === -1 ? [...a, '--headless', ...extra] : [...a.slice(0, i), '--headless', ...extra, ...a.slice(i)]
}
let dir = opt('--dir'); let worktree = opt('--worktree'); const reads = opts('--read')
if (!senderKey && dir) {
  const deskPath = resolve(dir.startsWith('/') ? dir : join(DIR, dir))
  if (existsSync(deskPath)) senderKey = findSenderKey(deskPath)
}
// Todd, 2026-10-12: a ticket builds on the rung builders_by_points gives its points (Claude Sonnet),
// and a dispatch with no ticket keeps the ladder's single `builder`. --engine still wins. A ticket the
// ladder escalates (8 points, two strikes) keeps the old default here; it exits to Data below.
const earlyTicketPath = ticketPathArg ? resolve(ticketPathArg) : (ticketId ? findTicketPath(TASKS_DIR, ticketId) : null)
const ticketBuilderRung = (() => {
  if (!earlyTicketPath || jobKind === 'write' || !existsSync(earlyTicketPath)) return null
  const r = builderFor(readFileSync(earlyTicketPath, 'utf8'), LADDER)
  return r.rung === 'builder' ? r : null
})()
let engine = opt('--engine') || ticketBuilderRung?.engine || LADDER.builder.engine
// T-714: an engine the ladder disables (Composer, T-715) is refused before anything runs.
const refuseDisabled = (e) => {
  if (!isEngineDisabled(e, LADDER)) return
  console.error(`dispatch: --engine ${e} is disabled in ${ladderPath()} (disabled_engines); the builder is ${LADDER.builder.engine}`)
  process.exit(2)
}
refuseDisabled(engine)
let quotaHops = []
const REFUSED_BUILD_ENGINES = new Set(['prototyper', 'data'])
if (REFUSED_BUILD_ENGINES.has(engine)) {
  console.error(`dispatch: --engine ${engine} is refused (that engine is not a builder on the ladder)`)
  process.exit(2)
}
// T-359: with no --model, Gemini gets a fixed default (Samwell's gemini-vs-sonnet report §4;
// Todd: medium effort for both arms) instead of whatever agy itself defaults to. Composer and
// Grok get theirs from CURSOR_MODELS unconditionally (that model choice is what tells them apart).
let model = opt('--model')
if (!model && (engine === 'gemini' || engine === 'agy')) model = modelFor(engine, LADDER)
// The Claude Code builder: model and effort from the ticket's builders_by_points rung (--model / --effort override).
const claudeBuilderRung = engine === 'claude' ? (ticketBuilderRung?.engine === 'claude' ? ticketBuilderRung : LADDER.subagent_tiers.default) : null
if (engine === 'claude' && !model) model = claudeBuilderRung.model
const claudeEffort = engine === 'claude' ? (opt('--effort') || claudeBuilderRung.effort) : null
if (engine === 'ideas-composer') model = CURSOR_MODELS.composer
if (engine === 'ideas-grok') model = CURSOR_MODELS.grok
if (CURSOR_MODELS[engine]) model = CURSOR_MODELS[engine]
if (engine === 'cursor-gemini' && !model) model = modelFor('cursor-gemini', LADDER)
if (engine === 'openrouter' || engine === 'ideas-openrouter') {
  model = model ? resolveOpenRouterModel(model) : selectNextModel({ statePath: process.env.DISPATCH_OPENROUTER_STATE_PATH })
}
// T-710: skip only exhausted provider:model keys; build uses composer→grok, verify uses cursor flash→agy.
{
  const quotaRole = process.env.DISPATCH_QUOTA_ROLE || (engine === 'cursor-gemini' ? 'verify' : 'build')
  if (engine === 'claude') {
    // No fall-over: an out-of-quota Claude builder stops rather than becoming another builder.
    if (!dryRun && quotaOut(quotaKey(engine, model), { statePath: process.env.DISPATCH_QUOTA_STATE_PATH })) {
      console.error(`dispatch: claude ${model} is out of quota; not swapping builders (see quota_chains in ${ladderPath()})`)
      process.exit(1)
    }
  } else {
    const routed = routeAroundQuota(engine, model, { role: quotaRole })
    engine = routed.engine
    model = routed.model
    quotaHops = routed.hops
  }
  refuseDisabled(engine)
}
const write = flag('--write')
// A --write job on composer, grok or agy is never typed into a pane either (T-490-1 follow-up,
// 2026-09-27): LaForge's --write dispatches of T-352/T-353 were typed into the live sidekick
// panes and sat 18 minutes at cursor-agent's "Run Everything / Skip" approval menu, with no
// child process and no commit. An unattended write runs here, headless, as this process's own
// child, with the engine's non-interactive flags and the stall watchdog below.
const pane = !ticketId && !(write && SIDEKICK_ENGINES.includes(engine)) && (paneAsked || (!headless && !window))
if (!['gemini', 'agy', 'composer', 'grok', 'ideas-composer', 'ideas-grok', 'openrouter', 'ideas-openrouter', 'cursor-gemini', 'claude'].includes(engine)) { console.error(`dispatch: unknown --engine ${engine} (gemini|agy|composer|grok|ideas-composer|ideas-grok|openrouter|ideas-openrouter|cursor-gemini|claude)`); process.exit(2) }

// T-521/T-684: map the engine to a sidekick lane the sending desk owns (its own, or its
// department's). A sender that owns no lane for the engine is refused, gemini/agy included;
// nothing falls through to another desk's lanes. An unknown sender (a manual run outside any
// desk folder) gets build's lane. An ideas-* engine names its lane outright.
let sidekickLaneKey = null
const refuseOwner = (msg) => {
  console.error(`dispatch: ${msg}`)
  if (!dryRun) writeSenderInboxFile({ engineTag: engine, resultText: msg, timedOut: false, stalled: false, code: 1 })
  process.exit(1)
}
if (engine === 'ideas-composer' || engine === 'ideas-grok' || engine === 'ideas-openrouter') {
  sidekickLaneKey = engine
  const owner = lanesData[engine]?.owner
  if (!lanesData[engine]?.folder) refuseOwner(`no ${engine} lane in the registry`)
  if (senderKey && owner && !senderMayUse(senderKey, owner)) refuseOwner(`ownership mismatch: the ${engine} sidekick is owned by ${owner}, not ${senderKey}`)
} else if (engine !== 'claude') {
  const desk = senderKey ? ownerDeskOf(senderKey) : 'build'
  sidekickLaneKey = sidekickLaneForEngine(engine, senderKey || 'build')
  if (!sidekickLaneKey) {
    const name = chairForDispatchEngine(engine)?.sidekickDir(engine) ?? engine   // agy lanes live in sidekicks/gemini/
    refuseOwner(`desk ${desk} owns no ${name} sidekick: add a lane with owner: ${desk} and folder desks/${desk}/sidekicks/${name} to the registry`)
  }
}
// AC-4: say which lane and folder the job goes to, dry run included.
if (sidekickLaneKey) console.error(`dispatch-routed lane=${sidekickLaneKey} folder=${lanesData[sidekickLaneKey].folder}`)
// The Claude Code builder has no sidekick lane of its own: it commits as `build` (a lane key the
// commit hook accepts) and signs its notes "Claude <model>" so a reader sees who built it.
let recordLaneKey = engine === 'claude' ? 'build' : workerLaneForDispatch(engine, sidekickLaneKey)
let recordSignerName = engine === 'claude' ? `Claude ${model}` : laneSignerName(recordLaneKey, lanesData)
const ticketDoneInboxDir = () => {
  if (process.env.DISPATCH_INBOX_DIR) return resolve(process.env.DISPATCH_INBOX_DIR)
  const senderFolder = senderKey && senderKey !== 'build' && sidekickLaneKeysForOwner(senderKey).length > 0 ? laneFolder(senderKey) : null
  if (senderFolder) return join(senderFolder, 'inbox')
  return INBOX_DIR
}
// --ticket: the ticket file itself supplies the task when none was typed — read it, do its
// Steps, reply; a question goes on a "QUESTION:" line so this process can lift it onto the
// board in the T-168 shape.
let ticketPath = null
if (ticketPathArg) {
  ticketPath = resolve(ticketPathArg)
  if (!existsSync(ticketPath)) { console.error(`dispatch: no ticket at ${ticketPath}`); process.exit(2) }
} else if (ticketId) {
  ticketPath = findTicketPath(TASKS_DIR, ticketId)
  if (!ticketPath) { console.error(`dispatch: no ticket ${ticketId} under ${TASKS_DIR}/tickets`); process.exit(2) }
}
const ticketText = ticketPath && existsSync(ticketPath) ? readFileSync(ticketPath, 'utf8') : ''
function ticketVerifier(text) {
  const m = text.match(/^verifier:\s*"?([^"\n]+)"?\s*$/m)
  return m ? m[1].trim() : ''
}
if (ticketText && REFUSED_BUILD_ENGINES.has(ticketVerifier(ticketText))) {
  console.error(`dispatch: ticket verifier ${ticketVerifier(ticketText)} is refused (the verifier comes from ${ladderPath()})`)
  process.exit(2)
}
// T-701: a job with no ticket never gets here.
// An empty or missing focus_batches list is no gate. hotfix: true and a ticket with no batch pass.
if (ticketPath && ticketText) {
  const contextPath = join(DIR, 'context.yaml')
  const focusBatches = existsSync(contextPath) ? readFocusBatches(readFileSync(contextPath, 'utf8')) : []
  const focusGate = checkFocusBatchGate({ ticketText, focusBatches })
  if (!focusGate.ok) {
    console.error(focusGate.reason)
    process.exit(2)
  }
}
// T-685: the assumption-sweep sentence, unchanged. js-yaml is loaded lazily and any parse
// failure falls back to a plain-text read of the key, so a missing module or odd front matter
// never stops dispatch for tickets that carry no flag. --force does not override this.
async function staleAssumptionMessage(text, fallbackId) {
  const fmBlock = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fmBlock) return null
  let fm = null
  try { fm = (await import('js-yaml')).default.load(fmBlock[1]) || {} } catch { fm = null }
  if (!fm || typeof fm !== 'object') {
    const block = fmBlock[1].match(/^stale_assumptions:[ \t]*(.*)\n?((?:[ \t]+-.*\n?)*)/m)
    const inline = block?.[1]?.replace(/[[\]'"]/g, '').split(',').map((x) => x.trim()).filter(Boolean) || []
    const listed = block?.[2]?.split('\n').map((l) => l.replace(/^\s*-\s*/, '').replace(/['"]/g, '').trim()).filter(Boolean) || []
    fm = { id: fmBlock[1].match(/^id:\s*(\S+)/m)?.[1], stale_assumptions: [...inline, ...listed] }
  }
  const stale = fm.stale_assumptions
  const staleIds = Array.isArray(stale) ? stale.filter(Boolean).map(String) : stale ? [String(stale)] : []
  if (!staleIds.length) return null
  const tid = fm.id || fallbackId || 'unknown'
  const clearCmd = staleIds.map((aid) => `node ~/slopdog/v2/scripts/assumption-sweep.mjs --clear ${tid} ${aid}`).join('; then ')
  return `dispatch: ${tid} has stale assumptions ${staleIds.join(', ')}; re-check it against ~/slopdog/tasks/assumptions.jsonl, then ${clearCmd}`
}

// Marks come from the same #T row shape ready-queue.mjs uses, so the cap and the collision
// warning see the board the queue sees.
function markedBoard(tasksDir) {
  const listPath = join(tasksDir, 'task-list.md')
  const list = existsSync(listPath) ? readFileSync(listPath, 'utf8').split('\n') : []
  const rows = new Map()
  const listOrder = new Map()
  for (let i = 0; i < list.length; i++) {
    const m = list[i].match(/^\|\s*(\S+)\s*\|\s*\[([^\]]+)\][^|]*#T(\S+?)[\s#]/)
    if (!m) continue
    rows.set(`T-${m[3]}`, m[1])
    listOrder.set(`T-${m[3]}`, i)
  }
  const ticketsDir = join(tasksDir, 'tickets')
  const tickets = []
  if (!existsSync(ticketsDir)) return { tickets, listOrder }
  const fm = (text, key) => (text.match(new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n]+)`, 'm')) || [])[1]?.trim()
  for (const f of readdirSync(ticketsDir)) {
    if (!f.endsWith('.md')) continue
    const text = readFileSync(join(ticketsDir, f), 'utf8')
    const id = fm(text, 'id')
    if (!id) continue
    const project = fm(text, 'project')
    const batch = fm(text, 'batch')
    tickets.push({
      id, text,
      mark: rows.get(id) || '?',
      paused: /^paused:\s*true/m.test(text),
      project, batch,
      batchKey: batchKeyFor(project, batch),
      pathTokens: extractPathTokens(text),
      openPathTokens: extractPathTokens(text, { openOnly: true }),
    })
  }
  return { tickets, listOrder }
}

// T-663-3 warn tier. Rules: notes/Slopdog/How Slopdog Works/Dispatch Validation Heuristics.md.
// A hit prints and never refuses. A real dispatch appends one Progress note.
function backtickPaths(text) {
  const paths = []
  for (const m of text.matchAll(/`([^`]+)`/g)) {
    const raw = m[1].trim()
    if (!raw || /\s/.test(raw)) continue
    paths.push(raw)
  }
  return paths
}

function expandTicketPath(p, tasksDir) {
  const cleaned = p.replace(/\s+\(new\)$/, '').trim()
  if (cleaned.startsWith('~')) return join(homedir(), cleaned.slice(1))
  if (cleaned.startsWith('/')) return cleaned
  return join(tasksDir, cleaned)
}

function untickedStepBlocks(body) {
  const stepsBody = body.split(/^## Steps\s*$/m)[1]
  if (!stepsBody) return []
  const section = stepsBody.split(/^## /m)[0]
  const lines = section.split('\n')
  const steps = []
  let current = null
  for (const line of lines) {
    if (/^-\s*\[[ xX]\]/.test(line)) {
      if (current) steps.push(current)
      current = { text: line, extra: [], unticked: /^-\s*\[ \]/.test(line) }
    } else if (current && line.trim()) current.extra.push(line)
  }
  if (current) steps.push(current)
  return steps.filter((s) => s.unticked).map((s) => [s.text, ...s.extra].join('\n'))
}

function judgementCheck1(body, tasksDir) {
  const hits = []
  for (const block of untickedStepBlocks(body)) {
    const alreadyBuilt = /already built/i.test(block)
    for (const p of backtickPaths(block)) {
      if (!existsSync(expandTicketPath(p, tasksDir))) continue
      const escaped = p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
      const creates = new RegExp(`(?:\\badd\\b|\\bcreate\\b|\\bcreates\\b|\\bcreating\\b)\\s+\`${escaped}\``, 'i').test(block)
        && !new RegExp(`\\bto\\s+\`${escaped}\``, 'i').test(block)
      if (!alreadyBuilt && !creates) continue
      const base = p.split('/').pop()
      hits.push({ check: 1, reason: `step names ${base} and that file is already present as the step describes` })
      break
    }
  }
  return hits
}

function laneIsIdeas(laneKey, lanesData) {
  const lane = lanesData?.[laneKey]
  if (!lane) return false
  if (laneKey === 'ideas' || lane.id === 'ideas' || lane.owner === 'ideas') return true
  return String(lane.folder || '').startsWith('desks/ideas')
}

function stepWritesTicketItself(block) {
  const stripped = block
    .replace(/don'?t run\s+(?:\/)?(?:ticket-add|task-add)/gi, '')
    .replace(/do not run\s+(?:\/)?(?:ticket-add|task-add)/gi, '')
  if (/\brelay\b/i.test(block) && /\bstep\s*-?\s*0\b/i.test(block)) return false
  return /ticket-add|\/task-add|\btask-add\b/i.test(stripped)
}

function judgementCheck4(body, laneKey, lanesData) {
  if (!laneKey || laneIsIdeas(laneKey, lanesData)) return []
  const folder = lanesData?.[laneKey]?.folder || '(no folder)'
  for (const block of untickedStepBlocks(body)) {
    if (!stepWritesTicketItself(block)) continue
    return [{ check: 4, reason: `lane ${laneKey} (${folder}) is not Ideas, and a step tells it to write a ticket itself` }]
  }
  return []
}

function acCheckboxCount(body) {
  const ac = body.split(/^## Acceptance Criteria\s*$/m)[1]
  if (!ac) return 0
  const section = ac.split(/^## /m)[0]
  return (section.match(/^- \[[ xX]\] AC-\d+/gm) || []).length
}

const STATED_COUNTS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 }

function statedCount(raw) {
  const t = String(raw).toLowerCase()
  if (/^\d+$/.test(t)) return Number(t)
  return STATED_COUNTS[t] ?? null
}

function sectionCheckboxCount(body, heading, itemRe) {
  const part = body.split(new RegExp(`^## ${heading}\\s*$`, 'm'))[1]
  if (!part) return 0
  const section = part.split(/^## /m)[0]
  return (section.match(itemRe) || []).length
}

function judgementCheck8(body) {
  const ac = acCheckboxCount(body)
  for (const m of body.matchAll(/\b(\d+)\s+acceptance criteria\b/gi)) {
    const n = Number(m[1])
    if (n !== ac) return [{ check: 8, reason: `ticket says ${n} acceptance criteria but lists ${ac}` }]
  }
  const steps = sectionCheckboxCount(body, 'Steps', /^- \[[ xX]\]/gm)
  for (const m of body.matchAll(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+steps\b/gi)) {
    const n = statedCount(m[1])
    if (n != null && n !== steps) return [{ check: 8, reason: `ticket says ${m[1]} steps but lists ${steps}` }]
  }
  const frs = (body.match(/^- FR-\d+/gm) || []).length
  for (const m of body.matchAll(/\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten)\s+functional requirements\b/gi)) {
    const n = statedCount(m[1])
    if (n != null && n !== frs) return [{ check: 8, reason: `ticket says ${m[1]} functional requirements but lists ${frs}` }]
  }
  for (const m of body.matchAll(/`## ([^`]+)`/g)) {
    const name = m[1].trim()
    if (!new RegExp(`^## ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'm').test(body)) {
      return [{ check: 8, reason: `ticket names a ${name} section and that header is absent` }]
    }
  }
  return []
}

function citedPaths(body) {
  return [
    ...backtickPaths(body),
    ...(body.match(/~\/[^\s`'")]+/g) || []),
    ...(body.match(/\/home\/[^\s`'")]+/g) || []),
  ].map((p) => p.replace(/[.,;:]+$/, ''))
}

function judgementCheck9(body, tasksDir) {
  if (!/slack thread|https?:\/\/\S*slack\.com|only in (?:a |the )?conversation/i.test(body)) return []
  const existing = citedPaths(body).filter((p) => existsSync(expandTicketPath(p, tasksDir)))
  if (existing.length > 0) return []
  return [{ check: 9, reason: "ticket's only source is a Slack thread or conversation, and nothing it cites exists on disk" }]
}

function judgementWarnings({ ticketText, tasksDir, laneKey, lanesData }) {
  const body = ticketText.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
  return [
    ...judgementCheck1(body, tasksDir),
    ...judgementCheck4(body, laneKey, lanesData),
    ...judgementCheck8(body),
    ...judgementCheck9(body, tasksDir),
  ]
}

// T-663-1 refuse tier, plus T-663-2: stale assumptions, the two-batch cap (check 13; 1, 4, 8
// and 9 belong to the warn tier and 11 was the dropped collision refusal), and a collision
// warning. Dry run runs the gate and writes nothing. Rewrite jobs are not build jobs.
// Check 13 is the batch cap because every numbered check through 12 is already assigned.
// A hotfix: true ticket passes check 13 and never counts toward it (lib/ready-rules.mjs isHotfix).
const BATCH_CAP_CHECK = 13
if (ticketPath && ticketText && jobKind !== 'write') {
  const staleMsg = await staleAssumptionMessage(ticketText, ticketId)
  if (staleMsg) {
    console.error(staleMsg)
    process.exit(2)
  }
  // T-678: a department that has spent its share of the week is refused (team-shares.json).
  // TEAM_BUDGET_FIXTURE_DIR points the check at a fixture folder; todd, hotfix and unattributed tickets pass.
  const budgetRefusal = limitsPaused() ? null : dispatchBudgetRefusal({ ticketText })
  if (budgetRefusal) {
    for (const l of budgetRefusal.lines) console.error(l)
    process.exit(2)
  }
  const { tickets, listOrder } = markedBoard(TASKS_DIR)
  const id = (ticketText.match(/^id:\s*["']?([^"'\n]+)/m) || [])[1]?.trim()
  const self = tickets.find((t) => t.id === id)
  const inFlight = tickets.filter((t) => ['🟡', '🔍'].includes(t.mark) && !t.paused && t.id !== id)
  if (self) {
    for (const hit of pathCollisions(self.pathTokens, inFlight)) {
      console.error(`collision warning: ${hit.id}`)
    }
  }
  const { refused, gaps } = runDispatchMechanicalGate({ ticketPath, ticketText, tasksDir: TASKS_DIR })
  if (self) {
    const sprint = process.env.SPRINT_PROJECT || 'shaping-and-delivery'
    const batchesInFlight = batchesInFlightOf(tickets, { anyProject: false, sprint })
    const cap = batchCapExcuse(self, { batchesInFlight, tickets, tasksDir: TASKS_DIR, listOrder })
    if (cap) {
      refused.push({ check: BATCH_CAP_CHECK, reason: cap })
      gaps.push(`dispatch gate check ${BATCH_CAP_CHECK}: ${cap}`)
    }
  }
  if (refused.length && force) {
    for (const r of refused) console.error(`forced past: check ${r.check} — ${r.reason}`)
    if (!dryRun) {
      const pad = (n) => String(n).padStart(2, '0')
      const now = new Date()
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      const nums = [...new Set(refused.map((r) => r.check))].sort((a, b) => a - b)
      const line = `- ${stamp} · ${recordSignerName} · dispatched with --force past check ${nums.join(', ')}.`
      writeFileSync(ticketPath, appendProgressNote(readFileSync(ticketPath, 'utf8'), line))
    }
  } else if (refused.length) {
    for (const r of refused) console.error(`refused: check ${r.check} — ${r.reason}`)
    if (!dryRun) writeReadinessGaps(ticketPath, gaps)
    process.exit(2)
  } else {
    const warnings = judgementWarnings({
      ticketText,
      tasksDir: TASKS_DIR,
      laneKey: sidekickLaneKey || recordLaneKey,
      lanesData,
    })
    for (const w of warnings) console.error(`judgement warning: check ${w.check} — ${w.reason}`)
    if (warnings.length && !dryRun) {
      const pad = (n) => String(n).padStart(2, '0')
      const now = new Date()
      const stamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`
      const nums = [...new Set(warnings.map((w) => w.check))].sort((a, b) => a - b)
      const line = `- ${stamp} · ${recordSignerName} · judgement warning: check ${nums.join(', ')} — ${warnings.map((w) => w.reason).join('; ')}.`
      writeFileSync(ticketPath, appendProgressNote(readFileSync(ticketPath, 'utf8'), line))
    }
  }
}
// T-714: the rung comes from the config. Strikes from any builder; at escalate_after_failures
// the ticket goes to the escalation rung (Opus solo on the data lane today), which is a Claude
// desk, not a sidekick this process runs — so dispatch records the escalation, writes the hand-off
// into that desk's inbox (T-740: a printed SendMessage line reached nobody when no one read the
// output), prints the route and stops with exit 3. The auto-verify below reaches the same exit
// when a RED verify brings the strikes to the limit.
function escalationReason(rung, text) {
  if (rung.reason === 'points') return `${ticketPoints(text)} points (escalate_from_points ${LADDER.escalate_from_points})`
  if (rung.reason === 'steps') return `${openSteps(text)} open steps (escalate_above_steps ${LADDER.escalate_above_steps})`   // only when a ladder still sets the key
  return `${rung.strikes} failed verify round${rung.strikes === 1 ? '' : 's'}`
}
function handOffEscalation(text) {
  const rung = builderFor(text, LADDER)
  const target = escalationTarget(LADDER)
  const label = `${rungLabel(target)} ${target.mode}`
  const tid = (text.match(/^id:\s*"?([\w-]+)/m) || [])[1] || ticketId || 'ticket'
  const reason = escalationReason(rung, text)
  process.stdout.write(`route: ${target.lane}\n`)
  // T-742: the trusted brief from the one brief source is the hand-off's verify instruction.
  const trusted = verifyBrief({ pathway: 'trusted', ticketPath, ticketText: text, tid, ladder: LADDER })
  if (dryRun) process.stdout.write(`--- verify brief (${trusted.style}, ${trusted.label}) ---\n${trusted.text}\n`)
  if (!dryRun && !escalatedAlready(text)) {
    recordEscalation({ ticketPath, ticketText: text, strikes: rung.strikes, reason })
    // DISPATCH_DATA_INBOX_DIR points a test at a scratch inbox; under a test's DISPATCH_INBOX_DIR alone nothing is written.
    const inboxDir = process.env.DISPATCH_DATA_INBOX_DIR ? resolve(process.env.DISPATCH_DATA_INBOX_DIR) : (process.env.DISPATCH_INBOX_DIR ? null : '')
    if (inboxDir !== null) {
      const body = `# ${tid}: escalated to you\n\nTicket: ${ticketPath}\nWhy: ${reason}.\nBuild it ${target.mode}: ${target.steps.join(', ')}. Read the project and batch first; the ticket is a hint, not a script.\n\n## Verify\n\n${trusted.text}\n`
      const w = spawnSync(process.execPath, [join(DIR, 'scripts', 'inbox-write.mjs'), '--to', target.lane, '--from', 'build', '--slug', `${tid.toLowerCase()}-escalated`],
        { input: body, encoding: 'utf8', env: { ...process.env, ...(inboxDir ? { SLOPDOG_INBOX_DIR: inboxDir } : {}) } })
      if (w.status !== 0) console.error(`dispatch: could not write ${target.lane}'s inbox: ${(w.stderr || '').trim()}`)
    }
  }
  console.error(`dispatch: ${tid} escalated to ${label} on ${target.lane} (${reason}); the hand-off is in ${target.lane}'s inbox.`)
  process.exit(3)
}
if (ticketPath && ticketText && jobKind !== 'write') {
  const points = ticketPoints(ticketText)
  // T-714: the verifier is chosen by points, so a ticket with no estimate is refused rather than
  // silently taking the cheapest verifier. The dispatch gate does not check for an estimate.
  if (points == null) {
    console.error(`dispatch: ${ticketPath} has no estimate; add estimate: with points: <1|2|3|5|8> to its front matter (the verifier is chosen by points, ${ladderPath()})`)
    process.exit(2)
  }
  const strikes = countStrikes(ticketText, LADDER)
  // T-715 (Todd's q3): escalate_from_points sends an 8-point ticket straight to the escalation rung, and
  // escalate_above_steps a ticket with too many open steps (T-740, was gate check 14); builderFor owns both rules.
  const escalate = builderFor(ticketText, LADDER).rung === 'escalation'
  const target = escalationTarget(LADDER)
  const verifier = escalate ? `${target.lane} (${target.mode})` : rungLabel(verifierFor(points, LADDER))
  const builder = escalate ? `${rungLabel(target)} ${target.mode}` : (engine === 'claude' && model ? `claude ${model}${claudeEffort ? `-${claudeEffort}` : ''}` : engine)
  console.error(`Log: ladder-rung-selected ${JSON.stringify({ ring: escalate ? 'escalation' : 'builder', builder, verifier, points, strikes })}`)
  if (escalate) handOffEscalation(ticketText)
}
// T-552: the brief is the one string known to reach Composer, Grok and Gemma (whether they
// read our CLAUDE.md is unconfirmed), so the build loop has to be spelled out in it: per-step
// plan/tick/commit, then hand-off. A dry run prints it. T-740: no preflight — the gate already
// accepted the ticket, and a separate verifier follows the build. A correction round (the last
// verify failed) opens with that failure, since the builder's earlier work is on the same branch.
// T-677: --job write gets a rewrite-only preamble and skips build ticket lifecycle updates.
const lastFailure = ticketText && countStrikes(ticketText, LADDER) > 0 ? cursorRetryFailureText(ticketText) : ''
const buildTicketBrief = ticketPath
  ? [
      `Follow ${BUILD_TICKET_SKILL} for this ticket: ${ticketPath}. Read both fully before you change anything; where this brief and the skill differ, the skill wins, except that you skip the skill's preflight and plan-check: the ticket was accepted when it was dispatched.`,
      ...(lastFailure ? ['', `CORRECTION ROUND — the last verify failed: ${lastFailure} Your earlier work is already in this checkout; fix that failure first, then finish any unticked step.`] : []),
      '',
      'PER STEP — work one step at a time:',
      `1. Find the first \`- [ ]\` step in the ticket's ## Steps that is not yet ticked. If every step is already ticked, go to 7.`,
      `2. Write one line into the ticket's ## Build log: \`- <timestamp> [Plan] <one line saying what you will do for this step>\`.`,
      '3. Do the step\'s work. Edit only the files the step names.',
      `4. Tick that step's \`- [ ]\` checkbox${(engine.endsWith('openrouter') || engine === 'claude') ? ' and leave the ticket uncommitted' : ''}. Never tick the ## Acceptance Criteria checkboxes — those are for the verifier, not for you.`,
      `5. Commit as \`${recordLaneKey} T-<id> step <N>: <what this step did>\` with a second line \`Why: <one line>\`,${(engine.endsWith('openrouter') || engine === 'claude') ? ' in your worktree only,' : ''} where <id> is the ticket's id and N is the step number. Commit after every step, so each one is its own commit.`,
      ...((engine.endsWith('openrouter') || engine === 'claude') ? ['Commit only inside your worktree. Never run git add, commit or push in ~/slopdog/tasks; leave your ticket and task-list.md edits uncommitted.'] : []),
      '6. Repeat from 1 for the next unticked step.',
      '',
      'AT THE END:',
      `7. Fill the ticket's ## Hand-off block: one \`Files changed:\` line with repo-relative paths, then for each automated acceptance criterion one block with \`AC-n · command\`, \`Red:\` (output at the red commit or first failing run) and \`Green:\` (output at pass).`,
      '8. If your work changed what the ticket\'s `feature:` slug does, revise that feature\'s page under ~/slopdog/notes/Slopdog/How Slopdog Works/ in place, per ~/slopdog/CLAUDE.md "A feature\'s reference doc is part of the feature": rewrite the stale sentence, never append. Skip this when the feature\'s behaviour is unchanged (T-657).',
      '',
      'Reply with a short report of what you did and verified. If you need something only Todd can decide, put "QUESTION:" on its own line, then a full sentence, then the options as (a) and (b), one line each, your recommendation marked "(Recommended)".',
    ].join('\n')
  : ''
const writeTicketBrief = ticketPath
  ? [
      `Rewrite or write markdown for the ticket at ${ticketPath}. Read it fully before you change anything.`,
      '',
      'This is a --job write dispatch, not a build job:',
      '- Write or rewrite the markdown the task or ticket asks for.',
      '- Do not run the build preflight loop (check-ticket, per-step Plan, tick, or `T-nnn step N:` commits).',
      '- Do not fill the ticket build Hand-off block (the Files changed / Red / Green section builders use at the end of a build).',
      '- Do not change the ticket status line, `verifier:` / `worker:` front matter, or ## Progress notes unless the task explicitly requires edits inside the ticket body.',
      '- Commit only the markdown files you changed, with a clear subject.',
      '',
      'Reply with a short report of what you changed. If you need something only Todd can decide, put "QUESTION:" on its own line, then a full sentence, then the options as (a) and (b), one line each, your recommendation marked "(Recommended)".',
    ].join('\n')
  : ''
const customTask = [...args, ...literal].join(' ').trim()
const brief = ticketPath
  ? (jobKind === 'write' ? writeTicketBrief : buildTicketBrief)
  : ''
// Custom task text never replaces the brief any more; it rides along as notes.
const task = brief && customTask ? `${brief}\n\nNOTES FROM THE DISPATCHER (read after the skill; they narrow the job, they do not replace the build order):\n${customTask}` : (brief || customTask)
// T-655: a ticket job for a non-Claude builder gets that lane's standing context at the
// top of the brief. A plain task (no --ticket / --ticket-path) stays unchanged. The
// preamble goes on the dry-run print and the headless prompt only — never on `task`,
// which is what a pane dispatch types around and matches in the job file. A newline
// there hangs the pane wait.
const standingContextTargetLane = sidekickLaneKey || recordLaneKey || engine
let standingContextPreamble = ''
if (ticketPath) {
  try {
    const standingContextFile = process.env.SLOPDOG_STANDING_CONTEXT_FILE || join(DIR, 'desk-standing-context.json')
    if (existsSync(standingContextFile)) {
      const standingConfig = JSON.parse(readFileSync(standingContextFile, 'utf8'))
      let blocks = standingConfig[standingContextTargetLane]
      if (typeof blocks === 'string' && standingConfig[blocks]) blocks = standingConfig[blocks]
      if (Array.isArray(blocks) && blocks.length > 0) {
        const lines = []
        for (const b of blocks) {
          if (typeof b === 'string') lines.push(b)
          else if (b && typeof b === 'object') {
            if (b.text) lines.push(b.text)
            else if (b.read) lines.push(`read: ${b.read}`)
          }
        }
        standingContextPreamble = lines.join('\n')
      }
    }
  } catch {}
}
const standingLane = lanesData[standingContextTargetLane]
const briefTask = standingContextPreamble && (!standingLane || standingLane.engine !== 'claude')
  ? `${standingContextPreamble}\n\n${task}`
  : task
if (!task) { console.error(USAGE); process.exit(2) }
// T-552: --dry-run prints the brief a builder would receive and exits 0 without starting
// a builder, so the brief can be read and unit-tested before any engine is touched. Before
// preJobTicketUpdate: a dry run must not mark a ticket 🟡 or touch the board.
if (dryRun) {
  if (['composer', 'grok', 'ideas-composer', 'ideas-grok', 'sonnet-cursor'].includes(engine) && ticketText) {
    const stored = readCursorChat(ticketText)
    const identity = { lane: recordLaneKey, model, ring: cursorChatRing(ticketText) }
    if (cursorChatSame(stored, identity)) process.stdout.write(`cursor route: --resume ${stored.id}\n`)
  }
  // T-708: say who would auto-verify after a clean build, from the ladder config.
  if (ticketPath && jobKind !== 'write') {
    const vRung = verifierFor(ticketPoints(ticketText), LADDER)
    process.stdout.write(`builder: ${engine}${model ? ` ${model}` : ''}${claudeEffort ? ` at ${claudeEffort} effort` : ''}\n`)
    process.stdout.write(noAutoVerify
      ? 'auto-verify: off (--no-auto-verify)\n'
      : `auto-verify: ${rungLabel(vRung)} via ${vRung.engine === 'claude' ? 'claude' : 'cursor-agent'} on lane ${LADDER.auto_verify_lane}\n`)
  }
  process.stdout.write(briefTask + '\n')
  // T-742: the verify brief the auto-verify would hand its verifier, beside the builder brief.
  if (ticketPath && jobKind !== 'write' && !noAutoVerify) {
    const vb = verifyBrief({ pathway: 'cheap', ticketPath, ticketText, ladder: LADDER })
    process.stdout.write(`\n--- verify brief (${vb.style}, ${vb.label}) ---\n${vb.text}\n`)
  }
  process.exit(0)
}
// T-740: `--ticket T-nnn --write` is the cheap lane's one build command; with no --dir or --worktree
// the build fences itself into a fresh worktree of ~/slopdog (below).
if (write && ticketPath && jobKind === 'build' && !dir && !worktree) dir = ROOT
if (write && !dir && !worktree) { console.error('dispatch: --write needs --dir or --worktree'); process.exit(2) }
if ((engine === 'gemini' || engine === 'agy') && !existsSync(AGY)) { console.error(`dispatch: agy missing (install Antigravity's agy; expected at ${AGY})`); process.exit(2) }
if (['composer', 'grok', 'ideas-composer', 'ideas-grok', 'sonnet-cursor'].includes(engine) && !existsSync(CURSOR_BIN)) { console.error(`dispatch: cursor-agent missing; expected at ${CURSOR_BIN}`); process.exit(2) }
if ((engine === 'openrouter' || engine === 'ideas-openrouter' || engine === 'claude') && !existsSync(CLAUDE_BIN)) { console.error(`dispatch: claude missing; expected at ${CLAUDE_BIN}`); process.exit(2) }

// T-490-1 FR-2: a --write job on one of the three unattended engines gets its own fresh
// worktree of the repo --dir sits in, on branch sidekick/<engine>/<job-id>, unless the
// caller already handed one over with --worktree (Gemma's older T-358 pattern, unchanged).
// dir is then swapped for the matching path inside that worktree, so everything below —
// checkFolder, cwd, and the quarantine walk at the bottom, which only ever scans writeDir()
// — never sees the shared tree again (the T-481 incident this fixes: a broad `--dir
// ~/slopdog` swept up files Tyrion's own session was writing at the same time).
// 2026-10-11 (Process Versus Direct report 3.1): every --write job that runs here gets its own
// worktree, not only the three unattended engines — a gemini build pointed at the shared
// tree timed out and the quarantine that followed destroyed other desks' uncommitted work. A
// gemini `--job write` (the writing desk's drafts, which must land in the shared tree) and a
// gemini job whose --dir is not in a git repo keep the old behaviour (the quarantine below
// is safe for them now); a --pane job is only typed from here, and the headless run it starts
// makes its own worktree.
let worktreeInfo = null
if (write && !pane && !worktree && (SIDEKICK_ENGINES.includes(engine) || jobKind === 'build')) {
  if (!dir) { console.error('dispatch: --write needs --dir (a path inside the repo to fence) or an explicit --worktree'); process.exit(2) }
  const target = checkFolder(dir)
  const repoRoot = spawnSync('git', ['-C', target, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' }).stdout.trim()
  if (!repoRoot && SIDEKICK_ENGINES.includes(engine)) { console.error(`dispatch: ${target} is not inside a git repo; composer/grok/agy only write inside one`); process.exit(2) }
  if (repoRoot) {
    const jobId = ticketId || `${Date.now()}-${process.pid}`
    const branch = `sidekick/${engine}/${jobId}`
    const wtPath = join(homedir(), 'slopdog', 'v2', '.worktrees', engine, jobId)
    mkdirSync(dirname(wtPath), { recursive: true })
    // T-740: a correction round reuses the ticket's branch and worktree, so the builder fixes the
    // failed verify on top of its own earlier work instead of starting again.
    const branchExists = spawnSync('git', ['-C', repoRoot, 'rev-parse', '--verify', '--quiet', `refs/heads/${branch}`]).status === 0
    const reuse = branchExists && existsSync(join(wtPath, '.git'))
    if (!reuse) {
      spawnSync('git', ['-C', repoRoot, 'worktree', 'prune'])
      // Sparse: the publish desk's committed video experiments are ~1G of the ~1.1G checkout, and
      // a full copy per job filled the disk on 2026-10-03; no build ticket needs them.
      const add = spawnSync('git', ['-C', repoRoot, 'worktree', 'add', '--no-checkout', ...(branchExists ? [] : ['-b']), ...(branchExists ? [wtPath, branch] : [branch, wtPath])], { encoding: 'utf8' })
      if (add.status !== 0) { console.error(`dispatch: git worktree add failed: ${(add.stderr || '').trim()}`); process.exit(2) }
      spawnSync('git', ['-C', wtPath, 'sparse-checkout', 'set', '--no-cone', '/*', '!/v2/desks/publish/experiments/'], { encoding: 'utf8' })
      const co = spawnSync('git', ['-C', wtPath, 'checkout', '-q', branch], { encoding: 'utf8' })
      if (co.status !== 0) { console.error(`dispatch: worktree checkout failed: ${(co.stderr || '').trim()}`); process.exit(2) }
    }
    provisionNodeModules(repoRoot, wtPath)
    const rel = target === repoRoot ? '' : target.slice(repoRoot.length + 1)
    // The worktree's own starting point, so the close handler can report every commit made
    // in the worktree during the job, not just one dispatch.mjs makes itself — a sidekick
    // that commits unattended (Composer, T-490-1 follow-up 2026-09-27) left "(no changes)" in
    // the reply before this, since the old check only looked at what was still staged.
    const startCommit = spawnSync('git', ['-C', wtPath, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
    worktreeInfo = { repoRoot, branch, path: wtPath, startCommit }
    dir = rel ? join(wtPath, rel) : wtPath
  }
}
// 2026-10-11: a --write build that still runs in a shared checkout (an explicit --dir beside an
// explicit --worktree, or a gemini dir outside git) refuses to start while that checkout holds
// uncommitted work. The worktree the caller handed over is hers and does not count.
if (write && jobKind === 'build' && !worktreeInfo && dir) {
  const dirty = uncommittedPaths(resolve(dir), worktree ? resolve(worktree) : null)
  if (dirty.length) {
    console.error(`dispatch: refused, ${resolve(dir)} has ${dirty.length} uncommitted change${dirty.length === 1 ? '' : 's'} (${dirty.slice(0, 5).join(', ')}${dirty.length > 5 ? ', …' : ''}); a --write build never runs in a checkout other desks are editing. Commit or move that work, or build in a worktree of its own.`)
    process.exit(2)
  }
}

// --worktree (T-358): the git worktree a job like Gemma's was handed explicitly. With no
// --dir it stands in for one — cwd and the scan root both become it. With --dir too,
// --worktree names a path inside dir that is hers: the quarantine walk below still scans
// dir, but skips anything under the worktree instead of moving it, so what she writes there
// ships instead of getting quarantined. The auto-fence above sets `dir` to the same kind of
// path, so writeDir() needs no separate case for it.
const writeDir = () => resolve(dir || worktree)
// Everything that differs between the workers, in one place.
// The chair the routed sidekick sits in (lib/chairs, T-642): it answers how the sidekick is messaged
// and whether its inbox is folded into the job. CURSOR and AGY_ENGINE below pick spawn arguments only.
const CHAIR = chairForDispatchEngine(engine)
const CURSOR = CHAIR === CHAIRS.cursor
let cursorResumeId = null
const AGY_ENGINE = CHAIR === CHAIRS.agy
const OPENROUTER = engine === 'openrouter' || engine === 'ideas-openrouter'
// Both run `claude -p` headless in the build worktree with the same stream-json parsing, fence check,
// ticket-update commit and ledger row; OPENROUTER alone adds the OpenRouter env and model rotation.
const CLAUDE_BUILDER = engine === 'claude'
const CLAUDE_FENCE_SETTINGS = JSON.stringify({ hooks: { PreToolUse: [{ matcher: 'Edit|Write|MultiEdit|NotebookEdit|Bash', hooks: [{ type: 'command', command: `${process.execPath} ${join(DIR, 'scripts', 'claude-write-fence.mjs')}`, timeout: 10 }] }] } })
const HEADLESS_CLAUDE = OPENROUTER || CLAUDE_BUILDER
// Every engine has its routed lane; Gemma's folder is the fallback for an unrouted job.
const workerLanePath = laneFolder(sidekickLaneKey || 'gemma') || DIR
const E = AGY_ENGINE
  ? { title: 'Gemini lane', lane: workerLanePath, bin: AGY, canWrite: write, cwd: workerLanePath,
      env: () => ({}),
      // agy print mode: --mode plan keeps a read-only job read-only; --dangerously-skip-permissions is the yolo of a --write job.
      // T-363: json (not text) so agy's reply carries a `usage` object (input_tokens,
      // output_tokens, thinking_tokens, cache_read_tokens) — same NDJSON-per-line wire shape
      // the show()/data-handler code below already expected for gemini (see its `// gemini`
      // branches), so switching the flag is enough; no new parsing shape was needed.
      args: (prompt, folders) => [...(write ? ['--dangerously-skip-permissions'] : ['--mode', 'plan']), ...(model ? ['--model', model] : []), '-p', prompt, '--output-format', 'json', '--print-timeout', '20m', ...folders.filter((d) => d !== E.cwd).flatMap((d) => ['--add-dir', d])] }
  : CURSOR
  ? { title: engine === 'sonnet-cursor' ? 'Sonnet' : engine === 'cursor-gemini' ? 'Gemini' : (engine === 'composer' || engine === 'ideas-composer') ? 'Composer' : 'Grok', lane: workerLanePath, bin: CURSOR_BIN, canWrite: true, cwd: write ? writeDir() : workerLanePath,
      env: () => ({}),
      // -f/--force: no approval prompt from a headless run (T-490-1 AC-1's edge case — an
      // approval prompt appearing anyway is a failure, never something a script answers).
      // --trust: a fresh sidekick worktree is an untrusted workspace, and cursor-agent asks
      // about it before it starts. stream-json, not json: one event per step, so the stall
      // watchdog below can tell a working job from one parked at a prompt (json is silent
      // until the very end).
      args: (prompt, folders) => cursorLaunchArgs({ prompt, folders, cwd: E.cwd, model, resumeId: cursorResumeId }) }
  : CLAUDE_BUILDER
  ? { title: 'Claude builder', lane: laneFolder('build') || DIR, bin: CLAUDE_BIN, canWrite: true, cwd: write ? writeDir() : (laneFolder('build') || DIR),
      // Write fence (T-749): a PreToolUse hook, scripts/claude-write-fence.mjs, passed by --settings and keyed on
      // DISPATCH_FENCE_ROOT, refuses (exit 2) any Edit/Write or writing Bash outside the worktree, the ticket
      // and task-list.md, before it happens. Hooks run under --dangerously-skip-permissions; the post-run fence stays as the backstop.
      env: () => (write ? { DISPATCH_FENCE_ROOT: writeDir(), DISPATCH_FENCE_ALLOW: [...fenceAllowed({ ticketPath, tasksDir: TASKS_DIR }), process.env.DISPATCH_JOBS_DIR || join(laneFolder('build') || DIR, 'jobs')].join(':') } : {}),
      // The ticket's builders_by_points rung: --model and --effort, headless, no approval prompts.
      args: (prompt) => ['-p', prompt, '--dangerously-skip-permissions', ...(write ? ['--settings', CLAUDE_FENCE_SETTINGS] : []), '--model', model, ...(claudeEffort ? ['--effort', claudeEffort] : []), '--output-format', 'stream-json', '--verbose'] }
  : OPENROUTER
  ? { title: engine === 'ideas-openrouter' ? 'Ideas OpenRouter' : 'OpenRouter', lane: workerLanePath, bin: CLAUDE_BIN, canWrite: true, cwd: write ? writeDir() : workerLanePath,
      env: () => {
        const citadel = getCitadelEnv()
        const apiKey = citadel.OPENROUTER_API_KEY || process.env.OPENROUTER_API_KEY || ''
        return {
          ANTHROPIC_BASE_URL: 'https://openrouter.ai/api',
          ANTHROPIC_AUTH_TOKEN: apiKey,
          ANTHROPIC_API_KEY: apiKey,
          OPENROUTER_API_KEY: apiKey,
          ANTHROPIC_DEFAULT_HAIKU_MODEL: 'dots-studio/dots-3-note-preview:free',
          ANTHROPIC_SMALL_FAST_MODEL: 'dots-studio/dots-3-note-preview:free',
          ANTHROPIC_CUSTOM_HEADERS: 'X-Title: Slop Dog',
          OPENROUTER_ENGINE: '1',
          DISPATCH_ENGINE: 'openrouter',
        }
      },
      args: (prompt, folders) => ['-p', prompt, '--dangerously-skip-permissions', ...(model ? ['--model', model] : []), '--output-format', 'stream-json', '--verbose'] }   // T-546 gap 4: no extra dirs; under skip-permissions they fence nothing, the post-run fence does
  : (() => { throw new Error(`dispatch: no engine driver for --engine ${engine}`) })()

// The folders are checked here, before anything is typed into a pane or opened in a window:
// a refused --dir exits now (T-206), instead of after the keystrokes went to the sidekick and
// the outer wait for a job file hung until timeout.
const folders = [...new Set([dir, worktree, ...reads].filter(Boolean))].map(checkFolder)

if (window && !ticketId) {
  // Same job, own Ghostty window; the shell stays open on the reply so it can be read.
  if (process.platform !== 'darwin' || !existsSync('/usr/bin/open')) { console.error('dispatch: --window is Mac only (Ghostty via /usr/bin/open); use --pane'); process.exit(2) }
  const inner = [process.execPath, fileURLToPath(import.meta.url), ...innerArgv('--window')]
  const quoted = inner.map((a) => `'${a.replace(/'/g, `'\\''`)}'`).join(' ')
  spawnSync('/usr/bin/open', ['-na', 'Ghostty', '--args', `--title=${E.title}`, '-e', 'sh', '-c', `${quoted}; echo; echo '[done — press Enter to close]'; read _`])
  process.exit(0)
}

// T-490-1 FR-1: a plain (non --ticket) dispatch to composer, grok or agy leaves its reply in
// the sending desk's own inbox/, same naming shape as above, `-from-<engine>-` so
// inbox-watch.mjs's own pattern picks it up and wakes the desk. `engineTag` is `gemma` even
// for `--engine agy` — her real name, not the pane's leftover `gemini` tag (Tyrion's answer
// on this ticket). Silent no-op with no resolved sender (a manual run outside any desk
// folder, or a registry miss) — there is nowhere to deliver it.
function writeSenderInboxFile({ engineTag, resultText, timedOut, stalled, code }) {
  if (!senderKey || !lanesData[senderKey]?.folder) return null
  // T-697: a test sandbox sets DISPATCH_INBOX_DIR (else SLOPDOG_INBOX_DIR). Honour that
  // before the sender's lane inbox, or a --sender reply lands in a live desk inbox.
  const override = process.env.DISPATCH_INBOX_DIR || process.env.SLOPDOG_INBOX_DIR
  const inbox = override ? resolve(override) : join(DIR, lanesData[senderKey].folder, 'inbox')
  mkdirSync(inbox, { recursive: true })
  const iso = new Date().toISOString()
  const stamp = `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}`
  const slug = stalled ? 'stalled' : timedOut ? 'timeout' : code !== 0 ? 'error' : 'done'
  const file = join(inbox, `${stamp}-from-${engineTag}-${slug}-${process.pid}.md`)
  writeFileSync(file, `# From ${engineTag} — dispatch reply\n\nExit: ${code}${timedOut ? ' (timeout)' : ''}\n\n## Reply\n\n${resultText}\n`)
  return file
}

if (ticketPath && jobKind !== 'write') {
  preJobTicketUpdate({ ticketPath, tasksDir: TASKS_DIR, laneKey: recordLaneKey, signerName: recordSignerName })
}

// The sidekick's visible herdr pane: labelled `<Name> (<lane>)` or agent `herdr-<lane>`
// (lib/desk-pane.mjs). T-490-1: `--engine agy` is Gemma's real name — the pane and
// registry key are `gemma` too, so the tag is `gemma` for either spelling, `composer`/`grok`
// for themselves.
const paneTag = sidekickLaneKey || engine
// Same tell as the headless stall watchdog, plus Claude Code's permission dialog, which
// replaces the input box with "Esc to cancel".
const PANE_PROMPT = /Run Everything|\(shift\+tab\)|Do you trust|trust this (folder|workspace)|waiting for (your )?approval|approve this|\[y\/n\]|Esc to cancel/i
const SHELL_NOISE = /^\[?(zsh|bash|sh|fish)\]?$|^gitstatusd/
const binOf = (args) => (args.split(/\s+/)[0] || '').split('/').pop()
// herdr only (T-477): an idle cursor/agy agent pane takes the job as a one-line prompt asking
// it to run the inner --headless command; working/blocked is refused (T-510). No herdr pane
// falls back to headless with a log line.
const herdrShellPane = () => {
  // The pane label `<Name> (<lane>)` first (lib/desk-pane.mjs, survives a /clear), then the agent name.
  const lp = herdrLanePanes()?.find((p) => p.lane === paneTag)
  const hit = (lp && { pane_id: lp.pane, agent: lp.agent, agent_status: lp.status }) || herdrAgents()?.find((a) => a.name === `herdr-${paneTag}`)
  if (!hit) return null
  if (hit.agent) {
    // A chair that takes typed jobs (agy, Cursor) is the lane's visible pane: the job goes into it
    // (see the agent branch below). Any other chair, or one herdr says is mid-turn, is not ours.
    if (!chairForAgent(hit.agent)?.paneJobs) return { why: `herdr-${paneTag} (${hit.pane_id}) is a ${hit.agent} desk, not a cursor/agy sidekick` }
    const st = hit.agent_status
    if (st !== 'idle' && st !== 'done') return { refuse: true, why: `The ${paneTag} pane was busy: herdr says the ${hit.agent} agent is ${st} (herdr ${hit.pane_id}).` }
    return { id: hit.pane_id, world: 'herdr', agent: hit.agent }
  }
  let fg = []
  try { fg = herdr(['pane', 'process-info', '--pane', hit.pane_id])?.result?.process_info?.foreground_processes ?? [] } catch {}
  let busy = ''
  if (fg.some((p) => /dispatch\.mjs/.test(p.cmdline || ''))) busy = 'running a dispatched job'
  else if (PANE_PROMPT.test(readPane({ world: 'herdr', pane: hit.pane_id }))) busy = 'waiting on an approval or permission prompt'
  else { const extra = fg.filter((p) => !SHELL_NOISE.test(p.name || binOf(p.cmdline || ''))); if (extra.length) busy = (extra[0].cmdline || extra[0].name).slice(0, 160) }
  if (busy) return { refuse: true, why: `The ${paneTag} pane was busy: ${busy} (herdr ${hit.pane_id}).` }
  return { id: hit.pane_id, world: 'herdr' }
}
const shellPane = () => {
  const h = herdrShellPane()
  if (h) return h
  return { why: `no herdr agent herdr-${paneTag} and no labelled pane for ${paneTag} (run herdr-up / sdh)` }
}
const target = pane ? shellPane() : null
if (target && !target.id) {
  // T-510: a sidekick pane that is not idle gets a reply file and a non-zero exit.
  // Keystrokes into an approval menu never produce a job file, so there is no headless
  // fallback on this path. A missing pane (no refuse flag) still runs headless.
  if (target.refuse && CHAIR?.foldsInbox) {
    console.error(`dispatch: ${target.why}`)
    writeSenderInboxFile({ engineTag: CHAIR.replyTag({ engine, lane: recordLaneKey }), resultText: target.why, timedOut: false, stalled: false, code: 1 })
    process.exit(1)
  }
  console.error(`dispatch: ${target.why}; running headless`)
}
let namedPane = true
if (target?.id && target.world === 'herdr') {
  try { assertCanTypeHerdrPane(target.id) }
  catch (e) {
    if (e.code !== 'unnamed_pane' && e.code !== 'unresolvable_pane') throw e
    console.error(`dispatch: ${e.message}; running headless`)
    namedPane = false
  }
}
if (target?.id && namedPane) {
  const inner = [process.execPath, fileURLToPath(import.meta.url), ...innerArgv('--pane')]
  const quoted = inner.map((a) => `'${a.replace(/'/g, `'\\''`)}'`).join(' ')
  const jobsDir = process.env.DISPATCH_JOBS_DIR ? resolve(process.env.DISPATCH_JOBS_DIR) : join(E.lane, 'jobs')
  mkdirSync(jobsDir, { recursive: true })
  const before = new Set(readdirSync(jobsDir))
  let toType = quoted
  if (target.agent) {
    // An interactive agent reads what is typed as a prompt, not a shell line, and a multi-line
    // task would submit early. So the job's command goes in a one-line script and the agent is
    // asked to run exactly that: the inner --headless run does the real work and writes the job
    // file below, so the finished:/exit: contract is unchanged, and the run is visible in the pane.
    const script = join(tmpdir(), `dispatch-pane-${process.pid}.sh`)
    writeFileSync(script, `#!/bin/sh\nexec ${quoted}\n`, { mode: 0o755 })
    toType = `Run this one shell command in your terminal and wait for it to exit (it can take many minutes). Do not do the task yourself and change nothing else. Reply "ran" when it exits: sh ${script}`
    process.stderr.write(`dispatch: sending the ${paneTag} job into the visible ${target.agent} pane ${target.id} (herdr), not headless\n`)
  }
  try { typeLine({ world: target.world, pane: target.id }, toType, { guard: Boolean(target.agent) }) }   // shell pane: the busy checks above already read it
  catch (e) {
    if (!target.agent) throw e
    const why = `The ${paneTag} pane was busy: ${e.message} (herdr ${target.id}).`
    console.error(`dispatch: ${why}`)
    if (CHAIR?.foldsInbox) { writeSenderInboxFile({ engineTag: sidekickLaneKey || engine, resultText: why, timedOut: false, stalled: false, code: 1 }); process.exit(1) }
    throw e
  }
  process.stdout.write(`[sent to herdr pane ${target.id}; waiting for the job file in ${jobsDir}]\n`)
  // The inner run writes one file when it closes; the one carrying this task text is ours.
  const marker = `\n## Task\n\n${task}\n`
  const deadline = Date.now() + (timeoutSec + 120) * 1000
  const file = await new Promise((done) => {
    const tick = () => {
      if (target.agent && Date.now() > deadline) {
        const why = `The ${paneTag} agent never ran the job command in pane ${target.id} within ${timeoutSec + 120}s; no job file appeared in ${jobsDir}.`
        console.error(`dispatch: ${why}`)
        if (CHAIR?.foldsInbox) writeSenderInboxFile({ engineTag: sidekickLaneKey || engine, resultText: why, timedOut: true, stalled: false, code: 124 })
        if (ticketPath && existsSync(ticketPath)) {
          const at = new Date().toISOString().slice(0, 16).replace('T', ' ')
          writeFileSync(ticketPath, appendProgressNote(readFileSync(ticketPath, 'utf8'), `- ${at} · ${recordSignerName} · 🔴 timed out after ${timeoutSec + 120}s (exit 124, engine ${engine}): the agent never ran the job.`))
        }
        process.exit(124)
      }
      for (const f of readdirSync(jobsDir)) {
        if (before.has(f) || !f.endsWith('.md')) continue
        if (readFileSync(join(jobsDir, f), 'utf8').includes(marker)) return done(join(jobsDir, f))
      }
      setTimeout(tick, 2000)
    }
    tick()
  })
  const text = readFileSync(file, 'utf8')
  const code = Number((text.match(/^exit: (-?\d+)$/m) || [])[1] ?? 1)
  process.stdout.write(`\n---\n${(text.split('\n## Result\n')[1] || '').trim()}\n\n[job ${file}]\n`)
  process.exit(code)
}

// Gemma's inbox (T-390), extended to Composer and Grok (T-490-1): none of the three has
// plugin hooks, so nothing else ever wakes them the way inbox-watch.mjs wakes a Claude-based
// desk. dispatch.mjs reads each one's own inbox/ right before the job it is about to run:
// same message shape (`^\d{4}-\d{2}-\d{2}-(?:\d{4}-)?from-[a-z0-9]+-.+`, inbox-watch.mjs's
// own regex) and the same archive-on-pickup behavior, folded into the prompt instead of
// delivered as a hook reminder. These three lanes only; Claude-based desks keep using
// inbox-watch.mjs untouched.
const GEMMA_INBOX_MESSAGE = /^\d{4}-\d{2}-\d{2}-(?:\d{4}-)?from-[a-z0-9]+-.+/i
function readGemmaInbox() {
  if (!CHAIR?.foldsInbox || ticketPath) return ''
  const inboxRoot = process.env.DISPATCH_SIDEKICK_INBOX_DIR
    ? resolve(process.env.DISPATCH_SIDEKICK_INBOX_DIR)
    : E.lane
  const inbox = join(inboxRoot, 'inbox')
  const archive = join(inboxRoot, 'inbox-archive')
  let files = []
  try { files = readdirSync(inbox).filter((f) => GEMMA_INBOX_MESSAGE.test(f) && lstatSync(join(inbox, f)).isFile()).sort() } catch { return '' }
  if (!files.length) return ''
  mkdirSync(archive, { recursive: true })
  const parts = []
  for (const f of files) {
    let text = ''
    try { text = readFileSync(join(inbox, f), 'utf8').trim() } catch { continue }
    try { renameSync(join(inbox, f), join(archive, f)) } catch { continue }
    parts.push(`### ${f}\n\n${text}`)
  }
  return parts.length ? `\n\nInbox (delivered by dispatch.mjs, moved to inbox-archive/ once read):\n\n${parts.join('\n\n---\n\n')}\n` : ''
}
const gemmaInbox = readGemmaInbox()

const prompt = [
  (dir || worktree) ? (E.canWrite ? `You may write files only in: ${writeDir()}` : `Working folder (read-only): ${writeDir()}`) : 'This job writes no files outside your own folder.',
  worktree ? `Your own worktree, kept rather than quarantined: ${resolve(worktree)}` : '',
  // Builders on T-626 wrote outside the fence twice (a test with a hardcoded worktree path
  // committed to the nested tasks repo, a scratch file in the shared tree): the nested repo is
  // not inside the worktree, so say plainly what may go there.
  worktreeInfo ? `Outside that worktree, touch only what the ticket names in the nested ~/slopdog/tasks repo (its ticket file, task-list.md, and any tasks/bin script it asks for); never write a worktree path into a file there, and put scratch files in /tmp, never in ~/slopdog.` : '',
  reads.length ? `Read-only context folders: ${reads.map((d) => resolve(d)).join(', ')}` : '',
  '', briefTask + gemmaInbox,
].filter((l, i) => l !== '' || i === 4).join('\n')
const started = new Date()
// What already sat under the write root, so the quarantine moves only files the job itself created.
const baseline = (write && E.canWrite && (dir || worktree)) ? snapshotFiles(writeDir()) : null
// The worker is not the caller: drop the dispatching session's CLAUDE_* vars, or a linked skill's
// session step (the turn log) acts on the caller's session. Found 2026-09-08.
const parentEnv = Object.fromEntries(Object.entries(process.env).filter(([k]) => {
  if (k.startsWith('CLAUDE_')) return false
  // OpenRouter must not inherit Cursor's process identity. Headers stay X-Title: Slop Dog.
  if (HEADLESS_CLAUDE && (k.startsWith('CURSOR_') || k.startsWith('__CURSOR'))) return false
  return true
}))
// Vendor keys a job may need, read from ~/.config/<vendor>/env (KEY=value lines) and passed
// into the worker's environment only; never into the prompt or the job log. (T-098, 2026-09-10.)
const vendorEnv = () => {
  const out = {}
  for (const vendor of ['byteplus', 'fal']) {
    try {
      for (const line of readFileSync(join(homedir(), '.config', vendor, 'env'), 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Z_][A-Z0-9_]*)\s*=\s*"?([^"\n]*)"?\s*$/)
        if (m) out[m[1]] = m[2]
      }
    } catch { /* no key for this vendor: the worker finds out */ }
  }
  return out
}
if (!dryRun) appendRerouteNotes(ticketPath, quotaHops)
// A first Cursor attempt, or a lane/model/ring change, opens a chat and stores it on the ticket.
// The job is launched into that chat. A matching stored chat is left for the retry path.
function createCursorChat(bin, cwd) {
  return new Promise((resolve) => {
    let settled = false
    const child = spawn(bin, ['create-chat'], { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let out = '', err = ''
    const done = (id) => { if (settled) return; settled = true; clearTimeout(timer); resolve(id) }
    const timer = setTimeout(() => { try { killTree(child.pid) } catch { /* already gone */ } done(null) }, 15000)
    const take = () => {
      if (quotaLine(err)) { try { killTree(child.pid) } catch { /* already gone */ } done(null); return }
      const line = out.trim().split('\n').filter(Boolean).pop() || ''
      if (CURSOR_CHAT_ID.test(line)) done(line)
    }
    child.stdout.on('data', (d) => { out += d; take() })
    child.stderr.on('data', (d) => { err += d; take() })
    child.on('error', () => done(null))
    child.on('close', () => {
      const line = out.trim().split('\n').filter(Boolean).pop() || ''
      done(CURSOR_CHAT_ID.test(line) ? line : null)
    })
  })
}
let launchPrompt = prompt
if (CURSOR && ticketPath && jobKind !== 'write') {
  const live = readFileSync(ticketPath, 'utf8')
  const identity = { lane: recordLaneKey, model, ring: cursorChatRing(live) }
  const stored = readCursorChat(live)
  if (cursorChatSame(stored, identity)) {
    const failure = cursorRetryFailureText(live)
    launchPrompt = failure || 'Retry this ticket.'
    cursorResumeId = stored.id
  } else {
    const id = await createCursorChat(E.bin, E.cwd)
    if (id) {
      writeFileSync(ticketPath, writeCursorChat(live, { id, lane: identity.lane, model: identity.model, ring: identity.ring }))
      cursorResumeId = id
    }
  }
}
const spawnJob = () => spawn(E.bin, E.args(launchPrompt, folders), { cwd: E.cwd, env: { ...parentEnv, ...vendorEnv(), ...E.env(), DISPATCH_LANE: CLAUDE_BUILDER ? 'claude' : (recordLaneKey || engine) }, stdio: ['ignore', 'pipe', 'pipe'] })
let job = spawnJob()
// T-359: a job kills itself on a timeout rather than hanging the caller — a hung stub, a hung
// agy, or an unattended Composer/Grok run still has to leave a reply file, not hang forever.
// Originally --ticket-only; T-490-1 AC-1 needs the same kill on a plain --timeout job too.
let timedOut = false
let jobTimer = null
const armJobTimer = () => {
  clearTimeout(jobTimer)
  jobTimer = setTimeout(() => { timedOut = true; job.kill('SIGKILL') }, timeoutSec * 1000)
}
armJobTimer()
// T-490-1 follow-up (2026-09-27): a sidekick job that is waiting on a human is killed, not
// left to hang. Two triggers: its output shows an approval prompt (any engine of the three),
// or it prints nothing at all for STALL_SEC (Composer and Grok only — they stream an event
// per step; agy's json reply is one object at the very end, so silence proves nothing there).
// The reply then opens `APPROVAL/STALLED after Ns` in the sending desk's inbox.
// 300s, not 60s: a quiet Playwright run inside a build ticket went past 60s (T-356, 2026-09-27).
// DISPATCH_STALL_SEC overrides it for a test.
const STALL_SEC = Number(process.env.DISPATCH_STALL_SEC || 300)
const APPROVAL_PROMPT = /Run Everything|\(shift\+tab\)|Do you trust|trust this (folder|workspace)|waiting for (your )?approval|approve this|\[y\/n\]/i
let stalled = null, lastOutputAt = Date.now()
const stall = (why) => {
  if (stalled || timedOut) return
  stalled = { why, sec: Math.round((Date.now() - started.getTime()) / 1000) }
  job.kill('SIGKILL')
}
const heard = (text) => {
  lastOutputAt = Date.now()
  if (SIDEKICK_ENGINES.includes(engine) && text && APPROVAL_PROMPT.test(text)) stall('approval prompt in its output')
}
const stallTimer = (CURSOR || HEADLESS_CLAUDE) ? setInterval(() => {
  if (Date.now() - lastOutputAt > STALL_SEC * 1000) stall(`no output for ${STALL_SEC}s`)
}, 5000) : null

// stream-json (Claude/OpenRouter) / json (Gemini, Composer, Grok): one JSON object per line either way.
// Print each as it lands so a watcher sees progress; keep the last assistant text as the
// reply, and capture the last object that carries a `usage` block (the engine's own token
// counts — never scanned from a transcript, straight off the wire).
let buf = '', last = '', lastUsage = null, turnCount = 0, toolEvents = []
const show = (e) => {
  // T-420: agy --output-format json (non-streaming) prints one terminal object with a
  // top-level `response` string, not a per-line role/type event — none of the shapes below
  // match it, which is why her reply was never read. A null/empty response is left unset so
  // the "(no reply)" fallback below still fires for a genuine silence.
  if (AGY_ENGINE && typeof e.response === 'string') {
    if (e.response.trim()) { last = e.response; process.stdout.write(e.response) }
    return
  }
  // Cursor CLI / Claude Code --output-format json or stream-json final result:
  // its reply lands in `result`, not `response`.
  if ((CURSOR || HEADLESS_CLAUDE) && e.type === 'result' && typeof e.result === 'string') {
    if (e.result.trim()) { last = e.result; process.stdout.write(e.result) }
    return
  }
  if ((CURSOR || HEADLESS_CLAUDE) && (e.type === 'thinking' || e.type === 'user' || e.type === 'system')) return   // stream-json noise
  if (e.type === 'tool_use' && e.tool_name) { process.stdout.write(`  → ${e.tool_name}\n`); return }   // gemini
  if (e.type === 'init' || e.type === 'tool_result' || (e.type === 'message' && e.role === 'user')) return  // gemini noise
  // An engine that sends whole assistant messages keeps the last; Gemini's stream-json sends
  // the reply as deltas (append them), so the reply is the concatenation, not the last piece.
  if (e.role === 'assistant' && typeof e.content === 'string' && e.content.trim()) {
    if (AGY_ENGINE) { last = (last + e.content); process.stdout.write(e.content) }
    else { last = e.content.trim(); process.stdout.write(`\n${last}\n`) }
  }
  else if (e.role === 'assistant' && e.tool_calls) for (const t of e.tool_calls) process.stdout.write(`  → ${t.function?.name || t.name || 'tool'}\n`)
  else if (e.role === 'thinking' || e.type === 'thinking') process.stdout.write('  … thinking\n')
  else if (e.type && /tool/.test(e.type)) process.stdout.write(`  → ${e.type}\n`)
}
const CHAT_GONE = /failed to (claim|resume)|chat.*(not found|gone|unknown|does not exist)|no such chat|persistent-session chat id/i
let cursorResumeFellBack = false
function wireJob(proc) {
proc.stdout.on('data', (d) => {
  lastOutputAt = Date.now()
  buf += d; const lines = buf.split('\n'); buf = lines.pop()
  for (const l of lines) {
    if (!l.trim()) continue
    try {
      const e = JSON.parse(l)
      // The prompt echo (`type: user`) carries the task text, which may itself mention an
      // approval; only what the engine says back is checked.
      if (e && typeof e === 'object' && e.type !== 'user' && e.type !== 'result' && /approv|permission/i.test(String(e.type || '') + String(e.subtype || ''))) stall('approval prompt in its output')
      if (e && typeof e === 'object' && e.usage && typeof e.usage === 'object') lastUsage = e.usage
      if ((CURSOR || HEADLESS_CLAUDE) && e.type === 'assistant') turnCount += 1
      if (HEADLESS_CLAUDE && (e.type === 'assistant' || e.type === 'user')) toolEvents.push(e)
      if (AGY_ENGINE && e.role === 'assistant' && typeof e.content === 'string' && e.content.trim()) turnCount += 1
      show(e)
    } catch { heard(l); process.stdout.write(l + '\n') }
  }
})
let err = ''
// T-695: a quota error on the engine's stderr ends the job at once: the engine and its children
// are killed, the state is recorded, and dispatch exits non-zero instead of waiting out the timeout.
let quotaHit = null
proc.stderr.on('data', (d) => {
  err += d; heard(String(d))
  if (quotaHit || timedOut || stalled) return
  quotaHit = quotaLine(err)
  if (!quotaHit) return
  console.error(`dispatch: ${engine} out of quota (${quotaHit.slice(0, 120)}); killed the engine`)
  recordQuota({ engine, model, reason: quotaHit })
  killTree(proc.pid)
})
proc.on('error', (e) => { console.error(`dispatch: cannot run ${E.bin}: ${e.message}`); process.exit(2) })
// Backstop to the tool profile: any file in --dir that is not markdown and was touched
// during the job is moved into lu/quarantine/ and named in the reply; a git-tracked file
// she overwrote is restored first. Symlinks are not followed. With --worktree (T-358), the
// fence moves from file type to path inside that folder: it is walked same as everything
// else, but anything under it is hers and is left in place, never quarantined, whatever its
// extension. Outside the worktree (but still under --dir) the old file-type rule stands.
const QUARANTINE = join(E.lane, 'quarantine')
// T-490-1: the auto-fenced path (worktreeInfo) counts as hers exactly like an explicit
// --worktree does — everything under it ships via the commit above, nothing is quarantined.
const worktreeR = worktree ? resolve(worktree) : (worktreeInfo ? worktreeInfo.path : null)
const inWorktree = (p) => worktreeR && (p === worktreeR || p.startsWith(worktreeR + '/'))
const quarantine = () => {
  if ((!dir && !worktree) || !E.canWrite) return []
  return quarantineTouchedFiles({ root: writeDir(), quarantineDir: QUARANTINE, sinceMs: started.getTime(), inWorktree, baseline })
}

proc.on('close', async (code) => {
  if (CURSOR && cursorResumeId && !cursorResumeFellBack && code && !timedOut && !stalled && !quotaHit && !String(last).trim() && CHAT_GONE.test(`${err}\n${buf}`)) {
    cursorResumeFellBack = true
    const oldId = cursorResumeId
    const id = await createCursorChat(E.bin, E.cwd)
    if (id && ticketPath) {
      const live = readFileSync(ticketPath, 'utf8')
      const identity = { lane: recordLaneKey, model, ring: cursorChatRing(live) }
      const stamp = new Date().toISOString().slice(0, 16).replace('T', ' ')
      let text = writeCursorChat(live, { id, lane: identity.lane, model: identity.model, ring: identity.ring })
      text = appendProgressNote(text, `- ${stamp} · dispatch · resume of cursor chat ${oldId} failed because the chat is gone; started a fresh session ${id}.`)
      writeFileSync(ticketPath, text)
      cursorResumeId = id
      launchPrompt = prompt
      buf = ''; last = ''; err = ''; lastUsage = null; turnCount = 0; toolEvents = []; quotaHit = null
      job = spawnJob()
      armJobTimer()
      wireJob(job)
      return
    }
  }
  clearTimeout(jobTimer)
  if (stallTimer) clearInterval(stallTimer)
  const moved = quarantine()
  last = last.trim()
  let result = (last || err.trim() || '(no reply)') + (moved.length ? `\n\nQUARANTINED (non-markdown files she wrote):\n${moved.join('\n')}` : '')
  // T-490-1 edge case: a reply file always lands, even on a timeout or an engine error, so
  // the sender is never left waiting (the missing done-note this generalizes past Gemma:
  // memory/gemma-dispatch-watch-finished.md).
  if (stalled) result = `APPROVAL/STALLED after ${stalled.sec}s (${stalled.why}); killed.\n\n${result}`
  else if (timedOut) result = `TIMED OUT after ${timeoutSec}s.\n\n${result}`
  else if (code !== 0) result = `${E.title} exited ${code}.\n\n${result}`
  // T-490-1 FR-2: commit whatever the job wrote inside its own worktree (never merge — the
  // Claude desk that verifies the result does that, or removes the worktree unmerged) and
  // name branch/worktree/commit in the reply so the verifier can find it.
  if (worktreeInfo) {
    stageWorktreeWork(worktreeInfo.path)
    const staged = spawnSync('git', ['-C', worktreeInfo.path, 'diff', '--cached', '--quiet'])
    if (staged.status !== 0) {
      // The house commit-msg hook refuses anything but `<lane> T-<id>: …` with a Why or Auto line.
      const tid = ticketId || (ticketText.match(/^id:\s*"?([\w-]+)/m) || [])[1]
      spawnSync('git', ['-C', worktreeInfo.path, 'commit', '-m', `${recordLaneKey}${tid ? ` ${tid}` : ''}: builder work left uncommitted, committed by dispatch`, '-m', 'Auto: dispatch.mjs'], { stdio: 'ignore' })
    }
    // Always diffed against the worktree's own starting point, not just what dispatch.mjs
    // itself just staged — a sidekick that committed on its own mid-run (unattended, no
    // approval prompt to catch it) still shows up here.
    const endCommit = spawnSync('git', ['-C', worktreeInfo.path, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).stdout.trim()
    const commitCount = Number(spawnSync('git', ['-C', worktreeInfo.path, 'rev-list', '--count', `${worktreeInfo.startCommit}..HEAD`], { encoding: 'utf8' }).stdout.trim() || '0')
    const commit = commitCount === 0 ? '(no changes)'
      : commitCount === 1 ? endCommit
      : `${worktreeInfo.startCommit.slice(0, 7)}..${endCommit.slice(0, 7)} (${commitCount} commits)`
    result += `\n\nbranch: ${worktreeInfo.branch}\nworktree: ${worktreeInfo.path}\ncommit: ${commit}`
  }
  // T-546 gap 4: refuse an openrouter job whose own tool calls wrote outside its worktree.
  const strays = HEADLESS_CLAUDE ? fenceCheck({ events: toolEvents, worktree: worktreeR, cwd: E.cwd, allowed: fenceAllowed({ ticketPath, tasksDir: TASKS_DIR }) }).strays : []
  if (strays.length) { code = 3; result = `${fenceReport(strays)}\n\n${result}`; console.error(fenceReport(strays)) }
  if (quotaHit) { code = code || 1; result = `OUT OF QUOTA: ${quotaHit}; killed.\n\n${result}` }
  if (OPENROUTER) {
    const isSuccess = code === 0 && !timedOut && !stalled
    const is429 = /429|rate_limit|rate limit/i.test(result) || /429|rate_limit|rate limit/i.test(err)
    recordRotationOutcome({
      statePath: process.env.DISPATCH_OPENROUTER_STATE_PATH,
      model,
      success: isSuccess,
      is429,
      error: isSuccess ? null : (err || result).slice(0, 200),
    })
  }
  // T-359: carry the ticket along the board before anything else — 🔍/🟠/🔴, her report into
  // Tyrion's inbox — using the same exit code and reply the job file below records.
  const ticketStatus = ticketPath && jobKind !== 'write'
    ? postJobTicketUpdate({
        ticketPath,
        tasksDir: TASKS_DIR,
        ticketId,
        laneKey: recordLaneKey,
        signerName: recordSignerName,
        inboxDir: ticketDoneInboxDir(),
        code: timedOut || stalled ? 124 : (code ?? 1),
        timedOut: Boolean(timedOut || stalled),
        stalled: Boolean(stalled && !timedOut),
        engine,
        resultText: result,
        timeoutSec,
        isAgyJob: AGY_ENGINE || lanesData[recordLaneKey]?.engine === 'agy',
      }).statusKey
    : null
  // T-714: the verifier stamp comes from the ladder, by the ticket's points.
  if (ticketPath && jobKind !== 'write' && existsSync(ticketPath)) {
    let stamped = readFileSync(ticketPath, 'utf8')
    stamped = setFrontMatterScalar(stamped, 'verifier', rungLabel(verifierFor(ticketPoints(stamped), LADDER)))
    if (engine === 'sonnet-cursor') stamped = setFrontMatterScalar(stamped, 'worker', 'sonnet-cursor')
    writeFileSync(ticketPath, stamped)
  }
  if (strays.length && ticketPath) writeFileSync(ticketPath, appendFenceConcern(readFileSync(ticketPath, 'utf8'), strays, { who: recordSignerName }))
  else if (HEADLESS_CLAUDE && ticketPath && jobKind !== 'write') commitTicketUpdates({ tasksDir: TASKS_DIR, paths: fenceAllowed({ ticketPath, tasksDir: TASKS_DIR }), message: `${ticketId || (ticketText.match(/^id:\s*"?([\w-]+)/m) || [])[1] || 'ticket'}: builder's ticket updates (${engine}, committed by dispatch)` })
  // T-490-1 FR-1: the plain (non --ticket) path, for all three sidekicks — --ticket keeps its
  // own dedicated flow into Tyrion's inbox above. OpenRouter has no chair (headless only) and
  // replies the same way, tagged with its --engine name.
  if (!ticketId && (CHAIR?.foldsInbox || HEADLESS_CLAUDE)) {
    writeSenderInboxFile({ engineTag: CHAIR?.replyTag({ engine, lane: recordLaneKey }) ?? engine, resultText: result, timedOut, stalled: !!stalled, code: code ?? 1 })
  }
  const finishedAt = new Date().toISOString()
  const exitCode = timedOut || stalled ? 124 : (code ?? 1)
  const usageBlock = CURSOR ? cursorUsageBlockFrom(lastUsage) : (AGY_ENGINE || HEADLESS_CLAUDE) ? usageBlockFrom(lastUsage) : null
  const usageYaml = AGY_ENGINE
    ? (usageBlock
        ? `usage:\n  input_tokens: ${usageBlock.input_tokens}\n  output_tokens: ${usageBlock.output_tokens}\n  thinking_tokens: ${usageBlock.thinking_tokens}\n  cache_read_tokens: ${usageBlock.cache_read_tokens}\n`
        : 'usage: missing\n')
    : ''
  // T-740 step 4: with --ticket-path the ticket file's own id names the ledger row; the brief can
  // mention other tickets first (step 10 names T-657), which used to label the row with the wrong one.
  const ticketFileId = ticketText ? (ticketText.match(/^id:\s*["']?([\w.-]+)["']?\s*$/m) || [])[1] : null
  const effectiveTid = ticketId || ticketFileId || (args.find((a) => /^T-\d+$/i.test(a)) || (task.match(/\b(T-\d+)\b/i) || [])[1]) || (OPENROUTER ? 'openrouter-task' : CLAUDE_BUILDER ? 'claude-task' : null)
  if (effectiveTid && (AGY_ENGINE || CURSOR || HEADLESS_CLAUDE)) {
    const { arm, lane } = dispatchArmForEngine(engine)
    const turns = (AGY_ENGINE || HEADLESS_CLAUDE) && turnCount === 0 && !timedOut && !stalled && code === 0 ? 1 : (turnCount || null)
    const source = AGY_ENGINE
      ? 'dispatch.mjs live job (agy usage reply)'
      : CURSOR
      ? 'dispatch.mjs live job (cursor-agent usage reply)'
      : 'dispatch.mjs live job (claude usage reply)'
    appendDispatchLedgerRow({
      ledgerPath: LEDGER_PATH,
      pricesPath: PRICES_PATH,
      tid: effectiveTid,
      arm,
      lane: sidekickLaneKey || lane,
      model,
      startedAt: started.toISOString(),
      finishedAt,
      usageBlock,
      source,
      turns,
      department: departmentForTicket(ticketText, TASKS_DIR),
      desk: senderKey || sidekickLaneKey || lane,
      role: jobKind === 'verify' ? 'verify' : 'build',
    })
  }
  // 2026-10-08 quick task (dispatch-wakes-tyrion-on-finish): a finished build or verify job
  // from any desk but build leaves one message in Tyrion's inbox through inbox-write.mjs, so
  // inbox-watch wakes him; a detached verifier's report used to wake nobody. Under a test's
  // DISPATCH_INBOX_DIR it writes only to DISPATCH_TYRION_INBOX_DIR, never the live inbox.
  // Never throws: a failed write is one stderr line. T-740: skipped when the auto-verify follows,
  // since that run ends in its own outcome (🟩, a strike, or one note) and a wake now is noise.
  const autoVerifyFollows = Boolean(ticketPath && jobKind !== 'write' && !noAutoVerify && exitCode === 0 && ticketStatus === 'verifying')
  if (!autoVerifyFollows) try {
    const tyrionDir = process.env.DISPATCH_TYRION_INBOX_DIR ? resolve(process.env.DISPATCH_TYRION_INBOX_DIR)
      : process.env.DISPATCH_INBOX_DIR ? null : INBOX_DIR
    const fileTid = ticketText ? (ticketText.match(/^id:\s*"?([\w.-]+)"?\s*$/m) || [])[1] : null
    const wakeTid = ticketId || fileTid || (['openrouter-task', 'claude-task'].includes(effectiveTid) ? null : effectiveTid)
    const kind = ticketPath ? jobKind : (/\bverif/i.test(task) ? 'verify' : 'build')
    const reportDir = ticketPath && jobKind !== 'write' ? ticketDoneInboxDir() : null
    const wake = tyrionDir && tyrionWakeMessage({ senderKey, tid: wakeTid, kind, code: exitCode, resultText: result, reportDir, buildInbox: tyrionDir })
    if (wake?.text) {
      const w = spawnSync(process.execPath, [join(DIR, 'scripts', 'inbox-write.mjs'), '--to', 'build', '--from', senderKey || recordLaneKey || engine, '--slug', wake.slug],
        { input: wake.text, encoding: 'utf8', env: { ...process.env, SLOPDOG_INBOX_DIR: tyrionDir } })
      if (w.status !== 0) console.error(`dispatch: could not wake Tyrion: ${(w.stderr || '').trim()}`)
    }
  } catch (e) { console.error(`dispatch: could not wake Tyrion: ${e.message}`) }
  const JOBS_DIR = process.env.DISPATCH_JOBS_DIR ? resolve(process.env.DISPATCH_JOBS_DIR) : join(E.lane, 'jobs')
  mkdirSync(JOBS_DIR, { recursive: true })
  const stamp = started.toISOString().replace(/[-:]/g, '').slice(0, 15).replace('T', '-')
  const file = join(JOBS_DIR, `${stamp}-${process.pid}.md`)
  writeFileSync(file, `---
engine: ${engine}
lane: ${sidekickLaneKey || ''}
model: "${model || 'default'}"
dir: "${dir ? resolve(dir) : ''}"
worktree: "${worktreeInfo ? worktreeInfo.path : (worktree ? resolve(worktree) : '')}"
branch: "${worktreeInfo ? worktreeInfo.branch : ''}"
read: [${reads.map((d) => `"${resolve(d)}"`).join(', ')}]
started: ${started.toISOString()}
finished: ${finishedAt}
exit: ${exitCode}
${usageYaml}---

## Task

${task}

## Result

${result}
`)
  process.stdout.write(`\n---\n${result}\n\n[job ${file}]${ticketStatus ? ` [ticket ${ticketId} → ${ticketStatus}]` : ''}\n`)
  // T-708 / T-740: the cheap lane's second and last step. A clean build is verified at once by the
  // ladder's verifier for the ticket's points (Sonnet at high effort), inside the build's own
  // worktree. GREEN merges the build branch to main and sets the ticket 🟩. RED records a strike with
  // verify-fail.mjs and runs this same dispatch once more on the same branch; the strike that reaches
  // escalate_after_failures hands the ticket to the escalation rung (Data) instead. A verifier that
  // cannot run, a reply with no verdict, or a GREEN that cannot merge cleanly leaves one note in
  // Tyrion's inbox.
  if (autoVerifyFollows) {
    const tyrionDir = process.env.DISPATCH_TYRION_INBOX_DIR
      ? resolve(process.env.DISPATCH_TYRION_INBOX_DIR)
      : (process.env.DISPATCH_INBOX_DIR ? null : INBOX_DIR)
    const fileTid = ticketText ? (ticketText.match(/^id:\s*"?([\w.-]+)"?\s*$/m) || [])[1] : null
    const tid = ticketId || fileTid || effectiveTid || 'ticket'
    // T-714: the auto-verifier is the ladder's verifier for this ticket's points.
    const verifierLane = LADDER.auto_verify_lane
    const vRung = verifierFor(ticketPoints(ticketText), LADDER)
    const verifierLabel = rungLabel(vRung)
    const verifierName = `Verifier (${verifierLabel})`
    const vOnClaude = vRung.engine === 'claude'
    const vBin = vOnClaude ? CLAUDE_BIN : CURSOR_BIN
    const toTyrion = (slug, text) => {
      if (!tyrionDir) return
      spawnSync(process.execPath, [join(DIR, 'scripts', 'inbox-write.mjs'), '--to', 'build', '--from', verifierLane, '--slug', `${slug}-${process.pid}`],
        { input: text, encoding: 'utf8', env: { ...process.env, SLOPDOG_INBOX_DIR: tyrionDir } })
    }
    // T-741 row 19: a verify that cannot prove the build either way (INCONCLUSIVE, no verdict, two
    // verdicts, a GREEN with no log, or a verifier that never ran) records no strike and merges
    // nothing, and never leaves 🔍 standing: the log or the reason goes on the ticket, the ticket goes
    // back to 🟡, and Tyrion gets one note.
    const sendBack = ({ slug, title, why, log = null, tail = '' }) => {
      try {
        let t = readFileSync(ticketPath, 'utf8')
        if (log) t = appendProgressNote(t, log)
        t = appendProgressNote(t, `- ${new Date().toISOString().slice(0, 16).replace('T', ' ')} · ${verifierName} · verify inconclusive: ${why}; no strike, nothing merged, back to 🟡 for Tyrion.`)
        writeFileSync(ticketPath, t)
        setTicketStatus({ ticketPath, tasksDir: TASKS_DIR, statusKey: 'doing' })
      } catch (e) { console.error(`dispatch: could not send ${tid} back to 🟡: ${e.message}`) }
      toTyrion(slug, `# ${tid}: ${title} (${verifierLabel})\n\n${why}. Nothing was merged or rebuilt and no strike was recorded; the ticket is back at 🟡.${tail ? `\n\n${tail}` : ''}\n`)
    }
    const unavailable = (why) => {
      sendBack({ slug: 'verify-unavailable', title: 'verifier unavailable', why: `Verifier cannot start: ${why}` })
      process.exit(0)
    }

    // FR-4: verifier cannot start
    if (!existsSync(vBin)) unavailable(`${vBin} missing`)
    const vKey = vOnClaude ? `anthropic:${vRung.model}` : `cursor:${vRung.model}`
    if (quotaOut(vKey, { statePath: process.env.DISPATCH_QUOTA_STATE_PATH })) unavailable(`quota exhausted for ${vRung.model}`)

    // The build's own checkout: the auto-fenced worktree, or the one the caller handed over.
    const buildDir = worktreeInfo ? worktreeInfo.path : (worktree ? resolve(worktree) : null)
    const buildBranch = worktreeInfo ? worktreeInfo.branch
      : (buildDir ? spawnSync('git', ['-C', buildDir, 'rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).stdout.trim() : '')
    // T-742: the brief comes from the one brief source, chosen by pathway and the verifier's model.
    const brief = verifyBrief({ pathway: 'cheap', ticketPath, tid, buildDir, branch: buildBranch, ladder: LADDER })
    const verifyPrompt = brief.text
    const verifyArgs = vOnClaude
      ? ['-p', verifyPrompt, '--model', vRung.model, ...(vRung.effort ? ['--effort', vRung.effort] : []), '--dangerously-skip-permissions', ...(buildDir ? ['--settings', CLAUDE_FENCE_SETTINGS] : []), '--output-format', 'json']
      : ['-p', verifyPrompt, '--force', '--trust', '--model', vRung.model, '--output-format', 'stream-json']
    const verifyTimeoutSec = Number(process.env.DISPATCH_VERIFY_TIMEOUT_SEC || 1800)
    const verifyStarted = Date.now()
    const verifyRes = spawnSync(vBin, verifyArgs, {
      cwd: buildDir || E.cwd,
      // The same write fence as the builder (claude-write-fence.mjs): the verifier writes only its worktree, the ticket and task-list.md.
      env: { ...parentEnv, ...vendorEnv(), DISPATCH_LANE: verifierLane, ...(vOnClaude && buildDir ? { DISPATCH_FENCE_ROOT: buildDir, DISPATCH_FENCE_ALLOW: fenceAllowed({ ticketPath, tasksDir: TASKS_DIR }).join(':') } : {}) },
      encoding: 'utf8',
      timeout: verifyTimeoutSec * 1000,
      killSignal: 'SIGKILL',
      maxBuffer: 64 * 1024 * 1024,
    })
    if (verifyRes.error?.code === 'ETIMEDOUT' || verifyRes.signal) unavailable(`the verify run was killed after ${verifyTimeoutSec}s`)

    const verifyOut = verifyRes.stdout || ''
    const verifyErr = verifyRes.stderr || ''
    const verifyCode = verifyRes.status ?? 0

    const quotaHitVerify = quotaLine(verifyErr) || (/quota|resource_exhausted/i.test(verifyErr) ? verifyErr.trim() : null)
    if (verifyCode !== 0 && (quotaHitVerify || !verifyOut.trim())) unavailable(`quota / ${quotaHitVerify || verifyErr.trim() || `exit ${verifyCode}`}`)

    let verifyText = ''
    for (const line of verifyOut.trim().split('\n').filter(Boolean).reverse()) {
      try {
        const obj = JSON.parse(line)
        if (obj && (obj.result || obj.text)) { verifyText = obj.result || obj.text; break }
      } catch {}
    }
    if (!verifyText) verifyText = verifyOut

    // T-741 rows 10 and 18: one parser decides the verdict, and the reply's §4 log is copied onto the
    // ticket on every verdict. A GREEN whose log shows nothing that ran is not proof, so it is
    // treated as INCONCLUSIVE.
    const parsed = parseVerdict(verifyText)
    const log = parseVerifyLog(verifyText)
    let verdict = parsed.verdict
    let inconclusiveWhy = parsed.why
    if (verdict === 'GREEN' && !logIsComplete(log)) { verdict = 'INCONCLUSIVE'; inconclusiveWhy = 'the reply said GREEN but its verify log names nothing that ran or was seen' }
    const reasonLine = (verifyText.match(/^\s*Reason:\s*(.+)$/im) || [])[1]?.trim() || ''
    const logBlock = renderVerifyLog({
      who: verifierName,
      ran: log.ran,
      sawHappy: log.sawHappy,
      sawUnhappy: log.sawUnhappy,
      verdict,
      why: verdict === parsed.verdict ? (verdictSentence(log.verdictLine) || reasonLine || inconclusiveWhy) : inconclusiveWhy,
    })
    const isGreen = verdict === 'GREEN'
    const isRed = verdict === 'RED'
    // T-740 step 4: the verdict goes onto the ticket's build row in the ledger, so the cheap lane's
    // cost can be judged against its rebuilds. Never stops the verify: a failed write is one stderr line.
    if (isGreen || isRed) {
      try {
        recordVerifyOutcome({ ledgerPath: LEDGER_PATH, ticketId: tid, green: isGreen, verifyMinutes: Math.round((Date.now() - verifyStarted) / 600) / 100 })
      } catch (e) {
        console.error(`dispatch: ledger verify outcome not recorded for ${tid}: ${e.message}`)
      }
    }
    const writeLog = () => writeFileSync(ticketPath, appendProgressNote(readFileSync(ticketPath, 'utf8'), logBlock))

    if (isGreen) {
      writeLog()
      // T-741 row 13: when main moved since the build, the ticket's Red-check commands run again on the
      // merged code before main fast-forwards; a failure falls back to the ready-to-merge note.
      const merged = buildDir && buildBranch && buildBranch !== 'main' && buildBranch !== 'HEAD'
        ? mergeBuildToMain({ buildDir, branch: buildBranch, removeWorktree: Boolean(worktreeInfo), recheck: (cwd) => runRedChecks(readFileSync(ticketPath, 'utf8'), cwd) })
        : { ok: false, why: 'the build ran in no worktree branch of its own' }
      if (merged.ok) {
        const evidence = (verifyText.match(/^\s*Evidence:\s*(.+)$/m) || [])[1]?.trim()
        markVerified({
          ticketPath,
          tasksDir: TASKS_DIR,
          signerName: verifierName,
          notes: [
            `verified GREEN on ${buildBranch}; merged to main at ${merged.sha}${merged.pushed ? ' and pushed' : ' (not pushed)'}.`,
            ...(evidence ? [evidence] : []),
          ],
        })
        process.stdout.write(`[ticket ${tid} → verified, merged ${buildBranch} at ${merged.sha}]\n`)
      } else {
        const noteBranch = buildBranch || (readFileSync(ticketPath, 'utf8').match(/^branch:\s*"?([^"\n]+)"?/m) || verifyText.match(/^Branch:\s*(.+)$/m) || [])[1]?.trim() || ''
        toTyrion('ready-to-merge', `# ready-to-merge: ${tid}\n\nTicket: ${tid}\nBranch: ${noteBranch}\nVerdict: GREEN\nNot merged by dispatch: ${merged.why}\n\n${verifyText}\n`)
      }
    } else if (isRed) {
      writeLog()
      // T-741 row 11: the category list in the brief comes from verify-fail.mjs and the ladder; a
      // category the verifier made up, or none, is verifier-error, which is never a strike.
      const red = parseRedDetails(verifyText)
      const category = strikeCategoryFor(red.said)
      const reason = red.reason || verdictSentence(log.verdictLine) || 'the verifier returned Verdict: RED'
      const vf = spawnSync(process.execPath, [VERIFY_FAIL, ticketPath, '--verifier', verifierName, '--category', category, '--ac', red.ac, '--reason', reason], { encoding: 'utf8' })
      if (vf.status !== 0) console.error(`dispatch: verify-fail.mjs refused: ${(vf.stderr || '').trim()}`)
      // 🔍 never stands once the check is over: back to 🟡, for the rebuild or for Data.
      setTicketStatus({ ticketPath, tasksDir: TASKS_DIR, statusKey: 'doing' })
      const after = readFileSync(ticketPath, 'utf8')
      if (!LADDER.strike_categories.includes(category)) {
        // No strike: the build is not at fault (a bad check, a stale base, quota, the verifier itself),
        // so building again would repeat the same failure. Tyrion decides.
        toTyrion('verify-no-strike', `# ${tid}: verify RED without a strike (${verifierLabel})\n\nCategory: ${category} ${red.ac}. ${reason}\nNothing was merged or rebuilt; the ticket is back at 🟡.\n`)
        process.exit(0)
      }
      if (builderFor(after, LADDER).rung === 'escalation') handOffEscalation(after)
      // One more build on the same branch: this same command again. The child reads the strike, opens
      // its brief with the failure, and reuses the worktree; its own verify decides what comes next.
      console.error(`dispatch: ${tid} verify RED (${category} ${red.ac}); building it again on ${buildBranch || 'the same checkout'}`)
      const parents = [process.env.DISPATCH_PARENT_PIDS, String(process.pid)].filter(Boolean).join(',')
      const again = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...argv], { stdio: 'inherit', cwd: process.cwd(), env: { ...process.env, DISPATCH_PARENT_PIDS: parents } })
      process.exit(again.status ?? 1)
    } else if (parsed.noVerdict) {
      sendBack({ slug: 'verify-no-verdict', title: 'verify gave no verdict', why: 'The verifier ran but its reply had no verdict line', log: logBlock, tail: `Its reply:\n\n${verifyText.trim().slice(-2000)}` })
    } else {
      sendBack({ slug: 'verify-inconclusive', title: 'verify inconclusive', why: `The verify was inconclusive: ${reasonLine || inconclusiveWhy || 'no reason given'}`, log: logBlock, tail: `Its reply:\n\n${verifyText.trim().slice(-2000)}` })
    }
  }
  process.exit(exitCode)
})
}
wireJob(job)
}
