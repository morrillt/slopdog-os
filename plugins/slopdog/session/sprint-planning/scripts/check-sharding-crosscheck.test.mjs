import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  shardBatchToTickets,
  twoWayCrossCheck,
  ticketShardingRulesPath,
} from './shard-tickets.mjs'
import fs from 'node:fs'

test('AC-4: ticket sharding enforces minimum size floor (>= 3 points) per ticket-add step 4', () => {
  assert.ok(fs.existsSync(ticketShardingRulesPath()), `ticket-add skill at ${ticketShardingRulesPath()}`)

  const sampleBatch = `# Batch 1-alpha
## Requirements
- **FR-1 (Small Task A):** Quick check.
  - *Verify:* Automated verify.
- **FR-2 (Small Task B):** Another small check.
  - *Verify:* Automated verify.
- **FR-3 (Substantial Feature):** Core implementation.
  - *Verify:* Integration verify.
`

  const { tickets, check } = shardBatchToTickets(sampleBatch, { startTicketNum: 910 })

  assert.equal(tickets.length, 2, 'two small requirements fold into one ticket beside the substantial FR')
  for (const t of tickets) {
    assert.ok(t.estimate.points >= 3, `Ticket ${t.id} has estimate ${t.estimate.points} >= 3`)
    assert.ok(t.markdown.includes('points:'))
    assert.ok(t.markdown.includes('## Steps'))
  }
  assert.equal(check.passed, true)
})

test('AC-7: two-way cross-check refuses unmapped requirements and unmapped tickets, and passes complete fixtures', () => {
  const reqs = [
    { id: 'FR-1', title: 'Req 1' },
    { id: 'FR-2', title: 'Req 2' },
  ]

  const ticketsMissingReq2 = [
    { id: 'T-101', title: 'Ticket for Req 1', body: 'Implements FR-1 cleanly.' },
  ]
  const fail1 = twoWayCrossCheck({ batchRequirements: reqs, tickets: ticketsMissingReq2 })
  assert.equal(fail1.passed, false)
  assert.equal(fail1.unmappedRequirements.length, 1)
  assert.equal(fail1.unmappedRequirements[0].id, 'FR-2')

  const ticketsOrphan = [
    { id: 'T-102', title: 'Orphan ticket', body: 'No requirement id cited here.' },
  ]
  const fail2 = twoWayCrossCheck({ batchRequirements: reqs, tickets: ticketsOrphan })
  assert.equal(fail2.passed, false)
  assert.equal(fail2.unmappedTickets.length, 1)
  assert.equal(fail2.unmappedTickets[0].id, 'T-102')

  const ticketsComplete = [
    { id: 'T-103', title: 'Ticket 1', body: 'Covers FR-1.' },
    { id: 'T-104', title: 'Ticket 2', body: 'Covers FR-2.' },
  ]
  const pass = twoWayCrossCheck({ batchRequirements: reqs, tickets: ticketsComplete })
  assert.equal(pass.passed, true)
})

test('AC-2 (FR-2): two small fixture requirements shard into one ticket of at least three points', () => {
  const twoSmallBatch = `# Batch 1-alpha
## Requirements
- **FR-1 (Small Task A):** Quick check.
  - *Verify:* Automated verify.
- **FR-2 (Small Task B):** Another small check.
  - *Verify:* Automated verify.
`

  const beforeCount = 2
  const { tickets, check } = shardBatchToTickets(twoSmallBatch, { startTicketNum: 920 })
  const afterCount = tickets.length

  console.log(`sharding fold: before ${beforeCount}, after ${afterCount}`)
  assert.equal(beforeCount, 2)
  assert.equal(afterCount, 1)
  assert.equal(tickets[0].estimate.points, 3)
  assert.equal(tickets[0].mappedRequirements.length, 2)
  assert.equal(check.passed, true)
})
