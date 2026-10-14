#!/usr/bin/env node
// memory-audit-runner — runs the memory audit headless for the weekly timer
// Pure Node, no LLM calls. Checks every desk against the desk standard.
// Timer: ~/.config/systemd/user/memory-audit.timer (Mon 09:45)

import { readLanesDocument } from '../../../scripts/lib/registry.mjs'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from 'node:fs'
import { join, relative } from 'node:path'
import { homedir } from 'node:os'

const HOME = homedir()
const SLOPDOG = join(HOME, 'slopdog')
const V2 = join(SLOPDOG, 'v2')
const TASKS = join(SLOPDOG, 'tasks')
const STATE = join(HOME, '.local', 'state', 'memory-audit')
const LOG = join(STATE, 'log')
const DESK_STANDARD = join(V2, 'rules', 'desk-standard.md')
const REPORTS = join(TASKS, 'reports')

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const NOW = args.includes('--now')
if (!DRY && !NOW) { console.error('usage: memory-audit-runner.mjs --now | --dry-run'); process.exit(2) }

const today = new Date().toISOString().slice(0, 10)
const stamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')
mkdirSync(STATE, { recursive: true })
const log = (line) => { if (DRY) { console.log(`[dry-run] log: ${line}`); return } writeFileSync(LOG, `${new Date().toISOString()} ${line}\n`, { flag: 'a' }) }
const tilde = (p) => p.replace(HOME, '~')
const read = (p) => { try { return readFileSync(p, 'utf8') } catch { return null } }
const lines = (p) => (read(p) || '').split('\n').length

// Required shared rules that every desk CLAUDE.md should @-import
const REQUIRED_IMPORTS = [
  'rules/principles.md',
  'rules/output-style.md',
  'rules/before-asking-todd.md',
  'rules/cmux-teams.md',
  'rules/workspaces.md',
  'rules/memory.md',
  'rules/desk-clear.md',
]

function desks() {
  const data = readLanesDocument({ v2: V2 })
  return Object.entries(data)
    .filter(([_, v]) => v.folder && !v.owner)
    .map(([id, v]) => ({ id, name: v.name, title: v.title, folder: v.folder }))
}

function checkDesk(desk) {
  const findings = []
  const deskPath = join(V2, desk.folder)
  const claudeMdPath = join(deskPath, 'CLAUDE.md')
  const memoryPath = join(deskPath, 'memory')

  // 1. Identity block
  const claudeMd = read(claudeMdPath)
  if (!claudeMd) {
    findings.push({ area: 'identity', title: 'Missing CLAUDE.md', why: `No CLAUDE.md at ${tilde(claudeMdPath)}`, fix: 'Create CLAUDE.md with role line and imports' })
  } else {
    const roleLineMatch = claudeMd.match(/^#\s+(.+?)\s*[—-]\s*(.+)$/m)
    if (!roleLineMatch) {
      findings.push({ area: 'identity', title: 'Missing role line', why: 'CLAUDE.md has no "# Name — Title" line', fix: 'Add role line matching the registry name and title' })
    } else {
      const [, name, title] = roleLineMatch
      if (name.trim() !== desk.name) {
        findings.push({ area: 'identity', title: 'Role name mismatch', why: `CLAUDE.md has "${name.trim()}" but the registry has "${desk.name}"`, fix: `Change role line to "# ${desk.name} — ${desk.title}"` })
      }
      if (title.trim() !== desk.title) {
        findings.push({ area: 'identity', title: 'Role title mismatch', why: `CLAUDE.md has "${title.trim()}" but the registry has "${desk.title}"`, fix: `Change role line to "# ${desk.name} — ${desk.title}"` })
      }
    }
  }

  // 2. Shared rules imports
  if (claudeMd) {
    for (const imp of REQUIRED_IMPORTS) {
      const importPath = `@${HOME}/slopdog/v2/${imp}`
      if (!claudeMd.includes(importPath) && !claudeMd.includes(`@~/slopdog/v2/${imp}`)) {
        findings.push({ area: 'imports', title: `Missing import: ${imp}`, why: `CLAUDE.md does not @-import ${importPath}`, fix: `Add \`@${importPath}\` to CLAUDE.md` })
      }
    }
    // Check for stale v1 imports
    if (claudeMd.includes('v1/')) {
      const v1Imports = claudeMd.match(/@.*v1\/[^\s)]+/g) || []
      for (const imp of v1Imports) {
        findings.push({ area: 'imports', title: 'Stale v1 import', why: `CLAUDE.md imports ${imp} which points to frozen v1`, fix: `Update to v2 equivalent or remove` })
      }
    }
  }

  // 3. Memory folder
  if (!existsSync(memoryPath)) {
    findings.push({ area: 'memoryFolder', title: 'Missing memory folder', why: `No memory/ folder at ${tilde(memoryPath)}`, fix: 'Create memory/ folder with MEMORY.md index' })
  } else {
    const memoryMdPath = join(memoryPath, 'MEMORY.md')
    const memoryMd = read(memoryMdPath)
    if (!memoryMd) {
      findings.push({ area: 'memoryFolder', title: 'Missing MEMORY.md', why: `No MEMORY.md index at ${tilde(memoryMdPath)}`, fix: 'Create MEMORY.md with one-line pointers to each shard' })
    } else {
      const shardFiles = readdirSync(memoryPath).filter(f => f.endsWith('.md') && f !== 'MEMORY.md' && f !== 'README.md')
      const indexLines = memoryMd.split('\n').filter(l => l.trim().startsWith('- ['))
      if (shardFiles.length !== indexLines.length) {
        findings.push({ area: 'memoryFolder', title: 'MEMORY.md out of sync', why: `${shardFiles.length} shard files but ${indexLines.length} index lines`, fix: 'Update MEMORY.md to have one line per shard file' })
      }
      // Check each shard has valid frontmatter
      for (const shard of shardFiles) {
        const shardPath = join(memoryPath, shard)
        const content = read(shardPath)
        if (content) {
          const fmMatch = content.match(/^---\n([\s\S]*?)\n---/)
          if (!fmMatch) {
            findings.push({ area: 'memoryFolder', title: `Shard missing frontmatter: ${shard}`, why: 'No YAML frontmatter found', fix: 'Add frontmatter with name, description, metadata.type' })
          } else {
            const fm = fmMatch[1]
            if (!fm.includes('name:')) findings.push({ area: 'memoryFolder', title: `Shard missing name: ${shard}`, why: 'Frontmatter has no name field', fix: 'Add name field' })
            if (!fm.includes('description:')) findings.push({ area: 'memoryFolder', title: `Shard missing description: ${shard}`, why: 'Frontmatter has no description field', fix: 'Add description field' })
            if (!fm.includes('metadata.type:')) findings.push({ area: 'memoryFolder', title: `Shard missing metadata.type: ${shard}`, why: 'Frontmatter has no metadata.type field', fix: 'Add metadata.type: user|feedback|project|reference' })
            else if (!/metadata\.type:\s*(user|feedback|project|reference)/.test(fm)) {
              findings.push({ area: 'memoryFolder', title: `Shard invalid metadata.type: ${shard}`, why: 'metadata.type must be user|feedback|project|reference', fix: 'Fix metadata.type value' })
            }
          }
        }
      }
    }
  }

  // 4. Check @-import paths exist
  if (claudeMd) {
    const importMatches = claudeMd.match(/@([^\s)]+)/g) || []
    for (const imp of importMatches) {
      const path = imp.slice(1).replace(/^~\/slopdog\/v2\//, '').replace(/^~\//, HOME + '/')
      const fullPath = path.startsWith('/') ? path : join(HOME, path)
      if (!existsSync(fullPath)) {
        findings.push({ area: 'imports', title: `Broken import: ${imp}`, why: `Path does not exist: ${tilde(fullPath)}`, fix: 'Fix or remove the import' })
      }
    }
  }

  return {
    desk: desk.id,
    name: desk.name,
    identity: { pass: !findings.some(f => f.area === 'identity'), findings: findings.filter(f => f.area === 'identity') },
    docsSanity: { pass: !findings.some(f => f.area === 'imports' && f.title.startsWith('Missing import')), findings: findings.filter(f => f.area === 'imports' && f.title.startsWith('Missing import')) },
    memoryFolder: { pass: !findings.some(f => f.area === 'memoryFolder'), findings: findings.filter(f => f.area === 'memoryFolder') },
    imports: { pass: !findings.some(f => f.area === 'imports' && !f.title.startsWith('Missing import')), findings: findings.filter(f => f.area === 'imports' && !f.title.startsWith('Missing import')) },
  }
}

function buildReport(results) {
  const out = []
  out.push(`# Memory Audit ${today}`)
  out.push('')
  const clean = results.filter(r => r.identity.pass && r.docsSanity.pass && r.memoryFolder.pass && r.imports.pass).length
  const total = results.length
  out.push(`**Verdict:** ${clean} of ${total} desks clean. ${total - clean} with gaps.`)
  out.push('')
  for (const r of results) {
    const pass = r.identity.pass && r.docsSanity.pass && r.memoryFolder.pass && r.imports.pass
    out.push(`## ${r.name} (${r.desk}) ${pass ? '✅' : '⚠️'}`)
    for (const area of ['identity', 'docsSanity', 'memoryFolder', 'imports']) {
      const a = r[area]
      if (a.findings.length) {
        out.push(`- ${area}: ${a.findings.length} finding(s)`)
        for (const f of a.findings) out.push(`  - ${f.title}: ${f.why} — Fix: ${f.fix}`)
      } else {
        out.push(`- ${area}: pass`)
      }
    }
    out.push('')
  }
  return out.join('\n')
}

async function main() {
  try {
    if (!existsSync(DESK_STANDARD)) throw new Error(`Desk standard not found: ${tilde(DESK_STANDARD)}`)
    const deskList = desks()
    const results = []
    for (const desk of deskList) {
      log(`checking ${desk.id}`)
      const r = checkDesk(desk)
      results.push(r)
      log(`done ${desk.id}`)
    }
    const report = buildReport(results)
    const reportPath = join(REPORTS, `memory-audit-${today}.md`)
    if (DRY) { console.log(`\n===== memory-audit dry run ${today} =====\n${report}\n`); return }
    mkdirSync(REPORTS, { recursive: true })
    writeFileSync(reportPath, report)
    log(`report written ${tilde(reportPath)}`)
    // file-report
    const { spawnSync } = await import('node:child_process')
    const fileReport = spawnSync('claude', ['slopdog:file-report', reportPath], { cwd: HOME, encoding: 'utf8', timeout: 60000 })
    if (fileReport.status !== 0) log(`file-report failed: ${(fileReport.stderr || fileReport.stdout || '').trim().slice(0, 300)}`)
    else log('file-report ok')
    // DM Todd via Slack desk
    const cleanCount = results.filter(r => r.identity.pass && r.docsSanity.pass && r.memoryFolder.pass && r.imports.pass).length
    const slack = spawnSync('claude', ['slopdog:slack', `dm`, `Memory audit ${today}: ${cleanCount} of ${results.length} desks clean — see report`], { cwd: HOME, encoding: 'utf8', timeout: 30000 })
    if (slack.status !== 0) log(`slack dm failed: ${(slack.stderr || slack.stdout || '').trim().slice(0, 300)}`)
    else log('slack dm sent')
    const summary = `desks=${results.length} clean=${cleanCount}`
    log(`${summary}`)
    if (!DRY) console.log(`memory-audit: ${summary}`)
  } catch (e) {
    log(`failed: ${String(e?.message || e).slice(0, 300)}`)
    console.error(`memory-audit failed: ${e?.message || e}`)
    process.exit(1)
  }
}

main()