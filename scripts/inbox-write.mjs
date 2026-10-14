#!/usr/bin/env node
// inbox-write — write one message into another desk's inbox, correctly named.
//
//   inbox-write.mjs --to <lane> --slug <slug> [--from <lane>] [--text "..."]
//
// Why this exists (T-632, matrix cell M5). SendMessage does not queue. A send to a desk that
// is not reachable returns `success: false` and nothing is written anywhere, so the rule that
// "the inbox is the ultimate fallback" only holds if the *sender* writes that file when the
// send fails. Nothing obliged a sender to, and doing it by hand means getting the folder from
// the registry and the `YYYY-MM-DD-HHMM-from-<lane>-<slug>.md` name right, which is enough
// friction that senders skipped it. This makes the fallback one command.
//
// --from defaults to the lane whose folder contains cwd, the same way dispatch.mjs finds its
// sender. Text comes from --text or stdin. Prints the path it wrote.
//
// It does not commit. The caller commits that path, as `v2/CLAUDE.md` requires, because only
// the caller knows whether the message is one of the gitignored kinds.

import { readLanesDocument } from './lib/registry.mjs'
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { join, resolve } from 'node:path'

const V2 = resolve(import.meta.dirname, '..')
const lanes = readLanesDocument({ v2: V2 })

const opt = (f) => { const i = process.argv.indexOf(f); return i > -1 ? process.argv[i + 1] : null }
const die = (m) => { console.error(`inbox-write: ${m}`); process.exit(2) }

const to = opt('--to') || die('need --to <lane>')
const slug = (opt('--slug') || die('need --slug <slug>')).replace(/[^a-z0-9-]/gi, '-').toLowerCase()

const lane = lanes[to]
if (!lane?.folder) die(`unknown lane '${to}'. Lanes: ${Object.keys(lanes).filter((k) => !['_', 'seats'].includes(k)).join(', ')}`)

// Sender: --from, else the lane whose folder is the longest prefix of cwd.
let from = opt('--from')
if (!from) {
  const cwd = process.cwd()
  let best = null
  for (const [key, v] of Object.entries(lanes)) {
    if (!v?.folder) continue
    const dir = join(V2, v.folder)
    if ((cwd === dir || cwd.startsWith(dir + '/')) && (!best || dir.length > best.dir.length)) best = { key, dir }
  }
  from = best?.key
}
if (!from) die('could not work out the sender lane from cwd; pass --from <lane>')

let text = opt('--text')
if (!text) {
  text = readFileSync(0, 'utf8').trim()
  if (!text) die('no message: pass --text or pipe it on stdin')
}

const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')
const name = `${stamp}-from-${from}-${slug}.md`
const inbox = process.env.SLOPDOG_INBOX_DIR ? resolve(process.env.SLOPDOG_INBOX_DIR) : join(V2, lane.folder, 'inbox') // SLOPDOG_INBOX_DIR: test sandbox (T-696)
if (!existsSync(inbox)) mkdirSync(inbox, { recursive: true })
const path = join(inbox, name)
if (existsSync(path)) die(`${path} already exists`)

writeFileSync(path, `# From ${from}\n\n${text}\n`)
console.log(path)
