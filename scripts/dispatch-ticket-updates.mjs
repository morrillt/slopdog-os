// T-359 / T-596: ticket file + task-list.md updates for dispatch --ticket jobs.
import { mkdirSync, writeFileSync, readFileSync, readdirSync, existsSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { verifierFor, rungLabel, ticketPoints, countStrikes } from './lib/build-ladder.mjs'

const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/
const STATUS_LINE = /^(T-[\w.-]+ · )(\S+)(?: [^\n]*)?$/m
export const STATUS_EMOJI = { doing: '🟡', verifying: '🔍', blocked: '🔴', questions: '🟠', verified: '🟩' }
const today = () => new Date().toISOString().slice(0, 10)
const noteStamp = () => new Date().toISOString().slice(0, 16).replace('T', ' ')
/** The verifier stamp, from the ladder by the ticket's points (T-714, T-741). */
const ladderVerifier = (ticketText) => rungLabel(verifierFor(ticketPoints(ticketText)))

/** Lane key stored on worker: and used in done-file names. dispatch.mjs routes every
 * sidekick engine to a registry key (T-684); with none (kimi), the engine name stands in. */
export function workerLaneForDispatch(engine, sidekickLaneKey) {
  return sidekickLaneKey || engine
}

export function laneSignerName(laneKey, lanesData = {}) {
  const name = lanesData[laneKey]?.name
  return name || laneKey
}

export function statusEmojiFromTicketText(text) {
  const m = text.match(STATUS_LINE)
  return m ? m[2] : null
}

export function taskListRowEmoji(tasksDir, ticketPath) {
  const listPath = join(tasksDir, 'task-list.md')
  if (!existsSync(listPath)) return null
  const ROW = /^\|\s*(\S+)\s*\|\s*\[[^\]]+\]\(([^)]+)\)/
  const lines = readFileSync(listPath, 'utf8').split('\n')
  const line = lines.find((l) => {
    const m = l.match(ROW)
    return !!m && resolve(join(tasksDir, m[2].trim())) === resolve(ticketPath)
  })
  return line ? line.match(ROW)[1] : null
}

function setFrontMatterScalar(text, key, rawValue) {
  const m = text.match(FRONT_MATTER)
  if (!m) throw new Error('ticket has no front matter')
  const re = new RegExp(`^${key}:`)
  const lines = m[1].split('\n')
  const i = lines.findIndex((l) => re.test(l))
  const line = `${key}: ${rawValue}`
  if (i === -1) lines.push(line)
  else lines[i] = line
  return text.replace(m[0], `---\n${lines.join('\n')}\n---\n`)
}

function setTicketStatusLine(text, statusKey) {
  if (!STATUS_LINE.test(text)) throw new Error('ticket has no status line')
  return text.replace(STATUS_LINE, (_all, pre) => `${pre}${STATUS_EMOJI[statusKey]} ${statusKey}`)
}

function appendUnder(text, section, line) {
  const lines = text.split('\n')
  const headingRe = new RegExp(`^##\\s+${section.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i')
  const start = lines.findIndex((l) => headingRe.test(l))
  if (start === -1) {
    const body = text.replace(/\s+$/, '')
    return `${body}\n\n## ${section}\n\n${line}\n`
  }
  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) { if (/^#{1,6}\s/.test(lines[i])) { end = i; break } }
  let last = start
  for (let i = start + 1; i < end; i++) { if (lines[i].trim() !== '') last = i }
  const insert = last === start ? ['', line] : [line]
  lines.splice(last + 1, 0, ...insert)
  return lines.join('\n')
}

function updateListRow(tasksDir, ticketPath, emoji) {
  const listPath = join(tasksDir, 'task-list.md')
  if (!existsSync(listPath)) return
  const ROW = /^\|\s*(\S+)\s*\|\s*\[[^\]]+\]\(([^)]+)\)/
  const lines = readFileSync(listPath, 'utf8').split('\n')
  const i = lines.findIndex((l) => {
    const m = l.match(ROW)
    return !!m && resolve(join(tasksDir, m[2].trim())) === resolve(ticketPath)
  })
  if (i === -1) return
  lines[i] = lines[i].replace(/^\|\s*\S+\s*\|/, `| ${emoji} |`)
  writeFileSync(listPath, lines.join('\n'))
}

function syncTicketStatusLineAndRow(ticketPath, tasksDir, text, statusKey) {
  text = setTicketStatusLine(text, statusKey)
  updateListRow(tasksDir, ticketPath, STATUS_EMOJI[statusKey])
  return text
}

function flowMap(obj) {
  return `{${Object.entries(obj).map(([k, v]) => `${k}: ${typeof v === 'boolean' ? v : JSON.stringify(String(v))}`).join(', ')}}`
}

function existingQuestionCount(text) {
  const m = text.match(FRONT_MATTER)
  return m ? (m[1].match(/^\s{4}-\s*\{/gm) || []).length : 0
}

function addQuestionItem(text, item) {
  const m = text.match(FRONT_MATTER)
  if (!m) throw new Error('ticket has no front matter')
  const itemLine = `    - ${flowMap(item)}`
  let fm = m[1]
  if (/^questions:/m.test(fm)) {
    fm = fm.replace(/(\n\s*status:\s*)\S+/, '$1open')
    if (/\n(\s*)items:\s*\[\]\s*(\n|$)/.test(fm)) {
      fm = fm.replace(/\n(\s*)items:\s*\[\]\s*(\n|$)/, `\n$1items:\n${itemLine}$2`)
    } else {
      const lines = fm.split('\n')
      const qIdx = lines.findIndex((l) => /^questions:/.test(l))
      let itemsIdx = -1
      for (let i = qIdx; i < lines.length; i++) { if (/^\s*items:/.test(lines[i])) { itemsIdx = i; break } }
      let insertAt = itemsIdx + 1
      for (let i = itemsIdx + 1; i < lines.length; i++) {
        if (/^\s{4}-\s*\{/.test(lines[i])) insertAt = i + 1
        else if (/^\S/.test(lines[i])) break
      }
      lines.splice(insertAt, 0, itemLine)
      fm = lines.join('\n')
    }
  } else {
    fm = `${fm.replace(/\n$/, '')}\nquestions:\n  status: open\n  updated: "${today()}"\n  items:\n${itemLine}`
  }
  return text.replace(m[0], `---\n${fm.replace(/\n$/, '')}\n---\n`)
}

export function writeTicketDoneInboxFile({ inboxDir, laneKey, signerName, ticketId: tid, code, timedOut, resultText, statusKey }) {
  mkdirSync(inboxDir, { recursive: true })
  const iso = new Date().toISOString()
  const stamp = `${iso.slice(0, 10)}-${iso.slice(11, 13)}${iso.slice(14, 16)}`
  const slug = statusKey === 'blocked' ? 'stopped' : statusKey === 'questions' ? 'question' : 'done'
  const file = join(inboxDir, `${stamp}-from-${laneKey}-${tid.toLowerCase()}-${slug}-${process.pid}.md`)
  writeFileSync(file, `# From ${signerName} — ${tid}\n\nStatus: ${statusKey}\nExit: ${code}${timedOut ? ' (timeout)' : ''}\n\n## Reply\n\n${resultText}\n`)
  return file
}

export function preJobTicketUpdate({ ticketPath, tasksDir, laneKey, signerName }) {
  let text = readFileSync(ticketPath, 'utf8')
  text = setFrontMatterScalar(text, 'worker', laneKey)
  text = setFrontMatterScalar(text, 'verifier', ladderVerifier(text))
  text = setFrontMatterScalar(text, 'started', JSON.stringify(new Date().toISOString()))
  text = syncTicketStatusLineAndRow(ticketPath, tasksDir, text, 'doing')
  text = appendUnder(text, 'Progress notes', `- ${noteStamp()} · ${signerName} · started.`)
  writeFileSync(ticketPath, text)
}

export function postJobTicketUpdate({
  ticketPath,
  tasksDir,
  ticketId,
  laneKey,
  signerName,
  inboxDir,
  code,
  timedOut,
  resultText,
  timeoutSec = 1200,
  isAgyJob = false,
  engine = '',
  stalled = false,
}) {
  let text = readFileSync(ticketPath, 'utf8')
  const idMatch = text.match(/^id:\s*"?(\S+?)"?\s*$/m)
  const tid = idMatch ? idMatch[1] : ticketId
  const qMatch = resultText.match(/^\s*QUESTION:\s*([\s\S]*)/im)
  const alreadyBlocked = STATUS_LINE.test(text) && text.match(STATUS_LINE)[2].startsWith('🔴')
  const preflightStop = /preflight.*(blocked|failed|stop)|no (code|work) touched|not validated by tickets-validate/i.test(resultText || '')
  let statusKey
  if (alreadyBlocked) {
    statusKey = 'blocked'
    text = appendUnder(text, 'Progress notes', `- ${noteStamp()} · ${signerName} · left the ticket 🔴 blocked as written; the harness did not change the status.`)
  } else if (preflightStop) {
    statusKey = 'blocked'
    text = appendUnder(text, 'Progress notes', `- ${noteStamp()} · ${signerName} · preflight stopped: the ticket is 🔴 blocked, reason in ## Concerns; the harness set the status from the reply.`)
  } else if (timedOut || code !== 0) {
    statusKey = 'blocked'
    const reason = timedOut ? `${stalled ? 'stalled' : 'timed out'} after ${timeoutSec}s` : (isAgyJob ? `agy exited ${code}` : `${signerName} exited ${code}`)
    text = appendUnder(text, 'Concerns', `- blocking (${signerName}, ${today()}): ${reason}.`)
    // A timeout is loud: the board said "started" while five of seven Gemma jobs timed out (2026-10-11).
    const note = timedOut
      ? `🔴 ${reason} (exit 124${engine ? `, engine ${engine}` : ''}); the build did not finish and the ticket is blocked.`
      : `stopped: ${reason}.`
    text = appendUnder(text, 'Progress notes', `- ${noteStamp()} · ${signerName} · ${note}`)
  } else if (qMatch) {
    statusKey = 'questions'
    const id = `q${existingQuestionCount(text) + 1}`
    text = addQuestionItem(text, { id, speaker: 'ai', asked_by: laneKey, text: qMatch[1].trim(), timestamp: new Date().toISOString(), resolved: false })
    text = appendUnder(text, 'Progress notes', `- ${noteStamp()} · ${signerName} · asked ${id} on the board.`)
  } else {
    statusKey = 'verifying'
    text = setFrontMatterScalar(text, 'verifier', ladderVerifier(text))
    text = appendUnder(text, 'Progress notes', `- ${noteStamp()} · ${signerName} · built, reported to Tyrion.`)
  }
  text = syncTicketStatusLineAndRow(ticketPath, tasksDir, text, statusKey)
  writeFileSync(ticketPath, text)
  const inboxFile = writeTicketDoneInboxFile({ inboxDir, laneKey, signerName, ticketId: tid, code, timedOut, resultText, statusKey })
  return { statusKey, inboxFile }
}

/** Set the ticket's status line and its task-list.md row to one STATUS_EMOJI key. */
export function setTicketStatus({ ticketPath, tasksDir, statusKey }) {
  writeFileSync(ticketPath, syncTicketStatusLineAndRow(ticketPath, tasksDir, readFileSync(ticketPath, 'utf8'), statusKey))
}

/** T-742: the ticket's `[manual]` acceptance criteria as todd_checks lines ("AC-6: Todd opens ..."),
 *  read from its `## Acceptance Criteria` section; the tag list may hold other tags beside manual. */
export function manualCriteria(ticketText) {
  const sec = ticketText.match(/^## Acceptance Criteria[ \t]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m)
  const out = []
  for (const line of (sec ? sec[1] : '').split('\n')) {
    const m = line.match(/^- \[[ xX]\] (AC-\d+) \[([^\]]*)\](?: \([^)]*\))?:?[ \t]*(.*)$/)
    if (m && m[2].split(',').some((t) => t.trim() === 'manual')) out.push(`${m[1]}: ${m[3].trim()}`)
  }
  return out
}

/** T-740: a GREEN auto-verify that merged the build. 🟩 on the status line and the row, `verifier:`
 *  and `started:` taken out (desks/build/CLAUDE.md), and the notes appended, the evidence note last.
 *  T-742: every `[manual]` acceptance criterion is copied into `todd_checks` (JSON-quoted, which is
 *  valid YAML) so it reaches the batch review card; a ticket that already lists todd_checks keeps its list. */
export function markVerified({ ticketPath, tasksDir, signerName, notes }) {
  let text = readFileSync(ticketPath, 'utf8')
  const checks = manualCriteria(text)
  const m = text.match(FRONT_MATTER)
  if (m) {
    const kept = m[1].split('\n').filter((l) => !/^(verifier|started):/.test(l))
    if (checks.length && !kept.some((l) => /^todd_checks:/.test(l))) kept.push('todd_checks:', ...checks.map((c) => `  - ${JSON.stringify(c)}`))
    text = text.replace(m[0], `---\n${kept.join('\n')}\n---\n`)
  }
  text = syncTicketStatusLineAndRow(ticketPath, tasksDir, text, 'verified')
  for (const n of notes) text = appendUnder(text, 'Progress notes', `- ${noteStamp()} · ${signerName} · ${n}`)
  writeFileSync(ticketPath, text)
}

/** T-742: take back the ticket's latest standing strike with a recorded reason, for a RED caused by
 *  the ticket's own cut. Writes `- <stamp> · <who> · strike voided: <reason>` under ## Progress notes,
 *  which countStrikes reads. Refused, writing nothing, with no reason or no strike to void. */
export function voidStrike({ ticketPath, who, reason }) {
  const why = String(reason || '').replace(/\s+/g, ' ').trim()
  if (!why) throw new Error('a strike void needs a reason: pass --reason "<why the build is not at fault>"')
  const text = readFileSync(ticketPath, 'utf8')
  if (countStrikes(text) === 0) throw new Error(`${ticketPath} has no strike to void`)
  writeFileSync(ticketPath, appendUnder(text, 'Progress notes', `- ${noteStamp()} · ${who} · strike voided: ${why}`))
}

export function findTicketPath(tasksDir, id) {
  const ticketsDir = join(tasksDir, 'tickets')
  const wantId = id.startsWith('T-') ? id : `T-${id}`
  if (!existsSync(ticketsDir)) return null
  for (const f of readdirSync(ticketsDir)) {
    if (!f.endsWith('.md')) continue
    const p = join(ticketsDir, f)
    const m = readFileSync(p, 'utf8').match(/^id:\s*"?(\S+?)"?\s*$/m)
    if (m && m[1] === wantId) return p
  }
  return null
}

/** GREEN/RED from a verify job's reply: an explicit verdict line first, then "verify passed/failed". */
export function verifyVerdict(resultText = '') {
  const line = resultText.match(/^\s*(?:\*\*)?(?:verdict:?\s*)?(?:\*\*)?\s*(GREEN|RED)\b/im)
  if (line) return line[1].toUpperCase()
  const phrase = resultText.match(/verif(?:y|ication)\s+(passed|failed)/i)
  if (phrase) return phrase[1].toLowerCase() === 'passed' ? 'GREEN' : 'RED'
  return 'unknown'
}

/**
 * The text of the one message a finished build or verify job leaves in Tyrion's inbox, or a
 * skip reason (2026-10-08 quick task: a detached verifier's report woke nobody). Skipped when
 * the job came from the build desk itself, names no ticket, or its report already went into
 * Tyrion's inbox.
 */
export function tyrionWakeMessage({ senderKey, tid, kind, code, resultText = '', reportDir, buildInbox }) {
  if (senderKey === 'build') return { skip: 'sender is the build desk' }
  if (!tid) return { skip: 'no ticket' }
  if (reportDir && buildInbox && resolve(reportDir) === resolve(buildInbox)) return { skip: 'report already in the build inbox' }
  const verdict = kind === 'verify' ? verifyVerdict(resultText) : null
  const head = resultText.trim().split('\n').slice(0, 12).join('\n')
  const text = [
    `# ${tid}: ${kind} job finished (from ${senderKey || 'unknown desk'})`,
    '',
    `Ticket: ${tid}`,
    `Kind: ${kind}`,
    `Exit: ${code}`,
    ...(verdict ? [`Verdict: ${verdict}`] : []),
    '',
    '## Reply (first lines)',
    '',
    head || '(no reply)',
    '',
  ].join('\n')
  const slug = `${tid.toLowerCase()}-${kind}-${verdict ? verdict.toLowerCase() : (code === 0 ? 'done' : 'stopped')}-${process.pid}`
  return { text, slug }
}
