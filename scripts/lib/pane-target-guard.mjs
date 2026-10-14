// pane-target-guard — pane typing is allowed only into a named herdr agent pane.
// A named pane has an agent name herdr-<lane>, or a pane label ending in (lane).
// Anything else is unnamed. A lookup that returns null is unresolvable: do not type.
import { isMain as isMainModule } from './is-main.mjs'

const NAMED_AGENT = /^herdr-[a-z0-9-]+$/
const NAMED_LABEL = /\([a-z0-9-]+\)\s*$/

function refuse(code, message) {
  const e = new Error(message)
  e.code = code
  throw e
}

export function assertNamedHerdrAgentPane(paneId, lookup) {
  if (paneId == null || String(paneId) === '') refuse('unnamed_pane', 'unnamed pane: no pane id')
  if (typeof lookup !== 'function') refuse('unresolvable_pane', `unresolvable pane: ${paneId}`)
  let row
  try { row = lookup(String(paneId)) } catch { refuse('unresolvable_pane', `unresolvable pane: ${paneId}`) }
  if (row == null) refuse('unresolvable_pane', `unresolvable pane: ${paneId}`)
  const name = typeof row.name === 'string' ? row.name : ''
  const label = typeof row.label === 'string' ? row.label : ''
  if (NAMED_AGENT.test(name) || NAMED_LABEL.test(label)) return row
  refuse('unnamed_pane', `unnamed pane: ${paneId}`)
}

// The only production call that sends text into a herdr pane.
export function sendTextToNamedPane(paneId, text, { lookup, herdr }) {
  assertNamedHerdrAgentPane(paneId, lookup)
  return herdr(['pane', 'send-text', paneId, text])
}

const isMain = isMainModule(import.meta.url)
if (isMain && process.argv.includes('--check')) {
  const arg = (flag) => {
    const i = process.argv.indexOf(flag)
    return i > -1 ? (process.argv[i + 1] || '') : ''
  }
  try {
    assertNamedHerdrAgentPane(arg('--pane'), () => ({ name: arg('--name'), label: arg('--label') }))
  } catch (e) {
    console.error(e.message)
    process.exit(1)
  }
}
