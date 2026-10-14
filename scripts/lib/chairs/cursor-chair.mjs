// cursor-chair.mjs — the Cursor chair driver (T-642): every `engine: cursor` lane, the Composer
// and the Grok sidekicks alike (Grok runs through `cursor-agent --model grok-…`).
//
// Messaging and inbox: the labelled pane first (a headless resume of a chat open in a pane forks
// it, and the visible chat never sees the message, probe-results.md); with no pane, a headless
// one-off that resumes the lane's own delivery session:
//   `cursor-agent -p <msg> --resume <chat id> --trust --output-format json` (reply = .result)
// The chat is made once with `cursor-agent create-chat` and pinned in the lane folder
// (session-pins.mjs). Clear-and-pickup: cursor-agent has no /clear in terminal mode and no hook to
// pick up after one, so it is refused with one line and nothing is typed.
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { findLanePane, messageNamedPane, clearRefusal } from './lane-pane.mjs'
import { jobsDir, sessionPinPath, loadSessionPin, saveSessionPin } from './session-pins.mjs'
import { run as defaultRun } from './run.mjs'

export const CURSOR_BIN = () => process.env.SK2_CURSOR_BIN || join(homedir(), '.local/bin/cursor-agent')

export const cursorChair = Object.freeze({
  id: 'cursor',
  herdrKind: 'cursor',
  hook: false,
  paneJobs: true,
  foldsInbox: true,
  findPane: (lane, panes) => findLanePane('cursor', lane, panes),
  // Cursor shows the dim placeholder "Add a follow-up" (or "Plan, search, build anything") in an
  // empty `→` line.
  promptText(screen) {
    const lines = screen.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(/^\s*→\s?(.*?)\s*$/)
      if (m) return /^(Add a follow-up|Plan, search, build anything.*)$/.test(m[1]) ? '' : m[1]
    }
    return null
  },
  hasRoute: () => true,
  // Returns { reply } or { error }; never throws, and a missing binary is an error, not a crash.
  async deliver(lane, prompt, cwd, ctx = {}) {
    const bin = ctx.bin ?? CURSOR_BIN()
    if (!existsSync(bin)) return { error: `cursor-agent missing at ${bin}` }
    const run = ctx.run ?? defaultRun
    const s = loadSessionPin(lane, ctx)
    if (!s.id) {
      const c = await run(bin, ['create-chat'], cwd, 60_000)
      s.id = c.stdout.trim()
      if (c.err || !s.id) return { error: `create-chat failed: ${c.err?.message || 'no id'}` }
      saveSessionPin(lane, s, ctx)
    }
    const r = await run(bin, ['-p', prompt, '--resume', s.id, '--trust', '--output-format', 'json'], cwd, ctx.receiptMs ?? 5 * 60_000)
    if (r.err) return { error: r.err.killed ? 'timeout' : (r.stderr || r.err.message).slice(0, 500) }
    try { return { reply: JSON.parse(r.stdout).result ?? '' } } catch { return { reply: r.stdout } }
  },
  message: (lane, paneId, text, ctx) => messageNamedPane(paneId, text, ctx),
  clearProblem: (paneId, name) => clearRefusal('cursor', paneId, name),
  clearAndPickup({ paneId, name }) {
    return { ok: false, refusal: clearRefusal('cursor', paneId, name) }
  },
  sessionPinPath, loadSessionPin, saveSessionPin, jobsDir,
  sidekickDir: (engine) => engine,
  // The `-from-<tag>-` of a dispatch reply file in the sender's inbox: the --engine name.
  replyTag: ({ engine }) => engine,
})
