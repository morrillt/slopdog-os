#!/usr/bin/env node
// agent-model-guard — PreToolUse on the Agent tool (Todd, 2026-10-13: every subagent launch picks
// its tier from the small card first). An Agent call that names no `model` inherits the launching
// desk's own model, which is how 212 of 218 September launches ran on the wrong rung (the Research
// desk's "The Subagent Ladder"). So a call with no model is refused (exit 2, one stderr line naming
// the skill); a fork (subagent_type "fork") inherits on purpose and passes, and so does any call
// that names a model. Anything unreadable passes: only exit 2 blocks.
// Audit trail (Todd, 2026-10-13: "just so we can occasionally audit"; temporary, "maybe we take this
// out later"): every call it lets through appends one JSON line {at, cwd, model, effort,
// subagent_type, description} to v2/reports/usage/subagent-launches.jsonl, the description starting
// with the tier the delegator picked ("hard: review T-742 diff"). Logging never blocks a launch.
// SLOPDOG_SUBAGENT_LOG overrides the path for a test. Self-contained: reads the hook JSON on stdin.
import { readFileSync, appendFileSync, mkdirSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'

let j = {}
try { j = JSON.parse(readFileSync(0, 'utf8') || '{}') } catch { process.exit(0) }

if (j.tool_name !== 'Agent') process.exit(0)   // the settings matcher scopes it; unreadable or empty input passes

const input = j.tool_input && typeof j.tool_input === 'object' ? j.tool_input : {}
function log() {
  try {
    const file = process.env.SLOPDOG_SUBAGENT_LOG || join(homedir(), 'slopdog/v2/reports/usage/subagent-launches.jsonl')
    mkdirSync(dirname(file), { recursive: true })
    const str = (v) => (typeof v === 'string' && v.trim() !== '' ? v : null)
    appendFileSync(file, JSON.stringify({ at: new Date().toISOString(), cwd: str(j.cwd), model: str(input.model), effort: str(input.effort), subagent_type: str(input.subagent_type), description: str(input.description) }) + '\n')
  } catch {}
}

if (String(input.subagent_type || '').trim().toLowerCase() === 'fork') { log(); process.exit(0) }
if (typeof input.model === 'string' && input.model.trim() !== '') { log(); process.exit(0) }

process.stderr.write('Refused: an Agent call must name its model. Run /slopdog:spawn-subagent (read ~/slopdog/v2/config/subagent-tiers.md, pick the tier, then `node ~/slopdog/v2/scripts/lib/build-ladder.mjs --subagent <tier>`) and pass that model and effort.\n')
process.exit(2)
