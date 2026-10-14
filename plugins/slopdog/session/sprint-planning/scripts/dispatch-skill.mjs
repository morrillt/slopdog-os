#!/usr/bin/env node
// House path for handing sprint-planning work to a skill via dispatch.mjs (agy).
import { execFileSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const HOME = process.env.HOME || '~'
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const SLOPDOG_DIR = path.resolve(SCRIPT_DIR, '../../../../..')

export function dispatchScriptPath() {
  const candidates = [
    path.resolve(SCRIPT_DIR, '../../../../../scripts/dispatch.mjs'),
    path.join(HOME, 'slopdog/v2/scripts/dispatch.mjs'),
  ]
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]
}

/**
 * Run dispatch.mjs with agy. Returns combined stdout (model reply text).
 */
export function runDispatchAgy(prompt, options = {}) {
  const dispatch = options.dispatchPath || dispatchScriptPath()
  const args = [
    dispatch,
    prompt,
    '--engine',
    'agy',
    '--headless',
    '--sender',
    options.sender || 'ideas',
    '--timeout',
    String(options.timeoutSec || 600),
  ]
  if (options.worktree) {
    args.push('--worktree', path.resolve(options.worktree))
  }
  if (options.writeDir) {
    args.push('--write', '--dir', path.resolve(options.writeDir))
  }
  const out = execFileSync('node', args, {
    encoding: 'utf8',
    env: { ...process.env, ...options.env },
    cwd: options.cwd || SLOPDOG_DIR,
    maxBuffer: 10 * 1024 * 1024,
  })
  return out
}

export function buildSkillPrompt({ skillPath, brief }) {
  return [
    'Sprint planning skill invocation.',
    `Read and follow the skill at ${skillPath} exactly.`,
    brief,
  ].join('\n\n')
}
