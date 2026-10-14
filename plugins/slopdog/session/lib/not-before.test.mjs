// T-640: the not-before date rule and the sprint-planning skip count.
// 2026-10-08 is a Thursday, 10-09 Friday, 10-10 Saturday, 10-11 Sunday.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  nextPlanningDay,
  sprintsInPhrase,
  resolveNotBefore,
  buildCaptureFrontMatter,
  serializeCaptureFile,
  parseIdeaMarkdown,
  classifyIdeaForDepartment,
  scanIntakeQueue,
  formatQueueReport,
} from './idea-queue.mjs'

test('next sprint: Slopdog lands on the next Friday, Projects on the next Saturday', () => {
  assert.equal(nextPlanningDay('slopdog', '2026-10-08'), '2026-10-09')
  assert.equal(nextPlanningDay('projects', '2026-10-08'), '2026-10-10')
  assert.equal(nextPlanningDay('slopdog', '2026-10-11'), '2026-10-16')
  assert.equal(nextPlanningDay('projects', '2026-10-11'), '2026-10-17')
})

test('same day: said on the planning day itself, next sprint is a week later', () => {
  assert.equal(nextPlanningDay('slopdog', '2026-10-09'), '2026-10-16')
  assert.equal(nextPlanningDay('projects', '2026-10-10'), '2026-10-17')
})

test('Friday/Saturday edge: Slopdog said on Saturday waits six days, Projects said on Friday waits one', () => {
  assert.equal(nextPlanningDay('slopdog', '2026-10-10'), '2026-10-16')
  assert.equal(nextPlanningDay('projects', '2026-10-09'), '2026-10-10')
})

test('IT has no planning day yet, so it is treated as Friday', () => {
  assert.equal(nextPlanningDay('it', '2026-10-11'), '2026-10-16')
  assert.equal(nextPlanningDay('it', '2026-10-09'), '2026-10-16')
})

test('N sprints adds a week per extra sprint', () => {
  assert.equal(nextPlanningDay('slopdog', '2026-10-11', 2), '2026-10-23')
  assert.equal(nextPlanningDay('projects', '2026-10-11', 3), '2026-10-31')
})

test('phrases: next sprint, two sprints, in 3 sprints; nonsense reads as none', () => {
  assert.equal(sprintsInPhrase('next sprint'), 1)
  assert.equal(sprintsInPhrase('Next Sprint'), 1)
  assert.equal(sprintsInPhrase('two sprints'), 2)
  assert.equal(sprintsInPhrase('in 3 sprints'), 3)
  assert.equal(sprintsInPhrase('one sprint'), 1)
  assert.equal(sprintsInPhrase('someday'), null)
  assert.equal(sprintsInPhrase('0 sprints'), null)
})

test('resolveNotBefore: earliest department day, explicit date kept, unreadable phrase throws', () => {
  assert.equal(resolveNotBefore('next sprint', ['projects', 'slopdog'], '2026-10-11'), '2026-10-16')
  assert.equal(resolveNotBefore('next sprint', ['slopdog', 'projects'], '2026-10-09'), '2026-10-10')
  assert.equal(resolveNotBefore('two sprints', ['projects'], '2026-10-11'), '2026-10-24')
  assert.equal(resolveNotBefore('2026-11-02', ['it'], '2026-10-11'), '2026-11-02')
  assert.throws(() => resolveNotBefore('soonish', ['slopdog'], '2026-10-11'), /cannot read/)
  assert.throws(() => resolveNotBefore('2026-02-30', ['slopdog'], '2026-10-11'), /cannot read/)
  assert.throws(() => resolveNotBefore('next sprint', [], '2026-10-11'), /department/)
})

test('capture writes not_before right after departments, and only when given', () => {
  const fm = buildCaptureFrontMatter({ departments: ['slopdog'], notBefore: '2026-10-16', captured: '2026-10-11' })
  const file = serializeCaptureFile(fm, 'T', 'Body.')
  assert.match(file, /departments:\n  - slopdog\nnot_before: 2026-10-16\nplanning_state: waiting/)
  const plain = serializeCaptureFile(buildCaptureFrontMatter({ departments: ['slopdog'] }), 'T', 'Body.')
  assert.doesNotMatch(plain, /not_before/)
})

const idea = (nb, extra = '') =>
  `---\ndepartments:\n  - slopdog\n${nb ? `not_before: ${nb}\n` : ''}planning_state: waiting\n${extra}---\n# Idea\n`

test('classify: future not_before skipped, same day and past picked, hotfix ignores it', () => {
  const today = '2026-10-16'
  assert.equal(classifyIdeaForDepartment(parseIdeaMarkdown(idea('2026-10-17')), 'slopdog', { today }).bucket, 'skipped_not_before')
  assert.equal(classifyIdeaForDepartment(parseIdeaMarkdown(idea('2026-10-16')), 'slopdog', { today }).bucket, 'picked')
  assert.equal(classifyIdeaForDepartment(parseIdeaMarkdown(idea('2026-10-01')), 'slopdog', { today }).bucket, 'picked')
  assert.equal(classifyIdeaForDepartment(parseIdeaMarkdown(idea(null)), 'slopdog', { today }).bucket, 'picked')
  assert.equal(classifyIdeaForDepartment(parseIdeaMarkdown(idea('2026-12-01', 'hotfix: true\n')), 'slopdog', { today }).bucket, 'hotfix_immediate')
})

test('scan: the report counts and names every idea skipped for its date', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'not-before-'))
  try {
    fs.writeFileSync(path.join(dir, 'a-later.md'), idea('2026-10-23'))
    fs.writeFileSync(path.join(dir, 'b-later.md'), idea('2026-10-17'))
    fs.writeFileSync(path.join(dir, 'c-today.md'), idea('2026-10-16'))
    fs.writeFileSync(path.join(dir, 'd-undated.md'), idea(null))
    const r = scanIntakeQueue(dir, 'slopdog', { today: '2026-10-16' })
    assert.equal(r.counts.skipped_not_before, 2)
    assert.equal(r.counts.picked, 2)
    const report = formatQueueReport(r)
    assert.match(report, /Not-before check \(2026-10-16\): skipped 2 ideas dated after today\./)
    assert.match(report, /Deferred — not before a later date \(2\):\n  - a-later\.md: not before 2026-10-23\n  - b-later\.md: not before 2026-10-17/)
    const later = scanIntakeQueue(dir, 'slopdog', { today: '2026-10-23' })
    assert.equal(later.counts.skipped_not_before, 0)
    assert.match(formatQueueReport(later), /skipped 0 ideas dated after today/)
  } finally {
    fs.rmSync(dir, { recursive: true, force: true })
  }
})
