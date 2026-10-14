#!/usr/bin/env node
// arm.mjs — arm the two unstucker passes as systemd user timers, or disarm them.
//
// The question sweep is a tracked unit pair (v2/scripts/systemd/unstucker-questions.{service,timer},
// symlinked into ~/.config/systemd/user/) so it survives a reboot; when that is installed this
// restarts it rather than creating a transient unit of the same name. The window-reset pass stays
// a transient unit (`systemd-run --user`), because the window length is an argument: a
// transient timer takes it on the command line, where a tracked unit would have to be rewritten
// every night. Both show up in `systemctl --user list-timers` and are stopped the same way.
//
// Usage:
//   node arm.mjs                 arm both passes, window length 4.6 hours
//   node arm.mjs 3.5             arm both, window-reset pass 3.5 hours out
//   node arm.mjs --status        say what is armed and when each fires
//   node arm.mjs --disarm        stop both timers

import { execFileSync, spawnSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { existsSync, mkdirSync } from 'node:fs'

const args = process.argv.slice(2)
const HOME = homedir()
const SCRIPT = join(HOME, 'slopdog/v2/scripts/unstucker.mjs')
const LOG = join(HOME, '.local/state/unstucker.log')
const UNITS = ['unstucker-questions.timer', 'unstucker-reset.timer']

const sh = (cmd, a) => spawnSync(cmd, a, { encoding: 'utf8' })

const status = () => {
  const r = sh('systemctl', ['--user', 'list-timers', 'unstucker-*', '--all', '--no-pager'])
  process.stdout.write(r.stdout || r.stderr)
}

if (args.includes('--status')) { status(); process.exit(0) }

if (args.includes('--disarm')) {
  const r = sh('systemctl', ['--user', 'stop', ...UNITS])
  if (r.status !== 0) process.stderr.write(r.stderr)
  console.log(`disarmed: ${UNITS.join(', ')}`)
  status()
  process.exit(0)
}

const hours = Number(args.find((a) => /^[\d.]+$/.test(a)) ?? 4.6)
if (!Number.isFinite(hours) || hours <= 0) {
  console.error(`window length must be a positive number of hours, got ${JSON.stringify(args[0])}`)
  process.exit(1)
}
const seconds = Math.round(hours * 3600)

const node = process.execPath
mkdirSync(join(HOME, '.local/state'), { recursive: true })

// Stop any pass left armed from an earlier night, so arming twice does not stack two sweeps.
sh('systemctl', ['--user', 'stop', ...UNITS])

const run = (unit, description, timerArgs, mode) => {
  const r = sh('systemd-run', [
    '--user', `--unit=${unit}`, `--description=${description}`,
    ...timerArgs,
    '/bin/sh', '-c', `${node} ${SCRIPT} --mode ${mode} >> ${LOG} 2>&1`,
  ])
  if (r.status !== 0) { console.error(`failed to arm ${unit}: ${r.stderr.trim()}`); process.exit(1) }
}

const TRACKED = join(HOME, '.config/systemd/user/unstucker-questions.timer')
if (existsSync(TRACKED)) {
  const r = sh('systemctl', ['--user', 'enable', '--now', 'unstucker-questions.timer'])
  if (r.status !== 0) { console.error(`failed to start unstucker-questions.timer: ${r.stderr.trim()}`); process.exit(1) }
} else run('unstucker-questions',
  'Unstucker question sweep — every 30 minutes, tell a desk waiting on Todd to move the question to the board',
  ['--on-active=30s', '--on-unit-active=30min', '--timer-property=AccuracySec=10s'],
  'questions')

run('unstucker-reset',
  `Unstucker window-reset pass — one shot ${hours}h out, nudge every stuck desk`,
  [`--on-active=${seconds}`, '--timer-property=AccuracySec=30s'],
  'reset')

const fires = new Date(Date.now() + seconds * 1000)
console.log(`armed the question sweep (every 30 minutes, first run in 30 seconds)`)
console.log(`armed the window-reset pass, one shot, ${hours}h out — about ${fires.toLocaleTimeString()} local`)
console.log(`log: ${LOG}`)
console.log(`disarm both: systemctl --user stop ${UNITS.join(' ')}`)
status()
