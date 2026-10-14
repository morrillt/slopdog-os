// T-546 gap 4: the openrouter engine's post-run fence. On T-512 the model (Nemotron) ran
// Claude Code with --dangerously-skip-permissions and wrote, committed and pushed straight
// into ~/slopdog, ~/slopdog/notes and ~/slopdog/tasks instead of its worktree. Under
// bypassPermissions no --add-dir list fences anything, so the fence is this check after the run.
//
// It reads the model's own actions (the stream-json `assistant` events dispatch already
// parses, or a Claude Code transcript .jsonl, which has the same shape), not a before/after
// `git status` of ~/slopdog: a dozen other desks write to that tree all the time, so a diff
// of it would blame them on the model.
//
// What counts as a write: Write/Edit/MultiEdit/NotebookEdit file paths, and in Bash commands
// output redirects, tee, cp/mv/rm/mkdir/touch/ln/chmod/install/rsync/sed -i/truncate targets,
// git write subcommands (add, commit, push, ...) run in a repo outside the worktree (by -C or
// a `cd` earlier in the same command), and `systemctl --user enable|link`. What it cannot see:
// a write made inside a program it runs (node -e, python, a script, `claude ...`), and paths
// built from variables other than $HOME.
import { existsSync, readFileSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { spawnSync } from 'node:child_process'
import { dirname, isAbsolute, join, resolve, basename } from 'node:path'

const FILE_TOOLS = new Set(['Write', 'Edit', 'MultiEdit', 'NotebookEdit'])
const GIT_WRITES = new Set(['add', 'commit', 'push', 'reset', 'checkout', 'switch', 'merge', 'rebase', 'cherry-pick',
  'revert', 'stash', 'rm', 'mv', 'restore', 'tag', 'pull', 'am', 'apply', 'clean', 'worktree', 'init', 'clone'])
// Commands whose every non-flag argument is a path they write (for cp/mv/ln/install/rsync, only the last is).
const ALL_ARGS_WRITTEN = new Set(['rm', 'rmdir', 'mkdir', 'touch', 'chmod', 'chown', 'truncate', 'tee', 'unlink', 'shred'])
const LAST_ARG_WRITTEN = new Set(['cp', 'mv', 'ln', 'install', 'rsync'])

// Canonical form of a path that may not exist yet: realpath the deepest existing ancestor
// (so ~ and ~ compare equal), then re-append the rest. With
// follow: false the leaf is not followed: the link an `ln` made inside its worktree stays inside.
export function canon(p, { follow = true } = {}) {
  const full = resolve(p)
  if (full === '/') return full
  let head = follow ? full : dirname(full); const tail = follow ? [] : [basename(full)]
  while (!existsSync(head)) { const up = dirname(head); if (up === head) break; tail.unshift(basename(head)); head = up }
  try { head = realpathSync(head) } catch {}
  return tail.length ? join(head, ...tail) : head
}

const under = (p, root) => p === root || p.startsWith(root.endsWith('/') ? root : root + '/')

// Tool uses, in order, from parsed stream-json / transcript events, plus Claude Code's
// "Shell cwd was reset to X" notices from the tool results (it resets the shell when a
// command leaves the project folder), so the Bash cwd can be carried across calls.
export function toolUses(events) {
  const out = []
  for (const e of events || []) {
    if (e?.type === 'assistant') {
      for (const c of e.message?.content || []) if (c?.type === 'tool_use') out.push({ name: c.name, input: c.input || {} })
    } else if (e?.type === 'user' && Array.isArray(e.message?.content)) {
      for (const c of e.message.content) {
        if (c?.type !== 'tool_result') continue
        const text = typeof c.content === 'string' ? c.content : Array.isArray(c.content) ? c.content.map((x) => x?.text || '').join('\n') : ''
        const m = text.match(/Shell cwd was reset to (\S+)/)
        if (m) out.push({ name: 'cwd-reset', input: { path: m[1] } })
      }
    }
  }
  return out
}

export function readEventsFile(file) {
  const out = []
  for (const l of readFileSync(file, 'utf8').split('\n')) { if (!l.trim()) continue; try { out.push(JSON.parse(l)) } catch {} }
  return out
}

// Shell words of one simple command, quotes removed. Good enough for the commands models write;
// not a full shell parser.
function words(seg) {
  const out = []; let cur = ''; let q = null; let has = false
  for (let i = 0; i < seg.length; i++) {
    const ch = seg[i]
    if (q) { if (ch === q) q = null; else if (ch === '\\' && q === '"' && i + 1 < seg.length) cur += seg[++i]; else cur += ch; continue }
    if (ch === "'" || ch === '"') { q = ch; has = true; continue }
    if (ch === '\\' && i + 1 < seg.length) { cur += seg[++i]; has = true; continue }
    if (/\s/.test(ch)) { if (cur || has) out.push(cur); cur = ''; has = false; continue }
    cur += ch
  }
  if (cur || has) out.push(cur)
  return out
}

// Split a command line into simple commands on ; && || | and newlines, outside quotes.
// Heredoc bodies are dropped first so their text is never read as commands.
function segments(cmd) {
  const lines = cmd.split('\n'); const kept = []
  for (let i = 0; i < lines.length; i++) {
    kept.push(lines[i])
    const m = lines[i].match(/<<-?\s*['"]?([A-Za-z_][A-Za-z0-9_]*)['"]?/)
    if (m) { while (i + 1 < lines.length && lines[i + 1].trim() !== m[1]) i++; i++ }
  }
  const s = kept.join('\n'); const out = []; let cur = ''; let q = null
  for (let i = 0; i < s.length; i++) {
    const ch = s[i]
    if (q) { cur += ch; if (ch === q) q = null; else if (ch === '\\' && q === '"') cur += s[++i] ?? ''; continue }
    if (ch === "'" || ch === '"') { q = ch; cur += ch; continue }
    if (ch === '\n' || ch === ';' || (ch === '|' ) || (ch === '&' && s[i + 1] === '&')) {
      // `2>&1` / `&>` / `>|` keep their & and |
      if (ch === '|' && s[i - 1] === '>') { cur += ch; continue }
      out.push(cur); cur = ''
      if ((ch === '&' || ch === '|') && s[i + 1] === ch) i++
      continue
    }
    cur += ch
  }
  out.push(cur)
  return out.map((x) => x.trim()).filter(Boolean)
}

function expand(w, home) {
  return w.replace(/^~(?=\/|$)/, home).replace(/\$\{HOME\}|\$HOME\b/g, home)
}

// Paths and actions one Bash command writes outside its cwd, best effort.
export function bashWrites(command, { cwd, home = homedir() }) {
  const writes = []; let here = cwd
  const at = (p) => { const x = expand(p, home); return resolve(here, x) }
  for (const seg of segments(command)) {
    let w = words(seg)
    // Redirect targets: `> f`, `>> f`, `>f`, `&> f`, `2> f`; never `2>&1`.
    const rest = []
    for (let i = 0; i < w.length; i++) {
      const m = w[i].match(/^(?:\d|&)?>>?\|?(.*)$/)
      if (m && !w[i].startsWith('<')) {
        const target = m[1] || w[++i]
        if (target && !/^&\d?$/.test(target) && !target.startsWith('&')) writes.push({ path: at(target), how: `redirect > ${target}` })
        continue
      }
      rest.push(w[i])
    }
    w = rest
    while (w.length && /^[A-Za-z_][A-Za-z0-9_]*=/.test(w[0])) w.shift()   // VAR=x cmd
    if (['sudo', 'env', 'command', 'nohup', 'time'].includes(w[0])) w.shift()
    const [cmd, ...a] = w
    if (!cmd) continue
    if (cmd === 'cd' || cmd === 'pushd') { here = a[0] ? at(a[0]) : home; continue }
    const args = a.filter((x) => !x.startsWith('-'))
    if (cmd === 'git') {
      let repo = here; let i = 0
      while (i < a.length && a[i].startsWith('-')) { if (a[i] === '-C') { repo = at(a[i + 1] || '.'); i += 2 } else if (a[i] === '-c') i += 2; else i++ }
      const sub = a[i]
      const verb = a.slice(i + 1).find((x) => !x.startsWith('-'))
      if ((sub === 'worktree' || sub === 'stash' || sub === 'tag') && (verb === undefined ? sub !== 'stash' : ['list', 'show'].includes(verb))) continue   // read-only forms
      if (GIT_WRITES.has(sub)) writes.push({ path: repo, how: `git ${sub}`, repo: true, args: a.slice(i + 1).filter((x) => !x.startsWith('-')) })
      continue
    }
    if (cmd === 'sed' && a.some((x) => /^-i/.test(x) || x === '--in-place')) {
      const files = args.slice(1)   // first non-flag arg is the script
      for (const f of files) writes.push({ path: at(f), how: 'sed -i' })
      continue
    }
    if (cmd === 'systemctl' && a.some((x) => ['enable', 'link', 'mask', 'edit', 'set-property'].includes(x))) {
      const unitDir = a.includes('--user') ? join(home, '.config', 'systemd', 'user') : '/etc/systemd/system'
      writes.push({ path: unitDir, how: `systemctl ${a.join(' ')}` })
      continue
    }
    const cargs = cmd === 'chmod' || cmd === 'chown' ? args.slice(1) : args
    if (ALL_ARGS_WRITTEN.has(cmd)) for (const f of cargs) writes.push({ path: at(f), how: cmd })
    else if (LAST_ARG_WRITTEN.has(cmd) && args.length >= 2) writes.push({ path: at(args[args.length - 1]), how: cmd, link: cmd === 'ln' })
  }
  writes.cwd = here   // where the shell is left, for the next Bash call
  return writes
}

const DEVICES = ['/dev/null', '/dev/stdout', '/dev/stderr', '/dev/tty']
const SCRATCH = ['/tmp', ...(process.env.TMPDIR ? [process.env.TMPDIR] : [])]

// The fence. `worktree` is the job's own worktree (null for a read-only job: nothing is
// inside it); `allowed` are the files outside it the brief owns (its ticket, task-list.md).
// `scratch` are the folders a model may always write (its brief says /tmp).
// Returns { strays: [{ path, how, tool }] }, empty when the run stayed inside.
export function fenceCheck({ events, worktree, allowed = [], home = homedir(), cwd, scratch = SCRATCH }) {
  const wt = worktree ? canon(worktree) : null
  const ok = [...DEVICES, ...scratch].map(canon)
  const files = allowed.filter(Boolean).map(canon)
  const inside = (p) => (wt && under(p, wt)) || ok.some((r) => under(p, r))
  const strays = []; const seen = new Set()
  const flag = (path, how, tool) => { const k = `${path}\t${how}`; if (seen.has(k)) return; seen.add(k); strays.push({ path, how, tool }) }
  let shell = cwd || wt || home
  for (const { name, input } of toolUses(events)) {
    if (name === 'cwd-reset') { shell = input.path; continue }
    if (FILE_TOOLS.has(name)) {
      const raw = input.file_path || input.notebook_path
      if (!raw) continue
      const p = canon(isAbsolute(raw) ? raw : resolve(cwd || wt || '.', raw))
      if (!inside(p) && !files.includes(p)) flag(p, name, name)
    } else if (name === 'Bash' && typeof input.command === 'string') {
      const ws = bashWrites(input.command, { cwd: shell, home }); shell = ws.cwd
      for (const w of ws) {
        const p = canon(w.path, { follow: !w.link })
        if (inside(p)) continue
        // A git write in another repo is a breach even when it only stages the ticket file:
        // that commit lands in a tree other desks share.
        if (!w.repo && files.includes(p)) continue
        flag(p, w.how, 'Bash')
      }
    }
  }
  return { strays }
}

// After a clean fence, dispatch (not the model) commits the builder's ticket edits in the
// tasks repo, by path only: `git commit -- <paths>` never sweeps in another desk's changes.
export function commitTicketUpdates({ tasksDir, paths, message }) {
  const root = canon(tasksDir)
  const rel = paths.filter(Boolean).map(canon).filter((p) => under(p, root) && existsSync(p)).map((p) => p.slice(root.length + 1))
  if (!rel.length) return { committed: false }
  const r = spawnSync('git', ['-C', root, 'commit', '-q', '-m', message, '--', ...rel], { encoding: 'utf8' })
  return { committed: r.status === 0, error: r.status === 0 ? null : (r.stderr || r.stdout || '').trim() }
}

// The files outside the worktree a ticket brief may write: the ticket and its task-list row.
export function fenceAllowed({ ticketPath, tasksDir }) {
  return [ticketPath, tasksDir ? join(tasksDir, 'task-list.md') : null].filter(Boolean)
}

export function fenceReport(strays) {
  return `FENCE BREACH: the model wrote outside its worktree (${strays.length}):\n${strays.map((s) => `- ${s.path} (${s.how})`).join('\n')}`
}

// One Concern on the ticket naming the stray paths, appended under ## Concerns.
export function appendFenceConcern(text, strays, { who = 'OpenRouter', date = new Date().toISOString().slice(0, 10) } = {}) {
  const line = `- blocking (${who}, ${date}): fence breach, the model wrote outside its worktree: ${strays.map((s) => `${s.path} (${s.how})`).join('; ')}.`
  const lines = text.split('\n')
  const start = lines.findIndex((l) => /^##\s+Concerns\s*$/i.test(l))
  if (start === -1) return `${text.replace(/\s+$/, '')}\n\n## Concerns\n\n${line}\n`
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) if (/^#{1,6}\s/.test(lines[i])) { end = i; break }
  let last = start
  for (let i = start + 1; i < end; i++) if (lines[i].trim() !== '') last = i
  lines.splice(last + 1, 0, ...(last === start ? ['', line] : [line]))
  return lines.join('\n')
}

// CLI replay: node openrouter-fence.mjs <events.jsonl> <worktree> [allowed file]...
// realpath both sides: ~/slopdog is a symlink into /storage, and import.meta.url is always resolved.
const isCli = (() => { try { return process.argv[1] && realpathSync(process.argv[1]) === realpathSync(new URL(import.meta.url).pathname) } catch { return false } })()
if (isCli) {
  const [file, worktree, ...allowed] = process.argv.slice(2)
  if (!file || !worktree) { console.error('usage: openrouter-fence.mjs <stream-or-transcript.jsonl> <worktree> [allowed-file]...'); process.exit(2) }
  const { strays } = fenceCheck({ events: readEventsFile(file), worktree, allowed })
  if (!strays.length) { console.log('fence: clean, every write stayed inside the worktree'); process.exit(0) }
  console.log(fenceReport(strays)); process.exit(3)
}
