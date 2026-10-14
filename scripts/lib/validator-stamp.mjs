// Shared readiness stamp check for ready-queue and check-ticket (T-676).
import { execFileSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const UNCONFIRMED_STAMP_REASON = 'unconfirmed readiness stamp'
const VALIDATOR_AUTHOR = 'tickets-validate'
// `<lane> T-nnn: validate <verdict>` since the commit-msg hook (rules/commits.md); the old
// `validate T-nnn: <verdict>` still reads, so stamps made before it stay valid.
const SUBJECT_RE = /^(?:validate (T-\S+):|[a-z0-9][a-z0-9_-]* (T-\d+(?:-\d+)?): validate\b)/

export const DEFAULT_RUNS_PATH = join(
  homedir(),
  '.local/state/slopdog-validate/runs.jsonl',
)

function git(repo, ...args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

export function extractReadinessBy(text) {
  const m = text.match(/^readiness:\s*\n(?:[ \t]+by:\s*(\S+)|[ \t]+\S[^\n]*\n(?:[ \t].*\n)*?[ \t]+by:\s*(\S+))/m)
  if (!m) {
    const inline = text.match(/^readiness:\s*\n[ \t]+by:\s*(\S+)/m)
    return inline?.[1] || null
  }
  return m[1] || m[2] || null
}

export function extractReadinessBlock(text) {
  const fm = text.match(/^---\r?\n([\s\S]*?)\r?\n---/)
  if (!fm) return ''
  const lines = fm[1].split('\n')
  let start = -1
  for (let i = 0; i < lines.length; i++) {
    if (/^readiness:/.test(lines[i])) {
      start = i
      break
    }
  }
  if (start === -1) return ''
  const out = [lines[start]]
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z0-9_]+:/.test(lines[i])) break
    out.push(lines[i])
  }
  return out.join('\n')
}

function readinessLineRange(text) {
  const lines = text.split(/\r?\n/)
  if (lines[0] !== '---') return null
  let fmEnd = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i] === '---') {
      fmEnd = i
      break
    }
  }
  if (fmEnd === -1) return null
  let startIdx = -1
  let endIdx = fmEnd - 1
  for (let i = 1; i < fmEnd; i++) {
    if (/^readiness:/.test(lines[i])) {
      startIdx = i
      break
    }
  }
  if (startIdx === -1) return null
  for (let i = startIdx + 1; i < fmEnd; i++) {
    if (/^[A-Za-z0-9_]+:/.test(lines[i])) {
      endIdx = i - 1
      break
    }
  }
  return { start: startIdx + 1, end: endIdx + 1 }
}

function lastCommitOnReadiness(repoRoot, relPath, fileText) {
  const range = readinessLineRange(fileText)
  if (!range || range.start > range.end) return null
  let out
  try {
    out = git(
      repoRoot,
      'blame',
      '-L',
      `${range.start},${range.end}`,
      '--porcelain',
      '--',
      relPath,
    )
  } catch {
    // Never committed (or not blameable): nothing can confirm the stamp.
    return null
  }
  const commits = new Map()
  const lines = out.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const head = lines[i]
    if (!/^[0-9a-f]{40} /.test(head)) continue
    const hash = head.slice(0, 40)
    if (commits.has(hash)) continue
    let author = ''
    let time = 0
    for (let j = i + 1; j < lines.length && !/^[0-9a-f]{40} /.test(lines[j]); j++) {
      if (lines[j].startsWith('author ')) author = lines[j].slice(7)
      if (lines[j].startsWith('committer-time ')) time = Number(lines[j].slice(15))
    }
    commits.set(hash, { hash, author, time })
  }
  if (!commits.size) return null
  let best = null
  for (const c of commits.values()) {
    if (!best) {
      best = c
      continue
    }
    if (c.time > best.time) best = c
    else if (
      c.time === best.time
      && c.author === VALIDATOR_AUTHOR
      && best.author !== VALIDATOR_AUTHOR
    ) {
      best = c
    }
  }
  return best
}

function fileAtCommit(repoRoot, relPath, commit) {
  try {
    return git(repoRoot, 'show', `${commit}:${relPath}`)
  } catch {
    return null
  }
}

function hasRunRecord(runsPath, commit, ticketId) {
  if (!existsSync(runsPath)) return false
  const lines = readFileSync(runsPath, 'utf8').split('\n').filter(Boolean)
  for (const line of lines) {
    try {
      const row = JSON.parse(line)
      if (row.commit === commit && row.ticket === ticketId) return true
    } catch {
      continue
    }
  }
  return false
}

export function appendRunRecord(runsPath, { ticket, commit, verdict }) {
  mkdirSync(join(runsPath, '..'), { recursive: true })
  appendFileSync(
    runsPath,
    `${JSON.stringify({ ticket, commit, verdict, at: new Date().toISOString() })}\n`,
  )
}

/**
 * @returns {{ ok: true } | { ok: false, reason: string }}
 */
export function confirmReadinessStamp({
  repoRoot,
  relPath,
  fileText,
  runsPath = DEFAULT_RUNS_PATH,
}) {
  const by = extractReadinessBy(fileText)
  if (by !== VALIDATOR_AUTHOR) {
    return { ok: true }
  }

  const commitInfo = lastCommitOnReadiness(repoRoot, relPath, fileText)
  if (!commitInfo || /^0+$/.test(commitInfo.hash)) {
    return { ok: false, reason: UNCONFIRMED_STAMP_REASON }
  }

  const atCommit = fileAtCommit(repoRoot, relPath, commitInfo.hash)
  if (!atCommit) {
    return { ok: false, reason: UNCONFIRMED_STAMP_REASON }
  }

  const liveBlock = extractReadinessBlock(fileText)
  const commitBlock = extractReadinessBlock(atCommit)
  if (liveBlock !== commitBlock) {
    return { ok: false, reason: UNCONFIRMED_STAMP_REASON }
  }

  let subject = ''
  try {
    subject = git(repoRoot, 'log', '-1', '--format=%s', commitInfo.hash)
  } catch {
    return { ok: false, reason: UNCONFIRMED_STAMP_REASON }
  }

  const subjectMatch = SUBJECT_RE.exec(subject)
  if (commitInfo.author !== VALIDATOR_AUTHOR || !subjectMatch) {
    return { ok: false, reason: UNCONFIRMED_STAMP_REASON }
  }

  const ticketId = subjectMatch[1] || subjectMatch[2]
  if (!hasRunRecord(runsPath, commitInfo.hash, ticketId)) {
    return { ok: false, reason: UNCONFIRMED_STAMP_REASON }
  }

  const idInFile = (fileText.match(/^id:\s*(\S+)/m) || [])[1]
  if (idInFile && idInFile !== ticketId) {
    return { ok: false, reason: UNCONFIRMED_STAMP_REASON }
  }

  return { ok: true }
}
