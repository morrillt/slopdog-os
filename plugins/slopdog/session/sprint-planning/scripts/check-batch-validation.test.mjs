import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { validateBatchWithSecondaryModel } from './validate-batch.mjs'
import { sandboxProcess } from '../../../../../scripts/lib/test-sandbox.mjs'

sandboxProcess()

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const AGY_STUB = path.join(SCRIPT_DIR, 'test-fixtures/agy-sprint-planning-stub.mjs')
const WORKTREE = path.resolve(SCRIPT_DIR, '../../../../../../')

function dispatchOptions() {
  const scratch = fs.mkdtempSync(path.join(os.tmpdir(), 'batch-validation-dispatch-'))
  const sidekick = path.join(scratch, 'sidekick')
  const jobs = path.join(scratch, 'jobs')
  fs.mkdirSync(sidekick)
  fs.mkdirSync(jobs)
  fs.writeFileSync(path.join(scratch, 'quota.json'), '{}\n')
  return {
    worktree: WORKTREE,
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

const SAMPLE_BATCH = `# Batch 1-alpha
## Summary
Sample batch for validation.

## What
- Deliver capability.

## Why
- Reduce risk.

## How
- Build with tests.

## Requirements
- **FR-1 (Auth Flow):** Users can sign in.
  - *Verify:* Integration test passes.

## Discussion & Open Questions
> [!comment Todd|q1]
> **Alignment:** Confirm scope.

## Appendix
### Details
Notes.

## Members
- T-100

## What this batch turns off
- Ad-hoc auth patches.
`

test('AC-3: validation calls secondary model via dispatch and adds happy and unhappy path criteria', async () => {
  const options = dispatchOptions()
  const result = await validateBatchWithSecondaryModel(SAMPLE_BATCH, {
    dispatchOptions: options,
    dispatchEnv: options.env,
  })

  assert.equal(result.reqCount, 1)
  assert.equal(result.validatedCriteria.length, 1)
  const crit = result.validatedCriteria[0]
  assert.equal(crit.reqId, 'FR-1')
  assert.ok(crit.happy.some((h) => /\[happy\]/.test(h)))
  assert.ok(crit.unhappy.some((u) => /\[unhappy\]/.test(u)))

  assert.match(result.updatedContent, /\*AC-happy:\*/)
  assert.match(result.updatedContent, /\*AC-unhappy:\*/)
  assert.match(result.updatedContent, /\[happy\]/)
  assert.match(result.updatedContent, /\[unhappy\]/)
})
