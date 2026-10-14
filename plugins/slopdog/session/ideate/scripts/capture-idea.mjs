#!/usr/bin/env node
/**
 * @inputs A title, the departments it touches, a feature slug and a body file holding Todd's words and the restatement.
 * @outputs One markdown file in desks/ideas/intake/ with department front matter and planning_state waiting.
 * @starts A shaping thread reaches 8 out of 10 and is not a hotfix.
 * @ends The intake file exists for that department's sprint planning step 1 to pick up.
 */
// capture-idea — write a deferred idea into desks/ideas/intake/ (T-624).
// Called from the ideate skill instead of ticket-add when the ask is not hotfix.
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  buildCaptureFrontMatter,
  serializeCaptureFile,
  normalizeDepartments,
  checkIdeaFeatures,
  loadFeatureSlugs,
  resolveNotBefore,
  localToday,
  isIsoDate,
} from '../../lib/idea-queue.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_INTAKE = path.resolve(HERE, '../../../../..', 'desks/ideas/intake')

function die(msg) {
  console.error(`capture-idea: ${msg}`)
  process.exit(2)
}

const argv = process.argv.slice(2)
const flags = {}
const pos = []
for (let i = 0; i < argv.length; i++) {
  const a = argv[i]
  if (a === '--hotfix') flags.hotfix = true
  else if (a === '--dry-run') flags.dryRun = true
  else if (a === '--print-path') flags.printPath = true
  else if (a.startsWith('--')) {
    if (i + 1 >= argv.length) die(`${a} needs a value`)
    flags[a.slice(2)] = argv[++i]
  } else pos.push(a)
}

const title = flags.title || pos[0]
if (!title) {
  die('usage: capture-idea.mjs --title "<title>" --departments slopdog,projects --body-file <path> [--feature <slug>|none] [--feature2 <slug>] [--slug slug] [--not-before "next sprint"|"two sprints"|YYYY-MM-DD] [--today YYYY-MM-DD] [--hotfix] [--dry-run]')
}

const deptRaw = flags.departments || flags.department
if (!deptRaw) die('--departments is required (comma-separated: slopdog, projects, it)')

const departments = normalizeDepartments(
  deptRaw.split(',').map((s) => s.trim()).filter(Boolean),
)
if (departments.length === 0) {
  die(`no valid departments in "${deptRaw}" (use slopdog, projects, it)`)
}

let body = flags.body || ''
if (flags['body-file']) {
  body = fs.readFileSync(path.resolve(flags['body-file']), 'utf8')
}
if (!body.trim()) die('empty body — pass --body-file or --body')

const slug =
  flags.slug ||
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)

// T-640: "next sprint", "two sprints" or a date becomes not_before; --today pins the clock for tests.
const today = flags.today || localToday()
if (!isIsoDate(today)) die(`--today must be YYYY-MM-DD, got "${today}"`)
let notBefore = null
if (flags['not-before']) {
  try {
    notBefore = resolveNotBefore(flags['not-before'], departments, today)
  } catch (e) {
    die(e.message)
  }
}

const date = new Date().toISOString().split('T')[0]
const fileName = `${date}-${slug}.md`
const intakeDir = process.env.IDEAS_INTAKE_DIR || DEFAULT_INTAKE
const outPath = path.join(intakeDir, fileName)

// T-658: the feature slug(s) this idea touches, confirmed by the desk before capture.
const feat = checkIdeaFeatures(
  { feature: flags.feature, feature2: flags.feature2 },
  await loadFeatureSlugs(),
)
if (feat.errors.length) die(feat.errors.join('; '))
for (const w of feat.warnings) console.error(`capture-idea: warning, ${w}`)
if (!feat.feature) {
  console.error('capture-idea: warning, no --feature given; the idea is captured untagged (pass a slug, or none when it touches no feature)')
}

const frontMatter = buildCaptureFrontMatter({
  departments,
  hotfix: Boolean(flags.hotfix),
  source: flags.source || null,
  feature: feat.feature,
  feature2: feat.feature2,
  notBefore,
})

const content = serializeCaptureFile(frontMatter, title, body)

if (flags.dryRun) {
  console.log(content)
  process.exit(0)
}

fs.mkdirSync(intakeDir, { recursive: true })
if (fs.existsSync(outPath)) {
  die(`refusing to overwrite existing intake file: ${outPath}`)
}
fs.writeFileSync(outPath, content, 'utf8')
if (flags.printPath) console.log(outPath)
console.log(`Captured deferred idea: ${fileName} → departments ${departments.join(', ')} · feature ${feat.feature ? [feat.feature, feat.feature2].filter(Boolean).join(', ') : '(untagged)'}`)
if (notBefore) console.log(`Not before ${notBefore} (from "${flags['not-before']}", today ${today}).`)
console.log('Front matter written:')
console.log(content.split('---').slice(0, 2).join('---') + '---')
