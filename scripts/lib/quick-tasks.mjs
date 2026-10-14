// quick-tasks — the Quick tasks page, shared by every watch panel that shows it.
//
// Todd, 2026-10-06: one codebase for the page. It lived inside buildwatch.mjs (bw); the Mac
// publish desk mounts the same page in publishwatch.mjs (pw). Everything the page does is here:
// the list, the detail line, the marks and colours, the legend, the space menu, the send-with-note
// text box, the footer, the background sweep, and the file edits behind the actions. The host
// keeps its own cursor, paging and drawing.
//
//   import { createQuickTasks } from './lib/quick-tasks.mjs'
//   const qt = createQuickTasks({ palette, redraw, width })
//   qt.list(W)          -> { head: [string], items: [{ line, wrap?, path?, heading? }] }
//   qt.footer()         -> the menu, the note box or a flash message, else null (host shows its own)
//   qt.onKey(key, item) -> true when the page consumed the key; item is the row under the cursor
//   qt.follow           -> after an action, the path the cursor should move to; the host moves
//                          the cursor to the row with that path and sets follow back to null
//
// palette: escape strings, all required.
//   text      main text colour (Catppuccin text)
//   grey      secondary text, the legend words and ages (overlay1)
//   dim       the detail line under the selected task (overlay0)
//   yellow    doing
//   red       blocked, the ⚠ on a failing done task, the b key
//   peach     queued, the q and s keys, the note box label
//   green     done and reviewed, the r key, flash messages
//   lavender  desk headings
//   mauve     page title, "actions", the note box caret
//   bg        the base background escape, painted behind the frame
//   reset     reset back to base-on-text (bw's R: \x1b[0m + bg + text)
//   bold      bold on (\x1b[1m)
//
// redraw(force) is called after an action changes something or a flash message expires.

import { readFileSync, readdirSync, statSync, writeFileSync, mkdirSync, renameSync } from 'node:fs'
import { execFile, execFileSync, spawn } from 'node:child_process'
import { basename, dirname, join } from 'node:path'
import { homedir } from 'node:os'
import { checkQuickTask } from '../quick-task-check.mjs'
import { readLanesDocument } from './registry.mjs'
import { subagentTier } from './build-ladder.mjs'

const V2 = join(homedir(), 'slopdog', 'v2')
// Todd, 2026-10-06: "use what the partner desk has, a simple task system, and move it system wide... a tab
// added to Build Watch for the status of tasks. There's no dispatcher, none of that, there's just
// a task board." and "We don't need the task ID; group by desk, like the sprint page groups by
// batch." So the page is the Sprint page's tree one level shallower: a desk at the margin, its
// tasks two spaces in, each with a status dot and its title. A done task drops off two days after
// its done: date, so the page shows what is moving rather than everything ever finished.
const quickDir = () => process.env.QUICK_TASKS_DIR || join(V2, 'quick-tasks')
const QUICK_ORDER = ['doing', 'blocked', 'queued', 'done', 'reviewed']
const QUICK_MARK = { reviewed: '☑' }

const vis = (s) => s.replace(/\x1b\[[0-9;]*m/g, '')
const clip = (s, n) => {
  if (!s) return ''
  const plain = vis(s)
  return plain.length <= n ? s : plain.slice(0, n - 1) + '…'
}
function safe(fn, fallback) {
  try { return fn() } catch { return fallback }
}
function frontMatter(file, limit = 2500) {
  const text = safe(() => readFileSync(file, 'utf8').slice(0, limit), null)
  if (!text) return null
  const m = text.match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  const fm = {}
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w+):\s*(.*)$/)
    if (kv) fm[kv[1]] = kv[2].replace(/^["']|["']$/g, '').trim()
  }
  return fm
}
// The selected row wraps its title, the way bw's Sprint page does: broken at spaces, each further
// line indented to start under the title's first character.
function wrapWords(s, n) {
  const out = []
  let cur = ''
  for (let w of s.split(/\s+/).filter(Boolean)) {
    while (w.length > n) { if (cur) { out.push(cur); cur = '' } out.push(w.slice(0, n)); w = w.slice(n) }
    if (!cur) cur = w
    else if (cur.length + 1 + w.length <= n) cur += ' ' + w
    else { out.push(cur); cur = w }
  }
  if (cur || !out.length) out.push(cur)
  return out
}
const wrapRow = (pre, title, titleW) => {
  const indent = ' '.repeat(vis(pre).length)
  return wrapWords(title, titleW).map((c, i) => (i ? indent : pre) + c)
}
// Packs whole coloured tokens (never splits one) onto as few lines as fit within W visible
// columns, each line pre-indented. Todd, 2026-10-10, on a small pane: "I need to be able to
// read them all... make it two lines... wrap them when it's too small." Joined with '\n', which
// every caller of list()/footer() already treats as one more screen line (head.join('\n').split
// in bw, flatMap((l) => l.split('\n')) in pw).
function wrapTokens(tokens, sep, W, indent = '  ') {
  const sepW = vis(sep).length
  const lines = []
  let cur = '', curW = 0
  for (const t of tokens) {
    const tW = vis(t).length
    const add = curW ? curW + sepW + tW : tW
    if (curW && add > W) { lines.push(indent + cur); cur = t; curW = tW }
    else { cur = curW ? cur + sep + t : t; curW = add }
  }
  lines.push(indent + cur)
  return lines.join('\n')
}
function touched(path) {
  const secs = (Date.now() - safe(() => statSync(path).mtimeMs, Date.now())) / 1000
  const v = secs < 60 ? 'now' : secs < 3600 ? `${Math.floor(secs / 60)}m` : secs < 86400 ? `${Math.floor(secs / 3600)}h` : secs < 604800 ? `${Math.floor(secs / 86400)}d` : `${Math.floor(secs / 604800)}w`
  return v.padStart(3)
}
const today = () => { const d = new Date(), p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}` }
const nowLocal = () => `${today()} ${new Date().toTimeString().slice(0, 5)}`
const quickStatus = (fm) => (fm.status === 'open' || !fm.status ? 'queued' : fm.status)

// ── the three activity rows under the highlighted task ──────────────────────
// Todd, 2026-10-08: when a task is highlighted, its detail area shows three rows, all read from the
// task file and git, no model call: (1) desk · status · priority · time since started or created;
// (2) plan step n of m and the now: line, or what blocks it, or what a failing done task is missing;
// (3) the last commit touching the file and the latest Notes line. A missing field shows a dash.
const ago = (secs) => {
  const s = Math.max(0, secs)
  return s < 3600 ? `${Math.floor(s / 60)}m` : s < 86400 ? `${Math.floor(s / 3600)}h` : `${Math.floor(s / 86400)}d`
}
const dash = (v) => (v && String(v).trim()) || '—'
// The numbered steps under ## Plan, stopped at the next ## heading.
function planSteps(text) {
  const sec = text.split(/^## Plan\s*$/m)[1]?.split(/^## /m)[0] || ''
  return sec.split('\n').filter((l) => /^\d+\.\s/.test(l)).map((l) => l.replace(/^\d+\.\s*/, ''))
}
const wordSet = (s) => new Set((s || '').toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 4))
// The 1-based step whose words share the most with the now: line; null when none shares any.
function planStepOf(steps, now) {
  const want = wordSet(now)
  let best = 0, n = null
  steps.forEach((s, i) => {
    const k = [...wordSet(s)].filter((w) => want.has(w)).length
    if (k > best) { best = k; n = i + 1 }
  })
  return n
}
// The last `- ` line under ## Notes, with its timestamp prefix removed.
function latestNote(text) {
  const notes = text.split(/^## Notes\s*$/m)[1]?.split(/^## /m)[0] || ''
  const last = notes.split('\n').filter((l) => /^- /.test(l)).pop() || ''
  return last.replace(/^- (\d{4}-\d\d-\d\d( \d\d:\d\d)?\s*[·:]?\s*)?/, '')
}
// Pure: the three plain rows (no colour) for one task. commit is { hash, ts } or null; check is the
// quick-task-check result; now is milliseconds, injectable for tests.
export function taskActivityRows({ text = '', fm = {}, name = '', check = { ok: true, missing: [] }, commit = null, now = Date.now() } = {}) {
  const status = quickStatus(fm)
  const startedNote = (text.match(/^- (\d{4}-\d\d-\d\d \d\d:\d\d):? started\b/m) || [])[1]
  const started = (startedNote && Date.parse(startedNote.replace(' ', 'T'))) || Date.parse(fm.created)
  // Labelled "started", never bare "19h old": the list's left-edge badge is a different clock
  // (the file's last touch), and the two can read hours apart on a done task last edited to mark
  // it so — Todd, 2026-10-10: "it says two hours... then it says 19 hours old... I don't even
  // know what that means."
  const age = Number.isNaN(started) ? '—' : `started ${ago((now - started) / 1000)} ago`
  const priority = fm.critical === 'true' ? 'critical' : dash(fm.priority)
  const row1 = `${name || dash(fm.desk)} · ${status} · ${priority} · ${age}`
  let row2
  if (status === 'blocked') row2 = `blocked by: ${dash(fm.blocked_by)}`
  else if (status === 'done' && check.ok === false) row2 = `missing: ${(check.missing || []).join(', ') || '—'}`
  else {
    const steps = planSteps(text)
    const n = planStepOf(steps, fm.now)
    row2 = `plan step ${n ?? '—'} of ${steps.length || '—'} · now: ${dash(fm.now)}`
  }
  const sha = commit ? `${commit.hash} ${ago(now / 1000 - commit.ts)} ago` : '—'
  // The commit leads row three, so the narrow pane's clip cuts the note, never the hash.
  return [row1, row2, `${sha} · ${dash(latestNote(text))}`]
}

// The last commit touching one task file: { hash, ts } in unix seconds, or null. One git log -1,
// cached per file mtime and at most once a minute, since it runs only for the highlighted row.
const commitCache = new Map()
// A desk's tasks as the tree Todd wrote: a node with an `id` sits under its `parent`, depth-first
// in id order, each tagged with its depth so the page can indent it. Tasks with no id (every quick
// task written before notiontime) come after, in the order they were given.
export function nestByParent(tasks) {
  const num = (id) => Number(String(id || '').replace(/\D/g, '')) || 0
  const withId = tasks.filter((t) => t.fm?.id)
  if (!withId.length) return tasks
  const ids = new Set(withId.map((t) => t.fm.id))
  const kids = (id) => withId.filter((t) => (ids.has(t.fm.parent) ? t.fm.parent : '') === id).sort((a, b) => num(a.fm.id) - num(b.fm.id))
  const out = []
  const walk = (id, depth) => {
    for (const t of kids(id)) {
      if (out.includes(t)) continue
      out.push(Object.assign(t, { depth }))
      walk(t.fm.id, depth + 1)
    }
  }
  walk('', 0)
  for (const t of withId) if (!out.includes(t)) out.push(Object.assign(t, { depth: 0 }))
  return [...out, ...tasks.filter((t) => !t.fm?.id)]
}

export function lastCommit(path) {
  const m = safe(() => statSync(path).mtimeMs, 0)
  const hit = commitCache.get(path)
  if (hit && hit.m === m && Date.now() - hit.at < 60000) return hit.c
  let c = null
  try {
    const [hash, ts] = execFileSync('git', ['log', '-1', '--format=%h %ct', '--', basename(path)], { cwd: dirname(path), encoding: 'utf8', timeout: 2000, stdio: ['ignore', 'pipe', 'ignore'] }).trim().split(' ')
    if (hash && ts) c = { hash, ts: Number(ts) }
  } catch { c = null }
  commitCache.set(path, { m, at: Date.now(), c })
  return c
}

export function criticalTrigger(sentence) {
  if (!sentence || typeof sentence !== 'string') return false
  return /\b(critical|important)\b/i.test(sentence)
}

// The executor's model and effort come from the subagent tiers in v2/config/build-ladder.json
// (Todd, 2026-10-13), never from this file. A task names its tier on a `tier:` front-matter line
// (sweep, default, hard or ceiling, picked from v2/config/subagent-tiers.md); a task with none takes
// the default tier. Points are only the size estimate and never pick a model; `critical: true` does not either.
export function executorFor(fm) {
  const { model, effort } = subagentTier(fm?.tier)
  return { model, effort }
}

// quick-task-add: trailing `critical` arg or whole-word important/critical in the sentence.
export function formatQuickTaskTitle(fm, title) {
  const t = title || ''
  return fm?.critical === 'true' ? `CRITICAL ${t}` : t
}

export function parseQuickTaskAddInput(raw) {
  const parts = (typeof raw === 'string' ? raw.trim().split(/\s+/) : [...raw]).filter(Boolean)
  let suffixCritical = false
  if (parts.length && parts[parts.length - 1].toLowerCase() === 'critical') {
    suffixCritical = true
    parts.pop()
  }
  const sentence = parts.join(' ')
  const critical = suffixCritical || criticalTrigger(sentence)
  let matched = null
  if (suffixCritical || /\bcritical\b/i.test(sentence)) matched = 'critical'
  else if (/\bimportant\b/i.test(sentence)) matched = 'important'
  return { sentence, critical, matched, criticalLine: critical ? 'critical: true' : 'critical:' }
}

// ── file helpers: plain edits, so every action stays zero-token ───────────
export function setStatus(path, status) {
  let t = readFileSync(path, 'utf8')
  t = t.replace(/^(---\n[\s\S]*?\n---)/, (fm) => {
    fm = /^status:.*$/m.test(fm) ? fm.replace(/^status:.*$/m, `status: ${status}`) : fm.replace(/\n---$/, `\nstatus: ${status}\n---`)
    if (status === 'done' || (status === 'reviewed' && !/^done:\s*\S/m.test(fm))) fm = /^done:.*$/m.test(fm) ? fm.replace(/^done:.*$/m, `done: ${today()}`) : fm.replace(/\n---$/, `\ndone: ${today()}\n---`)
    return fm
  })
  writeFileSync(path, t)
}
// The note goes at the end of the Notes section: before the next ## heading, or at the end.
export function appendNote(path, line) {
  const t = readFileSync(path, 'utf8')
  const at = t.search(/^## Notes\s*$/m)
  if (at < 0) return writeFileSync(path, t.replace(/\s*$/, `\n\n## Notes\n${line}\n`))
  const after = t.slice(at).search(/\n## (?!Notes)/)
  const end = after < 0 ? t.length : at + after
  writeFileSync(path, t.slice(0, end).replace(/\s*$/, `\n${line}\n`) + (after < 0 ? '' : '\n' + t.slice(end).replace(/^\n+/, '')))
}

export function createQuickTasks({ palette, redraw, width } = {}) {
  const P = palette
  const R = P.reset, B = P.bold, GREY = P.grey, DIM = P.dim
  const pageTitle = (name, sub) => `\n  ${P.mauve}${B}${name.toUpperCase()}${R}  ${GREY}${sub}${R}\n`

  // Todd, 2026-10-06: "Open and done, I don't know what they mean; queued and done are better
  // words." So the statuses are queued, doing, blocked, done, and a file still saying open reads as
  // queued, so nothing breaks while the files catch up. And "make done like a checkbox icon, that
  // would be more clear". Later the same day: "there's no reviewed for me to confirm it... queued,
  // then done, then reviewed. Reviewed gets the checkbox. Queued is orange, blocked is red." So done
  // (the desk says it did it) is a green dot, and reviewed (Todd has looked, set only from this
  // page's menu with r) is the green ☑.
  const QUICK_DOT = { queued: P.peach, doing: P.yellow, blocked: P.red, done: P.green, reviewed: P.green }
  const quickMark = (s) => `${QUICK_DOT[s] || GREY}${QUICK_MARK[s] || '●'}${R}`
  // Todd, 2026-10-06: a done task must say what was done, how it was verified and what concerns
  // remain. A done file that fails quick-task-check.mjs wears a red ⚠ instead of its dot, and its
  // detail line says what is missing, until the sweep (below) sends it back to doing. The check is
  // cached per file and re-run only when the file's mtime moves.
  const quickChecks = new Map()
  function quickCheck(path) {
    const m = safe(() => statSync(path).mtimeMs, 0)
    const hit = quickChecks.get(path)
    if (hit && hit.m === m) return hit.r
    const r = safe(() => checkQuickTask(path), { ok: true, missing: [] })
    quickChecks.set(path, { m, r })
    return r
  }
  const quickBad = (t) => quickStatus(t.fm) === 'done' && !quickCheck(t.path).ok
  const quickTaskMark = (t) => (quickBad(t) ? `${P.red}⚠${R}` : quickMark(quickStatus(t.fm)))
  // The sweep sends a failing done task back to its desk: quick-task-check.mjs --sweep, at most
  // once a minute, in the background so the redraw never waits on it or on git. The systemd timer
  // quick-task-sweep.timer runs the same sweep every two minutes when no watch panel is open.
  let quickSweptAt = 0
  function quickSweep() {
    if (Date.now() - quickSweptAt < 60000 || process.env.BW_NO_COMMIT) return
    quickSweptAt = Date.now()
    execFile(process.execPath, [join(V2, 'scripts', 'quick-task-check.mjs'), '--sweep'], { timeout: 120000 }, () => {})
  }
  function list(W = width ?? Math.min(process.stdout.columns || 100, 120) - 1) {
    quickSweep()
    // Todd, 2026-10-06: "a quick legend at the top of quick tasks to show statuses". One line,
    // each mark in the page's own colour, then the key that opens the action menu.
    const legendTokens = [...QUICK_ORDER.map((s) => `${quickMark(s)} ${GREY}${s}${R}`), `${GREY}· space: mark ${P.green}done${GREY} or ${P.lavender}send${GREY}${R}`]
    const legend = wrapTokens(legendTokens, '   ', W - 2)
    const head = [pageTitle('Quick tasks', 'small work a desk just does, by desk', W), legend]
    const lanes = safe(() => readLanesDocument({ v2: V2 }), {})
    const tasks = safe(() => readdirSync(quickDir()), []).filter((f) => /^\d{4}-\d\d-\d\d-.+\.md$/.test(f)).sort()
      .map((f) => ({ path: join(quickDir(), f), fm: frontMatter(join(quickDir(), f)) || {} }))
      .filter((t) => !(['done', 'reviewed'].includes(t.fm.status) && t.fm.done && Date.now() - Date.parse(t.fm.done) > 2 * 86400 * 1000))
    const byDesk = {}
    for (const t of tasks) (byDesk[t.fm.desk || 'no desk'] = byDesk[t.fm.desk || 'no desk'] || []).push(t)
    const items = []
    for (const desk of Object.keys(byDesk).sort()) {
      // Todd, 2026-10-06: "a double sort, by status, and then by the most recent touch, the most
      // recent at the top." Status order is QUICK_ORDER; inside a status, newest file edit first.
      const mt = (t) => safe(() => statSync(t.path).mtimeMs, 0)
      const flat = byDesk[desk].sort((a, b) => QUICK_ORDER.indexOf(quickStatus(a.fm)) - QUICK_ORDER.indexOf(quickStatus(b.fm)) || mt(b) - mt(a))
      // A task ingested from Notion carries id/parent (notiontime, 2026-10-11), so those are shown
      // as the tree Todd wrote: roots in id order, each child under its parent, indented by depth.
      // Everything without an id keeps the old flat status sort and follows the tree.
      const ts = nestByParent(flat)
      const name = lanes[desk]?.name || desk
      items.push({ line: `${P.lavender}${B}${name}${R}  ${GREY}${ts.length}${R}`, heading: true })
      for (const t of ts) {
        // Todd, 2026-10-06: "how long ago it was done... like three characters, 5m, 1h, 1d. Prefix it.
        // When it was last touched." The file's modification time is the last touch.
        const pre = `  ${GREY}${touched(t.path)}${R} ${quickTaskMark(t)} ${'  '.repeat(t.depth || 0)}`
        const title = formatQuickTaskTitle(t.fm, t.fm.title || t.path.split('/').pop())
        // The three activity rows ride in wrap(), so the host's window, which counts the selection's
        // lines, makes room for them the same way it does for a wrapped Sprint title.
        const wrap = () => {
          const rows = taskActivityRows({ text: safe(() => readFileSync(t.path, 'utf8'), ''), fm: t.fm, name, check: quickCheck(t.path), commit: lastCommit(t.path) })
          return [...wrapRow(pre, title, Math.max(12, W - 10)), ...rows.map((r) => '        ' + DIM + clip(r, W - 12) + R)]
        }
        items.push({ line: pre + clip(title, W - 10), path: t.path, wrap })
      }
    }
    if (!items.length) items.push({ line: `  ${GREY}no quick tasks in ~/slopdog/v2/quick-tasks${R}`, heading: true })
    return { head, items }
  }

  // The space-bar menu. Todd, 2026-10-06: "when I press space on a task it opens a quick little
  // thing like mark done or archive, or send to desk to do now, which appends a note I can add
  // there, so the desk responsible gets the original task plus my note." Every action is a plain
  // file edit, so it stays zero-token: q, b and r rewrite status:, a moves the file into
  // quick-tasks/archive/ (which the page never reads), s takes a one-line note and sends.
  // There is no done key. Todd, 2026-10-06, reviewing it: he only reviews; desks mark done. A done
  // set from here carried no notes, so the sweep bounced it straight back to doing.
  let mode = null, note = '', notePath = null, flashMsg = null, sendTarget = null
  const api = { list, footer, onKey, follow: null }
  function flash(text, ms = 4000) { flashMsg = { text, until: Date.now() + ms }; setTimeout(() => redraw?.(true), ms + 50) }
  // Done, from bw: Todd's own sign-off is the review, so there is no separate reviewed step and
  // no quick-task-check requirement to satisfy — archive it the same instant, so it never sits in
  // quick-tasks/ for the sweep to find and bounce back as "missing Verified/Concerns" (2026-10-10).
  function markDoneAndArchive(path, note) {
    setStatus(path, 'done')
    if (note) appendNote(path, note)
    mkdirSync(join(quickDir(), 'archive'), { recursive: true })
    renameSync(path, join(quickDir(), 'archive', path.split('/').pop()))
  }
  function action(key, path) {
    api.follow = path
    if (key === 'q') { setStatus(path, 'queued'); flash('marked queued') }
    else if (key === 'b') { setStatus(path, 'blocked'); flash('marked blocked') }
    // Reviewed is Todd's sign-off, so only this menu sets it, and only on a task a desk marked done.
    else if (key === 'r') {
      if (quickStatus(frontMatter(path) || {}) !== 'done') flash('only a done task can be reviewed')
      else { setStatus(path, 'reviewed'); appendNote(path, `- ${nowLocal()} · Reviewed by Todd`); flash('marked reviewed') }
    }
    else if (key === 'a') { mkdirSync(join(quickDir(), 'archive'), { recursive: true }); renameSync(path, join(quickDir(), 'archive', path.split('/').pop())); flash('archived') }
    else if (key === 'd') { markDoneAndArchive(path, `- ${nowLocal()} · Marked done by Todd from bw`); flash('marked done') }
    else if (key === 's') { mode = 'note'; note = ''; notePath = path; return }
    else if (key === 't') { mode = 'target'; return }
    mode = null
  }
  // Send now: the note into the file, the whole file plus the note into the desk's inbox, then a
  // commit of both paths in the background so the redraw never waits on git. Only Claude desks
  // have an inbox hook that wakes them, so for any other engine the footer says so rather than
  // claiming delivery (the point that lifted the shaping to 9/10).
  // opts.desk forces the recipient away from the task's own fm.desk — the 't' menu's "send to
  // research/ideas" forwards a referral, not an assignment, so it skips the quick-task-do
  // instruction and marks the quick task done+archived (same reasoning as markDoneAndArchive)
  // once the inbox write lands, instead of leaving it sitting in quick-tasks/ as done.
  function send(path, text0, opts = {}) {
    const fm = frontMatter(path) || {}
    const desk = opts.desk || fm.desk || 'prototyper'
    appendNote(path, `- ${nowLocal()} · Todd: ${text0}`)
    const slug = 'quick-task-' + path.split('/').pop().replace(/^\d{4}-\d\d-\d\d-/, '').replace(/\.md$/, '')
    const text = opts.desk
      ? `Todd asked prototyper to forward this quick task to ${desk}.\n\nTodd's note: ${text0}\n\nQuick task: ${path}\n\n${readFileSync(path, 'utf8').trim()}`
      : `${readFileSync(path, 'utf8').trim()}\n\nTodd's note: ${text0}. Do it now with /slopdog:quick-task-do ${path}.`
    const lanes = safe(() => readLanesDocument({ v2: V2 }), {})
    flash('sending…')
    execFile(process.execPath, [join(V2, 'scripts', 'inbox-write.mjs'), '--to', desk, '--slug', slug, '--from', 'prototyper', '--text', text], { timeout: 15000 }, (e, out, err) => {
      if (e) return flash(`send failed: ${(err || e.message).trim().slice(0, 60)}`, 6000)
      const inbox = out.trim()
      flash(lanes[desk]?.engine === 'claude' ? `sent to ${desk}` : `queued for ${desk}, no auto-wake`, 5000)
      let filePath = path
      if (opts.markDone) { try { setStatus(path, 'done'); filePath = join(quickDir(), 'archive', path.split('/').pop()); mkdirSync(join(quickDir(), 'archive'), { recursive: true }); renameSync(path, filePath) } catch { filePath = path } }
      const q = (p) => `'${p.replace(/'/g, `'\\''`)}'`
      // The inbox hook may already have moved the message to inbox-archive/, so add whichever exists.
      const arch = inbox.replace(/\/inbox\//, '/inbox-archive/')
      const sh = `cd ~/slopdog && set --; for p in ${q(filePath)} ${q(inbox)} ${q(arch)}; do [ -e "$p" ] && set -- "$@" "$p"; done; git add -- "$@" && git commit -q -m ${q(`todd: quick task ${slug} sent to ${desk} with Todd's note`)} -m 'Auto: quick-tasks' -- "$@" && git push -q origin main`
      // BW_NO_COMMIT=1 is for a test run with a throwaway task, which must never reach git.
      if (!process.env.BW_NO_COMMIT) spawn('sh', ['-c', sh], { detached: true, stdio: 'ignore' }).unref()
    })
  }
  function footer(W = width ?? Math.min(process.stdout.columns || 100, 120) - 1) {
    const k = (c, key, word) => `${c}${key}${R} ${word}`
    // Wrapped onto as many lines as a narrow pane needs (Todd, 2026-10-10: "I need to be able
    // to read them all... wrap them when it's too small"), never truncated.
    if (mode === 'menu') return wrapTokens([`${P.mauve}${B}actions${R}`, k(P.green, 'r', 'reviewed'), k(P.peach, 'q', 'queued'), k(P.red, 'b', 'blocked'), k(P.green, 'd', 'done'), k(P.text, 'a', 'archive'), k(P.peach, 's', 'send now'), k(P.lavender, 't', 'send to…'), `${GREY}esc${R}`], ` ${GREY}·${R} `, W, '')
    if (mode === 'target') return wrapTokens([`${P.lavender}${B}send to:${R}`, k(P.text, '1', 'research'), k(P.text, '2', 'ideas'), `${GREY}esc${R}`], ` ${GREY}·${R} `, W, '')
    if (mode === 'note') {
      const desk = sendTarget || frontMatter(notePath || '')?.desk || 'desk'
      return `${P.peach}note for ${desk}: ${R}${note}${P.mauve}▏${R}  ${GREY}⏎ send · esc${R}`
    }
    if (flashMsg && Date.now() < flashMsg.until) return `${P.green}${flashMsg.text}${R}`
    return null
  }
  // While the menu or note box is open it owns the keyboard: no host key fires, and Esc backs out
  // (2026-10-06). Space on a task row opens the menu.
  function onKey(key, item) {
    const path = item?.path || null
    if (mode === 'menu') {
      if (key === '\x1b') mode = null
      else if (path && 'qbrasdt'.includes(key)) try { action(key, path) } catch { mode = null; flash('that action failed') }
      redraw?.(true)
      return true
    }
    if (mode === 'target') {
      if (key === '\x1b') mode = null
      else if (key === '1' && path) { notePath = path; sendTarget = 'research'; mode = 'note'; note = '' }
      else if (key === '2' && path) { notePath = path; sendTarget = 'ideas'; mode = 'note'; note = '' }
      redraw?.(true)
      return true
    }
    if (mode === 'note') {
      if (key === '\x1b') { mode = null; note = ''; sendTarget = null }
      else if (key === '\x7f' || key === '\b') note = Array.from(note).slice(0, -1).join('')
      else if (key === '\r') {
        const n = note.trim(), target = sendTarget
        mode = null; note = ''; sendTarget = null
        if (n && notePath) try { send(notePath, n, target ? { desk: target, markDone: true } : {}) } catch { flash('send failed') }
      }
      else if (!key.startsWith('\x1b') && key >= ' ') note += key
      redraw?.(true)
      return true
    }
    if (key === ' ' && path) { mode = 'menu'; redraw?.(true); return true }
    return false
  }
  return api
}
