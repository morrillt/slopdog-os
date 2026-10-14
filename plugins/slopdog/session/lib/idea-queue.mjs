// Shared sprint-planning ideation queue: parse intake files, normalize departments,
// classify what a department meeting picks up vs skips (with explicit counts).
import fs from 'node:fs'
import path from 'node:path'
import { splitFrontMatter } from '../sprint-planning/scripts/ideation-layer.mjs'

/** Canonical department slugs (~/slopdog/v2/rules/vocabulary.md): three since 2026-10-10. */
export const DEPARTMENTS = ['slopdog', 'projects', 'it']

// `product` is the one old spelling still accepted; the retired department names are not.
const ALIASES = { product: 'projects' }

export function normalizeDepartment(raw) {
  if (raw == null || raw === '') return null
  const key = String(raw).trim().toLowerCase()
  return ALIASES[key] || (DEPARTMENTS.includes(key) ? key : null)
}

export function normalizeDepartments(list) {
  const out = []
  for (const item of list) {
    const n = normalizeDepartment(item)
    if (n && !out.includes(n)) out.push(n)
  }
  return out
}

// ── not-before dates (T-640) ──────────────────────────────────────────────
// An idea may carry `not_before: YYYY-MM-DD`: sprint planning leaves it alone
// until that day. Todd says "next sprint" or "two sprints" instead of a date
// (2026-10-04), so capture turns the phrase into a date; there is no sprint
// counter. Each department plans on its own weekday (vocabulary.md, "The three
// departments"): Slopdog on Friday, Projects on Saturday. IT is not scheduled,
// so it is treated as Friday until it gets a day of its own.

/** Planning weekday per department, 0 = Sunday … 6 = Saturday. */
export const PLANNING_WEEKDAY = { slopdog: 5, projects: 6, it: 5 }

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/
const NUMBER_WORDS = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8 }

/** True for a real calendar date written YYYY-MM-DD. */
export function isIsoDate(s) {
  if (typeof s !== 'string' || !ISO_DATE_RE.test(s)) return false
  const d = new Date(`${s}T00:00:00Z`)
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s
}

/** Today's date on this machine's clock, YYYY-MM-DD (local, not UTC). */
export function localToday(now = new Date()) {
  const p = (n) => String(n).padStart(2, '0')
  return `${now.getFullYear()}-${p(now.getMonth() + 1)}-${p(now.getDate())}`
}

function addDays(iso, n) {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

/**
 * The department's planning day `sprints` meetings from now: the first one is the
 * department's weekday strictly after `today` (a Friday idea saying "next sprint"
 * on a Friday lands on the following Friday), each further sprint adds a week.
 */
export function nextPlanningDay(department, today, sprints = 1) {
  const dept = normalizeDepartment(department)
  if (!dept) throw new Error(`unknown department "${department}" (use ${DEPARTMENTS.join(', ')})`)
  if (!isIsoDate(today)) throw new Error(`today must be YYYY-MM-DD, got "${today}"`)
  if (!Number.isInteger(sprints) || sprints < 1) throw new Error(`sprints must be a whole number of at least 1, got ${sprints}`)
  const dow = new Date(`${today}T00:00:00Z`).getUTCDay()
  const ahead = ((PLANNING_WEEKDAY[dept] - dow + 7) % 7) || 7
  return addDays(today, ahead + 7 * (sprints - 1))
}

/** How many sprints a phrase names: "next sprint" is 1, "two sprints" or "in 2 sprints" is 2; null when it names none. */
export function sprintsInPhrase(phrase) {
  const t = String(phrase ?? '').trim().toLowerCase().replace(/^in\s+/, '').replace(/\s+from now$/, '')
  if (/^(the\s+)?next\s+sprint$/.test(t)) return 1
  const m = t.match(/^(\d+|[a-z]+)\s+sprints?$/)
  if (!m) return null
  const n = /^\d+$/.test(m[1]) ? parseInt(m[1], 10) : NUMBER_WORDS[m[1]]
  return Number.isInteger(n) && n >= 1 ? n : null
}

/**
 * Turn what Todd said into a not_before date. An explicit YYYY-MM-DD is kept as
 * given; "next sprint" / "N sprints" becomes the earliest of the idea's
 * departments' planning days, so the first meeting that would take the idea is
 * the first one allowed to. Throws on a phrase it cannot read, so capture never
 * writes a guess.
 */
export function resolveNotBefore(phrase, departments, today = localToday()) {
  const raw = String(phrase ?? '').trim()
  if (isIsoDate(raw)) return raw
  const sprints = sprintsInPhrase(raw)
  if (sprints == null) {
    throw new Error(`cannot read not-before "${raw}" (use "next sprint", "two sprints", "3 sprints" or YYYY-MM-DD)`)
  }
  const deps = normalizeDepartments(departments)
  if (deps.length === 0) throw new Error('a not-before phrase needs at least one department')
  return deps.map((d) => nextPlanningDay(d, today, sprints)).sort()[0]
}

/** The idea's not_before date, or null when it has none (or it is not a real date). */
export function getNotBefore(fm) {
  const v = fm?.not_before
  return isIsoDate(typeof v === 'string' ? v.trim() : v) ? v.trim() : null
}

export function getDepartmentsFromFrontMatter(fm) {
  if (!fm || typeof fm !== 'object') return []
  if (Array.isArray(fm.departments)) {
    return normalizeDepartments(fm.departments)
  }
  if (fm.department != null && fm.department !== '') {
    const one = normalizeDepartment(fm.department)
    return one ? [one] : []
  }
  return []
}

export function isHotfixIdea(fm, body = '') {
  if (!fm) return false
  if (fm.hotfix === true) return true
  const tags = Array.isArray(fm.tags) ? fm.tags : []
  if (tags.includes('hotfix')) return true
  if (typeof body === 'string' && /#hotfix\b|\bhotfix:\s*true\b/i.test(body)) return true
  return false
}

/** True when the file participates in the sprint-planning ideation queue. */
export function isQueueCandidate(fm) {
  if (!fm || typeof fm !== 'object') return false
  if (fm.planning_state != null && fm.planning_state !== '') return true
  if (Array.isArray(fm.departments) && fm.departments.length > 0) return true
  if (fm.department != null && fm.department !== '') return true
  if (fm.hotfix === true) return true
  return false
}

export function planningState(fm) {
  if (!fm?.planning_state) return 'waiting'
  return String(fm.planning_state)
}

export function parseIdeaMarkdown(content) {
  const { frontMatter, body } = splitFrontMatter(content)
  return {
    frontMatter,
    body,
    departments: getDepartmentsFromFrontMatter(frontMatter),
    hotfix: isHotfixIdea(frontMatter, body),
    queue: isQueueCandidate(frontMatter),
    state: planningState(frontMatter),
    notBefore: getNotBefore(frontMatter),
    ...getFeaturesFromFrontMatter(frontMatter),
  }
}

export function classifyIdeaForDepartment(parsed, targetDepartment, { today = localToday() } = {}) {
  const dept = normalizeDepartment(targetDepartment)
  if (!dept) {
    return { bucket: 'skipped_invalid_meeting_department', reason: 'invalid department argument' }
  }

  if (!parsed.queue) {
    return { bucket: 'skipped_not_queue', reason: 'legacy intake (no department queue front matter)' }
  }

  if (parsed.hotfix) {
    return { bucket: 'hotfix_immediate', reason: 'hotfix bypass per vocabulary.md' }
  }

  if (parsed.state === 'processed') {
    return { bucket: 'skipped_already_processed', reason: `planning_state: ${parsed.state}` }
  }

  const deps = parsed.departments
  if (deps.length === 0) {
    return {
      bucket: 'skipped_missing_department',
      reason: 'queue file has no departments or department field',
    }
  }

  if (!deps.includes(dept)) {
    return {
      bucket: 'skipped_other_department',
      reason: `waiting for: ${deps.join(', ')}`,
    }
  }

  // T-640: a future not_before holds the idea back; the same day is eligible.
  if (parsed.notBefore && parsed.notBefore > today) {
    return { bucket: 'skipped_not_before', reason: `not before ${parsed.notBefore}` }
  }

  return { bucket: 'picked', reason: `planning_state: ${parsed.state}` }
}

export function listIntakeMarkdownFiles(intakeDir) {
  if (!fs.existsSync(intakeDir)) return []
  return fs
    .readdirSync(intakeDir)
    .filter((name) => name.endsWith('.md'))
    .sort()
    .map((name) => path.join(intakeDir, name))
}

export function scanIntakeQueue(intakeDir, targetDepartment, { today = localToday() } = {}) {
  const files = listIntakeMarkdownFiles(intakeDir)
  const buckets = {
    picked: [],
    hotfix_immediate: [],
    skipped_not_before: [],
    skipped_other_department: [],
    skipped_already_processed: [],
    skipped_missing_department: [],
    skipped_not_queue: [],
    skipped_invalid_meeting_department: [],
  }

  for (const filePath of files) {
    const name = path.basename(filePath)
    const content = fs.readFileSync(filePath, 'utf8')
    const parsed = parseIdeaMarkdown(content)
    const { bucket, reason } = classifyIdeaForDepartment(parsed, targetDepartment, { today })
    buckets[bucket].push({
      file: name,
      path: filePath,
      reason,
      departments: parsed.departments,
      planning_state: parsed.state,
      hotfix: parsed.hotfix,
      not_before: parsed.notBefore,
      feature: parsed.feature,
      feature2: parsed.feature2,
    })
  }

  const counts = Object.fromEntries(
    Object.entries(buckets).map(([k, v]) => [k, v.length]),
  )
  counts.total_files = files.length

  return { department: normalizeDepartment(targetDepartment), intakeDir, today, buckets, counts }
}

export function formatQueueReport(result) {
  const lines = []
  const dept = result.department || '(invalid)'
  lines.push(`Sprint planning step 1 — ideation queue for department: ${dept}`)
  lines.push(`Intake directory: ${result.intakeDir}`)
  if (result.today) {
    const n = result.buckets.skipped_not_before?.length ?? 0
    lines.push(`Not-before check (${result.today}): skipped ${n} idea${n === 1 ? '' : 's'} dated after today.`)
  }
  lines.push('')
  lines.push('Counts:')
  for (const [key, n] of Object.entries(result.counts)) {
    lines.push(`  ${key}: ${n}`)
  }
  lines.push('')

  const sections = [
    ['picked', 'Picked up for this meeting'],
    ['hotfix_immediate', 'Hotfix — process immediately (not deferred)'],
    ['skipped_not_before', 'Deferred — not before a later date'],
    ['skipped_other_department', 'Deferred — other department'],
    ['skipped_already_processed', 'Skipped — already processed'],
    ['skipped_missing_department', 'Skipped — missing department (not dropped silently)'],
    ['skipped_not_queue', 'Skipped — not in ideation queue (legacy intake)'],
  ]

  for (const [key, title] of sections) {
    const items = result.buckets[key]
    lines.push(`${title} (${items.length}):`)
    if (items.length === 0) {
      lines.push('  (none)')
    } else {
      for (const item of items) {
        const feat = item.feature
          ? ` [feature: ${item.feature}${item.feature2 ? `, ${item.feature2}` : ''}]`
          : ''
        lines.push(`  - ${item.file}: ${item.reason}${feat}`)
      }
    }
    lines.push('')
  }

  return lines.join('\n').trimEnd()
}

export function buildCaptureFrontMatter({
  departments,
  hotfix = false,
  captured = new Date().toISOString().split('T')[0],
  capturedBy = 'ideate',
  planningState = 'waiting',
  source = null,
  feature = null,
  feature2 = null,
  notBefore = null,
}) {
  const deps = normalizeDepartments(departments)
  const fm = {
    captured,
    captured_by: capturedBy,
    departments: deps,
    // T-640: the date the idea waits for, written right after departments.
    ...(notBefore ? { not_before: notBefore } : {}),
    planning_state: hotfix ? 'hotfix' : planningState,
    hotfix: Boolean(hotfix),
  }
  if (source) fm.source = source
  // T-658: the feature slug(s) the idea touches, or `none`; absent means untagged.
  if (feature) fm.feature = feature
  if (feature && feature2) fm.feature2 = feature2
  return fm
}

export function serializeCaptureFile(frontMatter, title, body) {
  const lines = ['---']
  for (const [key, val] of Object.entries(frontMatter)) {
    if (Array.isArray(val)) {
      lines.push(`${key}:`)
      for (const item of val) lines.push(`  - ${item}`)
    } else if (typeof val === 'boolean') {
      lines.push(`${key}: ${val}`)
    } else {
      lines.push(`${key}: ${val}`)
    }
  }
  lines.push('---', '', `# ${title}`, '', body.trim(), '')
  return lines.join('\n')
}

// ── feature slugs on ideas (T-658) ──────────────────────────────────────────
// An idea carries the same `feature:` key a ticket does (kebab-case slug from the
// Slopdog Features registry that ~/slopdog/notes/INDEX.md points at), plus an
// optional `feature2:` only when the idea is genuinely dual-purpose. Never more
// than two. `feature: none` is the explicit "touches no feature" marker; a missing
// field means nobody tagged it yet. Unknown slugs warn and are still written
// (warn-never-fail until cutover, as check-ticket does for tickets).

export const NO_FEATURE = 'none'
const FEATURE_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CHECK_TICKET = path.join(
  process.env.HOME || '',
  'slopdog/tasks/bin/check-ticket.mjs',
)

/**
 * The canonical feature slugs. One reader: check-ticket.mjs's
 * loadCanonicalFeatureSlugs (Slopdog Features.md front matter, falling back to its
 * built-in list). IDEA_FEATURES_REGISTRY points it at another file for tests.
 * Returns an empty Set when the tasks repo is not on this machine; callers then
 * skip the canonical check and only check slug form.
 */
export async function loadFeatureSlugs(registryPath = process.env.IDEA_FEATURES_REGISTRY) {
  try {
    const mod = await import(CHECK_TICKET)
    return registryPath ? mod.loadCanonicalFeatureSlugs(registryPath) : mod.loadCanonicalFeatureSlugs()
  } catch {
    return new Set()
  }
}

/**
 * Validate a primary and optional secondary feature slug for an idea.
 * Returns { feature, feature2, warnings, errors }. Errors are shape mistakes the
 * CLI refuses (a third slug, a second slug with no first, `none` paired with a
 * slug); warnings are slugs outside the canonical list, which are still kept.
 * A comma in `feature` is read as a list so `--feature a,b` means feature + feature2.
 */
export function checkIdeaFeatures({ feature, feature2 } = {}, canonical = new Set()) {
  const warnings = []
  const errors = []
  const clean = (v) => (v == null ? '' : String(v).trim().toLowerCase())
  let list = clean(feature).split(',').map((s) => s.trim()).filter(Boolean)
  const second = clean(feature2)
  if (second) list.push(...second.split(',').map((s) => s.trim()).filter(Boolean))
  list = [...new Set(list)]

  if (list.length === 0) return { feature: null, feature2: null, warnings, errors }
  if (list.length > 2) {
    errors.push(`an idea carries at most two feature slugs (feature, feature2), got ${list.length}: ${list.join(', ')}`)
  }
  if (!clean(feature) && second) errors.push('feature2 given with no primary feature')
  if (list.includes(NO_FEATURE) && list.length > 1) {
    errors.push(`"${NO_FEATURE}" means the idea touches no feature, so it cannot sit beside a slug`)
  }
  for (const slug of list) {
    if (slug === NO_FEATURE) continue
    if (!FEATURE_SLUG_RE.test(slug)) {
      errors.push(`feature "${slug}" is not a kebab-case slug`)
    } else if (canonical.size && !canonical.has(slug)) {
      warnings.push(`feature "${slug}" is not in the canonical Slopdog Features slug list (kept; warn-only until cutover)`)
    }
  }
  return { feature: list[0] ?? null, feature2: list[1] ?? null, warnings, errors }
}

/** Read feature / feature2 off parsed front matter (null when absent). */
export function getFeaturesFromFrontMatter(fm) {
  if (!fm || typeof fm !== 'object') return { feature: null, feature2: null }
  const v = (x) => (x == null || x === '' ? null : String(x).trim())
  return { feature: v(fm.feature), feature2: v(fm.feature2) }
}
