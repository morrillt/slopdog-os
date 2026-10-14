// pickup-owner — whose PICKUP.md is this? One answer shared by the write guard for the non-Claude
// engines (plugins/slopdog/hooks/pickup-guard.mjs) and by the note checks (both pickup-check.mjs
// copies, plugins/pickup/scripts/note.mjs, scripts/self-clear.mjs, the slopdog pickup-report.mjs).
// Herdr.md, verification cell D4: a sidekick must not be able to write any PICKUP.md but its own.
//
// "Own" means the PICKUP.md in the registry folder of the lane running this engine, found as
// the deepest lane folder that holds the agent's cwd. Two lanes on one folder means no lane owns
// that note alone, so a guarded engine there may write no PICKUP.md at all. An agent outside
// every lane folder (a dispatch worktree) may write only the PICKUP.md in its own cwd.
import { readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { readLanesDocument } from './registry.mjs'

export const V2 = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..')

export function loadLanes(v2 = V2) {
  try {
    const all = readLanesDocument({ v2 })
    return Object.fromEntries(Object.entries(all).filter(([, l]) => l && typeof l === 'object' && l.folder))
  } catch { return {} }
}

const real = (p) => { try { return realpathSync(p) } catch { return resolve(p) } }
const inside = (dir, p) => { const r = relative(dir, p); return r === '' || (!r.startsWith('..') && !isAbsolute(r)) }
const isPickup = (p) => basename(p) === 'PICKUP.md'

// The deepest lane folder holding `dir`: { folder, keys }, or null when no lane folder holds it.
export function laneFolderOf(dir, { lanes = loadLanes(), v2 = V2 } = {}) {
  const here = real(dir)
  let best = null
  for (const [key, l] of Object.entries(lanes)) {
    const f = real(resolve(v2, l.folder))
    if (!inside(f, here)) continue
    if (!best || f.length > best.folder.length) best = { folder: f, keys: [key] }
    else if (f === best.folder) best.keys.push(key)
  }
  return best
}

// The one PICKUP.md an agent of `engine` started in `cwd` may write: { own, lane, why }.
// own is null when it may write none (why says so).
export function ownPickup(cwd, engine, opts = {}) {
  const lanes = opts.lanes ?? loadLanes(opts.v2)
  const hit = laneFolderOf(cwd, { ...opts, lanes })
  if (!hit) return { own: join(real(cwd), 'PICKUP.md'), lane: null, why: '' }
  const mine = hit.keys.filter((k) => (lanes[k].engine || 'claude') === engine)
  if (!mine.length) return { own: null, lane: null, why: `${hit.folder} belongs to ${hit.keys.join(', ')}, not to a ${engine} lane` }
  if (hit.keys.length > 1) return { own: null, lane: mine[0], why: `${hit.folder} is shared by ${hit.keys.join(' and ')}, so its PICKUP.md is no one lane's` }
  return { own: join(hit.folder, 'PICKUP.md'), lane: mine[0], why: '' }
}

const refusal = (target, o) =>
  `pickup-guard: ${target} is not this desk's PICKUP.md` +
  (o.own ? ` (yours is ${o.own})` : ` (${o.why})`) +
  `. Never edit another desk's PICKUP.md; write your own note in your own registry folder (Herdr.md D4).`

// A file write to `target`: the refusal, or '' when allowed.
export function writeProblem(target, { cwd, engine, ...opts }) {
  if (!target || !isPickup(target)) return ''
  const o = ownPickup(cwd, engine, opts)
  const t = real(resolve(cwd, target))
  return o.own && t === o.own ? '' : refusal(t, o)
}

const READ_ONLY = /^(cat|head|tail|less|more|grep|rg|wc|ls|stat|file|diff|test|\[|git\s+(log|show|diff|status|blame))$/
const PICKUP_TOKEN = /[^\s'"`;|&<>()=]*PICKUP\.md\b/g

// A shell command: the refusal, or '' when allowed. Refuses when the command names a PICKUP.md
// that is not this desk's and is anything but a plain read (cat, grep, git log...) with no
// redirect into a file. `cd` segments move the directory relative paths resolve against.
export function commandProblem(command, { cwd, engine, ...opts }) {
  if (!command || !/PICKUP\.md/.test(command)) return ''
  const o = ownPickup(cwd, engine, opts)
  let here = cwd
  const segments = command.split(/&&|\|\||;|\n|\|/)
  const foreign = []
  let writes = /\btee\b|\bsponge\b|\bsed\s+-i|\bperl\s+-[a-z]*i/.test(command) ||
    />/.test(command.replace(/\d*>&\d+|&?\d*>\s*\/dev\/null/g, ''))
  for (const seg of segments) {
    const s = seg.trim()
    const cd = s.match(/^cd\s+("[^"]+"|'[^']+'|\S+)/)
    if (cd) { here = resolve(here, cd[1].replace(/^["']|["']$/g, '').replace(/^~(?=\/|$)/, process.env.HOME || '~')); continue }
    for (const tok of s.match(PICKUP_TOKEN) || []) {
      const path = real(resolve(here, tok.replace(/^~(?=\/)/, process.env.HOME || '~')))
      if (o.own && path === o.own) continue
      foreign.push(path)
      const verb = s.split(/\s+/).slice(0, 2).join(' ')
      if (!READ_ONLY.test(s.split(/\s+/)[0]) && !READ_ONLY.test(verb)) writes = true
    }
  }
  return foreign.length && writes ? refusal(foreign[0], o) : ''
}

// ---- the detection backstop: a note whose identity names another desk ----

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

// The first line of `## Who`, without markdown noise.
function whoLine(text) {
  const m = text.match(/^## Who[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)
  const body = m ? m[1] : ''
  return body.split('\n').map((l) => l.replace(/^[-*\s]+/, '').trim()).find(Boolean) || ''
}

// '' when the note in `dir` names this folder's desk (or names no desk at all); otherwise the
// one-line problem. The identity is the earliest registry name (or alias) in the `# ` title
// line, else a name opening the first line of `## Who` ("Daphne, the Ideas desk"; a name later
// in that line is a mention, not the writer). Only a desk folder (exactly a lane's folder) is checked.
export function identityProblem(dir, text, opts = {}) {
  const lanes = opts.lanes ?? loadLanes(opts.v2)
  const hit = laneFolderOf(dir, { ...opts, lanes })
  if (!hit || hit.folder !== real(dir)) return ''
  const namesOf = (k) => [lanes[k].name, ...(lanes[k].aliases || [])].filter(Boolean)
  const here = new Set(hit.keys.flatMap(namesOf))
  const all = new Map()
  for (const k of Object.keys(lanes)) for (const n of namesOf(k)) all.set(n, [...(all.get(n) || []), k])
  const title = (text.match(/^# .*$/m) || [''])[0]
  for (const [line, within] of [[title, Infinity], [whoLine(text), 12]]) {
    let first = null
    for (const n of all.keys()) {
      const i = line.search(new RegExp(`(^|[^\\w])${escape(n)}(?![\\w])`))
      if (i !== -1 && (!first || i < first.i)) first = { n, i }
    }
    if (!first || first.i > within) continue
    if (here.has(first.n)) return ''
    const owner = all.get(first.n)
    return `${join(hit.folder, 'PICKUP.md')} names ${first.n} (${owner.join(', ')}), not this folder's desk ` +
      `(${[...here].join(' / ')} — ${hit.keys.join(', ')}): a crossed note another desk wrote. ` +
      `Do not resume from it; rewrite it as this desk.`
  }
  return ''
}

// A desk with its own task system (a partner desk's `tasks/*.md`, no board tickets) anchors its
// PICKUP.md on a task file instead of a T-nnn: the first `tasks/<name>.md` or `quick-tasks/<name>.md`
// the note names that exists under the desk folder or its ancestors (the Prototyper desk's quick
// tasks live in the shared `v2/quick-tasks/`, above its own folder, not inside it — ../ included so
// that resolves). Returns that file's absolute path, or '' when there is none. Only a fallback: a
// note that names a T-nnn is anchored on the ticket, as before.
export function deskTaskAnchor(dir, text) {
  for (const m of text.matchAll(/(?<![\w/.-])(?:\.\.\/)*(?:quick-)?tasks\/[\w.-]+\.md\b/g)) {
    const p = join(resolve(dir), m[0])
    try { if (realpathSync(p)) return p } catch {}
  }
  return ''
}
