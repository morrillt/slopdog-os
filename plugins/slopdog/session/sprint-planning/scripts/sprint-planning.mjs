#!/usr/bin/env node
/**
 * @inputs A department name, with --status to print where it stands or no flag to try advancing past the current gate.
 * @outputs A per-department state file under ~/.config/slopdog/sprint-planning recording the current gated step and its sign-offs.
 * @starts A planning step finishes and the run tries to move to the next gate.
 * @ends All six gates carry a recorded sign-off and the tickets are released to builders.
 */
// Sprint Planning Harness & State Machine
// Executes the six-step gated sequence per department with Todd's explicit recorded sign-off.
import fs, { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

export const GATED_STEPS = [
  { step: 1, name: 'ideation', gate: 'gate-1-signoff', description: 'Ideation: process ideas and append non-destructive layers' },
  { step: 2, name: 'project-shaping', gate: 'gate-2-signoff', description: 'Shape Projects: draft/update project with canonical skill' },
  { step: 3, name: 'batch-shaping', gate: 'gate-3-signoff', description: 'Shape Batches: draft/update batch files at project scale' },
  { step: 4, name: 'batch-validation', gate: 'gate-4-signoff', description: 'Validate Batches: secondary model adds happy & unhappy path criteria' },
  { step: 5, name: 'ticket-sharding', gate: 'gate-5-signoff', description: 'Shard Tickets: create >= 3pt tickets and enforce two-way cross-check' },
  { step: 6, name: 'spotcheck-release', gate: 'gate-6-signoff', description: 'Spot-check & Release: review tickets and release to builders' },
]

export const SUPPORTED_DEPARTMENTS = ['slopdog', 'projects', 'it']

const HOME = process.env.HOME || '~'

export function stateDir() {
  return process.env.SPRINT_PLANNING_STATE_DIR || path.join(HOME, '.config/slopdog/sprint-planning')
}

export function stateFilePath(department) {
  const safe = department.toLowerCase().replace(/[^a-z0-9-]+/g, '-')
  return path.join(stateDir(), `${safe}.json`)
}

export function loadDepartmentState(department) {
  const file = stateFilePath(department)
  if (!fs.existsSync(file)) return null
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

export function saveDepartmentState(serialized) {
  const dir = stateDir()
  fs.mkdirSync(dir, { recursive: true })
  const file = stateFilePath(serialized.department)
  fs.writeFileSync(file, JSON.stringify(serialized, null, 2) + '\n', 'utf8')
  return file
}

export class SprintPlanningStateMachine {
  constructor(department = 'slopdog', initialState = {}) {
    this.department = department.toLowerCase()
    this.currentStep = initialState.currentStep || 1
    this.status = initialState.status || 'IN_PROGRESS'
    this.approvals = initialState.approvals || []
    this.artifacts = initialState.artifacts || {}
    this.persist = initialState.persist !== false
  }

  static fromDepartment(department) {
    const saved = loadDepartmentState(department)
    if (saved) {
      return new SprintPlanningStateMachine(department, { ...saved, persist: true })
    }
    return new SprintPlanningStateMachine(department)
  }

  isHotfixBypassed(item) {
    if (!item) return false
    const tags = Array.isArray(item.tags) ? item.tags : []
    const isTag = tags.includes('hotfix')
    const isFlag = item.hotfix === true
    const isText = typeof item === 'string' && /#hotfix\b|\bhotfix\b/i.test(item)
    return isTag || isFlag || isText
  }

  getCurrentGate() {
    const stepDef = GATED_STEPS.find((s) => s.step === this.currentStep)
    return stepDef ? stepDef.gate : null
  }

  getCurrentStepDef() {
    return GATED_STEPS.find((s) => s.step === this.currentStep) || null
  }

  canAdvanceWithoutSignoff() {
    return false
  }

  persistState() {
    if (!this.persist) return null
    return saveDepartmentState(this.serialize())
  }

  attemptAdvance(signoff = null) {
    if (this.status === 'COMPLETED') {
      const res = {
        halted: false,
        status: 'COMPLETED',
        message: `Department ${this.department} sprint planning is completed.`,
        currentStep: this.currentStep,
      }
      this.persistState()
      return res
    }

    const currentDef = this.getCurrentStepDef()
    if (!signoff || !signoff.recorded || !signoff.approver) {
      const res = {
        halted: true,
        status: 'HALTED_AWAITING_SIGNOFF',
        gate: currentDef.gate,
        currentStep: this.currentStep,
        stepName: currentDef.name,
        message: `Halted at Step ${this.currentStep} (${currentDef.name}). Explicit recorded sign-off required for gate ${currentDef.gate} before advancing.`,
      }
      this.persistState()
      return res
    }

    this.approvals.push({
      step: this.currentStep,
      gate: currentDef.gate,
      approver: signoff.approver,
      timestamp: signoff.timestamp || new Date().toISOString(),
      note: signoff.note || 'Sign-off confirmed.',
    })

    if (this.currentStep < 6) {
      this.currentStep += 1
      const nextDef = this.getCurrentStepDef()
      const res = {
        halted: true,
        status: 'STEP_ADVANCED_HALTED_AT_NEXT_GATE',
        previousStep: this.currentStep - 1,
        currentStep: this.currentStep,
        gate: nextDef.gate,
        message: `Advanced to Step ${this.currentStep} (${nextDef.name}). Now awaiting sign-off at gate ${nextDef.gate}.`,
      }
      this.persistState()
      return res
    }

    this.status = 'COMPLETED'
    const res = {
      halted: false,
      status: 'COMPLETED',
      message: `Step 6 approved. All six sprint planning gates passed and tickets released for department ${this.department}.`,
      currentStep: 6,
    }
    this.persistState()
    return res
  }

  serialize() {
    return {
      department: this.department,
      currentStep: this.currentStep,
      status: this.status,
      approvals: this.approvals,
      artifacts: this.artifacts,
      updatedAt: new Date().toISOString(),
    }
  }
}

export function runDepartmentSprintPlanning(department = 'slopdog', signoffSequence = []) {
  const machine = SprintPlanningStateMachine.fromDepartment(department)
  const transitions = []

  const initCheck = machine.attemptAdvance(null)
  transitions.push(initCheck)

  for (const signoff of signoffSequence) {
    const res = machine.attemptAdvance(signoff)
    transitions.push(res)
  }

  return {
    finalState: machine.serialize(),
    transitions,
    completed: machine.status === 'COMPLETED',
    stateFile: stateFilePath(department),
  }
}

export function formatStatusReport(department) {
  const saved = loadDepartmentState(department)
  if (!saved) {
    return `No sprint planning state on disk for department "${department}".`
  }
  const stepDef = GATED_STEPS.find((s) => s.step === saved.currentStep)
  const lines = [
    `Sprint planning — department: ${saved.department}`,
    `Status: ${saved.status}`,
    `Current step: ${saved.currentStep} (${stepDef?.name || 'unknown'})`,
    `Gate: ${stepDef?.gate || 'n/a'}`,
    `Recorded sign-offs: ${saved.approvals?.length || 0}`,
    `State file: ${stateFilePath(department)}`,
    `Updated: ${saved.updatedAt || 'unknown'}`,
  ]
  return lines.join('\n')
}

function main() {
  const args = process.argv.slice(2)
  const deptIdx = args.indexOf('--department')
  const department = deptIdx !== -1 ? args[deptIdx + 1] : 'slopdog'
  const statusFlag = args.includes('--status')

  if (statusFlag) {
    console.log(formatStatusReport(department))
    return
  }

  const machine = SprintPlanningStateMachine.fromDepartment(department)
  const check = machine.attemptAdvance(null)
  console.log(check.message)
  console.log(`State persisted: ${stateFilePath(department)}`)
}

if (process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main()
}
