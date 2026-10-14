#!/usr/bin/env node
// team-budget — each department's share of the weekly usage limit (T-678). The logic is in
// lib/team-budget.mjs; this is its command line.
//
//   team-budget.mjs names                         the shares file's entries and their sum
//   team-budget.mjs check <department>            ok (0) | warn (0) | refused (3); unknown (2)
//   team-budget.mjs dispatch-check --ticket-path <file>
//                                                 dispatch's refusal for that ticket: exit 2 and
//                                                 the two refusal lines, or silent exit 0
//   team-budget.mjs sweep [--dry-run]             the Watcher's sweep: one warning per department
//                                                 per window into the build lane's inbox
//
// Overrides, so a fixture can drive any command: --shares --ledger --usage --tickets-dir
// --batches-dir --state --sprints-dir; TEAM_BUDGET_FIXTURE_DIR points all of them at a fixture
// folder at once. --now is accepted for symmetry with sprint-record.mjs; the window comes from
// the usage file's seven_day.resets_at.

import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import {
  budgetSnapshot, checkDepartment, dispatchBudgetRefusal, loadShares, refusalLines, resolvePaths, sweep,
} from './lib/team-budget.mjs'

const argv = process.argv.slice(2)
const opt = (f) => { const i = argv.indexOf(f); return i > -1 ? argv[i + 1] : null }
const die = (m, code = 2) => { console.error(`team-budget: ${m}`); process.exit(code) }

const paths = resolvePaths({
  shares: opt('--shares'), ledger: opt('--ledger'), usage: opt('--usage'),
  ticketsDir: opt('--tickets-dir'), batchesDir: opt('--batches-dir'), state: opt('--state'),
  sprintsDir: opt('--sprints-dir'),
})
const cmd = argv[0]

if (cmd === 'names') {
  let doc
  try { doc = loadShares(paths.shares) } catch (e) { die(e.message) }
  const keys = Object.keys(doc.shares)
  console.log(`${keys.length} entries, sum ${doc.sum}: ${keys.join(', ')}`)
  process.exit(0)
}

if (cmd === 'check') {
  const dept = argv[1]
  if (!dept || dept.startsWith('--')) die('need a department: check <department>')
  let snap
  try { snap = budgetSnapshot(paths) } catch (e) { die(e.message) }
  let r
  try { r = checkDepartment(dept, snap.sharesDoc, snap.spendInfo, snap.draws) } catch (e) { die(e.message) }
  if (r.status === 'refused') {
    const [log, msg] = refusalLines(r)
    console.log(msg)
    console.error(log)
    process.exit(3)
  }
  console.log(dept === 'todd' ? 'ok: todd is never refused' : `${r.status}: ${dept} has spent ${r.spend}% of the week against a ${r.share}% share`)
  process.exit(0)
}

if (cmd === 'dispatch-check') {
  const p = opt('--ticket-path') || die('need --ticket-path <file>')
  const r = dispatchBudgetRefusal({ ticketText: readFileSync(resolve(p), 'utf8'), paths })
  if (r) { for (const l of r.lines) console.error(l); process.exit(2) }
  process.exit(0)
}

if (cmd === 'sweep') {
  const dryRun = argv.includes('--dry-run')
  const inboxWrite = join(import.meta.dirname, 'inbox-write.mjs')
  const send = (slug, text) => execFileSync(process.execPath, [inboxWrite, '--to', 'build', '--from', 'watcher', '--slug', slug, '--text', text], { encoding: 'utf8' })
  let out
  try { out = sweep({ paths, send, dryRun }) } catch (e) { die(e.message) }
  for (const l of out.lines) console.log(l)
  console.log(out.summary)
  process.exit(0)
}

die('usage: team-budget.mjs names | check <department> | dispatch-check --ticket-path <file> | sweep [--dry-run]')
