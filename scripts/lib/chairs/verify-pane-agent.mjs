// verify-pane-agent.mjs — refuse to type when the pane is not the desk's live Claude agent (T-647).
// Exit 0 from herdr is not delivery; a restarted remote server can leave a bare shell in the pane id.

export class PaneAgentVerificationError extends Error {
  constructor(message, code = 'pane_agent_unverified') {
    super(message)
    this.name = 'PaneAgentVerificationError'
    this.code = code
  }
}

/**
 * @param {object} opts
 * @param {Array} opts.panes — herdr pane list result
 * @param {Array} opts.agents — herdr agent list result
 * @param {string} opts.paneId
 * @param {string} opts.expectedAgentName — e.g. herdr-cloud
 * @param {string} [opts.expectedKind='claude']
 */
export function verifyPaneAgent({ panes, agents, paneId, expectedAgentName, expectedKind = 'claude' }) {
  const pane = panes.find((p) => p.pane_id === paneId)
  if (!pane) throw new PaneAgentVerificationError(`pane ${paneId} is not in herdr pane list`)

  if (pane.agent !== expectedKind) {
    throw new PaneAgentVerificationError(
      `pane ${paneId} runs ${pane.agent || 'no agent'}, expected ${expectedKind}; refusing to type into a fresh shell or wrong engine`,
    )
  }

  const agent = agents.find((a) => a.pane_id === paneId)
  if (!agent?.name) {
    throw new PaneAgentVerificationError(
      `pane ${paneId} has no named herdr agent (agent_session may be empty after a remote restart)`,
    )
  }
  if (agent.name !== expectedAgentName) {
    throw new PaneAgentVerificationError(
      `pane ${paneId} agent is ${agent.name}, expected ${expectedAgentName}`,
    )
  }

  const session = pane.agent_session?.value || agent.agent_session?.value || ''
  if (!session) {
    throw new PaneAgentVerificationError(
      `pane ${paneId} has no agent_session; the remote server may have restarted into a bare shell`,
    )
  }

  return { pane, agent, session }
}
