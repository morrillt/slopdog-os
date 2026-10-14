// limits — the one switch that pauses every usage and context limit (Todd, 2026-10-13: "I want to
// turn all that off right now. Just pause that."). While ~/slopdog/v2/LIMITS-OFF exists the gates
// stand down: sprint-stop and context-rot pass every prompt, dispatch skips the SPRINT-STOP and
// team-budget refusals (the maxConcurrentBuilders memory cap stays), and the Watcher writes no
// SPRINT-STOP. scripts/limits-toggle.mjs flips it; the polybar module slopdog-limits shows it.
// SLOPDOG_LIMITS_OFF_FILE overrides the path for tests.
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const limitsOffPath = () => process.env.SLOPDOG_LIMITS_OFF_FILE || join(homedir(), 'slopdog/v2/LIMITS-OFF')
export const limitsPaused = () => existsSync(limitsOffPath())
