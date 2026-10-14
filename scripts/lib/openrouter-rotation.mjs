// Rotation logic for OpenRouter free models under dispatch.mjs (T-546)
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { homedir } from 'node:os'

export const OPENROUTER_MODELS = [
  'dots-studio/dots-3-note-preview:free',
  // Inkling-Small returns 403 with X-Title: Slop Dog. Content Safety returns 200 on a
  // bare completion, then 400 once Claude Code sends tools. Ling 3.0 Flash Fin's free
  // slug 404s since 2026-10-08; Laguna S 2.1 (Poolside's coding agent model) replaced it:
  // 200 with a proper tool_use on /v1/messages, free endpoint uptime 99.9%.
  'poolside/laguna-s-2.1:free',
  'nvidia/nemotron-3-ultra-550b-a55b:free',
]

export const MODEL_ALIASES = {
  dots: 'dots-studio/dots-3-note-preview:free',
  dots3: 'dots-studio/dots-3-note-preview:free',
  'dots-3': 'dots-studio/dots-3-note-preview:free',
  'dots3-note': 'dots-studio/dots-3-note-preview:free',
  'dots-note': 'dots-studio/dots-3-note-preview:free',
  laguna: 'poolside/laguna-s-2.1:free',
  'laguna-s': 'poolside/laguna-s-2.1:free',
  'laguna-s-2.1': 'poolside/laguna-s-2.1:free',
  nemotron: 'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nemotron-ultra': 'nvidia/nemotron-3-ultra-550b-a55b:free',
  'nemotron-3-ultra': 'nvidia/nemotron-3-ultra-550b-a55b:free',
  sonnet: 'anthropic/claude-3.5-sonnet',
  'claude-sonnet': 'anthropic/claude-3.5-sonnet',
  'claude-3.5-sonnet': 'anthropic/claude-3.5-sonnet',
}

export function resolveOpenRouterModel(aliasOrId) {
  if (!aliasOrId) return null
  return MODEL_ALIASES[aliasOrId.toLowerCase()] || aliasOrId
}

export function defaultRotationStatePath() {
  return process.env.DISPATCH_OPENROUTER_STATE_PATH || join(homedir(), '.local', 'state', 'openrouter-rotation.json')
}

export function readRotationState(statePath = defaultRotationStatePath()) {
  try {
    if (existsSync(statePath)) {
      const data = JSON.parse(readFileSync(statePath, 'utf8'))
      if (typeof data === 'object' && data !== null) return data
    }
  } catch {}
  return { currentIndex: 0, lastModel: null, lastStatus: null, cooldowns: {} }
}

export function writeRotationState(state, statePath = defaultRotationStatePath()) {
  mkdirSync(dirname(statePath), { recursive: true })
  writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n')
}

/**
 * Select the model to use for the next dispatch job.
 * If forcedModel is provided, resolves and returns it without advancing state.
 * Otherwise, picks the current rotating model, skipping models in cooldown.
 */
export function selectNextModel({ statePath = defaultRotationStatePath(), forcedModel = null } = {}) {
  if (forcedModel) {
    return resolveOpenRouterModel(forcedModel)
  }
  const state = readRotationState(statePath)
  let idx = (typeof state.currentIndex === 'number' && state.currentIndex >= 0) ? state.currentIndex : 0
  const now = Date.now()
  const cooldowns = state.cooldowns || {}

  for (let attempts = 0; attempts < OPENROUTER_MODELS.length; attempts++) {
    const candidateIdx = (idx + attempts) % OPENROUTER_MODELS.length
    const candidate = OPENROUTER_MODELS[candidateIdx]
    const expires = cooldowns[candidate]
    if (!expires || expires < now) {
      return candidate
    }
  }

  // If all are in cooldown, pick current index anyway
  return OPENROUTER_MODELS[idx % OPENROUTER_MODELS.length]
}

/**
 * Record outcome of a dispatch job, advancing currentIndex to the next model in the list.
 * If error/429 occurs, marks the model and sets cooldown so subsequent tasks skip it.
 */
export function recordRotationOutcome({
  statePath = defaultRotationStatePath(),
  model,
  success,
  is429 = false,
  error = null,
} = {}) {
  const state = readRotationState(statePath)
  const currentIdx = OPENROUTER_MODELS.indexOf(model)
  const baseIdx = currentIdx !== -1 ? currentIdx : (state.currentIndex || 0)

  // Rotate to next model in list
  const nextIdx = (baseIdx + 1) % OPENROUTER_MODELS.length
  state.currentIndex = nextIdx
  state.lastModel = model
  state.lastStatus = success ? 'ok' : (is429 ? '429' : 'error')
  state.lastError = error
  state.updatedAt = new Date().toISOString()

  if (!state.cooldowns) state.cooldowns = {}
  if (is429) {
    // 60s cooldown on 429
    state.cooldowns[model] = Date.now() + 60000
  } else if (!success) {
    // 30s cooldown on general error
    state.cooldowns[model] = Date.now() + 30000
  } else {
    delete state.cooldowns[model]
  }

  writeRotationState(state, statePath)
  return state
}
