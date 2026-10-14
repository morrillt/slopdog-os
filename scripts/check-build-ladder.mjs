#!/usr/bin/env node
// check-build-ladder — fail when a script or dispatch skill hardcodes a value that
// v2/config/build-ladder.json owns (T-714): a builder engine default, a builder or verifier
// model id, a verifier stamp, a strike count, or Composer in a fall-over chain.
// Pragmatic: a grep for known literals, outside the config and its loader.
//
//   node scripts/check-build-ladder.mjs            checks the known callers
//   node scripts/check-build-ladder.mjs <file>...  checks those files instead (tests)
//
// Exit 0 with "ok" when nothing is found; exit 1 naming file:line for each hit.
import { realpathSync as __rp } from 'node:fs'
import { readFileSync, existsSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const V2 = dirname(dirname(fileURLToPath(import.meta.url)))
export const CALLERS = [
  'scripts/dispatch.mjs',
  'scripts/dispatch-ticket-updates.mjs',
  'scripts/seats.mjs',
  'scripts/lib/engine-quota.mjs',
  'scripts/lib/verify-brief.mjs',
  'scripts/dispatch-gate.mjs',
  'scripts/lib/quick-tasks.mjs',
  'plugins/slopdog/session/dispatch/SKILL.md',
  'rules/principles.md',
  'rules/delegation.md',
  'desks/build/tyrion/CLAUDE.md',
  'desks/build/data/CLAUDE.md',
  'rules/critical-rules.md',
  'plugins/slopdog/session/quick-task-add/SKILL.md',
  'plugins/slopdog/session/quick-task-do/SKILL.md',
].map((p) => join(V2, p))

const CODE_RULES = [
  { re: /['"`](gemini-3\.8-flash-(?:medium|high)|grok-4\.7-medium|claude-sonnet-5-[\w.-]+|composer-2\.5)['"`]/, what: 'model id (engine_models / builder)' },
  { re: /opt\('--engine'\)\s*\|\|\s*['"]/, what: 'default builder engine (builder)' },
  { re: /setFrontMatterScalar\([^)]*'verifier',\s*['"]/, what: 'verifier stamp (verifiers_by_points)' },
  { re: /\b\w*(?:Rounds|Fails|fails|strikes|Strikes|failCount)\s*>=?\s*\d/, what: 'strike count (escalate_after_failures)' },
  { re: /\[[^\]]*['"]cursor:composer['"]/, what: 'Composer in a fall-over chain (quota_chains)' },
  { re: /verifierLane\s*=\s*['"]/, what: 'auto-verify lane (auto_verify_lane)' },
  { re: /\bmodel:\s*['"](haiku|sonnet|opus)['"]/, what: 'subagent rung (subagent_tiers)' },
  { re: /\beffort:\s*['"](low|medium|high|xhigh|max)['"]/, what: 'subagent rung (subagent_tiers)' },
]
// A policy doc points at build-ladder.md; it never states a ladder value itself.
const ENGINE_NAME = /\b(Composer|Gemini|Gemma|Sonnet|Opus|Grok|Haiku|Flash)\b/
const LADDER_WORD = /\b(build|builds|builder|builders|built|verif\w*|escalat\w*|rings?|rungs?|points?)\b/
const DOC_RULES = [
  { re: /\bComposer\b/, what: 'Composer named in a route (disabled_engines)' },
  // Same clause only, with inline code and the bold **Verify:** label stripped, so a desk's own
  // model ("running on Opus.") and a command example (`--engine grok`) do not count.
  { test: (l) => l.replace(/`[^`]*`/g, '').replace(/\*\*Verify:\*\*/g, '').split(/[.;:!?]\s|—/).some((c) => ENGINE_NAME.test(c) && LADDER_WORD.test(c)), what: 'engine or model tied to building or verifying (builder / verifiers_by_points / escalation)' },
  { re: /\b(two|three|four|[1-9])\s+(failed|strikes?|fail(ure)?s?|verify rounds?|correction rounds?)\b/i, what: 'strike count (escalate_after_failures)' },
  { re: /\bring (?:one|two)\b/i, what: 'ring text the ladder replaced' },
  // A subagent rung named in prose: a model beside "subagent" or "effort" in the same clause.
  { test: (l) => l.replace(/`[^`]*`/g, '').split(/[.;:!?]\s|—/).some((c) => ENGINE_NAME.test(c) && /\b(subagents?|effort)\b/i.test(c)), what: 'subagent rung named in prose (subagent_tiers)' },
  { re: /gemini-3\.8-flash/, what: 'model id (builder / engine_models)' },
]

export function checkFiles(files) {
  const hits = []
  for (const f of files) {
    if (!existsSync(f)) { hits.push(`${f}:0: missing`); continue }
    const rules = f.endsWith('.md') ? DOC_RULES : CODE_RULES
    readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
      if (!f.endsWith('.md') && /^\s*(\/\/|\*)/.test(line)) return
      for (const r of rules) if (r.test ? r.test(line) : r.re.test(line)) hits.push(`${relative(process.cwd(), f) || f}:${i + 1}: ${r.what}: ${line.trim().slice(0, 120)}`)
    })
  }
  return hits
}

if (process.argv[1] && __rp(process.argv[1]) === __rp(fileURLToPath(import.meta.url))) {
  const args = process.argv.slice(2)
  const hits = checkFiles(args.length ? args : CALLERS)
  if (hits.length) {
    console.error(`check-build-ladder: ${hits.length} hardcoded value(s) the ladder owns; read them from v2/config/build-ladder.json through scripts/lib/build-ladder.mjs`)
    for (const h of hits) console.error(h)
    process.exit(1)
  }
  console.log('check-build-ladder: ok')
}
