#!/usr/bin/env node
// file-report.mjs -- files a finished report into the Research desk's reports
// folder, where every report lives (T-650), and appends its line to the runner's
// reports index, which is where Todd reads it (T-308-1). The repo you run it from
// still names the report's kind and project. A report filed from the partner repo
// is also copied into the partner's shared folder. Nothing goes into the Obsidian vault.
// See ../SKILL.md and ~/slopdog/notes/INDEX.md.
//
// Node, not bash (T-035 / the house rule in ~/slopdog/CLAUDE.md). Behaviour is
// the same as the file-report.sh it replaced, argument for argument.
import { execFileSync, spawnSync } from 'node:child_process'
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, statSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { selfLane } from '../../../../../scripts/lib/desk-pane.mjs'
import { knownProjects } from './projects.mjs'

function usage () {
  console.error('Usage: file-report.mjs [--kind how|research|project] [--project <slug>] <title> [content-file|-]')
  console.error('       file-report.mjs --slides <deck.html> [--project <slug>] <title>')
  console.error('  --kind         Override the routing inferred from the project root.')
  console.error('  --project      The tasks/projects/<slug>.md the report belongs to; inferred')
  console.error('                 from the destination repo when omitted, "" when nothing matches.')
  console.error('  --slides       Index a built visual-presentation deck (T-308-2): no markdown is')
  console.error('                 written; the line points path and html at the deck, source "slides".')
  console.error('  --artifact-url The published Artifact URL for this report (the default report')
  console.error('                 format); stamped into the index line for the Reports tab to link to.')
  console.error('  --skills       Comma-separated skills that produced the report (skills: [...]);')
  console.error('                 omitted when not given. Only the writing skill knows them.')
  console.error('  --ticket       The ticket id the report is about (T-nnn); "" when none.')
  console.error('  --tags         Comma-separated topic tags from the closed list sprint,pipeline,audit;')
  console.error('                 "report" is always added. See examples/report-frontmatter-standard.md.')
  console.error('  <title>        Human title for the report; also becomes the slug.')
  console.error('  [content-file] Path to the report body (markdown). Omit or pass -')
  console.error('                 to read the body from stdin.')
  process.exit(1)
}

const die = (msg) => { console.error(msg); process.exit(1) }

const VALIDATOR = join(dirname(fileURLToPath(import.meta.url)), 'validate-report-frontmatter.mjs')

function yamlScalar (s) {
  const t = String(s).replace(/\r?\n/g, ' ').trim()
  if (t && !/[:#\[\]{}&*!|>'"%@`]/.test(t)) return t
  return JSON.stringify(t)
}

function runFrontmatterValidator (reportPath) {
  const node = process.execPath
  const r = spawnSync(node, [VALIDATOR, reportPath], { encoding: 'utf8' })
  if (r.status !== 0) {
    const field = (r.stderr || r.stdout || '').trim()
    die(`file-report: front matter invalid${field ? ` (${field})` : ''}`)
  }
}

const argv = process.argv.slice(2)
let KIND = ''
let PROJECT_SLUG = null
let SLIDES = ''
let ARTIFACT_URL = ''
const TAG_VOCAB = new Set(['sprint', 'pipeline', 'audit'])
let SKILLS = []
let TICKET = ''
let TOPIC_TAGS = []
while (['--kind', '--project', '--slides', '--artifact-url', '--skills', '--ticket', '--tags'].includes(argv[0])) {
  if (argv[0] === '--kind') KIND = argv[1] ?? ''
  else if (argv[0] === '--slides') SLIDES = argv[1] ?? ''
  else if (argv[0] === '--artifact-url') ARTIFACT_URL = argv[1] ?? ''
  else if (argv[0] === '--skills') SKILLS = (argv[1] ?? '').split(',').map(s => s.trim()).filter(Boolean)
  else if (argv[0] === '--ticket') TICKET = argv[1] ?? ''
  else if (argv[0] === '--tags') TOPIC_TAGS = (argv[1] ?? '').split(',').map(s => s.trim()).filter(Boolean)
  else PROJECT_SLUG = argv[1] ?? ''
  argv.splice(0, 2)
}
if (TICKET && !/^T-\d{3}$/.test(TICKET)) die(`file-report: --ticket must be T-nnn, got '${TICKET}'`)
for (const tag of TOPIC_TAGS) if (!TAG_VOCAB.has(tag)) die(`file-report: unknown tag '${tag}' (sprint|pipeline|audit)`)
const TITLE = argv[0] ?? ''
if (!TITLE) usage()
const CONTENT_FILE = argv[1] ?? '-'

const HOME_DIR = process.env.HOME || homedir()
const TASKS = `${HOME_DIR}/slopdog/tasks`
// ~/slopdog (and ~/.claude) are symlinks into /storage, so git and process.cwd()
// may return the /storage spelling. Map any real path under one of these roots
// back to its ${HOME_DIR} spelling so the comparisons below match either way.
function realOr (p) { try { return realpathSync(p) } catch { return p } }
const HOME_ROOTS = [`${HOME_DIR}/slopdog`, `${HOME_DIR}/.claude`, HOME_DIR].map((root) => [root, realOr(root)])
function homeForm (p) {
  const r = realOr(p)
  for (const [root, real] of HOME_ROOTS) {
    if (r === real || r.startsWith(`${real}/`)) return root + r.slice(real.length)
  }
  return p
}
// The reports index the board reads (T-176-1): one JSON line per report,
// appended here, never rewritten. SLOPDOG_REPORTS_INDEX points tests elsewhere.
const REPORTS_INDEX = process.env.SLOPDOG_REPORTS_INDEX || `${TASKS}/reports/index.jsonl`
// A slides deck (T-308-2) is indexed where it already lives: the deck's own path.
let SLIDES_PATH = ''
if (SLIDES) {
  SLIDES_PATH = resolve(SLIDES)
  if (!existsSync(SLIDES_PATH) || !statSync(SLIDES_PATH).isFile()) die(`file-report: deck not found: ${SLIDES_PATH}`)
}
// Project root = git root of the cwd (of the deck's folder for --slides), else that folder.
const ROOT_FROM = SLIDES_PATH ? dirname(SLIDES_PATH) : process.cwd()
let PROJECT_ROOT
try {
  PROJECT_ROOT = execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: ROOT_FROM, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
} catch { PROJECT_ROOT = '' }
if (!PROJECT_ROOT) PROJECT_ROOT = ROOT_FROM
PROJECT_ROOT = homeForm(PROJECT_ROOT)
let PROJECT_NAME = PROJECT_ROOT.replace(/\/+$/, '').split('/').pop()
const d = new Date()
const DATE = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
const CWD = homeForm(process.cwd())

// --- Routing: where you stand decides where it goes (notes/INDEX.md) ---
// Infer KIND when not given. A deck is not routed anywhere, so --slides skips it.
if (SLIDES) KIND = 'how'
if (!KIND) {
  if (CWD === `${HOME_DIR}/slopdog/research` || CWD.startsWith(`${HOME_DIR}/slopdog/research/`)) KIND = 'research'
  else if (CWD === `${HOME_DIR}/.claude` || CWD.startsWith(`${HOME_DIR}/.claude/`)) KIND = 'how'
  else KIND = PROJECT_ROOT === `${HOME_DIR}/slopdog` ? 'how' : 'project'
}

// Every report lands in the Research desk's reports folder (T-650; Todd, 2026-10-04: "every
// report is routed to the research desk"). The kind and the project still come from where
// you stand. A report from the partner repo is also copied into the partner's shared folder, which
// Syncthing carries to the partner (Todd, 2026-10-05, T-650 q1): a copy, not the canonical file.
const RESEARCH_REPORTS = `${HOME_DIR}/slopdog/v2/desks/research/reports`
const CANONICAL_DIR = RESEARCH_REPORTS
const PARTNER_ROOTS = [`${HOME_DIR}/partner`, `${HOME_DIR}/slopdog/partner`]
const PARTNER_SHARED = PARTNER_ROOTS.includes(PROJECT_ROOT) ? `${PROJECT_ROOT}/shared/reports` : ''
switch (KIND) {
  case 'how':
    // About Todd's own machinery: no project of its own (filed as "").
    PROJECT_NAME = 'slopdog'
    break
  case 'research': {
    // An experiment under ~/slopdog/research/<experiment>: the experiment names it.
    let EXP = CWD.startsWith(`${HOME_DIR}/slopdog/research`) ? CWD.slice(`${HOME_DIR}/slopdog/research`.length) : CWD
    EXP = EXP.replace(/^\//, '').split('/')[0]
    if (!EXP) die('file-report: --kind research needs a cwd inside ~/slopdog/research/<experiment>/')
    PROJECT_NAME = EXP
    break
  }
  case 'project':
    break
  default:
    die(`file-report: unknown --kind '${KIND}' (how|research|project)`)
}

// --- Which board project owns it (T-176-1) ---
// The known slugs are the tasks/projects/*.md files whose front matter carries
// `project:`. A project file may also carry `repo:` (an absolute or ~/ path);
// when --project is not given, the destination repo is matched to that field
// first, then to a slug equal to the repo's basename; no match is "".
const PROJECTS = knownProjects(`${TASKS}/projects`, HOME_DIR)
if (PROJECT_SLUG === null) {
  const root = PROJECT_ROOT.replace(/\/+$/, '')
  // Every claimant, not the first one read (T-718): two projects claiming one repo is a
  // decision for whoever owns the project files, so the filing stops rather than guess.
  const claimants = PROJECTS.filter(p => p.repo && p.repo === root)
  if (claimants.length > 1) {
    die(`file-report: ${root} is claimed by more than one project (${claimants.map(p => p.slug).join(', ')}); ` +
        `nothing was filed. Pass --project <slug> to choose, e.g. --project ${claimants[0].slug}. ` +
        'check-repo-collisions.mjs lists every such repo.')
  }
  PROJECT_SLUG = (claimants[0] ??
                  PROJECTS.find(p => p.slug === root.split('/').pop()))?.slug ?? ''
} else if (!PROJECTS.some(p => p.slug === PROJECT_SLUG)) {
  die(`file-report: unknown --project '${PROJECT_SLUG}'. Known slugs (tasks/projects/<slug>.md): ` +
      (PROJECTS.map(p => p.slug).sort().join(', ') || '(none)'))
}

// One project per filing, resolved here and written to both the file's front matter and the index
// line, so the two cannot disagree (the index is what the Reports screen groups by). The matched slug
// wins; else the folder name; but the house's own machinery (kind how, whose folder is the catch-all
// slopdog) files as "", never the catch-all. Only a non-how filing with no name at all is refused.
const FILED_PROJECT = PROJECT_SLUG || (KIND === 'how' ? '' : PROJECT_NAME)
if (!FILED_PROJECT && KIND !== 'how') die(`file-report: no project resolved for ${CWD}; pass --project <slug>`)

// --slides (T-308-2): a deck already lives in its repo; only its index line is written,
// through the same append as a markdown report, so the board reads one index.
if (SLIDES_PATH) {
  appendIndexLine({ path: SLIDES_PATH, html: SLIDES_PATH, artifact: ARTIFACT_URL, source: 'slides' })
  console.log(`Indexed deck "${TITLE}" (project: ${FILED_PROJECT || '(none)'}):`)
  console.log(`  deck:      ${SLIDES_PATH}`)
  console.log(`  index:     ${REPORTS_INDEX}`)
  process.exit(0)
}

const SLUG = TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+/, '').replace(/-+$/, '')
if (!SLUG) die(`file-report: title "${TITLE}" produced an empty slug`)

const CANONICAL_PATH = `${CANONICAL_DIR}/${DATE}-${SLUG}.md`
mkdirSync(CANONICAL_DIR, { recursive: true })

let BODY
if (CONTENT_FILE === '-') {
  BODY = readFileSync(0, 'utf8')
} else {
  if (!existsSync(CONTENT_FILE)) die(`file-report: content file not found: ${CONTENT_FILE}`)
  BODY = readFileSync(CONTENT_FILE, 'utf8')
}
BODY = BODY.replace(/\n+$/, '')

// Strip any pre-existing frontmatter block so refiling an old report doesn't
// double it up.
{
  const out = []
  let inFm = false
  BODY.split('\n').forEach((line, i) => {
    if (i === 0 && line === '---') { inFm = true; return }
    if (inFm && line === '---') { inFm = false; return }
    if (inFm) return
    out.push(line)
  })
  BODY = out.join('\n').replace(/\n+$/, '')
}

const SUMMARY_LINE = (BODY.split('\n').find(l => l.trim() && !l.startsWith('#')) || TITLE).trim().slice(0, 280)
const ABSTRACT = SUMMARY_LINE.length > 20
  ? `${SUMMARY_LINE} Filed via file-report on ${DATE}.`
  : `${TITLE}. Filed on ${DATE}; open the HTML or Artifact for the full report.`
const RAG_READY = 'no'
const SENSITIVITY = 'safe'
const AUDIENCE = 'team'
const SHAREABLE = 'yes'

writeFileSync(CANONICAL_PATH,
  '---\n' +
  `title: "${TITLE.replace(/"/g, '\\"')}"\n` +
  `date: ${DATE}\n` +
  `kind: ${KIND}\n` +
  `project: ${FILED_PROJECT ? FILED_PROJECT : '""'}\n` +
  `summary: ${yamlScalar(SUMMARY_LINE)}\n` +
  `abstract: ${yamlScalar(ABSTRACT)}\n` +
  'entities: []\n' +
  'related: []\n' +
  `tags: [${['report', ...TOPIC_TAGS].join(', ')}]\n` +
  `desk: ${authorLane()}\n` +
  `ticket: ${TICKET ? TICKET : '""'}\n` +
  (SKILLS.length ? `skills: [${SKILLS.join(', ')}]\n` : '') +
  `audience: ${AUDIENCE}\n` +
  'quality: 3\n' +
  `sensitivity: ${SENSITIVITY}\n` +
  `shareable: ${SHAREABLE}\n` +
  `source_path: ${CANONICAL_PATH}\n` +
  `rag_ready: ${RAG_READY}\n` +
  '---\n\n' +
  `${BODY}\n`)

runFrontmatterValidator(CANONICAL_PATH)

// Who wrote it (T-305): the acting pane's desk lane (herdr agent name or tmux @peak_lane, via
// desk-pane selfLane, the same lookup mode.mjs makes), else "todd". The board's sign-off (T-303)
// types into that lane's pane.
function authorLane () {
  return selfLane() || 'todd'
}

// The index line (T-176-1). `html` is the artifact's source file, saved beside
// the report as <title>.html; stamped only when that file already exists.
// `artifact` is the hosted claude.ai Artifact URL (the default report format,
// Todd 2026-09-26), passed in via --artifact-url once published; "" when none.
// The one append both modes use; the key order is the index's contract.
function appendIndexLine ({ path, html, artifact, source }) {
  const line = JSON.stringify({
    title: TITLE,
    date: DATE,
    project: FILED_PROJECT,
    path,
    html,
    artifact: artifact || '',
    source,
    author: authorLane()
  })
  mkdirSync(dirname(REPORTS_INDEX), { recursive: true })
  appendFileSync(REPORTS_INDEX, `${line}\n`)
}
const HTML_PATH = `${CANONICAL_DIR}/${TITLE}.html`
appendIndexLine({ path: CANONICAL_PATH, html: existsSync(HTML_PATH) ? HTML_PATH : '', artifact: ARTIFACT_URL, source: 'file-report' })

// The partner copy (T-650 q1): the report and its HTML, byte for byte, into the partner's shared
// folder. The index keeps one line, pointing at the Research desk's canonical file.
const COPIES = []
if (PARTNER_SHARED) {
  mkdirSync(PARTNER_SHARED, { recursive: true })
  for (const src of [CANONICAL_PATH, ...(existsSync(HTML_PATH) ? [HTML_PATH] : [])]) {
    const dest = `${PARTNER_SHARED}/${src.split('/').pop()}`
    copyFileSync(src, dest)
    COPIES.push(dest)
  }
}

console.log(`Filed report "${TITLE}" (kind: ${KIND}, project: ${FILED_PROJECT || '(none)'}):`)
console.log(`  file:      ${CANONICAL_PATH}`)
console.log(`  index:     ${REPORTS_INDEX}`)
for (const c of COPIES) console.log(`  copied to: ${c}`)
