#!/usr/bin/env node
// quick-task-report.mjs — saves a quick task's final reply verbatim under `## Final report` at the
// end of its task file.
//
//   node ~/slopdog/v2/scripts/quick-task-report.mjs <task file> < <reply file>
//
// Reads the reply on stdin and trims leading and trailing blank lines only; every other line is
// kept as written. If the file already has a `## Final report` section, that section is replaced;
// otherwise the section is appended at the end. The section runs from its heading to the next
// `## ` heading or the end of the file, so a second run replaces it rather than duplicating it.
// The script also closes the section with an end-marker comment, because a reply can carry its
// own `## ` headings; when the marker is there, the section ends at the marker instead.
// Exits 2 with a message on stderr for no path, a path that is not a file, or an empty reply.

import { readFileSync, writeFileSync, existsSync, statSync } from 'node:fs'

const HEADING = '## Final report'
const END = '<!-- end of final report -->'

const path = process.argv[2]
if (!path) { console.error('usage: quick-task-report.mjs <task file> < reply'); process.exit(2) }
if (!existsSync(path) || !statSync(path).isFile()) { console.error(`no such task file: ${path}`); process.exit(2) }

const reply = readFileSync(0, 'utf8').split('\n')
while (reply.length && !reply[0].trim()) reply.shift()
while (reply.length && !reply[reply.length - 1].trim()) reply.pop()
if (!reply.length) { console.error('empty reply on stdin; nothing to save'); process.exit(2) }

const file = readFileSync(path, 'utf8').split('\n')
const block = [HEADING, '', ...reply, '', END, '']
const start = file.findIndex((l) => /^## Final report\s*$/.test(l))

let out
if (start < 0) {
  const kept = [...file]
  while (kept.length && !kept[kept.length - 1].trim()) kept.pop()
  out = [...kept, '', ...block]
} else {
  const mark = file.findIndex((l, i) => i > start && l === END)
  let end = mark >= 0 ? mark + 1 : file.findIndex((l, i) => i > start && /^## /.test(l))
  if (end < 0) end = file.length
  while (end < file.length && !file[end].trim()) end++
  out = [...file.slice(0, start), ...block, ...file.slice(end)]
}

writeFileSync(path, out.join('\n'))
console.log(`${start < 0 ? 'appended' : 'replaced'} ${HEADING} (${reply.length} lines) in ${path}`)
