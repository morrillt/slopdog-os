// git-inbox-fallback.mjs — durable delivery when herdr cannot reach a remote desk pane (T-647 AC-4).
import { mkdirSync, writeFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'

export function inboxFileName(fromLane, slug) {
  const stamp = new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')
  const safe = slug.replace(/[^a-z0-9-]/gi, '-').toLowerCase()
  return `${stamp}-from-${fromLane}-${safe}.md`
}

export function writeInboxFile({ v2Root, toFolder, fromLane, slug, text }) {
  const name = inboxFileName(fromLane, slug)
  const inbox = join(v2Root, toFolder, 'inbox')
  if (!existsSync(inbox)) mkdirSync(inbox, { recursive: true })
  const path = join(inbox, name)
  if (existsSync(path)) throw new Error(`inbox file already exists: ${path}`)
  writeFileSync(path, `# From ${fromLane}\n\n${text}\n`)
  return path
}

/**
 * Write the inbox file and push so a remote desk can pull it. Returns { path, pushed, ms }.
 * `run` is injectable for tests (default: spawnSync).
 */
export function gitInboxFallback(
  { v2Root, toFolder, fromLane, slug, text, remote = 'origin', branch, laneKey = 'cloud', ticketId = 'T-647' },
  run = spawnSync,
) {
  const started = Date.now()
  const path = writeInboxFile({ v2Root, toFolder, fromLane, slug, text })
  const rel = path.startsWith(v2Root) ? path.slice(v2Root.length + 1) : path
  const add = run('git', ['add', '--', rel], { cwd: v2Root, encoding: 'utf8' })
  if (add.status !== 0) throw new Error(`git add failed: ${add.stderr || add.stdout}`)
  const subject = `${laneKey} ${ticketId}: git inbox fallback (${slug})`
  const commit = run('git', ['commit', '-m', subject, '-m', 'Auto: inbox-delivery-watch', '--', rel], { cwd: v2Root, encoding: 'utf8' })
  if (commit.status !== 0) throw new Error(`git commit failed: ${commit.stderr || commit.stdout}`)
  const pushArgs = branch ? ['push', remote, branch] : ['push', remote]
  const push = run('git', pushArgs, { cwd: v2Root, encoding: 'utf8' })
  if (push.status !== 0) throw new Error(`git push failed: ${push.stderr || push.stdout}`)
  return { path, rel, pushed: true, ms: Date.now() - started }
}
