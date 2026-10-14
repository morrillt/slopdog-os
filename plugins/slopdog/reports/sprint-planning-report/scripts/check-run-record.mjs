#!/usr/bin/env node
// Checks that a sprint planning run record carries the required title line, reading-copy
// line and section headings, in order. Usage: check-run-record.mjs <file> [<file>...]
import { readFileSync } from 'node:fs'

const REQUIRED = [
  /^# Sprint planning run (<N>|\d+) — (<Department>|\S.*) — (<YYYY-MM-DD>|\d{4}-\d{2}-\d{2})$/,
  /^Notion reading copy: \S/,
  '## Executive summary and subject chosen',
  '## Per-step execution record',
  '## What this run produced',
  '## Assumptions taken, default-forward',
  '## Questions for the next iteration',
  '## Project and batch dependencies',
]

const files = process.argv.slice(2)
if (files.length === 0) {
  console.error('usage: check-run-record.mjs <file> [<file>...]')
  process.exit(2)
}
let bad = false
for (const file of files) {
  const lines = readFileSync(file, 'utf8').replace(/^---\n[\s\S]*?\n---\n/, '').split('\n')
  let at = 0
  for (const want of REQUIRED) {
    const i = lines.findIndex((l, n) => n >= at && (typeof want === 'string' ? l === want : want.test(l)))
    if (i === -1) {
      console.error(`${file}: missing or out of order: ${want}`)
      bad = true
      break
    }
    at = i + 1
  }
}
if (bad) process.exit(1)
console.log('run record ok')
