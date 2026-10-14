#!/usr/bin/env node
/**
 * @inputs A batch file and its functional requirements.
 * @outputs The batch with happy and unhappy path verification criteria added by a second model through dispatch.
 * @starts A shaped batch is signed and needs validating before sharding.
 * @ends Every requirement in the batch has its verify criteria.
 */
// Step 4: Multi-Model Batch Validation via dispatch.mjs (secondary agy reviewer).
import fs, { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { runDispatchAgy } from './dispatch-skill.mjs'

export function parseBatchSections(batchText) {
  const sections = {}
  const lines = batchText.split('\n')
  let currentHeader = '__root__'
  let buffer = []

  for (const line of lines) {
    const hMatch = line.match(/^##\s+(.+)$/)
    if (hMatch) {
      sections[currentHeader] = buffer.join('\n').trim()
      currentHeader = hMatch[1].trim()
      buffer = []
    } else {
      buffer.push(line)
    }
  }
  sections[currentHeader] = buffer.join('\n').trim()
  return sections
}

export function extractRequirements(reqText = '') {
  const reqs = []
  const lines = reqText.split('\n')
  let currentReq = null

  for (const line of lines) {
    const match = line.match(/^\s*-\s*\*\*FR-(\d+)\s*\(([^)]+)\):\*\*\s*(.*)$/)
    if (match) {
      if (currentReq) reqs.push(currentReq)
      currentReq = {
        id: `FR-${match[1]}`,
        title: match[2].trim(),
        description: match[3].trim(),
        verifications: [],
      }
    } else if (currentReq && line.trim().startsWith('- *Verify:*')) {
      currentReq.verifications.push(line.trim().replace(/^-\s*\*Verify:\*\s*/, ''))
    }
  }
  if (currentReq) reqs.push(currentReq)
  return reqs
}

export function parseCriteriaFromDispatchOutput(text) {
  const tryPayload = (raw) => {
    const parsed = JSON.parse(raw)
    if (parsed.reqId && Array.isArray(parsed.happy) && Array.isArray(parsed.unhappy)) {
      return parsed
    }
    if (typeof parsed.response === 'string' && parsed.response.trim()) {
      return tryPayload(parsed.response.trim())
    }
    return null
  }

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean)
  for (let i = lines.length - 1; i >= 0; i--) {
    try {
      const hit = tryPayload(lines[i])
      if (hit) {
        if (!hit.happy.length || !hit.unhappy.length) {
          throw new Error('Secondary model must return at least one happy and one unhappy criterion.')
        }
        return hit
      }
    } catch (err) {
      if (err.message.includes('happy and one unhappy')) throw err
    }
  }

  const inline = text.match(/\{"reqId"\s*:\s*"[^"]+"[\s\S]*?"unhappy"\s*:\s*\[[\s\S]*?\]\s*\}/)
  if (inline) {
    const hit = tryPayload(inline[0])
    if (hit) return hit
  }

  throw new Error('Secondary model reply did not contain criteria JSON.')
}

export async function reviewRequirementWithSecondaryModel(req, sections, options = {}) {
  const prompt = [
    'SPRINT_VALIDATE_JSON',
    'You are a secondary reviewer (not the author). Review this batch functional requirement against the batch context.',
    'Reply with a single JSON object only — no markdown fences — shaped as:',
    '{"reqId":"FR-n","happy":["..."],"unhappy":["..."]}',
    'Include at least one happy-path and one unhappy-path acceptance criterion each.',
    `Requirement: ${JSON.stringify(req)}`,
    `Batch sections: ${JSON.stringify({ Summary: sections.Summary, What: sections.What, Why: sections.Why, How: sections.How })}`,
  ].join('\n\n')

  const dispatchOut = runDispatchAgy(prompt, {
    ...options.dispatchOptions,
    sender: options.sender || 'ideas',
    timeoutSec: options.timeoutSec || 600,
    env: {
      ...options.dispatchEnv,
      SPRINT_AGY_STUB: 'validate-batch',
      SPRINT_VALIDATE_SPEC: JSON.stringify({ reqId: req.id, title: req.title }),
    },
  })

  return parseCriteriaFromDispatchOutput(dispatchOut)
}

export async function validateBatchWithSecondaryModel(batchText, options = {}) {
  const sections = parseBatchSections(batchText)
  const reqText = sections.Requirements || ''
  const reqs = extractRequirements(reqText)

  if (reqs.length === 0) {
    throw new Error('No functional requirements found in batch to validate.')
  }

  const validatedCriteria = []
  for (const req of reqs) {
    const criteria = await reviewRequirementWithSecondaryModel(req, sections, options)
    validatedCriteria.push(criteria)
  }

  const updatedReqLines = []
  for (const req of reqs) {
    updatedReqLines.push(`- **${req.id} (${req.title}):** ${req.description}`)
    for (const v of req.verifications) {
      updatedReqLines.push(`  - *Verify:* ${v}`)
    }
    const crit = validatedCriteria.find((c) => c.reqId === req.id)
    if (crit) {
      for (const h of crit.happy) {
        updatedReqLines.push(`  - *AC-happy:* ${h}`)
      }
      for (const u of crit.unhappy) {
        updatedReqLines.push(`  - *AC-unhappy:* ${u}`)
      }
    }
  }

  const lines = batchText.split('\n')
  const reqStart = lines.findIndex((l) => l.trim() === '## Requirements')
  if (reqStart === -1) {
    throw new Error('Malformed batch markdown: missing ## Requirements')
  }

  let reqEnd = lines.findIndex((l, i) => i > reqStart && l.startsWith('## '))
  if (reqEnd === -1) reqEnd = lines.length

  const beforeReq = lines.slice(0, reqStart + 1)
  const afterReq = lines.slice(reqEnd)

  const updatedBatchContent = [
    ...beforeReq,
    updatedReqLines.join('\n'),
    '',
    ...afterReq,
  ].join('\n')

  return {
    updatedContent: updatedBatchContent,
    validatedCriteria,
    reqCount: reqs.length,
  }
}

export async function validateBatchFile(filePath, options = {}) {
  const content = fs.readFileSync(filePath, 'utf8')
  const result = await validateBatchWithSecondaryModel(content, options)
  fs.writeFileSync(filePath, result.updatedContent, 'utf8')
  return result
}

async function main() {
  const args = process.argv.slice(2)
  const batchIdx = args.indexOf('--batch')
  if (batchIdx === -1 || !args[batchIdx + 1]) {
    console.error('Usage: node validate-batch.mjs --batch <path>')
    process.exit(1)
  }
  const batchPath = path.resolve(args[batchIdx + 1])
  if (!fs.existsSync(batchPath)) {
    console.error(`Batch file not found: ${batchPath}`)
    process.exit(1)
  }
  const result = await validateBatchFile(batchPath)
  console.log(`Batch ${batchPath} validated with secondary model: ${result.reqCount} requirements enriched (happy + unhappy paths).`)
}

if (process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main()
}
