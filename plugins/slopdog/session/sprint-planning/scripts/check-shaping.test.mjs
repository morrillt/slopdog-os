import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import {
  shapeProject,
  shapeBatch,
  resolveSkillPath,
  CANONICAL_PROJECT_SKILL_PATHS,
  CANONICAL_BATCH_SKILL_PATHS,
} from './shape-project-batch.mjs'
import { sandboxProcess } from '../../../../../scripts/lib/test-sandbox.mjs'

sandboxProcess()

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const AGY_STUB = path.join(SCRIPT_DIR, 'test-fixtures/agy-sprint-planning-stub.mjs')
const WORKTREE = path.resolve(SCRIPT_DIR, '../../../../../../')
const STRUCTURE_SCRIPT = path.join(SCRIPT_DIR, 'check-project-structure.mjs')
// A project in the Definition of Done shape this checker expects. The writing desk's
// project-shaper examples moved to the feature format on 2026-10-12, so the fixture lives here.
const BETTERDOCS_EXAMPLE = path.join(SCRIPT_DIR, 'test-fixtures/project-betterdocs-dod.md')
const NO_FRONT_MATTER_FIXTURE = path.join(SCRIPT_DIR, 'test-fixtures/project-no-front-matter.md')

function runStructureCheck(targetPath) {
  return spawnSync(process.execPath, [STRUCTURE_SCRIPT, targetPath], { encoding: 'utf8' })
}

function dispatchOptions() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'shaping-dispatch-'))
  const sidekick = path.join(scratch, 'sidekick')
  const jobs = path.join(scratch, 'jobs')
  fs.mkdirSync(sidekick)
  fs.mkdirSync(jobs)
  fs.writeFileSync(path.join(scratch, 'quota.json'), '{}\n')
  return {
    worktree: WORKTREE,
    // The dispatch this ticket changes. The fallback in dispatch-skill.mjs is the main checkout.
    dispatchPath: path.join(WORKTREE, 'v2/scripts/dispatch.mjs'),
    env: {
      DISPATCH_AGY_BIN: AGY_STUB,
      DISPATCH_QUOTA_STATE_PATH: path.join(scratch, 'quota.json'),
      DISPATCH_LEDGER_PATH: path.join(scratch, 'ledger.jsonl'),
      DISPATCH_JOBS_DIR: jobs,
      DISPATCH_SIDEKICK_INBOX_DIR: sidekick,
    },
  }
}

function inboxNames(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir).sort() : []
}

test('AC-1 (FR-1): structure checker passes canonical BetterDocs example and rejects missing front matter', () => {
  assert.ok(fs.existsSync(BETTERDOCS_EXAMPLE), BETTERDOCS_EXAMPLE)
  const ok = runStructureCheck(BETTERDOCS_EXAMPLE)
  assert.equal(ok.status, 0, ok.stderr || ok.stdout)

  const bad = runStructureCheck(NO_FRONT_MATTER_FIXTURE)
  assert.equal(bad.status, 1, bad.stdout || bad.stderr)
  assert.match(bad.stderr, /missing unified YAML front matter/)
})

test('AC-2: sprint planning runner invokes project-writer and batch-writer via dispatch to produce shaped files', () => {
  const ideasInboxes = [
    path.join(WORKTREE, 'v2/desks/ideas/inbox'),
    path.join(os.homedir(), 'slopdog/v2/desks/ideas/inbox'),
  ]
  const before = new Map(ideasInboxes.map((dir) => [dir, inboxNames(dir)]))
  const tmpDir = fs.mkdtempSync(path.join(WORKTREE, '.tmp-sprint-shaping-'))
  const projectOutDir = path.join(tmpDir, 'projects')
  const batchOutDir = path.join(tmpDir, 'batches', 'test-program')

  try {
  const projectSkill = resolveSkillPath(CANONICAL_PROJECT_SKILL_PATHS)
  const batchSkill = resolveSkillPath(CANONICAL_BATCH_SKILL_PATHS)
  assert.ok(fs.existsSync(projectSkill), `Project skill exists at ${projectSkill}`)
  assert.ok(fs.existsSync(batchSkill), `Batch skill exists at ${batchSkill}`)
  assert.match(projectSkill, /project-writer/)

  const projectRes = shapeProject({
    slug: 'test-program',
    title: 'Test Program',
    why: ['Clarify multi-department initiatives.'],
    what: ['Structured project definition with functional requirements.'],
    how: ['Iterate via gated sprint planning batches.'],
    requirements: [
      { title: 'Core Pipeline', description: 'Deliver pipeline.', verify: 'check command' },
      { title: 'Secondary Gate', description: 'Gated step.', verify: 'gate command' },
    ],
    outputDir: projectOutDir,
    dispatchOptions: dispatchOptions(),
  })

  assert.ok(fs.existsSync(projectRes.outPath))
  assert.match(projectRes.skillPath, /project-writer/)
  const projContent = fs.readFileSync(projectRes.outPath, 'utf8')
  assert.match(projContent, /# Test Program/)
  assert.match(projContent, /Definition of Done/)
  assert.match(projContent, /FR-1 \(Core Pipeline\)/)
  assert.match(projContent, /FR-2 \(Secondary Gate\)/)
  assert.match(projContent, /^## Discussion & Open Questions$/m)
  assert.match(projContent, /^## Appendix/m)

  const batchRes = shapeBatch({
    slug: 'test-program',
    batchName: '1-foundation',
    summary: 'Foundational batch for sprint delivery.',
    what: ['Lay the groundwork for batch execution.'],
    why: ['Ensure robust architecture.'],
    how: ['Write tested modules.'],
    requirements: [
      { title: 'Foundation Component', description: 'Implement foundation.', verify: 'node test' },
    ],
    outputDir: batchOutDir,
    dispatchOptions: dispatchOptions(),
  })

  assert.ok(fs.existsSync(batchRes.outPath))
  assert.match(batchRes.skillPath, /batch-writer/)
  const batchContent = fs.readFileSync(batchRes.outPath, 'utf8')
  assert.match(batchContent, /# Batch 1-foundation/)
  assert.match(batchContent, /## Summary/)
  assert.match(batchContent, /## Requirements/)
  assert.match(batchContent, /^## What this batch turns off$/m)

  for (const dir of ideasInboxes) {
    const fresh = inboxNames(dir).filter((name) => !before.get(dir).includes(name))
    assert.deepEqual(inboxNames(dir), before.get(dir), `new file in ${dir}: ${fresh.join(', ')}`)
  }
  } finally {
    for (const dir of ideasInboxes) {
      for (const name of inboxNames(dir)) {
        if (!before.get(dir).includes(name)) fs.rmSync(path.join(dir, name), { force: true })
      }
    }
    fs.rmSync(tmpDir, { recursive: true, force: true })
  }
})
