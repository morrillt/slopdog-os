#!/usr/bin/env node
// framework-audit — the weekly Slopdog framework audit (T-458). Page 1 is this script: a
// system-at-a-glance markdown page (counts, desks, hooks by event, rules by always-on cost,
// timers, and what changed since the last run), under sixty lines so Todd reads it. Page 2 is
// Samwell's: the script drops page 1 into the Research desk's inbox with Todd's ask, and
// Samwell writes suggestions and gaps measured against rules/principles.md, joins the two
// pages and files them with /slopdog:file-report (the Reports tab).
//
//   framework-audit.mjs --now       write page 1, hand it to Samwell (inbox file, committed
//                                   and pushed), remember this run for next week's diff
//   framework-audit.mjs --dry-run   print page 1; write, send and remember nothing
//
// Page 1: ~/slopdog/v2/reports/framework-audit/<date>-glance.md. Last run's snapshot:
// ~/.local/state/framework-audit/last.json. Opens nothing on screen.
// Timer: ~/.config/systemd/user/framework-audit.timer (Mon 09:30, after docs-order at 09:15).
import { readLanesDocument } from './lib/registry.mjs'
import { discoverSkills, skillFile } from './lib/skill-discovery.mjs'
import yaml from 'js-yaml'
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs'
import { execFileSync } from 'node:child_process'
import { join, basename, relative } from 'node:path'
import { homedir } from 'node:os'

const HOME = homedir()
const SLOPDOG = join(HOME, 'slopdog')
const V2 = join(SLOPDOG, 'v2')
const PLUGIN = join(V2, 'plugins', 'slopdog')
const TASKS_SKILLS = join(SLOPDOG, 'tasks', '.claude', 'skills')
const STATE = join(HOME, '.local', 'state', 'framework-audit')
const LAST = join(STATE, 'last.json')
const OUT_DIR = join(V2, 'reports', 'framework-audit')
const INBOX = join(V2, 'desks', 'research', 'inbox')

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
if (!DRY && !args.includes('--now')) { console.error('usage: framework-audit.mjs --now | --dry-run'); process.exit(2) }

const now = new Date()
const today = now.toISOString().slice(0, 10)
const hhmm = now.toISOString().slice(11, 16).replace(':', '')
const read = (p) => { try { return readFileSync(p, 'utf8') } catch { return null } }
const json = (p) => { try { return JSON.parse(readFileSync(p, 'utf8')) } catch { return null } }
const dirs = (p) => { try { return readdirSync(p, { withFileTypes: true }).filter((d) => d.isDirectory() || d.isSymbolicLink()).map((d) => d.name) } catch { return [] } }
const lines = (p) => (read(p) || '').split('\n').length
const git = (cwd, ...a) => { try { return execFileSync('git', a, { cwd, encoding: 'utf8' }).trim() } catch { return '' } }

// Skills: the same walk docs-gather.mjs uses (plugin groups plus project skills).
const { byGroup: skills, project: projectSkills } = discoverSkills(PLUGIN, TASKS_SKILLS)

// Subagents: personal (~/.claude/agents, one folder deep), v2's project scope, the plugin's own.
// Named by their frontmatter `name:`; a workflow step file without one is not a subagent.
const agentNames = (p, depth = 1) => {
  let out = []
  try {
    for (const d of readdirSync(p, { withFileTypes: true })) {
      if (d.isDirectory() && depth > 0) out = out.concat(agentNames(join(p, d.name), depth - 1))
      else if (d.name.endsWith('.md')) { const m = (read(join(p, d.name)) || '').match(/^---\n[\s\S]*?^name:\s*(\S+)/m); if (m) out.push(m[1]) }
    }
  } catch {}
  return out
}
const agents = [...new Set([...agentNames(join(HOME, '.claude', 'agents')), ...agentNames(join(V2, '.claude', 'agents')), ...agentNames(join(PLUGIN, 'agents'))])].sort()

// Hooks: every event's commands, by script name, from the plugin and each settings file.
const hooks = {}
const addHooks = (cfg, where) => {
  for (const [event, groups] of Object.entries(cfg?.hooks || {})) for (const g of groups || []) for (const h of g.hooks || []) {
    const cmd = String(h.command || h.prompt || h.type || '')
    // scoped.mjs wraps most plugin hooks; name the script it runs, not the wrapper.
    const found = (cmd.match(/[\w.-]+\.(?:mjs|js|py|sh)\b/g) || []).filter((x) => x !== 'scoped.mjs')
    const script = found.at(-1) || (cmd.includes('scoped.mjs') ? 'scoped.mjs (inline)' : cmd.split(/\s+/)[0])
    ;(hooks[event] ||= []).push(where === 'plugin' ? script : `${script} (${where})`)
  }
}
addHooks(json(join(PLUGIN, 'hooks', 'hooks.json')), 'plugin')
addHooks(json(join(HOME, '.claude', 'settings.json')), 'user')
for (const p of ['tasks', 'v2'].flatMap((d) => ['settings.json', 'settings.local.json'].map((f) => join(SLOPDOG, d, '.claude', f)))) addHooks(json(p), relative(SLOPDOG, p))

// Desks: the registry, with the length of each desk's CLAUDE.md, ROLE.md and GEMINI.md (what it
// costs every turn in the seat that reads them), each found from the lane's `folder`.
const lanes = readLanesDocument({ v2: V2 }) || {}
const fileLines = (dir, f) => existsSync(join(dir, f)) ? lines(join(dir, f)) : 0
const desks = Object.entries(lanes).filter(([, v]) => v && typeof v === 'object' && v.folder)
  .map(([key, v]) => {
    const dir = join(V2, v.folder)
    const d = { key, name: v.name, model: v.model || '—', engine: v.engine, claude: fileLines(dir, 'CLAUDE.md'), role: fileLines(dir, 'ROLE.md'), gemini: fileLines(dir, 'GEMINI.md') }
    return { ...d, total: d.claude + d.role + d.gemini }
  })

// Skill descriptions: the always-on cost of the plugin's skills is each skill's `description` plus
// `when_to_use`, and `disable-model-invocation: true` drops even that. Frontmatter is read with js-yaml.
// A frontmatter block js-yaml rejects (a colon inside an unquoted description, say) is read line by
// line instead, and counted in descBadYaml so the page can name it.
let descBadYaml = 0
const frontmatter = (text) => {
  const m = (text || '').match(/^---\n([\s\S]*?)\n---/)
  if (!m) return null
  try { const y = yaml.load(m[1]); return y && typeof y === 'object' ? y : null } catch {}
  descBadYaml++
  const fm = {}, ls = m[1].split('\n')
  for (let i = 0; i < ls.length; i++) {
    const k = ls[i].match(/^([\w-]+):\s*(.*)$/)
    if (!k) continue
    let v = k[2]
    while (i + 1 < ls.length && !/^[\w-]+:/.test(ls[i + 1])) v += ' ' + ls[++i].trim()
    fm[k[1]] = v === 'true' ? true : v
  }
  return fm
}
const descSizes = []
let descUnparsed = 0, descManual = 0
for (const [g, names] of Object.entries(skills)) for (const n of names) {
  const fm = frontmatter(read(join(PLUGIN, g, n, 'SKILL.md')))
  if (!fm) { descUnparsed++; continue }
  const manual = fm['disable-model-invocation'] === true
  if (manual) descManual++
  descSizes.push({ id: `${g}/${n}`, chars: String(fm.description ?? '').length + String(fm.when_to_use ?? '').length, manual })
}
const descTotal = descSizes.reduce((a, d) => a + d.chars, 0)
const descListed = descSizes.filter((d) => !d.manual).reduce((a, d) => a + d.chars, 0)
const descTop = [...descSizes].sort((a, b) => b.chars - a.chars).slice(0, 10)

// Stale skill names: a skill body that mentions `/slopdog:<name>` or `slopdog:<name>` for a skill that
// is not there, or a bare `/<name>` for a skill retired since the last run (or the known old
// names below). Reported as file:line, once per line and name.
const RETIRED = ['task-add']
const skillIds = new Set([...Object.values(skills).flat(), ...projectSkills])
const stale = []
{
  const gone = (json(LAST)?.skills || []).map((x) => x.split('/').pop()).filter((n) => !skillIds.has(n))
  const retired = new Set([...RETIRED, ...gone])
  const files = [...Object.entries(skills).flatMap(([g, s]) => s.map((n) => skillFile(PLUGIN, TASKS_SKILLS, `${g}/${n}`))), ...projectSkills.map((n) => skillFile(PLUGIN, TASKS_SKILLS, `tasks/${n}`))]
  for (const f of files) (read(f) || '').split('\n').forEach((line, i) => {
    const hit = new Set()
    for (const m of line.matchAll(/slopdog:([a-z][a-z0-9-]*)(?![a-z0-9:-])/g)) if (!skillIds.has(m[1])) hit.add(`slopdog:${m[1]}`)
    for (const m of line.matchAll(/(?<![\w/.~-])\/([a-z][a-z0-9-]*)(?![\w/.:-])/g)) if (retired.has(m[1]) && !skillIds.has(m[1])) hit.add(`/${m[1]}`)
    for (const h of hit) stale.push(`${f.replace(HOME, '~')}:${i + 1} ${h}`)
  })
}

// Rules: everything @-imported into every session, largest first.
const rulesDir = join(V2, 'rules')
const rules = (() => { try { return readdirSync(rulesDir).filter((f) => f.endsWith('.md')).map((f) => ({ f, n: lines(join(rulesDir, f)) })).sort((a, b) => b.n - a.n) } catch { return [] } })()
const globalRules = [join(HOME, '.claude', 'CLAUDE.md'), join(HOME, '.claude', 'docs', 'claude-code-best-practices.md')].map((p) => ({ f: p.replace(HOME, '~'), n: lines(p) }))

// Timers: the systemd user timers, which are the house's scheduled jobs on this machine.
const timers = (() => { try { return readdirSync(join(HOME, '.config', 'systemd', 'user')).filter((f) => f.endsWith('.timer')).map((f) => f.slice(0, -6)) } catch { return [] } })()

// Memory: shard counts in the shared store and each desk's private store.
const shards = (p) => { try { return readdirSync(p).filter((f) => f.endsWith('.md') && f !== 'MEMORY.md' && f !== 'README.md').length } catch { return 0 } }
const sharedMemory = shards(join(V2, 'memory'))

// What changed since last run: names added or gone, and commits touching v2 since then.
const snap = {
  date: today,
  alwaysOn: null, findings: [],
  skills: Object.entries(skills).flatMap(([g, s]) => s.map((n) => `${g}/${n}`)).concat(projectSkills.map((s) => `tasks/${s}`)),
  agents, hooks: Object.entries(hooks).flatMap(([e, s]) => s.map((n) => `${e}:${n}`)), desks: desks.map((d) => d.key), timers,
  deskLines: Object.fromEntries(desks.map((d) => [d.key, d.total])),
}
const last = json(LAST)
const since = last?.date || new Date(now - 7 * 864e5).toISOString().slice(0, 10)
const diff = (k) => {
  if (!last) return null
  const before = new Set(last[k] || []), after = new Set(snap[k])
  return { added: snap[k].filter((x) => !before.has(x)), gone: [...before].filter((x) => !after.has(x)) }
}
const commits = git(SLOPDOG, 'log', `--since=${since}`, '--oneline', '--', 'v2').split('\n').filter(Boolean).length
const ruleCommits = git(SLOPDOG, 'log', `--since=${since}`, '--oneline', '--', 'v2/rules').split('\n').filter(Boolean).length

// Page 1.
const skillCount = snap.skills.length
const hookCount = snap.hooks.length
const alwaysOn = rules.reduce((a, r) => a + r.n, 0) + globalRules.reduce((a, r) => a + r.n, 0)
snap.alwaysOn = alwaysOn
// The always-on line count run by run, oldest first, so page 1 can show the growth rather than
// only this week's number. Capped at the last six runs.
const alwaysOnHistory = [...(last?.alwaysOnHistory || (last?.alwaysOn ? [{ date: last.date, n: last.alwaysOn }] : [])), { date: today, n: alwaysOn }].slice(-6)
snap.alwaysOnHistory = alwaysOnHistory

// Findings: the things on this page that want fixing, each with a stable id so the next run can
// say which ones survived the week (a line number is not stable, so a stale-name finding is keyed
// on its file and the name, not on the line).
const CEILING = 800
const DESC_CEILING = 18000
const findings = []
if (alwaysOn > CEILING) findings.push({ id: 'always-on-over-ceiling', text: `always-on rules are ${alwaysOn} lines, ${alwaysOn - CEILING} past the ${CEILING}-line ceiling` })
if (descListed > DESC_CEILING) findings.push({ id: 'skill-descriptions-over-ceiling', text: `listed skill descriptions are ${descListed} characters, ${descListed - DESC_CEILING} past the ${DESC_CEILING} ceiling` })
if (descBadYaml) findings.push({ id: 'skill-frontmatter-bad-yaml', text: `${descBadYaml} skill(s) have frontmatter that is not valid YAML` })
for (const x of stale) {
  const [where, name] = x.split(' ')
  findings.push({ id: `stale:${where.replace(/:\d+$/, '')}:${name}`, text: `${where} names ${name}, a skill that is gone` })
}
snap.findings = findings
const lastFindings = new Map((last?.findings || []).map((f) => [f.id, f]))
const stillOpen = findings.filter((f) => lastFindings.has(f.id))
const fmt = (xs, max = 6) => xs.length <= max ? xs.join(', ') : `${xs.slice(0, max).join(', ')} and ${xs.length - max} more`
const out = []
out.push(`# Slopdog at a glance, ${today}`, '')
out.push(`Page 1 of the weekly framework audit (T-458), written by \`v2/scripts/framework-audit.mjs\`. Page 2 is Samwell's review against \`rules/principles.md\`.`, '')
out.push(`**${skillCount} skills, ${agents.length} subagents, ${hookCount} hooks, ${desks.length} desks, ${timers.length} timers, ${sharedMemory} shared memory shards; ${alwaysOn} lines of rules load into every session.**`, '')
// The always-on ceiling, Todd 2026-10-12 (rules/system-change-rubric.md, point 5).
out.push(alwaysOn > CEILING ? `**Needs Todd's attention: ${alwaysOn} always-on lines, ${alwaysOn - CEILING} past the ${CEILING}-line ceiling. The next change to the rules removes lines.**` : `Always-on lines: ${alwaysOn} of ${CEILING}, ${CEILING - alwaysOn} lines of headroom.`, '')
out.push(`Always-on headroom: ${alwaysOn} lines load into every session against the ${CEILING}-line ceiling Todd set on 2026-10-12, ${alwaysOn > CEILING ? `so there is no headroom left and the rules are ${alwaysOn - CEILING} lines over` : `leaving ${CEILING - alwaysOn} lines of headroom`}. Run by run: ${alwaysOnHistory.map((h) => `${h.date} ${h.n}`).join(' → ')}${alwaysOnHistory.length > 1 ? `, a change of ${alwaysOn - alwaysOnHistory[0].n >= 0 ? '+' : ''}${alwaysOn - alwaysOnHistory[0].n} lines since ${alwaysOnHistory[0].date}` : ''}.`, '')
out.push('## Still open from the previous audit', '')
if (!last) out.push('- First run: there is no previous audit to compare with.')
else if (!last.findings) out.push(`- The ${since} snapshot recorded no findings, so this run only sets the baseline; next week this section names what survived.`)
else if (!stillOpen.length) out.push(`- Nothing: every finding from the ${since} audit is fixed, and nothing it named is still here.`)
else for (const f of stillOpen) out.push(`- **Still open since ${since}:** ${f.text}.`)
out.push('', '## What changed since the last run', '')
if (!last) out.push(`- First run: no snapshot to compare with. ${commits} commits touched v2 in the last week, ${ruleCommits} of them in rules/.`)
else {
  out.push(`- Since ${since}: ${commits} commits touched v2, ${ruleCommits} of them in rules/.`)
  for (const k of ['skills', 'agents', 'hooks', 'desks', 'timers']) {
    const d = diff(k)
    if (d.added.length || d.gone.length) out.push(`- ${k[0].toUpperCase() + k.slice(1)}: ${d.added.length ? `added ${fmt(d.added)}` : ''}${d.added.length && d.gone.length ? '; ' : ''}${d.gone.length ? `gone ${fmt(d.gone)}` : ''}.`)
  }
  if (!['skills', 'agents', 'hooks', 'desks', 'timers'].some((k) => diff(k).added.length || diff(k).gone.length)) out.push('- No skill, subagent, hook, desk or timer was added or removed.')
}
out.push('', '## Skills by group', '')
out.push('| Group | Count | Skills |', '| --- | --- | --- |')
for (const [g, s] of Object.entries(skills).sort((a, b) => b[1].length - a[1].length)) out.push(`| ${g} | ${s.length} | ${fmt(s.sort(), 5)} |`)
if (projectSkills.length) out.push(`| tasks (project) | ${projectSkills.length} | ${fmt(projectSkills.sort(), 5)} |`)
out.push('', '## Hooks by event', '')
for (const [e, s] of Object.entries(hooks).sort()) out.push(`- **${e}** (${s.length}): ${fmt(s, 6)}`)
out.push('', '## Desks', '')
out.push(`Lines per desk file; Total is CLAUDE.md plus ROLE.md plus GEMINI.md, and Change is the Total against the last run${last?.deskLines ? '' : ' (the last snapshot has no per-desk lines, so this run only sets the baseline)'}.`, '')
out.push('| Desk | Name | Model | CLAUDE.md | ROLE.md | GEMINI.md | Total | Change |', '| --- | --- | --- | --- | --- | --- | --- | --- |')
const change = (d) => { const was = last?.deskLines?.[d.key]; if (!last?.deskLines) return '—'; if (was === undefined) return 'new'; const n = d.total - was; return n === 0 ? '0' : n > 0 ? `+${n}` : `${n}` }
const cell = (n) => n || '—'
for (const d of desks) out.push(`| ${d.key} | ${d.name} | ${d.engine || d.model} | ${cell(d.claude)} | ${cell(d.role)} | ${cell(d.gemini)} | ${d.total} | ${change(d)} |`)
out.push('', '## Skill descriptions', '')
out.push(`- ${descTotal} characters of description and when_to_use across ${descSizes.length} plugin skills; ${descManual} set \`disable-model-invocation: true\`, so ${descListed} characters are listed to the model every session.${descBadYaml ? ` ${descBadYaml} skill(s) have frontmatter that is not valid YAML and were read line by line.` : ''}`)
// The skill-listing ceiling, Todd 2026-10-12 (rules/system-change-rubric.md, point 5).
out.push(descListed > DESC_CEILING ? `- **Needs Todd's attention: ${descListed} listed characters, ${descListed - DESC_CEILING} past the ${DESC_CEILING} ceiling.**` : `- Listed characters: ${descListed} of ${DESC_CEILING}, ${DESC_CEILING - descListed} of headroom.`)
out.push(`- Ten longest: ${descTop.map((d) => `${d.id} ${d.chars}${d.manual ? ' (manual)' : ''}`).join(' · ')}`)
out.push('', '## Skills naming a skill that is gone', '')
if (!stale.length) out.push('- None: every `slopdog:<name>` in a skill body names a skill that exists, and no retired name is used.')
else { for (const x of stale.slice(0, 15)) out.push(`- ${x}`); if (stale.length > 15) out.push(`- and ${stale.length - 15} more`) }
out.push('', '## Always-on rules, largest first', '')
out.push(`- ${[...globalRules, ...rules.map((r) => ({ f: `rules/${r.f}`, n: r.n }))].sort((a, b) => b.n - a.n).slice(0, 8).map((r) => `${r.f} ${r.n}`).join(' · ')}`)
out.push('', `## Subagents and timers`, '')
out.push(`- Subagents: ${fmt(agents, 10)}.`)
out.push(`- Timers: ${fmt(timers, 12)}.`)
const page = out.join('\n') + '\n'

if (DRY) { process.stdout.write(page); console.error(`\n(dry run: ${page.split('\n').length} lines; nothing written)`); process.exit(0) }

mkdirSync(OUT_DIR, { recursive: true })
const pagePath = join(OUT_DIR, `${today}-glance.md`)
writeFileSync(pagePath, page)

// Todd's feedback on earlier audits waits in desks/research/audit-feedback/ and rides along
// verbatim in the hand-off, so Samwell reads it in his own context; then it moves to processed/.
const FEEDBACK = join(V2, 'desks', 'research', 'audit-feedback')
const feedbackFiles = (existsSync(FEEDBACK) ? readdirSync(FEEDBACK) : []).filter((f) => f.endsWith('.md')).sort()
const feedback = feedbackFiles.map((f) => read(join(FEEDBACK, f))).join('\n\n')

// The hand-off: one inbox file for the Research desk (rules in v2/CLAUDE.md, "Desk file inbox").
mkdirSync(INBOX, { recursive: true })
const msgPath = join(INBOX, `${today}-${hhmm}-from-scotty-framework-audit.md`)
writeFileSync(msgPath, `# Weekly framework audit, page 2 (T-458)

Samwell, this week's page 1 is \`${pagePath.replace(HOME, '~')}\`. Read it, then write page 2.

Todd's ask (2026-09-26): "a recurring weekly audit process that just goes through all of our skills and hooks and everything ... the second page is sent to Samwell for research: what do you see as suggestions for improvement measured across our principles."

1. Write page 2 as \`~/slopdog/v2/desks/research/reports/${today}-framework-audit.md\`: suggestions and gaps measured against \`~/slopdog/v2/rules/principles.md\`, citing each principle by its bold name and naming the concrete skill, hook, desk or rule each finding is about. Draw on any bearing report in \`desks/research/digest.md\` and say which. Gaps against the principles, not a line-by-line review. At most one and a half pages (under 90 lines).
2. Join page 1 and page 2 into one report under 150 lines, page 1 first, and file it with \`/slopdog:file-report\` so it lands on the Reports tab (\`~/slopdog/tasks/reports/index.jsonl\`).
3. Commit your paths and tell Scotty and Tyrion in one line where it is.
${feedback ? `
## Todd's feedback on the last audit — address every point

Add a "Change since last audit" section to the report that shows, point by point, what you did with each item below.

${feedback}
` : ''}`)
const moved = []
if (feedbackFiles.length) {
  mkdirSync(join(FEEDBACK, 'processed'), { recursive: true })
  for (const f of feedbackFiles) {
    execFileSync('git', ['mv', join(FEEDBACK, f), join(FEEDBACK, 'processed', f)], { cwd: SLOPDOG })
    moved.push(relative(SLOPDOG, join(FEEDBACK, f)), relative(SLOPDOG, join(FEEDBACK, 'processed', f)))
  }
}
execFileSync('git', ['add', relative(SLOPDOG, pagePath), relative(SLOPDOG, msgPath)], { cwd: SLOPDOG })
execFileSync('git', ['commit', '-q', '-m', `watcher T-458: framework-audit ${today} page 1, handed to Samwell for page 2`, '-m', 'Auto: framework-audit', '--', relative(SLOPDOG, pagePath), relative(SLOPDOG, msgPath), ...moved], { cwd: SLOPDOG })
try { execFileSync('git', ['push', '-q'], { cwd: SLOPDOG }) } catch (e) { console.error(`push failed: ${e.message}`) }

mkdirSync(STATE, { recursive: true })
writeFileSync(LAST, JSON.stringify(snap, null, 1))
console.log(`page 1: ${pagePath} (${page.split('\n').length} lines); handed to Samwell: ${msgPath}`)
