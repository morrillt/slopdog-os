import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = join(fileURLToPath(new URL('.', import.meta.url)), 'check-three-section.mjs')
const gold = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../../../../../desks/research/reports/Idea to Dispatch Pipeline.html',
)

function run(file) {
  return spawnSync(process.execPath, [script, file], { encoding: 'utf8' })
}

test('Idea to Dispatch Pipeline passes the three-section check', () => {
  const r = run(gold)
  assert.equal(r.status, 0, r.stderr || r.stdout)
  assert.match(r.stdout, /three-section report ok/)
})

test('report missing §3 fails', () => {
  const dir = mkdtempSync(join(tmpdir(), 'check-three-section-'))
  const bad = join(dir, 'bad.html')
  let text = readFileSync(gold, 'utf8')
  text = text.replace(/<section id="s3">[\s\S]*?<\/section>\s*/i, '')
  writeFileSync(bad, text)
  const r = run(bad)
  rmSync(dir, { recursive: true, force: true })
  assert.equal(r.status, 1)
  assert.match(r.stderr, /missing main section id="s3"/)
})
