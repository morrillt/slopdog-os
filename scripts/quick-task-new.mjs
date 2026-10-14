#!/usr/bin/env node
// quick-task-new.mjs — create one quick-task file with a correct id, parent and frontmatter.
//
// The one writer behind Obsidian's "New quick task" button (QuickAdd macro → user script
// Slopdog/Quick Tasks/scripts/new-quick-task.js → this script). Nothing hand-edits frontmatter.
//
// Usage:
//   node quick-task-new.mjs --title "Thing to do" [--parent QT-0017] [--desk prototyper] [--tier sweep|default|hard|ceiling --tier-why "kind of work"] [--points 2]
//   node quick-task-new.mjs --list-parents      # JSON [{id,title}] of top-level tasks, for a chooser
//
// Prints the absolute path of the file it wrote.

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { highestId } from './notiontime/ingest.mjs'

const V2 = join(dirname(fileURLToPath(import.meta.url)), '..')
const QUICK = join(V2, 'quick-tasks')
// Where a new file lands. The Obsidian button sets QUICK_TASK_OUT_DIR to the prototyper sandbox, so
// pressing it while the UI is being built never inserts a task into the live store (Todd, 2026-10-12).
// Parents and the next id are still read from the live store, so the chooser and the ids look real.
const OUT = process.env.QUICK_TASK_OUT_DIR || QUICK

const arg = (n, d = null) => { const i = process.argv.indexOf(`--${n}`); return i === -1 ? d : process.argv[i + 1] }
const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)

/** Every quick task that can be a parent: has an id, is not done, and is itself top-level or one deep. */
function tasks() {
  const out = []
  for (const f of readdirSync(QUICK)) {
    if (!f.endsWith('.md') || f === 'TEMPLATE.md') continue
    const head = readFileSync(join(QUICK, f), 'utf8').slice(0, 1500)
    const id = head.match(/^id:\s*(QT-\d+)/m)?.[1]
    if (!id) continue
    out.push({
      id,
      title: head.match(/^title:\s*(.+)$/m)?.[1]?.trim() || id,
      parent: head.match(/^parent:\s*(QT-\d+)/m)?.[1] || '',
      status: head.match(/^status:\s*(\S+)/m)?.[1] || '',
    })
  }
  return out.sort((a, b) => Number(a.id.slice(3)) - Number(b.id.slice(3)))
}

if (process.argv.includes('--list-parents')) {
  const open = tasks().filter((t) => t.status !== 'done' && !t.parent)
  console.log(JSON.stringify(open.map(({ id, title }) => ({ id, title }))))
  process.exit(0)
}

const title = arg('title')
if (!title) { console.error('quick-task-new: --title is required'); process.exit(1) }
const parent = (arg('parent', '') || '').trim()
if (parent && !/^QT-\d{4}$/.test(parent)) { console.error(`quick-task-new: --parent "${parent}" is not a QT id`); process.exit(1) }
if (parent && !tasks().some((t) => t.id === parent)) { console.error(`quick-task-new: no task has id ${parent}`); process.exit(1) }

const id = `QT-${String(highestId(QUICK) + 1).padStart(4, '0')}`
const date = new Date().toISOString().slice(0, 10)
const stamp = new Date().toTimeString().slice(0, 5)
const desk = arg('desk', 'prototyper')
const points = arg('points', '')
const tier = arg('tier', '')
const tierWhy = arg('tier-why', '')
if (tier && !['sweep', 'default', 'hard', 'ceiling'].includes(tier)) { console.error(`quick-task-new: --tier "${tier}" is not sweep, default, hard or ceiling`); process.exit(1) }

let name = `${date}-${slug(title) || id.toLowerCase()}.md`
let n = 1
while (existsSync(join(OUT, name))) { n += 1; name = `${date}-${slug(title) || id.toLowerCase()}-${n}.md` }

const body = `---
title: ${title}
desk: ${desk}
status: queued
created: ${date}
critical:
tier: ${tier}
tier_why: ${tierWhy}
points: ${points}
id: ${id}
parent: ${parent}
kind: task
summary:
notion:
align:
done:
now:
blocked_by:
---

# ${title}

**Asked:** ${title}

## What
${title}

## Done when
${title} is done and Todd has seen it.

## Notes
- ${date} ${stamp} · created from Obsidian${parent ? ` as a subtask of ${parent}` : ''}
`
const path = join(OUT, name)
writeFileSync(path, body)
console.log(path)
