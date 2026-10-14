#!/usr/bin/env node
/**
 * @inputs A validated batch and the size floor and folding rules from ticket-add step 4.
 * @outputs Tickets of three points or more, each cross-checked both ways against the batch's requirements.
 * @starts A validated batch is ready to shard.
 * @ends Every requirement maps to a ticket and every ticket maps back to a requirement.
 */
// Step 5: Ticket Sharding & Two-Way Cross-Check
// Size floor and folding rules: ~/slopdog/tasks/.claude/skills/ticket-add/SKILL.md step 4.
import fs, { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { extractRequirements } from './validate-batch.mjs'

const HOME = process.env.HOME || '~'
const SLOPDOG_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../../..')

export const TASK_ADD_SKILL_FOR_SHARDING = path.join(
  HOME,
  'slopdog/tasks/.claude/skills/ticket-add/SKILL.md',
)

export function ticketShardingRulesPath() {
  const candidates = [
    TASK_ADD_SKILL_FOR_SHARDING,
    path.join(SLOPDOG_DIR, '../tasks/.claude/skills/ticket-add/SKILL.md'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return TASK_ADD_SKILL_FOR_SHARDING
}

const MIN_TICKET_POINTS = 3

/** Rough shard size from requirement title (ticket-add step 4 folding input). */
export function estimateRequirementPoints(req) {
  const title = (req.title || '').toLowerCase()
  if (title.includes('substantial') || title.includes('large')) return 3
  if (title.includes('small') || title.includes('thin') || title.includes('quick')) return 1
  return 2
}

/** Fold sub-floor requirements into neighbors before minting tickets. */
export function foldRequirementsForSharding(reqs) {
  const groups = []
  let i = 0
  while (i < reqs.length) {
    const group = [reqs[i]]
    let sum = estimateRequirementPoints(reqs[i])
    i += 1
    while (sum < MIN_TICKET_POINTS && i < reqs.length) {
      const nextPts = estimateRequirementPoints(reqs[i])
      if (nextPts >= MIN_TICKET_POINTS && group.length > 0) break
      group.push(reqs[i])
      sum += nextPts
      i += 1
    }
    groups.push({ reqs: group, rawPoints: sum })
  }
  return groups
}

function createShardedTicket(reqGroup, points, options = {}) {
  const ticketNum = options.nextTicketNum || 901
  const id = `T-${ticketNum}`
  const primary = reqGroup[0]
  const title = reqGroup.length === 1
    ? primary.title
    : `${primary.title} and related batch requirements`

  const mappedReqs = reqGroup.map((r) => r.id)

  return {
    id,
    title,
    project: options.project || 'sprint-project',
    batch: options.batch || '1-alpha',
    estimate: {
      points: Math.max(MIN_TICKET_POINTS, points),
      rationale: reqGroup.length > 1
        ? `Folded per ticket-add step 4 (>= ${MIN_TICKET_POINTS} points) covering requirements: ${mappedReqs.join(', ')}.`
        : `Sized per ticket-add step 4 (>= ${MIN_TICKET_POINTS} points) covering requirements: ${mappedReqs.join(', ')}.`,
    },
    mappedRequirements: reqGroup,
    functionalRequirements: reqGroup.map((r, i) => `- FR-${i + 1} (${r.id}): ${r.description || r.title}`),
    acceptanceCriteria: reqGroup.flatMap((r) => [
      `- [ ] AC-${r.id}-happy [unit]: Happy path for ${r.title} executes cleanly.`,
      `- [ ] AC-${r.id}-unhappy [unit]: Unhappy path and error recovery verified for ${r.title}.`,
    ]),
  }
}

export function formatTicketMarkdown(ticket) {
  const date = new Date().toISOString().split('T')[0]
  const acText = ticket.acceptanceCriteria.join('\n')
  const frText = ticket.functionalRequirements.join('\n')
  const mappedIds = ticket.mappedRequirements.map((r) => r.id).join(', ')

  return `---
id: ${ticket.id}
project: ${ticket.project}
batch: ${ticket.batch}
tags:
  - meta
estimate:
  points: ${ticket.estimate.points}
  rationale: "${ticket.estimate.rationale}"
  updated: '${date}'
readiness:
  state: ready
  updated: '${date}'
  gaps: []
questions:
  status: none
  updated: '${date}'
  items: []
---

# ${ticket.title}

${ticket.id} · 🔵 ready

**Batch ${ticket.batch}** — Sharded ticket covering batch requirements: ${mappedIds}.

## What
Implements validated batch requirements (ticket-add step 4 size floor).

## Functional Requirements
${frText}

## Acceptance Criteria
${acText}

## Steps
- [ ] Implement core logic for ${mappedIds}.
  - Verify: Automated unit tests pass.
- [ ] Verify happy and unhappy acceptance criteria.
  - Verify: Edge cases halt cleanly.

## Progress notes
- ${date} · Gemma · Sharded ticket generated from batch requirements.
`.trim()
}

export function twoWayCrossCheck({ batchRequirements, tickets }) {
  const reqToTickets = new Map()
  const ticketToReqs = new Map()

  for (const req of batchRequirements) {
    reqToTickets.set(req.id, [])
  }
  for (const t of tickets) {
    ticketToReqs.set(t.id, [])
  }

  for (const t of tickets) {
    const ticketBody = typeof t === 'string' ? t : (t.body || JSON.stringify(t))
    const ticketId = t.id || 'unknown'

    for (const req of batchRequirements) {
      const re = new RegExp(`\\b${req.id}\\b`)
      if (re.test(ticketBody)) {
        reqToTickets.get(req.id).push(ticketId)
        ticketToReqs.get(ticketId).push(req.id)
      }
    }
  }

  const unmappedRequirements = []
  for (const [reqId, mapped] of reqToTickets.entries()) {
    if (mapped.length === 0) {
      const reqObj = batchRequirements.find((r) => r.id === reqId)
      unmappedRequirements.push({ id: reqId, title: reqObj?.title || 'Unknown' })
    }
  }

  const unmappedTickets = []
  for (const [tId, mapped] of ticketToReqs.entries()) {
    if (mapped.length === 0) {
      const ticketObj = tickets.find((t) => t.id === tId)
      unmappedTickets.push({ id: tId, title: ticketObj?.title || 'Unknown' })
    }
  }

  const passed = unmappedRequirements.length === 0 && unmappedTickets.length === 0
  let refusalReason = null

  if (!passed) {
    const reasons = []
    if (unmappedRequirements.length > 0) {
      reasons.push(`Unmapped batch requirements (${unmappedRequirements.length}): ${unmappedRequirements.map((r) => `${r.id} (${r.title})`).join(', ')}`)
    }
    if (unmappedTickets.length > 0) {
      reasons.push(`Unmapped tickets (${unmappedTickets.length}): ${unmappedTickets.map((t) => `${t.id} (${t.title})`).join(', ')}`)
    }
    refusalReason = `Cross-check refused: gaps detected in requirement-ticket traceability.\n` + reasons.join('\n')
  }

  return {
    passed,
    refusalReason,
    unmappedRequirements,
    unmappedTickets,
    reqToTickets,
    ticketToReqs,
  }
}

export function shardBatchToTickets(batchContent, options = {}) {
  if (!fs.existsSync(ticketShardingRulesPath())) {
    throw new Error(`Ticket sharding rules skill missing at ${ticketShardingRulesPath()}`)
  }

  const reqs = extractRequirements(batchContent)
  if (reqs.length === 0) {
    throw new Error('Batch has no functional requirements to shard.')
  }

  let nextNum = options.startTicketNum || 901
  const tickets = []
  const foldedGroups = foldRequirementsForSharding(reqs)
  for (const { reqs: group, rawPoints } of foldedGroups) {
    const t = createShardedTicket(group, rawPoints, {
      ...options,
      nextTicketNum: nextNum++,
    })
    t.markdown = formatTicketMarkdown(t)
    t.body = t.markdown
    tickets.push(t)
  }

  const check = twoWayCrossCheck({
    batchRequirements: reqs,
    tickets,
  })

  if (!check.passed) {
    throw new Error(check.refusalReason)
  }

  return { tickets, check }
}

function main() {
  const args = process.argv.slice(2)
  const batchIdx = args.indexOf('--batch')
  if (batchIdx === -1 || !args[batchIdx + 1]) {
    console.error('Usage: node shard-tickets.mjs --batch <path> [--project <slug>]')
    process.exit(1)
  }
  const batchPath = path.resolve(args[batchIdx + 1])
  const batchContent = fs.readFileSync(batchPath, 'utf8')
  const { tickets, check } = shardBatchToTickets(batchContent)
  console.log(`Sharded ${tickets.length} tickets (ticket-add step 4 floor >= ${MIN_TICKET_POINTS}). Two-way cross-check: PASSED.`)
}

if (process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main()
}
