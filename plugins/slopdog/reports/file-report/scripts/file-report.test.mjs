// file-report.test.mjs: one filing resolves one project, and that value is what both the report's
// front matter and its index line carry. Each case runs the real script under a throwaway HOME, so
// the tasks/projects files and the reports index are the test's own, never Todd's.
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const script = join(fileURLToPath(new URL('.', import.meta.url)), 'file-report.mjs')

// projects: slug -> true when that project's `repo:` is the probe repo, so the repo matches it.
function sandbox (projects = {}) {
  const home = mkdtempSync(join(tmpdir(), 'file-report-test-'))
  mkdirSync(join(home, 'slopdog', 'tasks', 'projects'), { recursive: true })
  const repo = realpathSync(mkdtempSync(join(home, 'work-')))
  const probe = join(repo, 'probe-repo')
  mkdirSync(probe)
  spawnSync('git', ['init', '-q', probe])
  for (const [slug, mapped] of Object.entries(projects)) {
    writeFileSync(join(home, 'slopdog', 'tasks', 'projects', `${slug}.md`),
      `---\ntype: projects\nproject: ${slug}\n${mapped ? `repo: ${probe}\n` : ''}---\n\n# ${slug}\n`)
  }
  return { home, repo: probe }
}

function file (home, args, cwd, body = 'A first line long enough to be the summary of the probe report.\n') {
  return spawnSync(process.execPath, [script, ...args], {
    cwd, env: { ...process.env, HOME: home }, input: body, encoding: 'utf8'
  })
}

// The front matter's project and the index line's project for the one report this filing wrote.
function filedProject (home) {
  const idx = readFileSync(join(home, 'slopdog', 'tasks', 'reports', 'index.jsonl'), 'utf8').trim().split('\n')
  const row = JSON.parse(idx[idx.length - 1])
  const fm = readFileSync(row.path, 'utf8').match(/^project:\s*(.*)$/m)[1].replace(/^"|"$/g, '')
  return { front: fm, index: row.project, path: row.path }
}

test('a matched slug is the value in both the front matter and the index', () => {
  const { home, repo } = sandbox({ 'probe-slug': true })
  const r = file(home, ['--kind', 'project', 'Probe report'], repo)
  assert.equal(r.status, 0, r.stderr)
  const { front, index } = filedProject(home)
  assert.equal(front, 'probe-slug')
  assert.equal(index, front)
})

test('with no matching slug, both carry the folder name, not an empty row', () => {
  const { home, repo } = sandbox()
  const r = file(home, ['--kind', 'project', 'Probe report'], repo)
  assert.equal(r.status, 0, r.stderr)
  const { front, index } = filedProject(home)
  assert.equal(front, 'probe-repo')
  assert.equal(index, front)
})

test('kind how never files under the catch-all slopdog, and both say ""', () => {
  const { home, repo } = sandbox()
  const r = file(home, ['--kind', 'how', 'Probe how report'], repo)
  assert.equal(r.status, 0, r.stderr)
  const { front, index } = filedProject(home)
  assert.equal(front, '')
  assert.equal(index, '')
})

test('a project filing with no resolvable name is refused before anything is written', () => {
  const { home } = sandbox()
  const r = file(home, ['--kind', 'project', 'Probe report'], '/')
  assert.equal(r.status, 1)
  assert.match(r.stderr, /no project resolved/)
  assert.equal(existsSync(join(home, 'slopdog', 'tasks', 'reports', 'index.jsonl')), false)
  assert.equal(existsSync('/reports'), false)
})


// T-718 AC-1: two projects claiming the filing repo is ambiguous; the router refuses rather than
// taking whichever project file it read first.
test('two projects claiming the repo refuse without --project, naming both, writing nothing', () => {
  const { home, repo } = sandbox({ 'claim-a': true, 'claim-b': true })
  const r = file(home, ['--kind', 'project', 'Probe report'], repo)
  assert.equal(r.status, 1)
  assert.match(r.stderr, /claim-a, claim-b/)
  assert.match(r.stderr, /--project/)
  assert.equal(existsSync(join(home, 'slopdog', 'tasks', 'reports', 'index.jsonl')), false)
  assert.equal(existsSync(join(repo, 'reports')), false)
})

test('an explicit --project still files from a repo two projects claim', () => {
  const { home, repo } = sandbox({ 'claim-a': true, 'claim-b': true })
  const r = file(home, ['--kind', 'project', '--project', 'claim-b', 'Probe report'], repo)
  assert.equal(r.status, 0, r.stderr)
  const { front, index } = filedProject(home)
  assert.equal(front, 'claim-b')
  assert.equal(index, 'claim-b')
})

// T-650: every report lands in the Research desk's reports folder, wherever it was filed from.
test('a project report is written to the research desk, not the repo it was filed from', () => {
  const { home, repo } = sandbox({ 'probe-slug': true })
  const r = file(home, ['--kind', 'project', 'Probe report'], repo)
  assert.equal(r.status, 0, r.stderr)
  const { path, front } = filedProject(home)
  assert.equal(dirname(path), join(realpathSync(home), 'slopdog', 'v2', 'desks', 'research', 'reports'))
  assert.equal(front, 'probe-slug')
  assert.equal(existsSync(join(repo, 'reports')), false)
  assert.doesNotMatch(r.stdout, /copied to/)
})

// T-650 q1: a partner report is also copied, with its HTML, into the partner's shared folder; the index keeps
// one line, pointing at the research desk's file.
test('a report filed from the partner repo is copied into shared/reports', () => {
  const { home } = sandbox()
  const cab = join(realpathSync(home), 'partner')
  mkdirSync(cab)
  spawnSync('git', ['init', '-q', cab])
  const research = join(realpathSync(home), 'slopdog', 'v2', 'desks', 'research', 'reports')
  mkdirSync(research, { recursive: true })
  writeFileSync(join(research, 'Deal report.html'), '<!doctype html><title>Deal</title>')
  const r = file(home, ['--kind', 'project', 'Deal report'], cab)
  assert.equal(r.status, 0, r.stderr)
  const idx = readFileSync(join(home, 'slopdog', 'tasks', 'reports', 'index.jsonl'), 'utf8').trim().split('\n')
  assert.equal(idx.length, 1)
  const row = JSON.parse(idx[0])
  assert.equal(dirname(row.path), research)
  assert.equal(row.project, 'partner')
  const shared = join(cab, 'shared', 'reports')
  const mdCopy = join(shared, basename(row.path))
  assert.equal(readFileSync(mdCopy, 'utf8'), readFileSync(row.path, 'utf8'))
  assert.equal(readFileSync(join(shared, 'Deal report.html'), 'utf8'), '<!doctype html><title>Deal</title>')
  assert.match(r.stdout, /copied to: .*shared\/reports/)
})
