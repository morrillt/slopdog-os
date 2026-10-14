#!/usr/bin/env node
/**
 * Test double for agy used with DISPATCH_AGY_BIN — simulates skill-shaped writes and
 * secondary-model JSON replies without spending quota.
 */
import fs from 'node:fs'
import path from 'node:path'

const promptIdx = process.argv.indexOf('-p')
const prompt = promptIdx >= 0 ? process.argv[promptIdx + 1] : ''
const mode = process.env.SPRINT_AGY_STUB || ''

function emitResult(response) {
  const line = JSON.stringify({
    type: 'result',
    response,
    usage: { input_tokens: 1, output_tokens: 1, thinking_tokens: 0, cache_read_tokens: 0 },
  })
  process.stdout.write(`${line}\n`)
}

function writeProject(cwd) {
  const spec = JSON.parse(process.env.SPRINT_SHAPE_SPEC || '{}')
  const slug = spec.slug || 'test-program'
  const targetDir = spec.outPath ? path.dirname(spec.outPath) : cwd
  fs.mkdirSync(targetDir, { recursive: true })
  const title = spec.title || 'Test Program'
  const reqs = spec.requirements || []
  const reqLines = reqs.length
    ? reqs.map((r, i) => `- [ ] **FR-${i + 1} (${r.title}):** ${r.description}\n  - *Verify:* ${r.verify || 'check'}`).join('\n')
    : '- [ ] **FR-1 (Core Delivery):** Baseline capability.\n  - *Verify:* check passes.'

  const content = `---
title: "${title}"
slug: "${slug}"
status: "Active"
version: "v1"
owner: "Todd"
desk: "writing"
updated: 2026-10-03
ready_for_ticket_shards: false
---

# ${title}

> **Status:** \`Active\` | **Desk:** \`writing\` | **Owner:** \`Todd\` | **Ready for Shards:** \`false\`

## Summary

- **What:**
  - ${(spec.what || ['Structured project definition.'])[0]}
- **Why:**
  - ${(spec.why || ['Clarify initiatives.'])[0]}
- **How:**
  - ${(spec.how || ['Gated sprint batches.'])[0]}

## Definition of Done

${reqLines}

## Discussion & Open Questions

> [!comment Todd|q1]
> **Alignment:** Confirm project priorities.

## Appendix: Supporting Details

### Context
Notes supporting the Definition of Done and batch planning.
`
  const outPath = spec.outPath || path.join(cwd, `${slug}.md`)
  fs.writeFileSync(outPath, content, 'utf8')
  emitResult(`Wrote project ${outPath} following project-writer.`)
}

function writeBatch(cwd) {
  const spec = JSON.parse(process.env.SPRINT_SHAPE_SPEC || '{}')
  const batchName = spec.batchName || '1-foundation'
  const targetDir = spec.outPath ? path.dirname(spec.outPath) : cwd
  fs.mkdirSync(targetDir, { recursive: true })
  const reqs = spec.requirements || [{ title: 'Foundation Component', description: 'Implement foundation.', verify: 'node test' }]
  const reqLines = reqs
    .map(
      (r, i) =>
        `- [ ] **FR-${i + 1} (${r.title}) — hangs from How bullet 1:** ${r.description}\n  - *Verify:* ${r.verify || 'verify'}`,
    )
    .join('\n')
  const owns = reqs.map((_, i) => `FR-${i + 1}`).join(', ')

  const content = `# Batch ${batchName}
type: slopdog
feature: ticket-shaping

## Summary
${spec.summary || 'Foundational batch for sprint delivery.'}

## What
- ${(spec.what || ['Lay groundwork.'])[0]}

## Why
- ${(spec.why || ['Ensure robust architecture.'])[0]}

## How
- ${(spec.how || ['Write tested modules.'])[0]} *(Owns ${owns}.)*

## Requirements
Every requirement hangs from one bullet of How.

${reqLines}

## Integration tests
- Run once every member ticket is done: smoke the shaped batch contract.

## Cross-cutting tests
- One check that spans the batch: the shaped file still names every requirement.

## Discussion & Open Questions
> [!comment Todd|q1]
> **Batch Alignment:** Confirm batch priorities.

## Appendix
### Details
Context for batch execution.

## Members
- T-999 · placeholder ticket

## What this batch turns off
- Superseded batch approaches.
`
  const outPath = spec.outPath || path.join(cwd, `${batchName}.md`)
  fs.writeFileSync(outPath, content, 'utf8')
  emitResult(`Wrote batch ${outPath} following batch-writer.`)
}

function validateReply() {
  const spec = JSON.parse(process.env.SPRINT_VALIDATE_SPEC || '{}')
  const reqId = spec.reqId || 'FR-1'
  const title = spec.title || 'Requirement'
  const payload = {
    reqId,
    happy: [
      `[happy] When ${title} runs under normal inputs, the system completes and state matches expectations.`,
      `[happy] Standard outputs match the batch contract for ${reqId}.`,
    ],
    unhappy: [
      `[unhappy] When input is invalid for ${title}, processing halts with a clear error and no partial writes.`,
      `[unhappy] Timeout or resource exhaustion for ${title} triggers graceful abort.`,
    ],
  }
  emitResult(JSON.stringify(payload))
}

if (mode === 'validate-batch' || prompt.includes('SPRINT_VALIDATE_JSON')) {
  validateReply()
} else if (mode === 'shape-project' || prompt.includes('project-writer') || prompt.includes('project-shaper')) {
  writeProject(process.cwd())
} else if (mode === 'shape-batch' || prompt.includes('batch-writer')) {
  writeBatch(process.cwd())
} else {
  emitResult('agy sprint-planning stub: no mode matched')
  process.exit(1)
}
