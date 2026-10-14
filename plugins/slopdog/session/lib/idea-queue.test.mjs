import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  parseIdeaMarkdown,
  classifyIdeaForDepartment,
  buildCaptureFrontMatter,
  serializeCaptureFile,
  normalizeDepartment,
  normalizeDepartments,
  DEPARTMENTS,
} from './idea-queue.mjs'

test('classify: department-tagged waiting idea picks for matching meeting', () => {
  const content = `---
department: it
planning_state: waiting
---
# Body
`
  const parsed = parseIdeaMarkdown(content)
  assert.deepEqual(parsed.departments, ['it'])
  const c = classifyIdeaForDepartment(parsed, 'it')
  assert.equal(c.bucket, 'picked')
})

test('classify: missing department is explicit skip', () => {
  const content = `---
planning_state: waiting
departments: []
---
# Body
`
  const parsed = parseIdeaMarkdown(content)
  const c = classifyIdeaForDepartment(parsed, 'slopdog')
  assert.equal(c.bucket, 'skipped_missing_department')
})

test('capture front matter shape leaves room for not_before', () => {
  const fm = buildCaptureFrontMatter({ departments: ['slopdog', 'it'] })
  const file = serializeCaptureFile(fm, 'Test', 'Todd said something.')
  assert.match(file, /departments:\n  - slopdog\n  - it/)
  assert.match(file, /planning_state: waiting/)
  assert.doesNotMatch(file, /not_before/)
})

test('three departments: slopdog, projects and it are accepted, the retired names are not', () => {
  assert.deepEqual(DEPARTMENTS, ['slopdog', 'projects', 'it'])
  assert.deepEqual(normalizeDepartments(['slopdog', 'projects', 'it']), ['slopdog', 'projects', 'it'])
  for (const retired of ['meta', 'features', 'influencer']) {
    assert.equal(normalizeDepartment(retired), null, retired)
  }
  assert.equal(normalizeDepartment('product'), 'projects')
})

test('classify: a projects idea is picked by the Projects meeting and deferred by the Slopdog one', () => {
  const parsed = parseIdeaMarkdown('---\ndepartments:\n  - projects\nplanning_state: waiting\n---\n# Body\n')
  assert.equal(classifyIdeaForDepartment(parsed, 'projects').bucket, 'picked')
  assert.equal(classifyIdeaForDepartment(parsed, 'slopdog').bucket, 'skipped_other_department')
})

test('classify: an idea left on a retired department name is skipped as missing, never picked', () => {
  const parsed = parseIdeaMarkdown('---\ndepartment: meta\nplanning_state: waiting\n---\n# Body\n')
  assert.equal(classifyIdeaForDepartment(parsed, 'slopdog').bucket, 'skipped_missing_department')
})

// ── T-658: feature slugs ───────────────────────────────────────────────────
import { checkIdeaFeatures, NO_FEATURE } from './idea-queue.mjs'

test('features: one or two canonical slugs pass clean; unknown warns; three errors', () => {
  const canon = new Set(['voice-ideation', 'runner-board'])
  assert.deepEqual(checkIdeaFeatures({ feature: 'voice-ideation', feature2: 'runner-board' }, canon), {
    feature: 'voice-ideation', feature2: 'runner-board', warnings: [], errors: [],
  })
  const odd = checkIdeaFeatures({ feature: 'nope-feature' }, canon)
  assert.equal(odd.errors.length, 0)
  assert.equal(odd.warnings.length, 1)
  assert.equal(checkIdeaFeatures({ feature: 'a,b,c' }, canon).errors.length, 1)
  assert.equal(checkIdeaFeatures({ feature: NO_FEATURE, feature2: 'runner-board' }, canon).errors.length, 1)
  assert.equal(checkIdeaFeatures({ feature2: 'runner-board' }, canon).errors.length, 1)
  assert.equal(checkIdeaFeatures({ feature: 'Not A Slug' }, canon).errors.length, 1)
})

test('features: capture front matter carries feature and feature2; parse reads them back', () => {
  const fm = buildCaptureFrontMatter({ departments: ['slopdog'], feature: 'voice-ideation', feature2: 'runner-board', captured: '2026-10-10' })
  const text = serializeCaptureFile(fm, 'T', 'body')
  assert.match(text, /^feature: voice-ideation$/m)
  assert.match(text, /^feature2: runner-board$/m)
  const parsed = parseIdeaMarkdown(text)
  assert.equal(parsed.feature, 'voice-ideation')
  assert.equal(parsed.feature2, 'runner-board')
  const none = parseIdeaMarkdown(serializeCaptureFile(buildCaptureFrontMatter({ departments: ['it'], feature: 'none' }), 'T', 'b'))
  assert.equal(none.feature, 'none')
  assert.equal(parseIdeaMarkdown(serializeCaptureFile(buildCaptureFrontMatter({ departments: ['it'] }), 'T', 'b')).feature, null)
})
