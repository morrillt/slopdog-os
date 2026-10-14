#!/usr/bin/env node
// unstucker.mjs — walk the desk panes and unstick the ones that are waiting on nothing.
//
// Todd named it, 2026-09-26: "Let's call it the unstucker." His ask: "a refresh script that
// will come and make sure you guys are all awake... if your tmux panels are stuck it just
// presses like hello enter on each panel."
//
// Why: a desk can sit for hours on a question nobody is awake to answer, or stop because its
// five-hour window ran out or its context ceiling refused the prompt. From outside all of
// those look the same — a quiet pane. This reads each desk pane, decides which kind of quiet
// it is, and only types into the ones where typing is safe.
//
// Two modes, matching the two things that go wrong overnight:
//
//   --mode questions   The question sweep. Acts ONLY on a pane that is waiting on Todd — an
//                      AskUserQuestion menu is open. It escapes the menu and tells the desk
//                      to put the question on the board instead. Meant to run every thirty
//                      minutes all night. Its message is fixed (Todd's words) and is not
//                      taken from --message.
//   --mode reset       The window-reset pass. Nudges every stuck pane — idle, menu, or a
//                      machine notice left unsent — with the general "read your PICKUP.md and
//                      carry on" line. Meant to run once, after the five-hour window has
//                      rolled over. This is the default.
//   --mode focus       T-472. The two-minute focus sweep, run by a standing systemd timer
//                      (focus-sweep.timer) every two minutes, all the time — it no-ops at
//                      once unless context.yaml's `focus_mode: on`, which only Todd or
//                      Daphne flips, so it only ever acts while Todd is actually here driving
//                      the team. Never types into a pane: it writes a file-inbox note
//                      (v2/CLAUDE.md, "Desk file inbox") to the one desk able to act, never a
//                      broadcast, and never calls an LLM. Three checks, each read from the
//                      board and the panes, not from a fresh guess every run:
//                        1. a desk pane idle at an empty prompt while a 🔵 or 🟡 ticket is
//                           assigned to it (`worker:` in the ticket's front matter,
//                           `start_after` not in the future) — a nudge
//                           to that desk, a second nudge if still idle, then one escalation to
//                           the ticket's dispatcher (Daphne if `verifier: ideas`, else Tyrion)
//                           and never again for the same desk and ticket.
//                        2. the focus project (the `project:` most `focus_tasks` rows in
//                           context.yaml carry) holds fewer than two 🔵/🟡 tickets in
//                           task-list.md (future `start_after` tickets skipped) — one note to Daphne to write the next ones.
//                        3. every remaining ticket in the focus project is 🟩 or 🟠 — one note
//                           to Daphne listing exactly what Todd owes (the batch reviews and the
//                           questions), so she can bring it to him instead of the team sitting
//                           idle waiting on his desk.
//                      Timings (`interval_min`, `idle_nudge_min`, `second_nudge_min`) are
//                      context.yaml's `focus_sweep:` block, not constants here. Dedupe state
//                      is FOCUS_STATE_FILE, one entry per condition (plus ticket id for check
//                      1, plus project for checks 2/3), so a condition that stays true is
//                      never renotified past its nudge/escalation ladder.
//
// Usage:
//   node unstucker.mjs                        window-reset pass over every desk pane
//   node unstucker.mjs --mode questions       question sweep only
//   node unstucker.mjs --mode focus            the two-minute focus sweep (no-ops unless
//                                              context.yaml's focus_mode: on)
//   node unstucker.mjs --dry-run              say what it would do, type nothing
//   node unstucker.mjs --lane build           one lane only
//   node unstucker.mjs --message "…"          a different nudge line (reset mode only)
//
// How a pane is read. Claude Code draws its input box between two horizontal border lines,
// with the `❯` on the first line inside. Finding the box, rather than the last `❯` anywhere
// in the pane, is what stops a transcript line that happens to start with `❯` from being read
// as the prompt. Inside the box:
//
//   idle            the box is empty, or holds only Claude Code's dim grey suggestion, which
//                   is not typed input at all (memory: dim-prompt-suggestion-is-not-typed)
//   running         a spinner line (`… (` … `)`, or "esc to interrupt") sits above the box
//   menu            an AskUserQuestion menu — numbered rows, or "(Recommended)"
//   stalled-notice  every line in the box is a notice a hook typed in and never got submitted
//                   (`Mode changed: …`, `Todd answered qN on …`). Safe to submit as-is: Enter
//                   alone, nothing new typed, because the desk was going to read it anyway.
//   typed-text      anything else in the box is a human's unsent words. Never typed into and
//                   never submitted — Enter there would send their half-written message
//                   (memory: self-clear-appends-to-typed-text).
//
// The fourth kind of stuck: a desk parked in the clear sequence (T-399, Todd 2026-09-26:
// "they're both just waiting for a clear to close. It never happens. So you need to have in
// your checking routine, tap their door a bit"). The sequence is two typed lines
// (`rules/desk-clear.md`): `/slopdog:clear-to-close` writes PICKUP.md, then `self-clear.mjs`
// types `/clear` and a detached `--watch` child types `/slopdog:pickup <folder>/PICKUP.md`
// once the pane shows the cleared prompt.
//
// The signature comes from the pane it actually happened on, Tyrion's %61, not from guessing:
// clear-to-close finished normally and self-clear.mjs exited 0, but peer messages kept
// arriving and starting fresh turns, the typed `/clear` never took, and twenty minutes later
// the pane was idle at an empty prompt with its context still around 230k. So the tell is not
// a refusal and not a dead watcher — it is a desk that ran the sequence and whose context
// never dropped. A desk that really cleared shows a small context bar; this one did not.
//
//   clear-stalled      idle, the clear sequence's own printing still on the visible pane, the
//                      context bar at CTX_STILL_FULL% or more, and a PICKUP.md between 2
//                      minutes and 3 hours old (it is written seconds before self-clear runs,
//                      so its mtime is when the sequence started). Typed in: `/clear` itself,
//                      because the original watcher is waiting on a cleared prompt that will
//                      never appear on its own. A live watcher does not block this case — in
//                      the observed stall two were alive — it only corroborates it.
//   cleared-no-pickup  the clear did land but the pickup line never followed: an empty box
//                      whose only transcript line above it is `❯ /clear` (the same rule
//                      self-clear.mjs uses) and no live `self-clear.mjs --watch <pane>`
//                      process. Typed in: `/slopdog:pickup <folder>/PICKUP.md`.
//
// The two chain: `/clear` from the first leaves the pane in the second's state, and either the
// original watcher types the pickup line within a second or the next pass does it.
//
// The fifth kind, and the general one (Todd, 2026-09-26): "what if there's no subagents
// running and there's no thinking happening… you just say hey, just checking in, noticed
// that there's none of that happening, what's up." Every pass reads whether each desk is
// alive — a spinner above the box, a running agent row under it, a background shell in the
// status row (`· 1 shell ·`, which will wake the desk), or simply a transcript that changed
// since the last pass — and a desk that has been none of those for a whole interval gets one
// plain check-in line. An idle desk with a shell or an agent running is left alone by both passes. State lives in STATE_FILE so "for the whole interval" means
// across passes rather than at the instant of the check, and so a desk that is legitimately
// idle is asked once per quiet spell rather than every thirty minutes.
//
// The sixth kind is the opposite of quiet: a turn that never ends. The dispatcher (Tyrion, lane
// `build`) and the Watcher (lane `watcher`) are the two desks everyone else waits on, and a turn
// of theirs that hangs on a tool call or an agent wait stalls the whole sprint while looking
// busy (Todd approved the release, 2026-10-11, from the Process Versus Direct report).
//
//   hung               `running` on lane build or watcher for HUNG_MS (30 min) or more. How
//                      long the turn has run is read from the spinner's own clock (`… (31m 2s ·`)
//                      when the pane shows one, else from `runningSince`, the first pass that
//                      saw it running, kept in STATE_FILE. It gets exactly one Escape and nothing
//                      typed; the desk is then told by an inbox note (inbox-write.mjs,
//                      slug hung-turn-released) and a `[hardening]` line goes into the
//                      retrospective (retrospective-append.mjs). `hungReleasedAt` in STATE_FILE
//                      stops a second Escape while the pane stays running, and is dropped the
//                      first pass that sees it not running. herdr calls a hung pane `working`, so
//                      this case alone skips the herdr-busy check below. Every other lane's
//                      running pane is left alone however long it runs.
//
// All of these are conservative on purpose: a false positive types into a working desk, which
// is worse than a missed catch, and all are safe to fire twice.

import { readLanesDocument } from './lib/registry.mjs'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { basename, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import yaml from 'js-yaml'
import { assertCanTypeHerdrPane, herdrBusy, listDeskPanes, readPane, sendKeys, typeLine } from './lib/desk-pane.mjs'
import { ensureHerdrAgentNames } from './lib/herdr-agent-names.mjs'
import { SWITCH_FILE, unstuckerOn } from './lib/unstucker-switch.mjs'

const args = process.argv.slice(2)
const has = (f) => args.includes(f)
const val = (f, d) => { const i = args.indexOf(f); return i === -1 ? d : args[i + 1] }

// T-472 (Concerns): --help must print usage and exit, not fall through to the reset
// pass's default mode and actually type into panes. Checked before anything else runs.
if (has('--help') || has('-h')) {
  console.log(`usage: unstucker.mjs [--mode reset|questions|focus] [--dry-run] [--lane <lane>] [--message "…"]

  --mode reset      window-reset pass over every desk pane (default)
  --mode questions  question sweep: escape an open menu, tell the desk to use the board
  --mode focus      the two-minute focus sweep (no-ops unless context.yaml's focus_mode: on)
  --dry-run         say what it would do, type nothing
  --lane <lane>     one lane only
  --message "…"     a different nudge line (reset mode only)

See the file's own top-of-file comment for what each mode actually checks.`)
  process.exit(0)
}

const dryRun = has('--dry-run')

// The on/off switch (lib/unstucker-switch.mjs, flipped with `u` on bw's Main page). Off makes
// every real run a no-op: the timers keep firing and each run logs why it did nothing. A
// --dry-run still reports, since it types nothing and the watcher reads its output.
if (!dryRun && !unstuckerOn()) {
  console.log(`${new Date().toISOString()} unstucker --mode ${val('--mode', 'reset')}: unstucker off, skipped (${SWITCH_FILE})`)
  process.exit(0)
}
const onlyLane = val('--lane', null)
const mode = val('--mode', 'reset')
if (!['reset', 'questions', 'focus'].includes(mode)) {
  console.error(`unknown --mode ${mode}: expected "reset", "questions" or "focus"`)
  process.exit(1)
}

// Todd's wording, 2026-09-26. It lives here rather than in the caller so every scheduled run
// says the same thing.
const QUESTION_SWEEP_MESSAGE =
  'This is not the time to answer questions. Please move this to the board.'

const RESET_MESSAGE = val('--message',
  'Unstucker: read your PICKUP.md and carry on with the ticket in hand. If you are stuck on a question for Todd, put it on the ticket and keep working.')

const nudge = mode === 'questions' ? QUESTION_SWEEP_MESSAGE : RESET_MESSAGE

// A notice some hook typed into a pane and never managed to submit. Matching one of these is
// the only case where this script presses Enter on text it did not type itself.
const MACHINE_NOTICES = [
  /^Mode changed: (spend|conserve)\b/,
  /^Todd answered q\d+ on T-\d+/,
  /^Todd asked for more on q\d+ on T-\d+/,
  /^Todd is at workspace 6, ready for q\d+ on T-\d+/,
  /^Unstucker: /,
  /^Wake check: /,
]

// The clear sequence's own printing, as it appears in a pane that ran it. Prose about
// clearing does not match: these are lines the machine wrote.
const CLEAR_MARKERS = [/self-clear\.mjs/, /^self-clear: /, /clear-to-close/, /pickup-check\.mjs/]

// How old the desk's PICKUP.md must be before an idle pane counts as parked. clear-to-close
// writes it seconds before self-clear.mjs runs, so its mtime is when the sequence started:
// under 2 minutes the clear may still be landing, and past 3 hours the note belongs to some
// earlier clear rather than to this stall.
const NOTE_PARKED_MIN_MS = 2 * 60 * 1000
const NOTE_PARKED_MAX_MS = 180 * 60 * 1000

// The context bar, at or above this, says the clear never took. A desk clears at 20% and up
// (rules/desk-clear.md), and one that really cleared shows a few per cent or `ctx …`, so 12 is
// well clear of both edges. An unreadable bar (a narrow pane, or `ctx …`) reads as cleared and
// nothing fires.
const CTX_STILL_FULL = 12

// The liveness check. A desk must have been neither thinking nor running an agent for this
// long, measured across passes rather than at the instant, before it is asked what is up. The
// question sweep runs every thirty minutes, so 25 minutes means two passes in a row saw the
// same quiet pane.
// Both are overridable so a run against a scratch tmux server can exercise the quiet path in
// seconds and against its own state file, instead of waiting out two real passes.
const QUIET_MS = Number(process.env.UNSTUCKER_QUIET_MS || 25 * 60 * 1000)

// And how long before the same pane is asked again. Without it a desk that answers the
// check-in and then goes quiet again would be asked every second pass all night, which is the
// nagging Todd asked us to avoid: "you just say hey, just checking in… what's up", once.
const ASK_COOLDOWN_MS = Number(process.env.UNSTUCKER_ASK_COOLDOWN_MS || 2 * 60 * 60 * 1000)
const STATE_FILE = process.env.UNSTUCKER_STATE_FILE ||
  resolve(process.env.HOME || '', '.local/state/unstucker-state.json')

// The hung-turn release: only these lanes, only past this long. The two scripts it calls are
// overridable so the tests can point them at stubs and never write a real inbox or retro file.
const HUNG_LANES = ['build', 'watcher']
const HUNG_MS = 30 * 60 * 1000

// What a desk is told after its approval prompt is escaped. It cannot be answered overnight,
// and leaving it up costs the desk the whole night, so the prompt goes and the ask becomes a
// question on the ticket, where Todd answers it on the board like any other.
const PERMISSION_MESSAGE =
  'Unstucker: a permission prompt was waiting here with nobody awake to answer it, so I pressed ' +
  'Escape. Put what you needed approved on the ticket as a question for Todd and carry on with ' +
  'whatever does not need it.'

const QUIET_MESSAGE =
  'Unstucker: just checking in — nothing is thinking in this pane and no subagent is running. ' +
  "What are you waiting on? If it is a question for Todd, put it on the ticket and carry on."

const V2 = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const INBOX_WRITE = process.env.UNSTUCKER_INBOX_WRITE || resolve(V2, 'scripts', 'inbox-write.mjs')
const RETRO_APPEND = process.env.UNSTUCKER_RETRO_APPEND || resolve(V2, 'scripts', 'retrospective-append.mjs')
let lanes = {}
try { lanes = readLanesDocument({ v2: V2 }) } catch { lanes = {} }
const pickupPath = (lane) => {
  const folder = lanes[lane]?.folder
  if (!folder) return null
  const note = resolve(V2, folder, 'PICKUP.md')
  return existsSync(note) ? note : null
}
const noteParked = (note) => {
  if (!note) return false
  const age = Date.now() - statSync(note).mtimeMs
  return age >= NOTE_PARKED_MIN_MS && age <= NOTE_PARKED_MAX_MS
}

// Panes a detached `self-clear.mjs --watch <pane>` is still polling. While one is alive the
// pickup line is still coming, so those panes are left alone.
// T-412: a process counts only when it IS that watcher: node running self-clear.mjs with
// `--watch <pane>` as its next two arguments, read from /proc the way self-clear.mjs's own
// retireOlderWatchers reads it. A command line that merely contains the text (a shell that
// mentions it, this script's own pgrep) is not a watcher.
const watchedPanes = () => {
  const found = new Set()
  let pids = []
  try { pids = readdirSync('/proc').filter((d) => /^\d+$/.test(d)) } catch { return found }
  for (const pid of pids) {
    let argv
    try { argv = readFileSync(`/proc/${pid}/cmdline`, 'utf8').split('\0') } catch { continue }
    if (!/^node(\d|$)/.test(basename(argv[0] || ''))) continue
    if (!(argv[1] || '').endsWith('self-clear.mjs') || argv[2] !== '--watch') continue
    if (/^%\d+$|^w\w*:p\w+$/.test(argv[3] || '')) found.add(argv[3])   // a tmux id, or a herdr one (w1:p1C)
  }
  return found
}

// What the last pass saw, per pane: the transcript fingerprint, the context bar, when this
// quiet spell started and whether it has already been asked about. Missing or unreadable reads
// as an empty slate, which only ever delays a nudge by one pass.
const loadState = () => {
  try { return JSON.parse(readFileSync(STATE_FILE, 'utf8')) } catch { return {} }
}
const saveState = (st) => {
  try {
    mkdirSync(dirname(STATE_FILE), { recursive: true })
    writeFileSync(STATE_FILE, JSON.stringify(st, null, 2))
  } catch (err) {
    console.error(`  (could not write ${STATE_FILE}: ${err.message})`)
  }
}

const tmux = (...a) => execFileSync('tmux', a, { encoding: 'utf8' })

// Keystrokes need air between them. An Escape sent and then text sent in the same breath
// arrives as one escape sequence, and the terminal eats the Escape: fired at a permission
// prompt on a scratch pane it selected "1. Yes" and ran the command instead of cancelling it
// (2026-09-26). The same spacing is why self-clear.mjs separates a line from its Enter.
const pause = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms)

const strip = (l) => l.replace(/\x1b\]8;[^\x07\x1b]*(\x07|\x1b\\)/g, '').replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')

// A box edge: nothing but box-drawing characters and whitespace, and enough of them to be a
// real rule rather than a stray glyph. Covers the flat `────` box and the rounded `╭──╮` one.
const isBoxEdge = (s) => /^[\s─│╭╮╰╯├┤]+$/.test(s) && (s.match(/[─╭╮╰╯]/g) || []).length >= 10

// The desk panes, herdr first (lib/desk-pane.mjs: agents named `herdr-<lane>`, then tmux
// @peak_lane panes for lanes herdr does not have, so a desk is never nudged twice). In herdr
// only Claude desks are walked: every reading below is Claude Code's input box, and a cursor
// or agy desk's screen is a different shape this does not parse.
// Unnamed herdr agents are invisible to listDeskPanes (no herdr-<lane>); name them first.
ensureHerdrAgentNames({ dryRun, lanesJson: lanes, v2Root: V2 })
const panes = listDeskPanes()
  .filter((p) => p.world === 'tmux' || p.agent === 'claude')
  .filter((p) => !onlyLane || p.lane === onlyLane)
  .map((p) => ({ ...p, id: p.pane }))
const capture = (p) => readPane(p, { ansi: true })

if (panes.length === 0) {
  console.log(onlyLane ? `no herdr agent herdr-${onlyLane} and no tmux pane with @peak_lane ${onlyLane}` : 'no desk panes found (neither herdr nor tmux has one)')
  process.exit(0)
}

// Everything the pane says about the desk: which kind of quiet the input box is in, plus the
// three readings the clear and liveness cases need.
const state = (raw) => ({ ...readBox(raw), ...readSignals(raw) })

const readSignals = (raw) => {
  const bare = raw.split('\n').map(strip)

  // The context bar the statusline draws: `███░░░░░░░░░ 26%`. The first percentage is
  // context_window.used_percentage (~/.claude/statusline.py, ROW 2); `ctx …` means it is not
  // known yet, which is what a session shows before its first turn.
  // Read it from the bottom: the statusline is the last thing in the pane, so the nearest bar
  // above the foot is the live one rather than something left in the transcript.
  let ctx = null
  for (let i = bare.length - 1; i >= 0; i--) {
    const m = bare[i].match(/[█░]{4,}\s+(\d+)%/)
    if (m) { ctx = Number(m[1]); break }
  }

  // The agent panel under the box, when the desk has it open: a row per agent, the running
  // ones carrying an elapsed time and a token count, the finished ones saying `idle`.
  const agentRunning = bare.some((l) => /^\s*[●◯]\s+\S/.test(l) && /↓/.test(l) && !/\bidle\b/.test(l))

  // A fingerprint of the transcript and the input box, stopping at the last box edge so the
  // status rows are left out — they tick on their own (the five-hour countdown, the spend
  // figure) and would make a frozen pane look alive every pass.
  let lastEdge = -1
  for (let i = bare.length - 1; i >= 0; i--) {
    if (isBoxEdge(bare[i].replace(/\s+$/, ''))) { lastEdge = i; break }
  }
  const body = (lastEdge === -1 ? bare : bare.slice(0, lastEdge + 1)).join('\n')

  // T-412. A background shell the desk started, and that will wake it, is the status row's
  // `· 1 shell ·`. Read only below the last box edge: the transcript's own "1 shell still
  // running" is history, not the pane's state now.
  const foot = lastEdge === -1 ? [] : bare.slice(lastEdge + 1)
  const shellRunning = foot.some((l) => /(^|·)\s*[1-9]\d*\s+shells?\s*(·|$)/.test(l.trim()))
  return { ctx, agentRunning, shellRunning, fingerprint: createHash('sha1').update(body).digest('hex').slice(0, 16) }
}

const readBox = (raw) => {
  const lines = raw.split('\n')
  const bare = lines.map(strip)

  // Find the input box: a `❯` line touching one of the box's own edges. The edge above is the
  // usual tell, but Claude Code overdraws that top edge with a queued-message hint, so the
  // closing edge below counts too — reached across the box's contiguous content lines.
  // Scanning from the bottom finds the live box, not one scrolled up in the transcript.
  const touchesBox = (i) => {
    if (i >= 1 && isBoxEdge(bare[i - 1].replace(/\s+$/, ''))) return true
    for (let j = i + 1; j < Math.min(bare.length, i + 16); j++) {
      const s = bare[j].replace(/\s+$/, '')
      if (isBoxEdge(s)) return true
      if (s.trim() === '') return false      // a blank line means the box already closed
    }
    return false
  }
  let promptIdx = -1
  for (let i = bare.length - 1; i >= 1; i--) {
    if (/^\s*❯/.test(bare[i]) && touchesBox(i)) { promptIdx = i; break }
  }
  if (promptIdx === -1) {
    // A permission prompt replaces the input box rather than sitting in it, so there is no box
    // to find and the pane used to be skipped as if claude were not running — the hole in the
    // middle of this, since the Build desk is the pane most likely to hit one. Its shape:
    // numbered options after a `❯`, and `Esc to cancel` under them.
    const optionIdx = bare.findIndex((l) => /^\s*❯\s*\d+\./.test(l))
    if (optionIdx !== -1 && bare.slice(optionIdx).some((l) => /Esc to cancel/.test(l))) {
      const ask = bare.slice(0, optionIdx).reverse().find((l) => l.trim() && !isBoxEdge(l.replace(/\s+$/, '')))
      return { st: 'permission-dialog', after: (ask || '').trim().slice(0, 60) }
    }
    return { st: 'no-box', after: '' }
  }

  // Box content: the `❯` line plus its continuation lines, down to the closing edge.
  const first = bare[promptIdx].replace(/^\s*❯\s*/, '').replace(/\s+$/, '')
  const rest = []
  for (let i = promptIdx + 1; i < bare.length; i++) {
    const s = bare[i].replace(/\s+$/, '')
    if (isBoxEdge(s)) break
    rest.push(s.replace(/^\s\s/, ''))
  }
  const content = [first, ...rest].map((l) => l.trim()).filter(Boolean)
  const after = content.join(' ⏎ ')

  // A spinner above the box means the desk is mid-turn; leave it entirely alone.
  const above = bare.slice(0, promptIdx).reverse()
    .find((l) => l.trim() && !isBoxEdge(l.replace(/\s+$/, ''))) || ''
  // The spinner carries the turn's own clock, `… (31m 2s ·` or `… (1h 2m 3s ·`: turnMs is that,
  // or null when the line shows no clock.
  if (/(….*\(|esc to interrupt)/.test(above)) {
    const m = above.match(/…\s*\((?:(\d+)h\s*)?(?:(\d+)m\s*)?(?:(\d+)s)?\s*·/)
    const turnMs = m && (m[1] || m[2] || m[3])
      ? ((Number(m[1] || 0) * 60 + Number(m[2] || 0)) * 60 + Number(m[3] || 0)) * 1000
      : null
    return { st: 'running', after, turnMs }
  }

  // Claude Code's own greyed-out suggestion sits after the `❯` but is not typed input.
  const dimSuggestion = /\x1b\[2m/.test(lines[promptIdx].split('❯').slice(1).join(''))
  if (content.length === 0 || dimSuggestion) {
    // The post-clear prompt: an empty box whose only transcript line above it is the echoed
    // `❯ /clear`. Same rule self-clear.mjs's watcher uses to decide the clear has landed.
    if (/^[❯>]\s*\/clear$/.test(above.trim())) return { st: 'cleared', after: '' }
    // Otherwise: is the clear sequence's own printing still on the visible pane? If it has
    // scrolled off, the desk has done other things since and is not parked mid-clear.
    const clearTalk = bare.some((l) => CLEAR_MARKERS.some((re) => re.test(l.trim())))
    return { st: 'idle', after: '', clearTalk }
  }

  if (/^\d+\./.test(first) || content.some((l) => /\(Recommended\)/.test(l))) return { st: 'menu', after }
  if (content.every((l) => MACHINE_NOTICES.some((re) => re.test(l)))) return { st: 'stalled-notice', after }
  return { st: 'typed-text', after }
}

// Which states each mode acts on. The question sweep touches nothing but an open menu, so a
// run every thirty minutes cannot disturb a desk that is simply working or simply idle.
// A desk parked in the clear sequence is unstuck in both passes: the stall Todd watched
// happens overnight, and the thirty-minute sweep is the pass that is running then.
// A desk parked in the clear sequence, and a desk where nothing at all is happening, are
// unstuck in both passes: both stalls happen overnight, and the thirty-minute sweep is the
// pass that is running then.
const CLEAR_STATES = ['clear-stalled', 'cleared-no-pickup']
const ACTS_ON = {
  questions: ['menu', 'permission-dialog', ...CLEAR_STATES, 'quiet', 'hung'],
  reset: ['idle', 'menu', 'permission-dialog', 'stalled-notice', ...CLEAR_STATES, 'quiet', 'hung'],
}

// After a hung turn's Escape: tell the desk by its inbox, then log the hang for the retro.
// inbox-write.mjs does not commit, so the sender commits its file (v2/CLAUDE.md, Desk file inbox);
// retrospective-append.mjs commits its own. A failure of either is reported, never fatal.
const SLOPDOG_ROOT = resolve(homedir(), 'slopdog')
const tellHungRelease = (lane, mins) => {
  const text = `Unstucker: your turn had been running ${mins} min, past the 30-minute hang line, so I ` +
    'pressed Escape once to release it. Read your PICKUP.md and carry on; if a tool call or an agent ' +
    'wait was what hung, do not rerun it as it stood.'
  try {
    const path = execFileSync('node', [INBOX_WRITE, '--from', 'slopdog', '--to', lane, '--slug', 'hung-turn-released', '--text', text],
      { encoding: 'utf8' }).trim().split('\n').pop()
    if (path.startsWith(`${SLOPDOG_ROOT}/`)) {
      const rel = path.slice(SLOPDOG_ROOT.length + 1)
      execFileSync('git', ['add', rel], { cwd: SLOPDOG_ROOT })
      execFileSync('git', ['commit', '-q', '-m', `slopdog: hung-turn note to ${lane}`, '-m', 'Why: unstucker released a hung turn', '--', rel], { cwd: SLOPDOG_ROOT })
      execFileSync('git', ['push', '-q'], { cwd: SLOPDOG_ROOT, timeout: 60_000 })
    }
  } catch (err) { console.error(`  (hung-turn inbox note to ${lane} failed: ${err.message})`) }
  try {
    execFileSync('node', [RETRO_APPEND, '--ticket', 'none', '--department', 'slopdog',
      '--what', `[hardening] the ${lane} desk's turn hung ${mins} min; unstucker pressed Escape once to release it`,
      '--cost', `${mins} min of a stalled ${lane} desk, and every desk waiting on it`,
      '--prevention', 'find what the turn was waiting on (the desk was asked in its inbox) and give that wait its own timeout'],
      { encoding: 'utf8' })
  } catch (err) { console.error(`  (hung-turn retrospective line failed: ${err.message})`) }
}

// ---------------------------------------------------------------------------
// --mode focus (T-472). Its own path: no pane is ever typed into, nothing here
// touches ACTS_ON or the reset/questions loop below, and it exits before that
// loop runs.
if (mode === 'focus') {
  const CONTEXT_FILE = process.env.UNSTUCKER_CONTEXT_FILE || resolve(V2, 'context.yaml')
  const TASK_LIST_FILE = process.env.UNSTUCKER_TASK_LIST_FILE || resolve(homedir(), 'slopdog/tasks/task-list.md')
  const SLOPDOG = resolve(homedir(), 'slopdog')
  const FOCUS_STATE_FILE = process.env.UNSTUCKER_FOCUS_STATE_FILE ||
    resolve(process.env.HOME || '', '.local/state/unstucker-focus-state.json')

  let fctx = {}
  try { fctx = yaml.load(readFileSync(CONTEXT_FILE, 'utf8')) || {} } catch (err) {
    console.error(`focus sweep: can't read ${CONTEXT_FILE}: ${err.message}`)
    process.exit(1)
  }

  console.log(`${new Date().toISOString()} unstucker --mode focus${dryRun ? ' --dry-run' : ''}`)
  if (fctx.focus_mode !== 'on') {
    console.log(`  focus_mode is ${fctx.focus_mode || 'off'}: nothing to do`)
    process.exit(0)
  }

  // Settings, not constants: context.yaml's `focus_sweep:` block (T-472's step 5).
  const idleNudgeMin = Number(fctx.focus_sweep?.idle_nudge_min ?? 2)
  const secondNudgeMin = Number(fctx.focus_sweep?.second_nudge_min ?? 5)

  const loadFocusState = () => { try { return JSON.parse(readFileSync(FOCUS_STATE_FILE, 'utf8')) } catch { return {} } }
  const saveFocusState = (st) => {
    try { mkdirSync(dirname(FOCUS_STATE_FILE), { recursive: true }); writeFileSync(FOCUS_STATE_FILE, JSON.stringify(st, null, 2)) }
    catch (err) { console.error(`  (could not write ${FOCUS_STATE_FILE}: ${err.message})`) }
  }
  const focusState = loadFocusState()
  const report = []

  const isFuture = (dateVal) => {
    if (!dateVal) return false
    if (typeof dateVal === 'string') {
      const s = dateVal.trim().toLowerCase()
      if (s === 'tomorrow') return true
      if (s === 'yesterday' || s === 'today') return false
    }
    let dateStr = ''
    if (dateVal instanceof Date) {
      dateStr = dateVal.toISOString().slice(0, 10)
    } else if (typeof dateVal === 'string') {
      dateStr = dateVal.trim().slice(0, 10)
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
    const today = new Date().toISOString().slice(0, 10)
    return dateStr > today
  }

  const fmCache = new Map()
  const frontmatter = (file) => {
    if (!fmCache.has(file)) {
      try {
        const m = readFileSync(file, 'utf8').match(/^---\r?\n([\s\S]*?)\r?\n---/)
        fmCache.set(file, m ? (yaml.load(m[1]) || {}) : {})
      } catch { fmCache.set(file, {}) }
    }
    return fmCache.get(file)
  }

  // task-list.md's own row shape (update-focus-tasks.mjs parses the same file the same
  // way): `| <emoji> | [title](tickets/<file>.md)<br>#T<id> #E<n> #v<n> ... | <desc> |`.
  const ROW_RE = /^\|\s*(\S+)\s*\|\s*\[[^\]]*\]\((tickets\/[^)]+\.md)\)<br>([^|]*)\|/
  const rows = []
  for (const line of readFileSync(TASK_LIST_FILE, 'utf8').split('\n')) {
    const m = line.match(ROW_RE)
    if (!m) continue
    const [, status, file, tagsRaw] = m
    const idMatch = tagsRaw.match(/#T(\d[\d-]*)/)
    const projMatch = tagsRaw.match(/#(v\d+)\b/)
    if (!idMatch) continue
    const fullPath = resolve(homedir(), 'slopdog/tasks', file)
    const fm = frontmatter(fullPath)
    if (isFuture(fm.start_after)) continue
    rows.push({ status, id: `T-${idMatch[1]}`, file: fullPath, project: projMatch ? projMatch[1] : null })
  }
  const dispatcherFor = (file) => (frontmatter(file).verifier === 'ideas' ? 'ideas' : 'build')

  const writeInbox = (laneKey, slug, text) => {
    const folder = lanes[laneKey]?.folder
    if (!folder) { report.push(`(no registry folder for ${laneKey}, skipped: ${slug})`); return }
    if (dryRun) { report.push(`would write ${laneKey}/inbox/…-from-unstucker-${slug}.md: ${text}`); return }
    const inboxDir = resolve(V2, folder, 'inbox')
    mkdirSync(inboxDir, { recursive: true })
    const d = new Date()
    const pad = (n) => String(n).padStart(2, '0')
    const name = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}-from-unstucker-${slug}.md`
    writeFileSync(resolve(inboxDir, name), text.endsWith('\n') ? text : `${text}\n`)
    const rel = `v2/${folder}/inbox/${name}`
    try {
      execFileSync('git', ['add', rel], { cwd: SLOPDOG })
      execFileSync('git', ['commit', '-q', '-m', `watcher: focus sweep note to ${laneKey} (${slug})`, '-m', 'Auto: unstucker', '--', rel], { cwd: SLOPDOG })
      execFileSync('git', ['push', '-q'], { cwd: SLOPDOG, timeout: 60_000 })
    } catch (err) { console.error(`  (${rel} written but commit/push failed: ${err.message})`) }
    report.push(`wrote ${laneKey}/inbox/${name}`)
  }

  const focusNow = Date.now()

  // Condition 1: a desk pane idle at an empty prompt while a 🔵/🟡 ticket is assigned to it
  // (`worker:` in the ticket's own front matter — set ahead of the pickup, same as T-472's
  // own ticket carried `worker: scotty` while still 🔵). First nudge once idle for
  // idle_nudge_min, a second at second_nudge_min, then one escalation to the dispatcher —
  // Daphne for a meta ticket (`verifier: ideas`), Tyrion otherwise — and never again while
  // the same ticket stays assigned to the same desk.
  const IN_QUEUE = new Set(['🔵', '🟡'])
  for (const p of panes) {
    const assigned = rows.find((r) => IN_QUEUE.has(r.status) && frontmatter(r.file).worker === p.lane)
    const stateKey = `1:${p.lane}`
    if (!assigned) { delete focusState[stateKey]; continue }
    const { st } = readBox(capture(p))
    if (st !== 'idle') { delete focusState[stateKey]; continue }
    const prev = focusState[stateKey]
    if (!prev || prev.ticket !== assigned.id) {
      focusState[stateKey] = { ticket: assigned.id, idleSince: focusNow, stage: 0 }
      continue
    }
    const idleMin = (focusNow - prev.idleSince) / 60000
    if (prev.stage === 0 && idleMin >= idleNudgeMin) {
      writeInbox(p.lane, `${assigned.id}-idle-1`,
        `Unstucker focus sweep: ${assigned.id} is ${assigned.status} and assigned to you (\`worker\`), idle here for about ${Math.round(idleMin)} min. Pick it up, or put what's blocking you on the ticket.`)
      prev.stage = 1
    } else if (prev.stage === 1 && idleMin >= secondNudgeMin) {
      writeInbox(p.lane, `${assigned.id}-idle-2`,
        `Unstucker focus sweep: second nudge — ${assigned.id} is still not moving, idle here for about ${Math.round(idleMin)} min.`)
      prev.stage = 2
    } else if (prev.stage === 2) {
      writeInbox(dispatcherFor(assigned.file), `${assigned.id}-escalate`,
        `Unstucker focus sweep: ${p.lane} hasn't picked up ${assigned.id} (${assigned.status}, assigned) after two nudges, idle about ${Math.round(idleMin)} min.`)
      prev.stage = 3
    }
    // stage 3: escalated once; left alone from here while it stays assigned and idle.
  }

  // Conditions 2/3: the focus project — the `project` most `focus_tasks` rows carry — and
  // how many of its task-list.md tickets are still 🔵/🟡. Deduped by the project's current
  // ticket-id set, so a nudge is only repeated once that set actually changes.
  //
  // T-472 (Concerns, sent back): task-list.md's own row carries no project chip, only the
  // version tag (`#v2`, `rows`'s `project` field above) — the one thing update-focus-tasks.mjs
  // can hand its cheap Haiku pass without opening every ticket file, so it names the row
  // "slopdog-v2", "v2", or whatever wording that pass picked, always built around that same
  // tag. Comparing the two verbatim ("slopdog-v2" !== "v2") meant check 2 always fired (every
  // row looked project-less) and check 3 never could (inProject was always empty). Normalize
  // both sides to the bare `v<n>` the tag actually is before comparing.
  const versionTag = (s) => (String(s || '').match(/\bv\d+\b/) || [])[0] || null
  const projectCounts = {}
  for (const t of fctx.focus_tasks || []) {
    const v = versionTag(t.project)
    if (v) projectCounts[v] = (projectCounts[v] || 0) + 1
  }
  const focusProject = Object.entries(projectCounts).sort((a, b) => b[1] - a[1])[0]?.[0]
  if (focusProject) {
    const inProject = rows.filter((r) => r.project === focusProject)
    const openCount = inProject.filter((r) => IN_QUEUE.has(r.status)).length
    const idsHash = createHash('sha1').update(inProject.map((r) => r.id).sort().join(',')).digest('hex').slice(0, 12)
    if (inProject.length > 0 && openCount === 0 && inProject.every((r) => r.status === '🟩' || r.status === '🟠')) {
      const key = `3:${focusProject}`
      if (focusState[key]?.hash !== idsHash) {
        writeInbox('ideas', `${focusProject}-owed`,
          `Unstucker focus sweep: nothing left to build in the focus project (${focusProject}) — everything is 🟩 waiting on its batch review or 🟠 a question for Todd: ${inProject.map((r) => `${r.status} ${r.id}`).join(', ')}.`)
        focusState[key] = { hash: idsHash }
      }
      delete focusState[`2:${focusProject}`]
    } else if (openCount < 2) {
      const key = `2:${focusProject}`
      if (focusState[key]?.hash !== idsHash) {
        writeInbox('ideas', `${focusProject}-thin`,
          `Unstucker focus sweep: the focus project (${focusProject}) has only ${openCount} 🔵/🟡 ticket(s) left. Write the next ones from its "How this project ends" and Backlog.`)
        focusState[key] = { hash: idsHash }
      }
      delete focusState[`3:${focusProject}`]
    } else {
      delete focusState[`2:${focusProject}`]
      delete focusState[`3:${focusProject}`]
    }
  }

  if (report.length === 0) console.log('  nothing to do')
  for (const line of report) console.log(`  ${line}`)
  if (!dryRun) saveFocusState(focusState)
  process.exit(0)
}

const watched = watchedPanes()
const now = Date.now()
const before = loadState()
const after_ = {}

const report = []
for (const p of panes) {
  const key = `${p.lane}:${p.id}`
  const prev = before[key] || {}
  let { st, after, clearTalk, ctx, agentRunning, shellRunning, fingerprint, turnMs } = state(capture(p))

  // Liveness: thinking, an agent still running, a background shell still running, or a
  // transcript that moved since the last pass. Any of the four restarts the quiet clock and
  // forgives an earlier check-in.
  const moved = prev.fingerprint !== undefined && prev.fingerprint !== fingerprint
  const alive = st === 'running' || agentRunning || shellRunning || moved
  const quietSince = alive ? now : (prev.quietSince || now)
  const askedAt = prev.askedAt || null          // kept across spells, so the cooldown holds
  // The hang clock and its one Escape last only while the pane stays running.
  const runningSince = st === 'running' ? (prev.runningSince || now) : undefined
  const hungReleasedAt = st === 'running' ? prev.hungReleasedAt : undefined
  const turnFor = st === 'running' ? (turnMs ?? now - runningSince) : 0
  after_[key] = { lane: p.lane, seen: now, fingerprint, ctx, quietSince, askedAt, runningSince, hungReleasedAt }

  // The two clear-sequence stalls need more than the input box: the context bar, the age of
  // the desk's note, and whether a pickup watcher is still polling.
  const note = pickupPath(p.lane)
  if (st === 'running' && HUNG_LANES.includes(p.lane) && !hungReleasedAt && turnFor >= HUNG_MS) {
    st = 'hung'
  } else if (st === 'cleared') {
    st = watched.has(p.id) ? 'cleared-watched' : 'cleared-no-pickup'
  } else if (st === 'idle' && clearTalk && noteParked(note) && ctx !== null && ctx >= CTX_STILL_FULL) {
    st = 'clear-stalled'
  } else if (st === 'idle' && !alive && now - quietSince >= QUIET_MS &&
             now - (askedAt || 0) >= ASK_COOLDOWN_MS) {
    st = 'quiet'
  } else if (st === 'idle' && shellRunning) {
    // T-412. The desk is waiting on a shell that will wake it, so neither pass nudges it:
    // the reset line would interrupt a wait that is already going to end on its own.
    st = 'shell-running'
  } else if (st === 'idle' && agentRunning) {
    // T-414. Same for a background agent: its result arrives as a new turn, so the reset
    // line would only interrupt it.
    st = 'agent-running'
  }

  // The nudge is the line that never arrived, not a general reminder.
  let line = nudge
  if (st === 'cleared-no-pickup') line = note ? `/slopdog:pickup ${note}` : '/slopdog:pickup'
  if (st === 'clear-stalled') line = '/clear'
  if (st === 'quiet') line = QUIET_MESSAGE
  if (st === 'permission-dialog') line = PERMISSION_MESSAGE

  if (!ACTS_ON[mode].includes(st)) {
    const quietFor = Math.round((now - quietSince) / 60000)
    const why = {
      running: hungReleasedAt
        ? `left alone, hung turn already escaped ${Math.round((now - hungReleasedAt) / 60000)} min ago`
        : 'left alone, mid-turn',
      idle: askedAt && now - askedAt < ASK_COOLDOWN_MS
        ? `left alone, idle and already asked ${Math.round((now - askedAt) / 60000)} min ago`
        : `left alone, idle with no question open (quiet ${quietFor} min)`,
      'stalled-notice': 'left alone, unsent notice but not the reset pass',
      'cleared-watched': 'left alone, just cleared and a pickup watcher is still polling',
      'shell-running': 'left alone, idle with a background shell running that will wake it',
      'agent-running': 'left alone, idle with a background agent running that will wake it',
      'typed-text': `SKIPPED, a human's unsent text in the box: ${JSON.stringify(after.slice(0, 60))}`,
      'no-box': 'SKIPPED, no claude input box in this pane',
    }[st] || `left alone (${st})`
    report.push(`${p.lane} (${p.id}): ${why}`)
    continue
  }

  // The screen alone cannot see a background agent the desk is waiting on: the prompt looks idle
  // and empty. herdr's agent status can, so on herdr a pane it calls working or blocked is not
  // typed into, except to answer a menu or a permission dialog, which are what `blocked` is for.
  const dialog = st === 'menu' || st === 'permission-dialog'
  const busy = p.world === 'herdr' && !dialog && st !== 'hung' ? herdrBusy(p) : ''
  if (busy) {
    report.push(`${p.lane} (${p.id}): left alone, herdr says the agent is ${busy} (would have been ${st})`)
    continue
  }

  // A stalled notice is submitted as it stands: press Enter, type nothing.
  const submitOnly = st === 'stalled-notice'
  const what = {
    'permission-dialog': `escape the approval prompt nobody is awake to answer (${JSON.stringify(after)})`,
    'clear-stalled': `re-type the /clear that never took (context still ${ctx}%)`,
    'cleared-no-pickup': `type the pickup line that never arrived: ${line}`,
    'hung': `release a turn hung ${Math.round(turnFor / 60000)} min (one Escape, then an inbox note and a retro line)`,
    'quiet': `ask what it is waiting on (nothing thinking, no agent running, ${Math.round((now - quietSince) / 60000)} min)`,
  }[st] || (submitOnly ? 'submit the unsent notice' : `nudge (${st})`)
  if (dryRun) {
    report.push(`${p.lane} (${p.id}): would ${what}`)
    continue
  }
  if (p.world === 'tmux' && p.inMode) tmux('send-keys', '-t', p.id, '-X', 'cancel')   // copy mode swallows Enter
  if (st === 'hung') {
    // One Escape and nothing typed: the desk hears why from its inbox, not its prompt.
    sendKeys(p, p.world === 'herdr' ? 'esc' : 'Escape')
    after_[key].hungReleasedAt = now
    tellHungRelease(p.lane, Math.round(turnFor / 60000))
    report.push(`${p.lane} (${p.id}): did ${what}`)
    continue
  }
  if (st === 'menu' || st === 'permission-dialog') {
    sendKeys(p, p.world === 'herdr' ? 'esc' : 'Escape')
    pause(500)
  }
  // readBox above already refused typed-text, and a menu's own rows would trip typeLine's guard.
  if (p.world === 'herdr') assertCanTypeHerdrPane(p.pane)
  if (!submitOnly) typeLine(p, line, { enter: false, guard: false })
  pause(300)
  sendKeys(p, 'Enter')
  if (st === 'quiet') after_[key].askedAt = now     // one check-in per quiet spell, not one per pass
  report.push(`${p.lane} (${p.id}): did ${what}`)
}

// Keep only what this run saw, plus anything seen in the last day, so a pane that goes away
// does not sit in the file forever.
if (!dryRun) {
  for (const [k, v] of Object.entries(before)) {
    if (!after_[k] && v.seen && now - v.seen < 24 * 60 * 60 * 1000) after_[k] = v
  }
  saveState(after_)
}

console.log(`${new Date().toISOString()} unstucker --mode ${mode}${dryRun ? ' --dry-run' : ''}`)
for (const line of report) console.log(`  ${line}`)
