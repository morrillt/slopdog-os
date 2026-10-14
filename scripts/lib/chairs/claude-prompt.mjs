// claude-prompt.mjs — reading a Claude Code input box off a pane capture: the Claude chair's
// prompt heuristics (T-642). Moved out of lib/desk-pane.mjs, which re-exports them so its callers
// (self-clear, clear-watch, unstucker, the inbox watcher) keep importing them from there.

export const stripAnsi = (s) => s.replace(/\x1b\]8;[^\x07\x1b]*(\x07|\x1b\\)/g, '').replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '')

// The last line that starts with `❯`/`>` (the input box), whether its text is Claude Code's
// dim suggestion, and the nearest non-blank, non-border line above it (a spinner while a turn
// runs, else the last transcript line). null when there is no prompt line.
export function promptScan(capture) {
  const raw = capture.replace(/\r/g, '').split('\n')
  const lines = raw.map((l) => stripAnsi(l).replace(/ /g, ' ').replace(/\s+$/, ''))
  let at = -1
  for (let i = lines.length - 1; i >= 0; i--) if (/^\s*[❯>]/.test(lines[i])) { at = i; break }
  if (at === -1) return null
  let above = ''
  for (let i = at - 1; i >= 0; i--) {
    const l = lines[i]
    // Claude Code's right-aligned update notice (`✔ Update installed · Restart to apply`) sits
    // between the transcript and the input box; it is chrome, not a transcript line (T-647).
    if (l === '' || /^[─]+/.test(l.trim()) || /Update installed|Restart to apply/.test(l)) continue
    above = l.trim()
    break
  }
  const afterGlyph = raw[at].split(/[❯>]/).slice(1).join('')
  const dim = /^\s*\x1b\[2m/.test(afterGlyph) || /^(\s|\x1b\[[0-9;]*m)*\x1b\[2m/.test(afterGlyph)
  return { prompt: lines[at].trim(), above, dim }
}

export const isSpinner = (line) => /…\s*\(.*\)$/.test(line) || /esc to interrupt/.test(line)

// The text a human left unsent in the prompt, or '' when the prompt is empty (or shows only the
// dim suggestion, or there is no Claude prompt at all).
export function unsentText(capture) {
  const scan = promptScan(capture)
  if (!scan || scan.dim) return ''
  const text = scan.prompt.replace(/^[❯>]\s*/, '')
  // A fresh session's dim suggestion read without ANSI: `❯ Try "…"` (T-267).
  if (/^Try ".*"$/.test(text)) return ''
  return text
}

// '' when the capture shows an idle, empty Claude Code prompt, else the reason.
export function notIdle(capture) {
  const scan = promptScan(capture)
  if (!scan) return 'no prompt line (claude not running, or a menu is up)'
  const text = unsentText(capture)
  if (text) return `prompt has text: "${scan.prompt}"`
  if (isSpinner(scan.above)) return `a turn is running: "${scan.above}"`
  return ''
}

export const isRunning = (capture) => { const s = promptScan(capture); return Boolean(s) && isSpinner(s.above) }

// True once /clear has run and nothing else has happened since: the transcript above the empty
// prompt is just the echoed `❯ /clear`.
export const isCleared = (capture) => !notIdle(capture) && /^[❯>]\s*\/clear$/.test(promptScan(capture).above)
