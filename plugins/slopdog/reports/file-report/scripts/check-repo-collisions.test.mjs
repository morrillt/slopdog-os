// check-repo-collisions.test.mjs: a repo two projects claim is listed with both slugs and exits 1;
// one claim per repo exits 0 (T-718 AC-2). Runs the real script over a temp projects/ dir.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { mkdtempSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = join(fileURLToPath(new URL('.', import.meta.url)), 'check-repo-collisions.mjs')

function projectsDir (claims) {
  const dir = mkdtempSync(join(tmpdir(), 'repo-collisions-'))
  for (const [slug, repo] of Object.entries(claims)) {
    writeFileSync(join(dir, `${slug}.md`), `---\nproject: ${slug}\n${repo ? `repo: ${repo}\n` : ''}---\n\n# ${slug}\n`)
  }
  return dir
}
const run = (dir) => spawnSync(process.execPath, [script, dir], { encoding: 'utf8' })

test('a repo claimed by two projects is listed with both slugs and exits 1', () => {
  const r = run(projectsDir({ alpha: '/x/comms', beta: '/x/comms/', gamma: '/x/other', delta: '' }))
  assert.equal(r.status, 1)
  assert.match(r.stdout, /\/x\/comms claimed by alpha, beta/)
  assert.doesNotMatch(r.stdout, /\/x\/other claimed/)
})

test('every repo claimed once exits 0 and says so', () => {
  const r = run(projectsDir({ alpha: '/x/comms', beta: '/x/other', gamma: '' }))
  assert.equal(r.status, 0, r.stdout)
  assert.match(r.stdout, /no repo collisions: 2 of 3 projects/)
})

test('a repo line with a trailing note still counts as a claim', () => {
  const dir = mkdtempSync(join(tmpdir(), 'repo-collisions-'))
  writeFileSync(join(dir, 'alpha.md'), '---\nproject: alpha\nrepo: ~/x/dash (morrillt/dash)\n---\n')
  writeFileSync(join(dir, 'beta.md'), '---\nproject: beta\nrepo: ~/x/dash\n---\n')
  const r = run(dir)
  assert.equal(r.status, 1)
  assert.match(r.stdout, /x\/dash claimed by alpha, beta/)
})
