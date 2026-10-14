#!/usr/bin/env node
// Append structured sprint lessons to ~/slopdog/v2/retrospective/<date>-<department>.md (T-659).
// CLI: node retrospective-append.mjs --ticket T-nnn --what "..." --cost "..." --prevention "..."
//   [--department slopdog|projects|it] [--sprint <filename-or-path>]
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { basename, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { commitOwnFile } from './lib/commit-own-file.mjs'

export const ALLOWED_DEPARTMENTS = ['slopdog', 'projects', 'it']

export const ALLOWED_THEMES = [
  'watcher',
  'plugin-hook',
  'skill',
  'script',
  'dispatch',
  'git',
  'memory',
  'delivery',
  'unstucker',
  'desk-clear',
  'universe-ui',
  'machine',
]

export function normalizeTheme(theme) {
  if (!theme) return null
  const t = String(theme).trim().toLowerCase()
  if (!ALLOWED_THEMES.includes(t)) {
    throw new Error(`unknown theme "${theme}"; allowed: ${ALLOWED_THEMES.join(', ')}`)
  }
  return t
}

const V2_DIR = resolve(process.env.SLOPDOG_V2 || resolve(fileURLToPath(new URL('..', import.meta.url))))
const RETRO_DIR = join(V2_DIR, 'retrospective')
const TASKS_DIR = resolve(process.env.SLOPDOG_TASKS || join(homedir(), 'slopdog', 'tasks', 'tickets'))

const REQUIRED = ['ticket', 'what', 'cost', 'prevention']

export function validateLessonFields(fields) {
  const missing = REQUIRED.filter((k) => !String(fields[k] ?? '').trim())
  return { ok: missing.length === 0, missing }
}

export function normalizeDepartment(dept) {
  const d = String(dept || 'slopdog').trim().toLowerCase()
  if (!ALLOWED_DEPARTMENTS.includes(d)) {
    throw new Error(`unknown department "${dept}"; allowed: ${ALLOWED_DEPARTMENTS.join(', ')}`)
  }
  return d
}

function parseDatePrefix(filename) {
  const m = /^(\d{4}-\d{2}-\d{2})-/.exec(filename)
  return m ? m[1] : ''
}

export function resolveRetrospectivePath({ retroDir, department, sprint, today }) {
  const dept = normalizeDepartment(department)
  if (sprint) {
    const base = basename(sprint)
    if (!base.endsWith(`-${dept}.md`)) {
      throw new Error(`--sprint must end with -${dept}.md`)
    }
    return join(retroDir, base)
  }
  const matches = readdirSync(retroDir, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.endsWith(`-${dept}.md`))
    .map((e) => e.name)
    .sort((a, b) => parseDatePrefix(b).localeCompare(parseDatePrefix(a)))
  if (matches.length > 0) {
    return join(retroDir, matches[0])
  }
  const day = today || new Date().toISOString().slice(0, 10)
  return join(retroDir, `${day}-${dept}.md`)
}

function departmentTitle(dept) {
  return dept
}

export function defaultHeader(department, sprintDate) {
  const dept = normalizeDepartment(department)
  return `# Sprint retrospective — the ${departmentTitle(dept)} sprint of ${sprintDate}

One entry per problem or improvement, appended as it happens by whichever desk hit it.
Each entry: what happened, which ticket or job, what it cost, what would stop it recurring.

`
}

const ENTRY_HEADING_TS = /^## (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) · /
const BODY_LINE_TS = /^- (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) ·/
const REVIEWED_MARKER = /<!-- reviewed: (\d{4}-\d{2}-\d{2} \d{2}:\d{2}) -->/g

export function formatLessonEntry({ what, ticket, cost, prevention, author, at, tag }) {
  let summary = String(what).trim().split('\n')[0]
  if (tag) {
    const t = normalizeTheme(tag)
    if (summary.startsWith('[hardening]')) {
      const rest = summary.replace(/^\[hardening\]\s*/, '')
      summary = `[hardening] [${t}] ${rest}`
    } else {
      summary = `[${t}] ${summary}`
    }
  }
  const line = `- ${at} · ${author} · ${String(what).trim()} (${ticket})`
  return `## ${at} · ${summary}
${line}
- Cost: ${String(cost).trim()}
- What would stop it recurring: ${String(prevention).trim()}

`
}

export function parseEntryHeadings(text) {
  const lines = text.split('\n')
  const headings = []
  for (const line of lines) {
    if (!line.startsWith('## ')) continue
    const m = ENTRY_HEADING_TS.exec(line)
    if (m) headings.push({ line, at: m[1] })
  }
  return headings
}

export function latestReviewedAt(text) {
  let latest = null
  for (const m of text.matchAll(REVIEWED_MARKER)) {
    const at = m[1]
    if (!latest || at.localeCompare(latest) > 0) latest = at
  }
  return latest
}

export function formatReviewedMarker(at) {
  return `<!-- reviewed: ${at} -->\n`
}

export function insertReviewedMarker(text, marker) {
  const addressedIdx = findAddressedIndex(text)
  if (addressedIdx === -1) {
    const trimmed = text.replace(/\s+$/, '')
    return trimmed + (trimmed ? '\n\n' : '') + marker
  }
  const before = text.slice(0, addressedIdx).replace(/\s+$/, '')
  const rest = text.slice(addressedIdx)
  const prefix = before ? before + '\n\n' : ''
  return prefix + marker + rest
}

export function markReviewed({ targetPath, at }) {
  const marker = formatReviewedMarker(at)
  if (!existsSync(targetPath)) {
    throw new Error(`retrospective file not found: ${targetPath}`)
  }
  const text = readFileSync(targetPath, 'utf8')
  writeFileSync(targetPath, insertReviewedMarker(text, marker), 'utf8')
  return targetPath
}

export function listNewEntryHeadings(text) {
  const reviewedAt = latestReviewedAt(text)
  const headings = parseEntryHeadings(text)
  const newOnes = reviewedAt
    ? headings.filter((h) => h.at.localeCompare(reviewedAt) > 0)
    : headings
  return newOnes.map((h) => h.line)
}

const ADDRESSED_HEADING = '### Addressed'

export function separatorBeforeLesson(text) {
  if (text.length === 0) return ''
  if (text.endsWith('\n\n')) return ''
  if (text.endsWith('\n')) return '\n'
  return '\n\n'
}

export function findAddressedIndex(text) {
  const atLine = text.indexOf('\n### Addressed')
  if (atLine !== -1) return atLine + 1
  if (text.startsWith('### Addressed')) return 0
  return -1
}

export function mergeLessonIntoRetrospective(text, entry) {
  const addressedIdx = findAddressedIndex(text)
  if (addressedIdx === -1) {
    return text + separatorBeforeLesson(text) + entry
  }
  const active = text.slice(0, addressedIdx).replace(/\s+$/, '')
  const rest = text.slice(addressedIdx)
  const prefix = active ? active + separatorBeforeLesson(active) : ''
  return prefix + entry + rest
}

export function appendLesson({ targetPath, department, sprintDate, entry }) {
  mkdirSync(join(targetPath, '..'), { recursive: true })
  if (!existsSync(targetPath)) {
    const date = sprintDate || parseDatePrefix(basename(targetPath))
    writeFileSync(targetPath, defaultHeader(department, date) + entry, 'utf8')
    return
  }
  const text = readFileSync(targetPath, 'utf8')
  writeFileSync(targetPath, mergeLessonIntoRetrospective(text, entry), 'utf8')
}

export function parseTicketFrontMatter(content) {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!m) return null
  const fm = m[1]
  const idMatch = fm.match(/^id:\s*(\S+)/m)
  const id = idMatch ? idMatch[1].replace(/^["']|["']$/g, '') : null
  const themeMatch = fm.match(/^theme:\s*(\S+)/m)
  const theme = themeMatch ? themeMatch[1].replace(/^["']|["']$/g, '').toLowerCase() : null
  const tagsBlock = fm.match(/^tags:\s*\n((?:\s+-\s+.*\n)+)/m)
  const tags = []
  if (tagsBlock) {
    for (const line of tagsBlock[1].split('\n')) {
      const tm = line.match(/^\s+-\s+([^\s#]+)/)
      if (tm) tags.push(tm[1])
    }
  }
  const titleMatch = content.match(/^#\s+(.+)$/m)
  const title = titleMatch ? titleMatch[1].trim() : (id || 'untitled')
  return { id, theme, tags, title }
}

export function parseHardeningEntries(text) {
  const lines = text.split('\n')
  const entries = []
  let current = null
  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (current) entries.push(current)
      current = { heading: line, lines: [] }
    } else if (current) {
      current.lines.push(line)
    }
  }
  if (current) entries.push(current)

  return entries.filter((e) => {
    return e.heading.includes('[hardening]') || e.lines.some((l) => l.includes('[hardening]'))
  }).map((e) => {
    const m = e.heading.match(/^##\s+(\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2})\s*·\s*(.*)$/)
    const at = m ? m[1] : ''
    const summary = m ? m[2].trim() : e.heading.replace(/^##\s*/, '')
    const themeMatch = summary.match(/\[hardening\]\s*\[([a-z0-9-]+)\]/i) || summary.match(/^\[([a-z0-9-]+)\]/i)
    let theme = themeMatch ? themeMatch[1].toLowerCase() : null
    if (theme && !ALLOWED_THEMES.includes(theme)) {
      theme = null
    }
    return {
      type: 'entry',
      at,
      summary,
      theme,
      heading: e.heading,
      raw: [e.heading, ...e.lines].join('\n'),
    }
  })
}

function findTicketFiles(dir) {
  const results = []
  if (!existsSync(dir)) return results
  const entries = readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      results.push(...findTicketFiles(fullPath))
    } else if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(fullPath)
    }
  }
  return results
}

export function groupByTheme({ retroTexts, tickets, retroDir = RETRO_DIR, tasksDir = TASKS_DIR } = {}) {
  const groups = {}
  for (const theme of ALLOWED_THEMES) {
    groups[theme] = []
  }
  groups.untagged = []

  let entries = []
  if (retroTexts && retroTexts.length > 0) {
    for (const text of retroTexts) {
      entries.push(...parseHardeningEntries(text))
    }
  } else if (existsSync(retroDir)) {
    const files = readdirSync(retroDir).filter((f) => f.endsWith('.md'))
    for (const file of files) {
      const text = readFileSync(join(retroDir, file), 'utf8')
      entries.push(...parseHardeningEntries(text))
    }
  }

  let ticketList = []
  if (tickets && tickets.length > 0) {
    for (const t of tickets) {
      if (typeof t === 'string') {
        const parsed = parseTicketFrontMatter(t)
        if (parsed && parsed.tags.includes('bug')) ticketList.push({ type: 'ticket', ...parsed })
      } else if (t.content) {
        const parsed = parseTicketFrontMatter(t.content)
        if (parsed && parsed.tags.includes('bug')) ticketList.push({ type: 'ticket', ...parsed })
      } else if (t.tags && t.tags.includes('bug')) {
        ticketList.push({ type: 'ticket', ...t })
      }
    }
  } else if (existsSync(tasksDir)) {
    const ticketFiles = findTicketFiles(tasksDir)
    for (const tf of ticketFiles) {
      const text = readFileSync(tf, 'utf8')
      const parsed = parseTicketFrontMatter(text)
      if (parsed && parsed.tags.includes('bug')) {
        ticketList.push({ type: 'ticket', ...parsed, file: tf })
      }
    }
  }

  for (const entry of entries) {
    if (entry.theme && groups[entry.theme]) {
      groups[entry.theme].push(entry)
    } else {
      groups.untagged.push(entry)
    }
  }

  for (const ticket of ticketList) {
    const theme = ticket.theme && ALLOWED_THEMES.includes(ticket.theme) ? ticket.theme : null
    if (theme && groups[theme]) {
      groups[theme].push(ticket)
    } else {
      groups.untagged.push(ticket)
    }
  }

  return groups
}

function parseArgs(argv) {
  const out = { department: 'slopdog', sprint: null, markReviewed: false, newOnly: false, tag: null, byTheme: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    const next = () => {
      if (i + 1 >= argv.length) throw new Error(`missing value for ${a}`)
      return argv[++i]
    }
    if (a === '--ticket') out.ticket = next()
    else if (a === '--what') out.what = next()
    else if (a === '--cost') out.cost = next()
    else if (a === '--prevention') out.prevention = next()
    else if (a === '--department') out.department = next()
    else if (a === '--sprint') out.sprint = next()
    else if (a === '--mark-reviewed') out.markReviewed = true
    else if (a === '--new') out.newOnly = true
    else if (a === '--tag') out.tag = next()
    else if (a === '--by-theme') out.byTheme = true
    else throw new Error(`unknown argument: ${a}`)
  }
  if (out.tag) {
    out.tag = normalizeTheme(out.tag)
  }
  return out
}

function localTimestamp() {
  const d = new Date()
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function authorLabel() {
  return process.env.SLOPDOG_LANE || process.env.USER || 'desk'
}

function main() {
  try {
    const args = parseArgs(process.argv)
    if (args.markReviewed && args.newOnly) {
      throw new Error('use only one of --mark-reviewed or --new')
    }
    if (args.byTheme) {
      const groups = groupByTheme({ retroDir: RETRO_DIR, tasksDir: TASKS_DIR })
      for (const theme of ALLOWED_THEMES) {
        const items = groups[theme] || []
        console.log(`\nTheme: ${theme} (${items.length})`)
        for (const item of items) {
          if (item.type === 'ticket') {
            console.log(`  - [ticket] ${item.id}: ${item.title}`)
          } else {
            console.log(`  - [entry] ${item.at} · ${item.summary}`)
          }
        }
      }
      const untagged = groups.untagged || []
      console.log(`\nUntagged: (${untagged.length})`)
      for (const item of untagged) {
        if (item.type === 'ticket') {
          console.log(`  - [ticket] ${item.id}: ${item.title}`)
        } else {
          console.log(`  - [entry] ${item.at} · ${item.summary}`)
        }
      }
      return
    }
    mkdirSync(RETRO_DIR, { recursive: true })
    const targetPath = resolveRetrospectivePath({
      retroDir: RETRO_DIR,
      department: args.department,
      sprint: args.sprint,
    })

    if (args.markReviewed) {
      const path = markReviewed({ targetPath, at: localTimestamp() })
      console.log(path)
      return
    }

    if (args.newOnly) {
      if (!existsSync(targetPath)) {
        console.log('0 new entries')
        return
      }
      const text = readFileSync(targetPath, 'utf8')
      const headings = listNewEntryHeadings(text)
      for (const h of headings) console.log(h)
      console.log(`${headings.length} new entr${headings.length === 1 ? 'y' : 'ies'}`)
      return
    }

    const check = validateLessonFields(args)
    if (!check.ok) {
      console.error(`retrospective-append: missing required field(s): ${check.missing.join(', ')}`)
      process.exit(1)
    }
    const sprintDate = parseDatePrefix(basename(targetPath))
    const entry = formatLessonEntry({
      what: args.what,
      ticket: args.ticket,
      cost: args.cost,
      prevention: args.prevention,
      author: authorLabel(),
      at: localTimestamp(),
      tag: args.tag,
    })
    appendLesson({
      targetPath,
      department: args.department,
      sprintDate,
      entry,
    })
    commitOwnFile(targetPath, 'retrospective-append', 'record a retrospective lesson')
    console.log(targetPath)
  } catch (err) {
    console.error(`retrospective-append: ${err.message}`)
    process.exit(1)
  }
}

if (process.argv[1] && realpathSync(resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main()
}
