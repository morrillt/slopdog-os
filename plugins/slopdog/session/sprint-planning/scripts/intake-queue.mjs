#!/usr/bin/env node
/**
 * @inputs A department name, and optionally the intake folder and today's date.
 * @outputs A printed list of the intake ideas this sprint picks up and the ones it skips, with counts.
 * @starts Sprint planning step 1 opens for that department.
 * @ends Every waiting idea is listed as picked or skipped, with ideas whose not_before date is ahead held back.
 */
// Sprint planning step 1: list intake queue picks and skips with counts (T-624),
// holding back ideas whose not_before date is still ahead (T-640).
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { scanIntakeQueue, formatQueueReport, localToday, isIsoDate } from '../../lib/idea-queue.mjs'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const DEFAULT_INTAKE = path.resolve(HERE, '../../../../..', 'desks/ideas/intake')

const argv = process.argv.slice(2)
const deptIdx = argv.indexOf('--department')
if (deptIdx === -1 || !argv[deptIdx + 1]) {
  console.log('Usage: node intake-queue.mjs --department <slopdog|projects|it> [--intake-dir <path>] [--today YYYY-MM-DD]')
  process.exit(1)
}

const department = argv[deptIdx + 1]
const intakeFlag = argv.indexOf('--intake-dir')
const intakeDir =
  intakeFlag !== -1 && argv[intakeFlag + 1]
    ? path.resolve(argv[intakeFlag + 1])
    : process.env.IDEAS_INTAKE_DIR || DEFAULT_INTAKE

// T-640: ideas whose not_before is after today are skipped and counted; --today pins the date.
const todayIdx = argv.indexOf('--today')
const today = todayIdx !== -1 && argv[todayIdx + 1] ? argv[todayIdx + 1] : localToday()
if (!isIsoDate(today)) {
  console.error(`intake-queue: --today must be YYYY-MM-DD, got "${today}"`)
  process.exit(2)
}

const result = scanIntakeQueue(intakeDir, department, { today })
console.log(formatQueueReport(result))
