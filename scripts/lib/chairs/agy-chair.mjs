// agy-chair.mjs — the agy (Antigravity) chair driver (T-642).
//
// Messaging and inbox: the pane route only. A message is typed into the desk's labelled agy pane
// once the agent is idle and its `>` input line is empty. agy has no headless call a script can
// resume a session with (none is invented here, and A-15 dispatches no job to agy), so a lane with
// no open pane has no route: its file stays in inbox/ and dispatch.mjs folds it into the next job
// (T-688). Clear-and-pickup: refused with one line, nothing typed.
import { homedir } from 'node:os'
import { join } from 'node:path'
import { findLanePane, messageNamedPane, clearRefusal } from './lane-pane.mjs'
import { jobsDir, sessionPinPath, loadSessionPin, saveSessionPin } from './session-pins.mjs'

export const AGY_BIN = () => process.env.SK2_AGY_BIN || join(homedir(), '.local/bin/agy')

export const agyChair = Object.freeze({
  id: 'agy',
  herdrKind: 'agy',
  hook: false,
  paneJobs: true,     // dispatch.mjs types a job into an idle agy pane
  foldsInbox: true,   // dispatch.mjs folds its inbox/ into the next job and replies by inbox file
  findPane: (lane, panes) => findLanePane('agy', lane, panes),
  // agy draws `> …`; its model menu ("Switch Model") hides the prompt.
  promptText(screen) {
    if (screen.includes('Switch Model')) return null
    const lines = screen.split('\n')
    for (let i = lines.length - 1; i >= 0; i--) {
      const m = lines[i].match(/^\s*>\s?(.*?)\s*$/)
      if (m && !m[1].startsWith('/')) return m[1]
    }
    return null
  },
  hasRoute: (lane, pane) => Boolean(pane),
  deliver: async (lane) => ({ error: `no headless route for the agy chair (${lane?.key}): open its labelled pane, or dispatch.mjs folds the file into its next job` }),
  message: (lane, paneId, text, ctx) => messageNamedPane(paneId, text, ctx),
  clearProblem: (paneId, name) => clearRefusal('agy', paneId, name),
  // Never calls `send`: a half-typed /clear in agy's prompt is a message to the model.
  clearAndPickup({ paneId, name }) {
    return { ok: false, refusal: clearRefusal('agy', paneId, name) }
  },
  sessionPinPath, loadSessionPin, saveSessionPin, jobsDir,
  // The folder name under desks/<desk>/sidekicks/ (T-684): agy lanes live in gemini/.
  sidekickDir: () => 'gemini',
  // The `-from-<tag>-` of a dispatch reply file: the lane (`gemma`), whichever of --engine agy or
  // gemini was typed (Tyrion's answer on T-490-1: agy is Gemma's real name).
  replyTag: ({ lane, engine }) => lane || engine,
})
