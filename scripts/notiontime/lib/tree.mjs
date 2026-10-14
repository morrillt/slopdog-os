// notiontime — turns Todd's rough nested bullets into a tree of directives and quick tasks.
//
// One parser, markdown in: fetch-block.mjs converts a Notion block subtree into the same nested
// checkbox markdown Todd writes by hand, so this file is the only place the shape is understood.
//
// Every line says what it is. The five prefixes are the whole vocabulary:
//   - Directive: ORGANIZE MAP @slopdog          → a directive node
//   - Task: projects are organized              → a task node
//   - Subtask: archive the stale ones           → a task node, always its own node
//   - desc: it is hard to keep track            → the description line of the node above it
//     (why: and description: are the same marker, so older notes still parse)
//   - note: a loose thought                     → body text on the node above it, at any level
// `@lane` sets the desk and is inherited by descendants. The word critical sets critical: true.
// The tree is two levels deep: a task and its subtasks. Anything written deeper is attached to
// the top task of its branch (Todd, 2026-10-12), since Obsidian Bases groups on one level only.
//
// Two older markers still parse, so nothing already written breaks:
//   - QUICK TASK projects are organized         → the same as Task:
//   - QUICKTASKS                                → a bare group; its children are tasks
// And in loose mode an unprefixed bullet is still inferred the old way — a note under a directive,
// a child task under a task. In strict mode it is an error instead, named by its line number.
// Strict is on when the file uses the new vocabulary (Task:, Subtask: or note:), which is what a
// template-shaped file looks like; the old rough notes have none of those, so they stay loose.

import { readFileSync } from 'node:fs'

const DIRECTIVE = /^directives?\b[:\s-]*/i
const SUBTASK = /^sub[-\s]?tasks?\b[:\s-]*/i
const TASK = /^(?:quick\s*tasks?|tasks?)\b[:\s-]*/i
// desc: is the marker the template teaches; why: and description: are read as the same line.
const WHY = /^(?:description|desc|why)\b[:\s-]*/i
const NOTE = /^notes?\b[:\s-]*/i

/** The prefixes that make a file strict: the new vocabulary, which old rough notes never use. */
const STRICT_MARKERS = [SUBTASK, NOTE, /^tasks?\b[:\s-]*/i]

export const PREFIXES = 'Directive:, Task:, Subtask:, desc:, note:'

/** One line of a nested markdown list: its depth in levels, its text, and its 1-based line number. */
export function parseLines(markdown) {
  const out = []
  let lineNo = 0
  for (const raw of markdown.split('\n')) {
    lineNo += 1
    const m = raw.match(/^(\s*)[-*]\s+(?:\[([ xX])\]\s*)?(.*)$/)
    if (!m) continue
    const text = m[3].trim()
    if (!text) continue
    // Two spaces per level is the Notion export shape; four-space indents halve the same.
    const spaces = m[1].replace(/\t/g, '    ').length
    out.push({ depth: Math.floor(spaces / 4), text, checked: /[xX]/.test(m[2] || ''), line: lineNo })
  }
  return out
}

/** True when the markdown uses the explicit new vocabulary, so unprefixed bullets are a mistake. */
export function looksStrict(markdown) {
  return parseLines(markdown).some((l) => STRICT_MARKERS.some((re) => re.test(l.text.replace(/@([a-z][a-z0-9-]*)/i, '').trim())))
}

/** The desk a line names, as `@lane`, or null. The marker is removed from the text. */
function takeDesk(text) {
  const m = text.match(/@([a-z][a-z0-9-]*)/i)
  if (!m) return { text, desk: null }
  return { text: (text.slice(0, m.index) + text.slice(m.index + m[0].length)).replace(/\s{2,}/g, ' ').trim(), desk: m[1].toLowerCase() }
}

// The flag word. `critical` sets critical: true and the word then comes out of the title, so the
// flag lives in the front matter and the title reads as the work. Only the two positions the flag
// is written in are stripped: a leading label ("Critical: clear the inbox") and a trailing tag
// (", critical"). A mid-sentence use ("clear the critical inbox") is prose, and removing it would
// change what the sentence says, so it stays. So does a title ending on a linking verb ("the
// system is critical"), where the word is the predicate.
const LEAD_FLAG = /^critical\s*[:\-–—]\s*/i
const TAIL_FLAG = /(?:\s*[,;:\-–—]\s*|\s+)critical[.!]?$/i
const LINKING = /\b(?:is|are|was|were|be|being|been|stays|remains|looks|seems|becomes?)$/i

/** The title with its flag word taken out, tidied of the punctuation the removal leaves behind. */
export function stripFlag(title) {
  let out = title.trim()
  if (LEAD_FLAG.test(out)) {
    const rest = out.replace(LEAD_FLAG, '')
    if (rest) out = rest.charAt(0).toUpperCase() + rest.slice(1)
  }
  const tail = out.replace(TAIL_FLAG, '')
  if (tail !== out && tail && !LINKING.test(tail)) out = tail
  return out.replace(/\s{2,}/g, ' ').replace(/[\s,;:\-–—]+$/, '').trim() || title.trim()
}

function titleCase(s) {
  // His headers are shouted (ORGANIZE MAP AND THINGS). Keep the words, drop the shouting, so a
  // Notion row and a file name read like the rest of the house.
  if (s !== s.toUpperCase()) return s
  return s.toLowerCase().replace(/^[a-z]/, (c) => c.toUpperCase())
}

export function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').split('-').slice(0, 6).join('-')
}

/**
 * Nested markdown → a flat list of nodes, each with parentIndex, kind, title, desk, notes.
 * The tree is flat on purpose: ids are allocated after parsing, so a node can name its parent's id.
 */
export function buildTree(markdown, options = {}) {
  return parse(markdown, options).nodes
}

/**
 * The same parse, plus the unprefixed bullets it refused. `{ nodes, loose, strict }`.
 * `loose` is `[{ line, text }]` and is only filled in strict mode; in loose mode the old
 * inference still runs and nothing is refused.
 */
export function parse(markdown, { strict = null } = {}) {
  const lines = parseLines(markdown)
  const isStrict = strict == null ? looksStrict(markdown) : strict
  const loose = []
  const nodes = []
  // stack[depth] = { index, kind } for the node that owns that depth, or a transparent group.
  const stack = []

  for (const line of lines) {
    const { text: afterDesk, desk } = takeDesk(line.text)
    let text = afterDesk
    let kind = null
    let transparent = false

    let trailing = ''
    if (DIRECTIVE.test(text)) {
      kind = 'directive'
      text = text.replace(DIRECTIVE, '').trim()
      // A directive's header carries its own gloss after a colon ("ORGANIZE MAP: prune trees …").
      // The name is what comes before the colon; the gloss is a note, so the row stays readable.
      const colon = text.indexOf(':')
      if (colon > 0) { trailing = text.slice(colon + 1).trim(); text = text.slice(0, colon).trim() }
    } else if (SUBTASK.test(text)) {
      // A Subtask: is always its own node, whatever its depth.
      kind = 'task'
      text = text.replace(SUBTASK, '').trim()
    } else if (TASK.test(text)) {
      const rest = text.replace(TASK, '').trim()
      if (rest) { kind = 'task'; text = rest } else { transparent = true }
    }

    // The nearest real ancestor, at a shallower depth than this line.
    let parentIndex = null
    let parentKind = null
    for (let d = line.depth - 1; d >= 0; d -= 1) {
      const owner = stack[d]
      if (owner && owner.index != null) { parentIndex = owner.index; parentKind = owner.kind; break }
      if (owner && owner.transparent) continue
    }

    if (transparent) {
      // A bare QUICKTASKS header: its children hang off whatever owns it, as tasks.
      stack[line.depth] = { index: parentIndex, kind: 'directive', transparent: true, forceTask: true }
      stack.length = line.depth + 1
      continue
    }

    const owner = stack[line.depth - 1]
    const forcedTask = Boolean(owner && owner.forceTask)

    if (!kind) {
      if (WHY.test(text) && parentIndex != null) {
        nodes[parentIndex].why = text.replace(WHY, '').trim()
        stack.length = line.depth + 1
        stack[line.depth] = { index: null, kind: null, noteOf: parentIndex }
        continue
      }
      if (NOTE.test(text) && parentIndex != null) {
        // note: is body text on the node above, at every level — directive, task or subtask.
        nodes[parentIndex].notes.push(text.replace(NOTE, '').trim())
        stack.length = line.depth + 1
        stack[line.depth] = { index: null, kind: null, noteOf: parentIndex }
        continue
      }
      if (isStrict) {
        // Nothing is inferred from indentation here: the line has to say what it is.
        loose.push({ line: line.line, text: line.text })
        stack.length = line.depth + 1
        stack[line.depth] = { index: parentIndex, kind: parentKind }
        continue
      }
      if (parentIndex == null) kind = 'directive'
      else if (forcedTask) kind = 'task'
      else if (parentKind === 'directive') {
        // A plain bullet under a directive is detail about the directive, not work of its own.
        nodes[parentIndex].notes.push(text)
        stack.length = line.depth + 1
        stack[line.depth] = { index: null, kind: null, noteOf: parentIndex }
        continue
      } else kind = 'task'
    }

    // Two levels only (Todd, 2026-10-12): a task and its subtasks, nothing deeper. Obsidian
    // Bases groups on one level, so a third level either collapses or prints a whole ancestor
    // path in the header. A node parsed deeper than a subtask is attached to the top task of its
    // branch instead — the same rule the quick-task files were migrated with. A directive is a
    // container, not a task level, so it does not count toward the two.
    if (parentIndex != null && nodes[parentIndex].kind !== 'directive') {
      let top = parentIndex
      while (nodes[top].parentIndex != null && nodes[nodes[top].parentIndex].kind !== 'directive') top = nodes[top].parentIndex
      parentIndex = top
    }

    const inheritedDesk = desk || (parentIndex != null ? nodes[parentIndex].desk : null)
    // Only the word critical marks a node critical here. quick-task-add also accepts
    // "important", which is too common in a rough note ("our most important skills") to trust.
    const critical = /\bcritical\b/i.test(line.text)
    const node = {
      kind,
      title: titleCase(critical ? stripFlag(text) : text),
      desk: inheritedDesk || null,
      parentIndex,
      why: '',
      notes: trailing ? [trailing] : [],
      critical,
      checked: line.checked,
    }
    nodes.push(node)
    stack[line.depth] = { index: nodes.length - 1, kind }
    stack.length = line.depth + 1
  }

  return { nodes, loose, strict: isStrict }
}

/** Allocates `QT-nnnn` ids in document order, starting after the highest id already on disk. */
export function allocateIds(nodes, startAfter = 0) {
  let n = startAfter
  for (const node of nodes) { n += 1; node.id = `QT-${String(n).padStart(4, '0')}` }
  for (const node of nodes) node.parent = node.parentIndex == null ? '' : nodes[node.parentIndex].id
  return nodes
}

/** The tree as indented text, for showing Todd what the parse produced before anything is written. */
export function renderTree(nodes) {
  const depthOf = (node) => (node.parentIndex == null ? 0 : depthOf(nodes[node.parentIndex]) + 1)
  return nodes.map((node) => {
    const pad = '  '.repeat(depthOf(node))
    const bits = [node.id, node.kind === 'directive' ? 'DIRECTIVE' : 'task', node.desk ? `@${node.desk}` : '@?']
    if (node.critical) bits.push('CRITICAL')
    const out = [`${pad}${bits.join(' · ')} — ${node.title}`]
    if (node.why) out.push(`${pad}  desc: ${node.why}`)
    for (const note of node.notes) out.push(`${pad}  note: ${note}`)
    return out.join('\n')
  }).join('\n')
}

/**
 * The tree back out as nested bullets in Todd's own marker shape — the starting point for pass
 * one, the cleaning pass. Every node names its own marker and its own `@desk` rather than relying
 * on inheritance, so re-parsing this output gives the same tree back and clean-check.mjs can tell
 * a wording fix from a structural change.
 */
export function renderMarkdown(nodes) {
  const out = []
  const kids = (index) => nodes.map((n, i) => [n, i]).filter(([n]) => n.parentIndex === index)
  const walk = (node, index, depth) => {
    const pad = '    '.repeat(depth)
    // A colon inside a directive's title would be read back as the start of its gloss, so it goes.
    const title = node.kind === 'directive' ? node.title.replace(/:/g, '') : node.title
    // Every line names its own marker, so re-parsing this output is strict and gives the same tree.
    // A node with a task above it is a subtask; depth is not consulted, since the tree is two
    // levels deep and a directive above a task is a container rather than a level.
    const parentIsTask = node.parentIndex != null && nodes[node.parentIndex].kind !== 'directive'
    const marker = node.kind === 'directive' ? 'Directive:' : (parentIsTask ? 'Subtask:' : 'Task:')
    // The flag word has left the title, so a critical node writes it back as the trailing tag.
    const flag = node.critical ? ', critical' : ''
    out.push(`${pad}- [${node.checked ? 'x' : ' '}] ${marker} ${title}${flag}${node.desk ? ` @${node.desk}` : ''}`)
    const inner = '    '.repeat(depth + 1)
    if (node.why) out.push(`${inner}- [ ] desc: ${node.why}`)
    for (const note of node.notes) out.push(`${inner}- [ ] note: ${note}`)
    for (const [child, i] of kids(index)) walk(child, i, depth + 1)
  }
  for (const [node, i] of kids(null)) walk(node, i, 0)
  return out.join('\n')
}

export function readMarkdown(path) {
  return readFileSync(path, 'utf8')
}
