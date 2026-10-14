#!/usr/bin/env node
/**
 * Structural checklist for project-writer output (tasks/projects/*.md). Exit 1 names the first failure.
 */
import { readFileSync } from 'node:fs'
import { homedir } from 'node:os'

const path = process.argv[2]
if (!path) {
  console.error('usage: check-project-structure.mjs <project.md>')
  process.exit(2)
}

const text = readFileSync(path, 'utf8')

if (!text.startsWith('---')) {
  console.error('missing unified YAML front matter at file start')
  process.exit(1)
}

const frontMatterBlocks = text.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/gm)
if (!frontMatterBlocks || frontMatterBlocks.length !== 1) {
  console.error('expected exactly one front matter block')
  process.exit(1)
}

const required = [
  /^# .+/m,
  /^## Summary$/m,
  /- \*\*What:\*\*/,
  /- \*\*Why:\*\*/,
  /- \*\*How:\*\*/,
  /^## Definition of Done$/m,
  /\*\*FR-\d+/,
  /\*Verify:\*/,
  /^## Discussion & Open Questions$/m,
  /^## Appendix/m,
]

for (const re of required) {
  if (!re.test(text)) {
    console.error(`missing required section or pattern: ${re}`)
    process.exit(1)
  }
}

// Department type (T-652): warn only, never fail.
const { departmentTypeWarnings } = await import(`${homedir()}/slopdog/tasks/bin/lib/department-type.mjs`)
for (const w of departmentTypeWarnings(text)) console.log(`warning: ${w}`)

console.log('project structure ok')
