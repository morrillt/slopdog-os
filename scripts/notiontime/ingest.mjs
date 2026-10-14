#!/usr/bin/env node
// notiontime ingest — rough nested bullets in, structured quick tasks out.
//
// Usage:
//   node ingest.mjs --from <markdown file>            print the tree, write nothing
//   node ingest.mjs --from <file> --clean-out <file>  write the tree back out as bullets (pass one)
//   node ingest.mjs --from <markdown file> --write     write the quick-task files
//   node ingest.mjs --from <file> --write --date 2026-10-11
//   node ingest.mjs --from <file> --strict | --loose    force or lift the unprefixed-bullet check
//
// The ingest runs in two passes. Pass one writes the parsed tree back out as nested bullets in
// Todd's own marker shape (--clean-out); the cleaning pass fixes the wording in that file, and
// clean-check.mjs proves no node was invented or dropped. Pass two ingests the cleaned file.
//
// The rough notes are never touched. Every node becomes one file in v2/quick-tasks/ carrying
// id/parent/kind, so bw and the existing scripts keep working and the nesting lives in the data.

import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname, basename } from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse, allocateIds, renderTree, renderMarkdown, slugify, PREFIXES } from './lib/tree.mjs'

const V2 = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const QUICK = join(V2, 'quick-tasks')

function arg(name, fallback = null) {
  const i = process.argv.indexOf(`--${name}`)
  return i === -1 ? fallback : process.argv[i + 1]
}
const has = (name) => process.argv.includes(`--${name}`)

/** The highest QT-nnnn already allocated across the quick-tasks folder (and its archive). */
export function highestId(dir = QUICK) {
  let top = 0
  const dirs = [dir, join(dir, 'archive')].filter((d) => existsSync(d))
  for (const d of dirs) {
    for (const f of readdirSync(d)) {
      if (!f.endsWith('.md')) continue
      const m = readFileSync(join(d, f), 'utf8').slice(0, 1200).match(/^id:\s*QT-(\d+)/m)
      if (m) top = Math.max(top, Number(m[1]))
    }
  }
  return top
}

export function fileNameFor(node, date, taken = new Set()) {
  const stem = `${date}-${slugify(node.title) || node.id.toLowerCase()}`
  let name = `${stem}.md`
  let n = 1
  while (taken.has(name) || existsSync(join(QUICK, name))) { n += 1; name = `${stem}-${n}.md` }
  taken.add(name)
  return name
}

export function renderQuickTask(node, { date, source }) {
  const lines = []
  lines.push('---')
  lines.push(`title: ${node.title}`)
  lines.push(`desk: ${node.desk || ''}`)
  lines.push(`status: ${node.kind === 'directive' ? 'doing' : 'queued'}`)
  lines.push(`created: ${date}`)
  lines.push(`critical:${node.critical ? ' true' : ''}`)
  lines.push('points:')
  lines.push(`id: ${node.id}`)
  lines.push(`parent: ${node.parent || ''}`)
  lines.push(`kind: ${node.kind}`)
  lines.push('notion:')
  lines.push('align:')
  lines.push('done:')
  lines.push('now:')
  lines.push('blocked_by:')
  lines.push('---')
  lines.push('')
  lines.push(`# ${node.title}`)
  lines.push('')
  lines.push(`**Asked:** ${node.title}${node.why ? ` — why: ${node.why}` : ''} (ingested from ${source})`)
  lines.push('')
  lines.push('## What')
  lines.push(node.why || node.notes[0] || node.title)
  lines.push('')
  lines.push('## Done when')
  lines.push(node.kind === 'directive'
    ? 'Every quick task under this directive is done or archived.'
    : `${node.title} — and the Notes say what was done.`)
  if (node.notes.length) {
    lines.push('')
    lines.push('## From the notes')
    for (const n of node.notes) lines.push(`- ${n}`)
  }
  lines.push('')
  lines.push('## Notes')
  lines.push(`- ${date} · ingested from ${source} by notiontime`)
  lines.push('')
  return lines.join('\n')
}

function main() {
  const from = arg('from')
  if (!from) { console.error('usage: ingest.mjs --from <markdown file> [--clean-out <file>] [--write] [--date YYYY-MM-DD]'); process.exit(1) }
  const date = arg('date', new Date().toISOString().slice(0, 10))
  // Strict decides whether an unprefixed bullet is a mistake or old loose shorthand. It is on by
  // itself when the file uses the new vocabulary (Task:, Subtask:, note:); --strict and --loose
  // say so outright.
  const strict = has('strict') ? true : has('loose') ? false : null
  const { nodes: parsed, loose, strict: wasStrict } = parse(readFileSync(from, 'utf8'), { strict })
  const nodes = allocateIds(parsed, highestId())
  const source = basename(from)

  if (loose.length) {
    console.error(`${from}: ${loose.length} bullet(s) say nothing about what they are:`)
    for (const l of loose) console.error(`  line ${l.line}: ${l.text}`)
    console.error(`Give each one a prefix: ${PREFIXES}`)
    process.exit(1)
  }

  console.log(renderTree(nodes))
  console.log('')
  console.log(wasStrict ? 'strict: every bullet must name its prefix' : 'loose: unprefixed bullets are inferred from their indentation')
  console.log('')
  console.log(`${nodes.length} node(s): ${nodes.filter((n) => n.kind === 'directive').length} directive(s), ${nodes.filter((n) => n.kind === 'task').length} task(s)`)

  // Pass one: the same tree as bullets again, for the cleaning pass to edit in place. The rough
  // notes themselves are still never touched, so the raw block stays the record of what he wrote.
  const cleanOut = arg('clean-out')
  if (cleanOut) {
    writeFileSync(cleanOut, `${renderMarkdown(nodes)}\n`)
    console.log('')
    console.log(`wrote the cleaning draft to ${cleanOut}`)
    console.log(`check it with: node clean-check.mjs ${from} ${cleanOut}`)
  }

  if (!has('write')) { console.log(cleanOut ? '(no files written — pass --write for pass two)' : '(dry run — pass --write to write the files)'); return }

  if (!existsSync(QUICK)) mkdirSync(QUICK, { recursive: true })
  const taken = new Set()
  for (const node of nodes) {
    node.file = fileNameFor(node, date, taken)
    writeFileSync(join(QUICK, node.file), renderQuickTask(node, { date, source }))
  }
  console.log('')
  for (const node of nodes) console.log(`${node.id}  ${node.file}`)
}

if (process.argv[1] && process.argv[1].endsWith('ingest.mjs')) main()
