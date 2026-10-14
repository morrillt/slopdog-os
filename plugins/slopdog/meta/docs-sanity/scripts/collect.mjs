#!/usr/bin/env node
// docs-sanity — collect the facts the audit reads. Prints a report; writes nothing.
// Called by ~/.claude/skills/slopdog/meta/docs-sanity/SKILL.md
//
// Strict YAML on every SKILL.md frontmatter (T-636): always checked before the report.
//   node collect.mjs --strict-yaml              validate only; exit 0/1
//   node collect.mjs --strict-yaml --skills-root <dir>   validate a fixture tree

import { readFileSync, readdirSync, existsSync, lstatSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { homedir } from 'node:os'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const V2_ROOT = join(__dirname, '..', '..', '..', '..', '..')
const yaml = createRequire(join(V2_ROOT, 'package.json'))('js-yaml')

const HOME = homedir()
const PLUGIN = join(HOME, '.claude/skills/slopdog')
const NOTES = join(HOME, 'slopdog/notes')
const SLOPDOG = join(HOME, 'slopdog')

const argv = process.argv.slice(2)
const strictYamlOnly = argv.includes('--strict-yaml')
const skillsRootIdx = argv.indexOf('--skills-root')
const skillsRoot = skillsRootIdx >= 0 ? argv[skillsRootIdx + 1] : PLUGIN

function walkSkills (dir) {
  const found = []
  for (const group of readdirSync(dir, { withFileTypes: true })) {
    if (!group.isDirectory() || group.name.startsWith('.')) continue
    const gdir = join(dir, group.name)
    for (const name of readdirSync(gdir, { withFileTypes: true })) {
      if (!name.isDirectory()) continue
      const f = join(gdir, name.name, 'SKILL.md')
      if (existsSync(f)) found.push({ group: group.name, name: name.name, file: f })
    }
  }
  return found.sort((a, b) => (a.group + a.name).localeCompare(b.group + b.name))
}

/** @returns {{ count: number, errors: { rel: string, message: string }[] }} */
function validateSkillFrontmatter (dir) {
  const skills = walkSkills(dir)
  const errors = []
  for (const s of skills) {
    const rel = `${s.group}/${s.name}/SKILL.md`
    const body = readFileSync(s.file, 'utf8')
    const m = body.match(/^---\r?\n([\s\S]*?)\r?\n---/)
    if (!m) {
      errors.push({ rel, message: 'missing --- frontmatter delimiters' })
      continue
    }
    try {
      yaml.load(m[1])
    } catch (e) {
      errors.push({ rel, message: e.message.replace(/\s+/g, ' ').trim() })
    }
  }
  return { count: skills.length, errors }
}

const yamlCheck = validateSkillFrontmatter(skillsRoot)
if (yamlCheck.errors.length) {
  console.error(`skill frontmatter (js-yaml): ${yamlCheck.errors.length} of ${yamlCheck.count} SKILL.md rejected`)
  for (const e of yamlCheck.errors) console.error(`  ${e.rel}: ${e.message}`)
  process.exit(1)
}
if (strictYamlOnly) {
  console.log(`skill frontmatter (js-yaml): ${yamlCheck.count} SKILL.md, 0 rejected`)
  process.exit(0)
}

const out = []
const say = (s = '') => out.push(s)
const tilde = (p) => p.replace(HOME, '~')

// ---------- 1. keep-tight ----------
say('## 1 · keep-tight (inherited, do not re-derive)\n')
const tight = join(PLUGIN, 'meta/keep-tight/scripts/check-tight.mjs')
try {
  const r = execFileSync('node', [tight], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
  say('```\n' + r.trim() + '\n```')
} catch (e) {
  const text = [e.stdout, e.stderr].filter(Boolean).join('\n').trim()
  say(`exit ${e.status ?? '?'}:`)
  say('```\n' + (text || String(e.message)) + '\n```')
}

// ---------- 2. skills inventory + the destinations each names ----------
// paths a skill body names as somewhere it puts a file
const DEST = /(?:~|\/Users\/[a-z]+)\/(?:slopdog|\.slopdog|\.claude|\.local|\.cache)\/[A-Za-z0-9_./<>-]*/g

const skills = walkSkills(PLUGIN)
say(`\n## 2 · Skills on disk — ${skills.length} (step 2: duplicates; step 3: destinations)\n`)
for (const s of skills) {
  const body = readFileSync(s.file, 'utf8')
  const fm = body.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1]
  const desc = String((fm && yaml.load(fm)?.description) || '').replace(/\s+/g, ' ').trim()
  const dests = [...new Set((body.match(DEST) || []).map(tilde))]
    .filter((p) => !p.includes('/skills/slopdog/')) // its own scripts aren't destinations
  say(`### /slopdog:${s.name}  \`${s.group}/\``)
  say(desc.slice(0, 400) + (desc.length > 400 ? '…' : ''))
  say(dests.length ? 'writes/names: ' + dests.map((d) => `\`${d}\``).join(', ') : 'writes/names: —')
  say()
}

// ---------- 3. INDEX.md rows ----------
say('\n## 3 · notes/INDEX.md rows (step 3 + step 5)\n')
const index = readFileSync(join(NOTES, 'INDEX.md'), 'utf8')
const rows = [...index.matchAll(/^\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*(.+?)\s*\|\s*$/gm)]
  .map((m) => ({ what: m[1], write: m[2], find: m[3] }))
  .filter((r) => !/^-+$/.test(r.what) && r.what !== 'What you produced')
for (const r of rows) {
  const target = r.find.replace(/`/g, '').trim()
  const clean = /[<>]|YYYY/.test(target) ? '' : target
  const abs = join(NOTES, clean)
  const exists = clean && !clean.startsWith('—') ? existsSync(abs) : null
  say(`- **${r.what}** → write \`${r.write}\` → find \`${r.find}\`` +
      (exists === false ? '  ⚠️ target does not exist' : ''))
}

// ---------- 4. notes/Slopdog census ----------
say('\n## 4 · notes/Slopdog census (step 4) — (link) = symlinked view, not authored here\n')
const sdir = join(NOTES, 'Slopdog')
for (const e of readdirSync(sdir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
  const p = join(sdir, e.name)
  if (e.isDirectory()) {
    const files = readdirSync(p, { withFileTypes: true })
    const hasReadme = files.some((f) => f.name === 'README.md')
    say(`### ${e.name}/ — ${files.length} entries${hasReadme ? '' : '  ⚠️ no README'}`)
    for (const f of files.sort((a, b) => a.name.localeCompare(b.name))) {
      const fp = join(p, f.name)
      const isLink = lstatSync(fp).isSymbolicLink()
      let extra = ''
      if (isLink) {
        try { extra = ` ⇒ ${tilde(execFileSync('readlink', ['-f', fp], { encoding: 'utf8' }).trim())}` }
        catch { extra = ' ⇒ (broken)' }
      }
      say(`- ${f.name}${isLink ? ' (link)' : ''}${extra}`)
    }
    say()
  } else say(`- ${e.name} (loose file at Slopdog/ root)`)
}

// ---------- 5. the files that make routing claims ----------
say('\n## 5 · Files that make routing claims (step 5 — read each, cross-check)\n')
const claimants = [
  join(NOTES, 'INDEX.md'),
  join(NOTES, 'CLAUDE.md'),
  join(NOTES, 'Slopdog/README.md'),
  join(HOME, 'HOME-INDEX.md'),
  join(HOME, '.claude/CLAUDE.md'),
  join(HOME, '.claude/docs/claude-code-best-practices.md'),
  join(SLOPDOG, 'CLAUDE.md'),
]
for (const d of readdirSync(sdir, { withFileTypes: true })) {
  if (d.isDirectory() && existsSync(join(sdir, d.name, 'README.md'))) claimants.push(join(sdir, d.name, 'README.md'))
}
try {
  const more = execFileSync('find', [join(SLOPDOG, 'dev'), '-maxdepth', '3', '-name', 'CLAUDE.md',
    '-not', '-path', '*/node_modules/*'], { encoding: 'utf8' }).trim().split('\n').filter(Boolean)
  claimants.push(...more)
} catch {}
for (const c of [...new Set(claimants)]) {
  if (!existsSync(c)) { say(`- \`${tilde(c)}\` ⚠️ missing`); continue }
  const body = readFileSync(c, 'utf8')
  const hits = body.split('\n').filter((l) => /INDEX\.md|Find it here|Write it here|goes (in|into|here)|lives (in|at)|routed|filed/i.test(l)).length
  say(`- \`${tilde(c)}\` — ${body.split('\n').length} lines, ${hits} routing-ish lines`)
}


console.log(out.join('\n'))
