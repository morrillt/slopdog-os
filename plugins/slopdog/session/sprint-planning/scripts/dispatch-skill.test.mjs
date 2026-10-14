import test from 'node:test'
import assert from 'node:assert/strict'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { dispatchScriptPath } from './dispatch-skill.mjs'

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const WORKTREE = path.resolve(SCRIPT_DIR, '../../../../../../')

test('dispatchScriptPath resolves this worktree dispatch.mjs', () => {
  assert.equal(dispatchScriptPath(), path.join(WORKTREE, 'v2/scripts/dispatch.mjs'))
})
