#!/usr/bin/env node
// verify-fail — the verifier's failure note, one line per failing AC, under ## Progress notes.
//   verify-fail.mjs <ticket-path|T-id> --verifier <name> --category <cat> --ac AC-n --reason "<one sentence>"
// Writes `- YYYY-MM-DD HH:MM (UTC) · <verifier> · verify failed [<cat>] AC-n: <reason>`. Exit 1 on a
// missing field or a category outside CATEGORIES; nothing is written then.
import { readFileSync, writeFileSync } from 'node:fs'
import { parseArgs } from 'node:util'
import { resolveTicket } from './ticket-lib.mjs'

export const CATEGORIES = ['code-defect', 'no-real-run', 'bad-verify-line', 'not-built', 'stale-base', 'env-quota', 'scope-product', 'verifier-error']
const fail = (m) => { console.error(`verify-fail: ${m}`); process.exit(1) }

const { values: v, positionals } = parseArgs({ allowPositionals: true, options: { verifier: { type: 'string' }, category: { type: 'string' }, ac: { type: 'string' }, reason: { type: 'string' } } })
if (!positionals[0] || !v.verifier || !v.ac || !v.reason?.trim()) fail('usage: verify-fail.mjs <ticket|T-id> --verifier <name> --category <cat> --ac AC-n --reason "<sentence>"')
if (!CATEGORIES.includes(v.category)) fail(`--category must be one of ${CATEGORIES.join(', ')}`)
if (!/^AC-\d+$/.test(v.ac)) fail('--ac must look like AC-3')
const path = resolveTicket(positionals[0])
if (!path) fail(`no ticket found for "${positionals[0]}"`)

const p2 = (n) => String(n).padStart(2, '0')
export const utcStamp = (d = new Date()) => `${d.getUTCFullYear()}-${p2(d.getUTCMonth() + 1)}-${p2(d.getUTCDate())} ${p2(d.getUTCHours())}:${p2(d.getUTCMinutes())}`
const line = `- ${utcStamp()} · ${v.verifier} · verify failed [${v.category}] ${v.ac}: ${v.reason.trim().replace(/\s+/g, ' ')}`
let t = readFileSync(path, 'utf8')
if (!/^## Progress notes\s*$/m.test(t)) t = t.replace(/\s*$/, '\n\n## Progress notes\n')
const lines = t.split('\n')
const h = lines.findIndex((l) => /^## Progress notes\s*$/.test(l))
let end = lines.findIndex((l, i) => i > h && /^## /.test(l)); if (end === -1) end = lines.length
let at = end; while (at > h + 1 && lines[at - 1].trim() === '') at--
lines.splice(at, 0, line)
writeFileSync(path, lines.join('\n'))
console.log(`${path}: ${line}`)
