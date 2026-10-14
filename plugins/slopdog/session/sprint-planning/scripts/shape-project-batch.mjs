#!/usr/bin/env node
/**
 * @inputs A department's processed ideas and the project-writer and batch-writer skills.
 * @outputs A drafted or updated project file and batch files, each checked by the structure checkers.
 * @starts Sprint planning reaches the project and batch shaping steps.
 * @ends The project and batch files pass check-project-structure and check-batch-structure.
 */
// Steps 2 & 3: Project and Batch Shaping via project-writer and batch-writer skills.
import fs, { realpathSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import { buildSkillPrompt, runDispatchAgy } from './dispatch-skill.mjs'

const HOME = process.env.HOME || '~'
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const SLOPDOG_DIR = path.resolve(SCRIPT_DIR, '../../../../..')
const PROJECT_STRUCTURE_SCRIPT = path.join(SCRIPT_DIR, 'check-project-structure.mjs')
const BATCH_STRUCTURE_SCRIPT = path.join(
  SCRIPT_DIR,
  '../../../writing/batch-writer/scripts/check-batch-structure.mjs',
)

export const CANONICAL_PROJECT_SKILL_PATHS = [
  path.join(SLOPDOG_DIR, 'v2/plugins/slopdog/writing/project-writer/SKILL.md'),
  path.join(HOME, 'slopdog/v2/plugins/slopdog/writing/project-writer/SKILL.md'),
  path.join(HOME, '.claude/skills/slopdog/writing/project-writer/SKILL.md'),
]

export const CANONICAL_BATCH_SKILL_PATHS = [
  path.join(SLOPDOG_DIR, 'v2/plugins/slopdog/writing/batch-writer/SKILL.md'),
  path.join(HOME, 'slopdog/v2/plugins/slopdog/writing/batch-writer/SKILL.md'),
  path.join(HOME, '.claude/skills/slopdog/writing/batch-writer/SKILL.md'),
]

export function resolveSkillPath(candidates) {
  for (const p of candidates) {
    if (fs.existsSync(p)) return p
  }
  return candidates[0]
}

function runProjectStructureCheck(outPath) {
  if (!fs.existsSync(PROJECT_STRUCTURE_SCRIPT)) {
    throw new Error(`check-project-structure.mjs not found at ${PROJECT_STRUCTURE_SCRIPT}`)
  }
  execFileSync('node', [PROJECT_STRUCTURE_SCRIPT, outPath], { stdio: 'pipe' })
}

function runBatchStructureCheck(outPath) {
  const fallback = path.join(
    HOME,
    'slopdog/v2/plugins/slopdog/writing/batch-writer/scripts/check-batch-structure.mjs',
  )
  const script = fs.existsSync(BATCH_STRUCTURE_SCRIPT) ? BATCH_STRUCTURE_SCRIPT : fallback
  if (!fs.existsSync(script)) {
    throw new Error(`check-batch-structure.mjs not found`)
  }
  execFileSync('node', [script, outPath], { stdio: 'pipe' })
}

export function shapeProject({
  slug,
  title = slug,
  desk = 'ideas',
  why = [],
  what = [],
  how = [],
  requirements = [],
  outputDir = path.join(HOME, 'slopdog/tasks/projects'),
  dispatchOptions = {},
}) {
  const skillPath = resolveSkillPath(CANONICAL_PROJECT_SKILL_PATHS)
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Project skill not found at ${skillPath}`)
  }
  if (!skillPath.includes('project-writer')) {
    throw new Error(`Expected project-writer skill, got ${skillPath}`)
  }

  fs.mkdirSync(outputDir, { recursive: true })
  const outPath = path.join(outputDir, `${slug}.md`)
  const spec = { slug, title, desk, why, what, how, requirements, outPath }
  const brief = [
    `Shape or refresh the project file for slug "${slug}" (title: ${title}).`,
    `Write the project markdown to: ${outPath}`,
    `Use ~/slopdog/v2/plugins/slopdog/writing/project-writer/template.md and the worked example ~/slopdog/tasks/projects/shaping-and-delivery.md per project-writer.`,
    `Inputs JSON: ${JSON.stringify({ slug, title, desk, why, what, how, requirements })}`,
  ].join('\n')

  const prompt = buildSkillPrompt({ skillPath, brief })
  runDispatchAgy(prompt, {
    ...dispatchOptions,
    writeDir: outputDir,
    env: {
      ...dispatchOptions.env,
      SPRINT_AGY_STUB: 'shape-project',
      SPRINT_SHAPE_SPEC: JSON.stringify(spec),
    },
  })

  if (!fs.existsSync(outPath)) {
    throw new Error(`Project shaping via ${skillPath} did not produce ${outPath}`)
  }
  runProjectStructureCheck(outPath)
  const content = fs.readFileSync(outPath, 'utf8')
  return { outPath, skillPath, content }
}

export function shapeBatch({
  slug,
  batchName,
  summary,
  what = [],
  why = [],
  how = [],
  requirements = [],
  outputDir = path.join(HOME, `slopdog/tasks/batches/${slug}`),
  dispatchOptions = {},
}) {
  const skillPath = resolveSkillPath(CANONICAL_BATCH_SKILL_PATHS)
  if (!fs.existsSync(skillPath)) {
    throw new Error(`Batch skill not found at ${skillPath}`)
  }

  fs.mkdirSync(outputDir, { recursive: true })
  const outPath = path.join(outputDir, `${batchName}.md`)
  const spec = { slug, batchName, summary, what, why, how, requirements, outPath }
  const brief = [
    `Shape batch "${batchName}" for project "${slug}".`,
    `Write the batch markdown to: ${outPath}`,
    `Follow batch-writer section order and run structural self-check when done.`,
    `Inputs JSON: ${JSON.stringify({ slug, batchName, summary, what, why, how, requirements })}`,
  ].join('\n')

  const prompt = buildSkillPrompt({ skillPath, brief })
  runDispatchAgy(prompt, {
    ...dispatchOptions,
    writeDir: outputDir,
    env: {
      ...dispatchOptions.env,
      SPRINT_AGY_STUB: 'shape-batch',
      SPRINT_SHAPE_SPEC: JSON.stringify(spec),
    },
  })

  if (!fs.existsSync(outPath)) {
    throw new Error(`Batch shaping via ${skillPath} did not produce ${outPath}`)
  }
  runBatchStructureCheck(outPath)
  const content = fs.readFileSync(outPath, 'utf8')
  return { outPath, skillPath, content }
}

function main() {
  const args = process.argv.slice(2)
  const modeIdx = args.indexOf('--mode')
  const mode = modeIdx !== -1 ? args[modeIdx + 1] : 'project'
  const slugIdx = args.indexOf('--slug')
  const slug = slugIdx !== -1 ? args[slugIdx + 1] : 'sample-project'

  if (mode === 'project') {
    const res = shapeProject({ slug })
    console.log(`Project shaped at ${res.outPath} via ${res.skillPath}`)
  } else if (mode === 'batch') {
    const batchIdx = args.indexOf('--batch')
    const batchName = batchIdx !== -1 ? args[batchIdx + 1] : '1-alpha'
    const res = shapeBatch({ slug, batchName })
    console.log(`Batch shaped at ${res.outPath} via ${res.skillPath}`)
  } else {
    console.error('Unknown mode: ' + mode)
    process.exit(1)
  }
}

if (process.argv[1] && realpathSync(path.resolve(process.argv[1])) === realpathSync(fileURLToPath(import.meta.url))) {
  main()
}
