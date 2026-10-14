import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import {
  SprintPlanningStateMachine,
  GATED_STEPS,
  stateFilePath,
  loadDepartmentState,
  formatStatusReport,
} from './sprint-planning.mjs'

test('AC-5: harness enforces that all six steps pause and require explicit recorded user confirmation before proceeding', () => {
  const department = 'slopdog'
  const machine = new SprintPlanningStateMachine(department, { persist: false })

  assert.equal(machine.currentStep, 1)
  const halt1 = machine.attemptAdvance(null)
  assert.equal(halt1.halted, true)
  assert.equal(halt1.status, 'HALTED_AWAITING_SIGNOFF')
  assert.equal(halt1.gate, 'gate-1-signoff')

  const fakeSignoff = machine.attemptAdvance({ approver: '', recorded: false })
  assert.equal(fakeSignoff.halted, true)
  assert.equal(fakeSignoff.status, 'HALTED_AWAITING_SIGNOFF')

  const advance1 = machine.attemptAdvance({ approver: 'Todd', recorded: true, note: 'Step 1 approved' })
  assert.equal(advance1.currentStep, 2)
  assert.equal(advance1.gate, 'gate-2-signoff')

  const halt2 = machine.attemptAdvance(null)
  assert.equal(halt2.halted, true)
  assert.equal(halt2.gate, 'gate-2-signoff')

  const advance2 = machine.attemptAdvance({ approver: 'Todd', recorded: true, note: 'Step 2 approved' })
  assert.equal(advance2.currentStep, 3)
  assert.equal(advance2.gate, 'gate-3-signoff')

  const halt3 = machine.attemptAdvance(null)
  assert.equal(halt3.halted, true)
  assert.equal(halt3.gate, 'gate-3-signoff')

  const advance3 = machine.attemptAdvance({ approver: 'Todd', recorded: true, note: 'Step 3 approved' })
  assert.equal(advance3.currentStep, 4)
  assert.equal(advance3.gate, 'gate-4-signoff')

  const halt4 = machine.attemptAdvance(null)
  assert.equal(halt4.halted, true)
  assert.equal(halt4.gate, 'gate-4-signoff')

  const advance4 = machine.attemptAdvance({ approver: 'Todd', recorded: true, note: 'Step 4 approved' })
  assert.equal(advance4.currentStep, 5)
  assert.equal(advance4.gate, 'gate-5-signoff')

  const halt5 = machine.attemptAdvance(null)
  assert.equal(halt5.halted, true)
  assert.equal(halt5.gate, 'gate-5-signoff')

  const advance5 = machine.attemptAdvance({ approver: 'Todd', recorded: true, note: 'Step 5 approved' })
  assert.equal(advance5.currentStep, 6)
  assert.equal(advance5.gate, 'gate-6-signoff')

  const halt6 = machine.attemptAdvance(null)
  assert.equal(halt6.halted, true)
  assert.equal(halt6.gate, 'gate-6-signoff')

  const advance6 = machine.attemptAdvance({ approver: 'Todd', recorded: true, note: 'Step 6 spot-check released' })
  assert.equal(advance6.status, 'COMPLETED')
  assert.equal(advance6.halted, false)
  assert.equal(machine.status, 'COMPLETED')
  assert.equal(machine.approvals.length, 6)

  assert.equal(machine.isHotfixBypassed({ tags: ['hotfix'] }), true)
  assert.equal(machine.isHotfixBypassed({ hotfix: true }), true)
  assert.equal(machine.isHotfixBypassed('Ticket #hotfix emergency'), true)
  assert.equal(machine.isHotfixBypassed({ tags: ['meta'] }), false)
})

test('AC-5: gate state persists to disk and --status reads it', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sprint-state-'))
  const prev = process.env.SPRINT_PLANNING_STATE_DIR
  process.env.SPRINT_PLANNING_STATE_DIR = tmpDir

  try {
    const dept = 'projects'
    const m1 = new SprintPlanningStateMachine(dept)
    m1.attemptAdvance(null)
    m1.attemptAdvance({ approver: 'Todd', recorded: true, note: 'Gate 1' })

    const file = stateFilePath(dept)
    assert.ok(fs.existsSync(file))
    const onDisk = loadDepartmentState(dept)
    assert.equal(onDisk.currentStep, 2)
    assert.equal(onDisk.approvals.length, 1)

    const m2 = SprintPlanningStateMachine.fromDepartment(dept)
    assert.equal(m2.currentStep, 2)

    const statusText = formatStatusReport(dept)
    assert.match(statusText, /Current step: 2/)
    assert.match(statusText, /gate-2-signoff/)
    assert.match(statusText, /Recorded sign-offs: 1/)
  } finally {
    if (prev === undefined) delete process.env.SPRINT_PLANNING_STATE_DIR
    else process.env.SPRINT_PLANNING_STATE_DIR = prev
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
