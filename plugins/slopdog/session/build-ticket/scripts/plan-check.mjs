#!/usr/bin/env node
// plan-check — mechanical gate: every automated AC has a Given/When/Then plan line, no placeholders, size cap (T-699).
//   plan-check.mjs <ticket-path>
// Exit 0 when the plan is complete; exit 1 with one stdout line per problem.
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { isMain } from '../../../../../scripts/lib/is-main.mjs'

const TOKEN_CAP = 1600
const AUTOMATED = new Set(['unit', 'e2e', 'logger', 'live'])
const PLAN_RE = /\[Plan\]\s*(AC-\d+)\s*·\s*Given\b/i
const PLACEHOLDER_RE = /<[^>]+>|\bTBD\b|\bTODO\b|…/

function sectionBody(text, name) {
  const lines = text.split('\n')
  const start = lines.findIndex((l) => l.trim() === `## ${name}`)
  if (start === -1) return ''
  let end = lines.findIndex((l, i) => i > start && /^## /.test(l))
  if (end === -1) end = lines.length
  return lines.slice(start + 1, end).join('\n')
}

function automatedCriteria(acBody) {
  const out = []
  for (const line of acBody.split('\n')) {
    const m = line.match(/^-\s*\[[ xX]\]\s*(AC-\d+)\s*(?:\[([^\]]+)\])?\s*/)
    if (!m) continue
    const type = (m[2] || '').split(',')[0]?.trim() || ''
    if (!AUTOMATED.has(type)) continue
    out.push(m[1])
  }
  return out
}

function planLines(buildLog) {
  const byAc = new Map()
  for (const line of buildLog.split('\n')) {
    const m = line.match(PLAN_RE)
    if (!m) continue
    byAc.set(m[1], line)
  }
  return byAc
}

function planTokenCount(buildLog) {
  const chunks = []
  for (const line of buildLog.split('\n')) {
    if (PLAN_RE.test(line)) chunks.push(line)
  }
  const chars = chunks.join('\n').length
  return chars / 4
}

export function checkPlan(text) {
  const lines = []
  const acBody = sectionBody(text, 'Acceptance Criteria')
  const buildLog = sectionBody(text, 'Build log')
  const need = automatedCriteria(acBody)
  const have = planLines(buildLog)

  for (const id of need) {
    const plan = have.get(id)
    if (!plan) {
      lines.push(`${id}: no plan line in ## Build log`)
      continue
    }
    if (PLACEHOLDER_RE.test(plan)) {
      lines.push(`${id}: placeholder in plan line`)
    }
  }

  if (planTokenCount(buildLog) > TOKEN_CAP) {
    lines.push(`plan exceeds ${TOKEN_CAP} tokens — split the ticket`)
  }

  return { ok: lines.length === 0, lines }
}

export function runCli(ticketPath) {
  const text = readFileSync(resolve(ticketPath), 'utf8')
  const r = checkPlan(text)
  if (!r.ok) {
    for (const line of r.lines) console.log(line)
    return { status: 1, lines: r.lines }
  }
  return { status: 0, lines: [] }
}

if (isMain(import.meta.url)) {
  const path = process.argv[2]
  if (!path) {
    console.error('usage: plan-check.mjs <ticket-path>')
    process.exit(1)
  }
  const r = runCli(path)
  process.exit(r.status)
}
