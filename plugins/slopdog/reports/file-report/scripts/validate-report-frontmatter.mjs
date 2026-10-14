#!/usr/bin/env node
// validate-report-frontmatter.mjs — checks a report file against
// examples/report-frontmatter-standard.md (T-530).
import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const V2_ROOT = join(__dirname, '..', '..', '..', '..', '..')
const yaml = createRequire(join(V2_ROOT, 'package.json'))('js-yaml')

const AUDIENCE = new Set(['self', 'team', 'partner', 'public'])
const KIND = new Set(['how', 'research', 'project'])
const SENSITIVITY = new Set(['safe', 'personal', 'deal-confidential', 'secret-adjacent'])
const YESNO = new Set(['yes', 'no'])

const REQUIRED = [
  'title',
  'date',
  'kind',
  'project',
  'summary',
  'abstract',
  'entities',
  'related',
  'tags',
  'audience',
  'quality',
  'sensitivity',
  'shareable',
  'source_path',
  'rag_ready'
]

function fail (field) {
  console.error(field)
  process.exit(1)
}

function expectedShareable (audience, sensitivity) {
  if (sensitivity === 'secret-adjacent') return 'no'
  if (sensitivity === 'deal-confidential' || sensitivity === 'personal') return 'no'
  if (sensitivity === 'safe') {
    return (audience === 'team' || audience === 'public') ? 'yes' : 'no'
  }
  return null
}

function extractFrontmatter (text) {
  const t = text.replace(/^\uFEFF/, '')
  const m = t.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/)
  if (!m) return null
  return m[1]
}

function bodyAfterFrontmatter (text) {
  const t = text.replace(/^\uFEFF/, '')
  const m = t.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n([\s\S]*)$/)
  return m ? m[1] : ''
}

function isoDateString (v) {
  if (v instanceof Date && !Number.isNaN(v.getTime())) {
    return v.toISOString().slice(0, 10)
  }
  const s = String(v)
  const head = /^(\d{4}-\d{2}-\d{2})/.exec(s)
  return head ? head[1] : s
}

function isIsoDate (v) {
  const s = isoDateString(v)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s))
}

function checkBodyHeadings (body) {
  const trimmed = body.trim()
  if (!trimmed) return true
  // Stub pointing at HTML / Artifact only — no section structure required.
  if (/^#\s/.test(trimmed) && !/\n##\s/.test(trimmed) && trimmed.length < 800) {
    const lower = trimmed.toLowerCase()
    if (lower.includes('.html') || lower.includes('artifact')) return true
  }
  const lines = trimmed.split('\n')
  for (const line of lines) {
    if (/^#{3,}\s/.test(line)) return false
    if (/^#{1}\s/.test(line)) continue
    if (/^##\s/.test(line)) continue
    if (/^\*\*[^*]+\*\*\s*$/.test(line.trim())) return false
  }
  return true
}

const file = process.argv[2]
if (!file) {
  console.error('Usage: validate-report-frontmatter.mjs <report.md|report.html>')
  process.exit(1)
}

let raw
try {
  raw = readFileSync(resolve(file), 'utf8')
} catch {
  console.error('file')
  process.exit(1)
}

const fmText = extractFrontmatter(raw)
if (!fmText) fail('title')

let fm
try {
  fm = yaml.load(fmText)
} catch {
  fail('title')
}
if (!fm || typeof fm !== 'object') fail('title')

for (const key of REQUIRED) {
  if (fm[key] === undefined || fm[key] === null || (fm[key] === '' && key !== 'project')) fail(key)
}

const title = String(fm.title).trim()
if (!title) fail('title')

if (!isIsoDate(fm.date)) fail('date')

if (!KIND.has(String(fm.kind))) fail('kind')

if (typeof fm.project !== 'string') fail('project')

if (!String(fm.summary).trim() || String(fm.summary).includes('\n')) fail('summary')

const abstract = String(fm.abstract).trim()
if (!abstract) fail('abstract')

if (!Array.isArray(fm.entities)) fail('entities')
if (!Array.isArray(fm.related)) fail('related')
if (!Array.isArray(fm.tags) || !fm.tags.length) fail('tags')
if (!fm.tags.map(String).includes('report')) fail('tags')

if (!AUDIENCE.has(String(fm.audience))) fail('audience')

const q = Number(fm.quality)
if (!Number.isInteger(q) || q < 1 || q > 5) fail('quality')

if (!SENSITIVITY.has(String(fm.sensitivity))) fail('sensitivity')

if (!YESNO.has(String(fm.shareable))) fail('shareable')

if (!String(fm.source_path).trim()) fail('source_path')

if (!YESNO.has(String(fm.rag_ready))) fail('rag_ready')

const wantShareable = expectedShareable(String(fm.audience), String(fm.sensitivity))
if (wantShareable && String(fm.shareable) !== wantShareable) fail('shareable')

if (String(fm.rag_ready) === 'yes') {
  if (q < 3) fail('rag_ready')
  if (!checkBodyHeadings(bodyAfterFrontmatter(raw))) fail('rag_ready')
}

process.exit(0)
