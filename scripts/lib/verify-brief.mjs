#!/usr/bin/env node
// verify-brief — the one place a verify brief is chosen and a verify reply is read (T-742, T-741 rows
// 9, 10, 11, 17-22). Two briefs: the trusted brief for a high-reasoning rung (Data on the escalation
// lane), short and judgement-led but still asking for proof, and the prescriptive brief for the cheap
// lane's verifier, with exact commands. The pathway picks the rung from build-ladder.json and the
// ticket's points pick the brief through `verify_brief_by_points`: every verifier is Opus now, so the
// brief follows the size of the ticket, not the model (the Captain's default, 2026-10-13). The design is
// v2/desks/research/reports/2026-10-11-when-and-how-to-verify.md, sections 1 to 4.
//
//   node v2/scripts/lib/verify-brief.mjs --pathway cheap|trusted --ticket <path> [--points N] [--strikes N]
//       prints the brief that pathway gets, for the task-verify and build-ticket skills
//
// Also here: the one verdict parser (GREEN, RED or INCONCLUSIVE; two different verdicts or none is
// INCONCLUSIVE and never GREEN), the verify log's parser and renderer for `## Progress notes`, the
// strike category a RED reply maps to, and the ticket's Red-check commands.
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { homedir } from 'node:os'
import { loadLadder, rungLabel, ticketPoints, verifierFor, escalationTarget, countStrikes } from './build-ladder.mjs'

const V2 = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
export const VERIFY_FAIL_PATH = join(V2, 'plugins', 'slopdog', 'session', 'build-ticket', 'scripts', 'verify-fail.mjs')
export const RUNNER_REPO = join(homedir(), 'slopdog', 'dev', 'playground', 'slopdog-ticket-runner')
export const RUNNER_VERIFY_SKILL = join(RUNNER_REPO, '.claude', 'skills', 'verify', 'SKILL.md')
export const STYLES = ['trusted', 'prescriptive']
export const PATHWAYS = ['cheap', 'trusted']
export const VERDICTS = ['GREEN', 'RED', 'INCONCLUSIVE']
// A category the verifier invents, or none at all, is the verifier's problem and never a strike.
export const UNKNOWN_CATEGORY = 'verifier-error'

// ---------- categories ----------

/** verify-fail.mjs's CATEGORIES, read as text: importing that script would run its CLI. */
export function verifyCategories(path = VERIFY_FAIL_PATH) {
  const m = readFileSync(path, 'utf8').match(/export const CATEGORIES\s*=\s*\[([^\]]*)\]/)
  if (!m) throw new Error(`verify-brief: no CATEGORIES list in ${path}`)
  const cats = [...m[1].matchAll(/['"]([a-z-]+)['"]/g)].map((x) => x[1])
  if (!cats.includes(UNKNOWN_CATEGORY)) throw new Error(`verify-brief: ${path} has no ${UNKNOWN_CATEGORY} category`)
  return cats
}

/** The category a RED reply's `Category:` maps to: itself when verify-fail.mjs knows it, else verifier-error. */
export function strikeCategoryFor(said, { categories = verifyCategories() } = {}) {
  const s = String(said || '').trim().toLowerCase()
  return categories.includes(s) ? s : UNKNOWN_CATEGORY
}

/** One sentence listing every category, marking the ladder's strike_categories. */
export function categorySentence(ladder = loadLadder(), categories = verifyCategories()) {
  const strikes = new Set(ladder.strike_categories)
  return categories.map((c) => `${c} (${strikes.has(c) ? 'a strike against the builder' : 'no strike'})`).join(', ')
}

// ---------- selection ----------

/** The rung that verifies on a pathway: the cheap lane's verifier by points, or the escalation rung. */
export function verifyRung({ pathway, points }, ladder = loadLadder()) {
  if (!PATHWAYS.includes(pathway)) throw new Error(`verify-brief: pathway must be one of ${PATHWAYS.join(', ')}, not ${pathway}`)
  return pathway === 'trusted' ? escalationTarget(ladder) : verifierFor(points, ladder)
}

/** The brief style a verify run gets. The escalated (trusted) pathway always gets `trusted`; the cheap
 *  pathway reads build-ladder.json's verify_brief_by_points by the ticket's points: exact key, else the
 *  next listed value up, else the largest, unknown points take the smallest; `prescriptive` with no map. */
export function briefStyle({ pathway, points }, ladder = loadLadder()) {
  if (pathway === 'trusted') return 'trusted'
  const map = ladder.verify_brief_by_points
  if (!map || !Object.keys(map).length) return 'prescriptive'
  const keys = Object.keys(map).map(Number).sort((a, b) => a - b)
  const p = Number(points)
  const k = Number.isFinite(p) && p > 0 ? (keys.find((x) => x >= p) ?? keys[keys.length - 1]) : keys[0]
  const style = map[String(k)]
  if (!STYLES.includes(style)) throw new Error(`verify-brief: verify_brief_by_points.${k} is ${style}, not one of ${STYLES.join(', ')}`)
  return style
}

/** §3.1 rows: 1 (1-2 points), 2 (3-5 points), 3 (8 points or escalated). A previous RED moves up one. */
export function depthRow({ pathway, points, priorReds = 0 }) {
  const p = Number(points) || 0
  let row = pathway === 'trusted' || p >= 8 ? 3 : p >= 3 ? 2 : 1
  if (priorReds) row = Math.min(3, row + 1)
  return row
}

const DEPTH = {
  1: 'run every Verify line and acceptance criterion as written, one happy path, and one unhappy path where the ticket has one',
  2: 'run every Verify line and acceptance criterion as written, one happy path, and every unhappy path the ticket names, against the real app and real data; confirm each automated criterion has a check that actually ran and observes the changed output',
  3: 'run at least two happy paths and, where possible, two unhappy paths, all against the real app and real data, as well as every Verify line and acceptance criterion as written',
}

// ---------- the two briefs ----------

const LOG_SHAPE = [
  'Verify log:',
  '- Ran: <each command, page visit or check, named so someone else could run it again>',
  '- Saw (happy): <the output or behaviour, quoted briefly>',
  '- Saw (unhappy): <the same for the unhappy path, or "none possible: <why>">',
  '- Verdict: <GREEN, RED or INCONCLUSIVE>, <one sentence saying why>',
].join('\n')

function trustedBrief({ ticketPath, row }) {
  return [
    `Prove the work on this ticket and leave the record: ${ticketPath}.`,
    'Todd\'s words: "prove it for at least one or two happy paths and if possible a couple of the non-happy paths as well and leave a clear record of what you did. It could be as simple as that."',
    `Pick the method yourself, but it must be a check that actually ran, against the real app and real data, with what you saw quoted; a fixture-only pass is INCONCLUSIVE, not GREEN.${row >= 3 ? ' At this size, run at least two happy paths and, where possible, two unhappy paths.' : ''}`,
    'Run the ticket\'s own acceptance criteria and every Red-check command under its ## Hand-off as well as anything you add; tests you wrote yourself are not proof on their own.',
    'Write the record under the ticket\'s ## Progress notes, before the 🟩 note, as "- <YYYY-MM-DD HH:MM> · <your name> · verify log" with these four indented lines:',
    LOG_SHAPE.split('\n').slice(1).map((l) => `  ${l}`).join('\n'),
  ].join('\n')
}

function prescriptiveBrief({ ticketPath, tid, buildDir, branch, points, row, ladder, runnerSkill }) {
  const probe = row >= 2
  const lines = [
    `You are checking a build you did not write: ticket ${tid || ''} at ${ticketPath}. Try to disprove the builder's claims; do not fix anything.`.replace('ticket  at', 'ticket at'),
    buildDir ? `The build is on branch ${branch}, checked out in your working directory ${buildDir}; run everything there.` : 'Run everything in your working directory.',
    `Depth: a ${points ?? 'no'}-point ticket, so ${DEPTH[row]}. Go one level deeper if \`git diff --stat main...HEAD\` shows over about 500 lines, the ticket has more than five acceptance criteria, or the change touches secrets, authentication, deleting or rewriting data, or git on the shared tree.`,
    '',
    'Do these in order, and keep each command you run and what it printed:',
    '1. Read the ticket\'s ## Steps, ## Acceptance Criteria and ## Hand-off. The Hand-off block is the builder\'s claims, not evidence.',
    '2. Run every step\'s `Verify:` line exactly as written, and every `Red-check: AC-n · <command> · <hash>` command under ## Hand-off. Run any script the build changed by its ~/slopdog path as well as its /storage path. Run the existing test suites of the files in `git diff --name-only main...HEAD`; a failure main already has is not the builder\'s.',
    '3. For each test-first criterion (one with a Red-check line), check out its red commit in a scratch worktree (`git worktree add <scratch dir> <hash>`), run the command there and confirm it failed for the reason the criterion names; then remove that worktree. A missing red commit, or a check that passes at it, is RED code-defect.',
    `4. Read every test the build added or changed (\`git diff main...HEAD\`). A test that passes by construction (asserts what it just set up, asserts on source text, only checks that nothing threw, only inspects mocks or logs, or mocks the code we own that the change touches) is RED code-defect.${probe ? ' For each automated criterion, make one small breaking edit to the code it covers, rerun its check, confirm it now fails, then undo the edit with `git checkout -- <file>`; a check that still passes is RED code-defect.' : ''}`,
    '5. Spec check: write three lists, each item quoting the ticket line it rests on. Missing: what the ticket asks for that the build does not do. Scope creep: what the build does that the ticket did not ask for. Wrong: what the build does differently from the ticket. Anything missing or wrong is RED; scope creep alone goes into the log for Todd and is not RED.',
    '6. Run the change against the real app and real data, covering the paths the depth above asks for. A pass that only ran against fixtures or mocks is not proof: give INCONCLUSIVE with the reason, not GREEN.',
  ]
  if (runnerSkill) lines.push(`7. If the build touches ${RUNNER_REPO}, follow ${runnerSkill}: run its Launch, Doctor and Drive steps for the board features the ticket touches, and quote its Evidence under Saw.`)
  lines.push(
    '',
    'End your reply with the verify log, in exactly this shape, then the verdict line:',
    LOG_SHAPE,
    '',
    'The last line is exactly "Verdict: GREEN", "Verdict: RED" or "Verdict: INCONCLUSIVE", the same verdict as the log\'s own Verdict line. Write a Verdict line nowhere else; a reply with two different verdicts, or none, counts as INCONCLUSIVE and is never merged.',
    'After GREEN, add one line "Evidence: As a user, you can now <what Todd can now do>. <One sentence saying how you checked it on real data.>". GREEN with no Ran or Saw (happy) line is treated as INCONCLUSIVE.',
    `After RED, add a line "AC: AC-n" naming the first failing criterion, a line "Category: <one of ${categorySentence(ladder)}>", then what failed, since that text goes back to the builder.`,
    'After INCONCLUSIVE, add a line "Reason: <what stopped you from proving it either way>".',
  )
  return lines.join('\n')
}

/** The verify brief for a pathway: { style, rung, label, row, text }. `ticketText` defaults to reading ticketPath. */
export function verifyBrief({ pathway, points, ticketPath, ticketText, tid, buildDir, branch, strikes, ladder = loadLadder(), runnerSkillPath = RUNNER_VERIFY_SKILL } = {}) {
  const text = ticketText ?? (ticketPath && existsSync(ticketPath) ? readFileSync(ticketPath, 'utf8') : '')
  const pts = points ?? ticketPoints(text)
  const n = strikes ?? (text ? countStrikes(text, ladder) : 0)
  const id = tid || (text.match(/^id:\s*"?([\w.-]+)/m) || [])[1] || ''
  const rung = verifyRung({ pathway, points: pts }, ladder)
  const style = briefStyle({ pathway, points: pts }, ladder)
  const row = depthRow({ pathway, points: pts, priorReds: n })
  const runnerSkill = runnerSkillPath && existsSync(runnerSkillPath) ? runnerSkillPath : null
  const body = style === 'trusted'
    ? trustedBrief({ ticketPath, row })
    : prescriptiveBrief({ ticketPath, tid: id, buildDir, branch, points: pts, row, ladder, runnerSkill })
  return { style, rung, label: rungLabel(rung), row, text: body }
}

// ---------- reading the reply ----------

const VERDICT_LINE = /^\s*(?:[-*]\s+)?(?:\*\*)?verdict(?:\*\*)?\s*:?\s*(?:\*\*)?\s*(GREEN|RED|INCONCLUSIVE)\b/i
const stripFences = (t) => String(t || '').replace(/```[\s\S]*?(?:```|$)/g, '')

/** The one verdict parser. Every line that starts with a Verdict label counts (fenced code is skipped).
 *  One distinct verdict: that verdict. Two different ones, or none: INCONCLUSIVE, never GREEN. */
export function parseVerdict(text) {
  const found = []
  for (const line of stripFences(text).split('\n')) {
    const m = line.match(VERDICT_LINE)
    if (m) found.push(m[1].toUpperCase())
  }
  const distinct = [...new Set(found)]
  if (distinct.length === 1) return { verdict: distinct[0], found, why: '' }
  if (distinct.length === 0) return { verdict: 'INCONCLUSIVE', found, why: 'no verdict', noVerdict: true }
  return { verdict: 'INCONCLUSIVE', found, why: `the reply gave more than one verdict (${distinct.join(' and ')})` }
}

const FIELDS = [
  ['ran', /^ran$/i],
  ['sawHappy', /^saw\s*\(happy\)$/i],
  ['sawUnhappy', /^saw\s*\(unhappy\)$/i],
  ['verdict', /^verdict$/i],
]

/** The §4 fields from a reply: { ran, sawHappy, sawUnhappy, verdictLine }. A field may run onto
 *  indented continuation lines. Missing fields are ''. */
export function parseVerifyLog(text) {
  const out = { ran: '', sawHappy: '', sawUnhappy: '', verdictLine: '' }
  let cur = null
  for (const raw of stripFences(text).split('\n')) {
    const m = raw.match(/^\s*(?:[-*]\s+)?(?:\*\*)?([A-Za-z ()]+?)(?:\*\*)?\s*:\s*(.*)$/)
    const field = m && FIELDS.find(([, re]) => re.test(m[1].trim()))
    if (field) {
      cur = field[0] === 'verdict' ? 'verdictLine' : field[0]
      // The first occurrence wins, except Verdict, where the log's line (with its sentence) beats the bare last line.
      if (cur === 'verdictLine') { if (!out.verdictLine || m[2].trim().length > out.verdictLine.length) out.verdictLine = m[2].trim() }
      else if (!out[cur]) out[cur] = m[2].trim()
      else cur = null
      continue
    }
    if (cur && cur !== 'verdictLine' && /^\s{2,}\S/.test(raw) && !/^\s*(?:[-*]\s+)?(AC|Category|Evidence|Reason)\s*:/i.test(raw)) {
      out[cur] = `${out[cur]}; ${raw.trim().replace(/^[-*]\s+/, '')}`.replace(/^; /, '')
    } else cur = null
  }
  return out
}

/** True when a reply's log carries what a GREEN needs: what ran and what was seen on a happy path. */
export function logIsComplete(log) {
  return Boolean(log && log.ran && log.sawHappy)
}

const clip = (s, n = 600) => {
  const t = String(s || '').replace(/\s+/g, ' ').trim()
  return t.length > n ? `${t.slice(0, n - 1)}…` : t
}
const pad = (n) => String(n).padStart(2, '0')
export function localStamp(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/** The §4 block for `## Progress notes`. The verdict sentence is the log's own when it gave one. */
export function renderVerifyLog({ stamp = localStamp(), who, ran, sawHappy, sawUnhappy, verdict, why }) {
  if (!VERDICTS.includes(verdict)) throw new Error(`verify-brief: verdict must be one of ${VERDICTS.join(', ')}`)
  const missing = 'not given by the verifier'
  return [
    `- ${stamp} · ${who} · verify log`,
    `  - Ran: ${clip(ran) || missing}`,
    `  - Saw (happy): ${clip(sawHappy) || missing}`,
    `  - Saw (unhappy): ${clip(sawUnhappy) || missing}`,
    `  - Verdict: ${verdict}, ${clip(why, 300) || 'no reason given'}`,
  ].join('\n')
}

/** The sentence after the verdict word on the log's Verdict line ("GREEN, all three paths ran" → "all three paths ran"). */
export function verdictSentence(verdictLine) {
  return String(verdictLine || '').replace(/^\s*(GREEN|RED|INCONCLUSIVE)\b[\s,.:;—-]*/i, '').trim()
}

/** A RED reply's details: the criterion, the category as said, and the text that goes back to the builder. */
export function parseRedDetails(text) {
  const t = String(text || '')
  const lines = t.split('\n')
  let last = -1
  lines.forEach((l, i) => { if (VERDICT_LINE.test(l)) last = i })
  const after = (last === -1 ? lines : lines.slice(last + 1)).join('\n').trim() || t.trim()
  const ac = (after.match(/^\s*AC:\s*(AC-\d+)/m) || after.match(/\b(AC-\d+)\b/) || t.match(/^\s*AC:\s*(AC-\d+)/m) || [])[1] || 'AC-1'
  const said = (after.match(/^\s*Category:\s*([a-z-]+)/im) || after.match(/verify failed \[([a-z-]+)\]/) || t.match(/^\s*Category:\s*([a-z-]+)/im) || [])[1] || ''
  const reason = after.split('\n')
    .filter((l) => !/^\s*(AC|Category):/i.test(l))
    .join(' ')
    .replace(/verify failed \[[a-z-]+\]\s*(AC-\d+:)?\s*/gi, '')
    .replace(/\s+/g, ' ').trim().slice(0, 400)
  return { ac, said, reason }
}

/** The ticket's `Red-check: AC-n · <command> · <hash>` lines: [{ ac, cmd, hash }]. */
export function redCheckCommands(ticketText) {
  const out = []
  for (const m of String(ticketText || '').matchAll(/^Red-check:\s*(AC-\d+)\s*·\s*(.+?)\s*·\s*([0-9a-f]{7,40})\s*$/gm)) out.push({ ac: m[1], cmd: m[2], hash: m[3] })
  return out
}

// ---------- CLI ----------

if (process.argv[1] && realpathSync(process.argv[1]) === realpathSync(fileURLToPath(import.meta.url))) {
  const a = process.argv.slice(2)
  const get = (k) => { const i = a.indexOf(k); return i === -1 ? undefined : a[i + 1] }
  const pathway = get('--pathway') || 'cheap'
  const ticketPath = get('--ticket')
  if (!ticketPath) { console.error('usage: verify-brief.mjs --pathway cheap|trusted --ticket <path> [--points N] [--strikes N]'); process.exit(2) }
  const b = verifyBrief({ pathway, ticketPath, points: get('--points') ? Number(get('--points')) : undefined, strikes: get('--strikes') ? Number(get('--strikes')) : undefined })
  console.log(`# verify brief: ${b.style}, ${b.label}, depth row ${b.row}\n\n${b.text}`)
}
