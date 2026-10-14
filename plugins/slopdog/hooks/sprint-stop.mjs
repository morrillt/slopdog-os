#!/usr/bin/env node
// sprint-stop — the Watcher's stop as a real gate (UserPromptSubmit, T-729; Todd, 2026-10-10:
// "I don't want to wake up to being over 20% tomorrow"). While ~/slopdog/v2/desks/watcher/SPRINT-STOP
// exists, every prompt is refused (exit 2, stderr is the one-line reason); with the file absent it
// exits 0 silently. dispatch.mjs refuses every job on the same file. Let through:
//   - a typed prompt that starts "lift stop": deletes the file (the pattern is context-rot's
//     "run on"; a Slack or inbox message arrives wrapped and never starts this way);
//   - /clear, /slopdog:clear-to-close, /slopdog:pickup, or a prompt naming self-clear.mjs, so a
//     desk can still save its state;
//   - every prompt from the watcher and slack lanes, so the Watcher keeps measuring and Varys can
//     tell Todd.
// A hook gates only the next prompt: a turn already running finishes. Nothing deletes the file when
// the weekly window resets; the stop holds until someone lifts it. Self-contained on purpose
// (the test copies this file alone into a scratch folder); the lane lookup loads on demand.
import { readFileSync, unlinkSync, realpathSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

// The limits switch (scripts/lib/limits.mjs, inlined so this file still runs alone): paused, pass everything.
if (existsSync(process.env.SLOPDOG_LIMITS_OFF_FILE || join(homedir(), 'slopdog/v2/LIMITS-OFF'))) process.exit(0)
const STOP = process.env.SLOPDOG_SPRINT_STOP_FILE || join(homedir(), 'slopdog/v2/desks/watcher/SPRINT-STOP')
let input = ''
try { input = readFileSync(0, 'utf8') } catch {}
let j = {}; try { j = JSON.parse(input) } catch {}

try { readFileSync(STOP) } catch { process.exit(0) }   // no stop file: silent

const prompt = String(j.prompt || '').trim()
if (/^lift stop\b/i.test(prompt)) {
  try { unlinkSync(STOP) } catch {}
  console.log(`SPRINT-STOP lifted: ${STOP} deleted on Todd's typed "lift stop". Dispatch and prompts run again.`)
  process.exit(0)
}
if (/^\/(slopdog:clear-to-close|slopdog:pickup|clear)\b/.test(prompt) || prompt.includes('self-clear.mjs')) process.exit(0)

const EXEMPT = ['watcher', 'slack']
let lane = null
try {
  const { laneFor } = await import('./context-refusal-notify.mjs')
  lane = j.cwd ? laneFor(j.cwd) : null
} catch {}
if (!lane && j.cwd) {   // the registry could not be read: fall back on the folder names
  let real = j.cwd; try { real = realpathSync(j.cwd) } catch {}
  lane = EXEMPT.find((l) => new RegExp(`/desks/${l}(/|$)`).test(real)) || null
}
if (EXEMPT.includes(lane)) process.exit(0)

process.stderr.write(`SPRINT-STOP: the Watcher stopped the sprint at the weekly usage cap (${STOP} exists), so this prompt is refused; Todd lifts it by typing "lift stop" in a pane. To save state meanwhile, run /slopdog:clear-to-close then node ~/slopdog/v2/scripts/self-clear.mjs (both still pass).\n`)
process.exit(2)
