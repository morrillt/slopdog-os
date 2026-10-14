#!/usr/bin/env node
// limits-toggle — flip the switch in lib/limits.mjs. `on` enforces the limits (deletes LIMITS-OFF),
// `off` pauses them (writes LIMITS-OFF with who and when), `toggle` flips, `status` prints the state,
// `--bar` prints the polybar label. The polybar module slopdog-limits runs `--bar` and, on a click, `toggle`.
import { writeFileSync, unlinkSync } from 'node:fs'
import { userInfo } from 'node:os'
import { limitsOffPath, limitsPaused } from './lib/limits.mjs'

const arg = process.argv[2] || 'status'
const pause = () => writeFileSync(limitsOffPath(), JSON.stringify({ by: userInfo().username, at: new Date().toISOString() }) + '\n')
const enforce = () => { try { unlinkSync(limitsOffPath()) } catch {} }

if (arg === '--bar') { console.log(limitsPaused() ? 'limits off' : 'limits on'); process.exit(0) }
if (arg === 'off') pause()
else if (arg === 'on') enforce()
else if (arg === 'toggle') limitsPaused() ? enforce() : pause()
else if (arg !== 'status') { console.error('usage: limits-toggle.mjs on|off|toggle|status|--bar'); process.exit(64) }
console.log(limitsPaused() ? `limits paused (${limitsOffPath()} exists)` : 'limits enforced')
