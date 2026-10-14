// Skill discovery shared by framework-audit.mjs and docs-gather.mjs.
// Plugin skills are <group>/<name>/SKILL.md. Project skills are one folder deep
// under ~/slopdog/tasks/.claude/skills and are named tasks/<name>.
import { existsSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const dirs = (p) => {
  try {
    return readdirSync(p, { withFileTypes: true })
      .filter((d) => d.isDirectory() || d.isSymbolicLink())
      .map((d) => d.name)
  } catch {
    return []
  }
}

export function discoverSkills(pluginDir, tasksSkillsDir) {
  const byGroup = {}
  for (const g of dirs(pluginDir)) {
    for (const s of dirs(join(pluginDir, g))) {
      if (existsSync(join(pluginDir, g, s, 'SKILL.md'))) (byGroup[g] ||= []).push(s)
    }
  }
  const project = dirs(tasksSkillsDir).filter((s) => existsSync(join(tasksSkillsDir, s, 'SKILL.md')))
  const ids = Object.entries(byGroup)
    .flatMap(([g, names]) => names.map((n) => `${g}/${n}`))
    .concat(project.map((s) => `tasks/${s}`))
  return { byGroup, project, ids }
}

export function skillFile(pluginDir, tasksSkillsDir, id) {
  if (id.startsWith('tasks/')) return join(tasksSkillsDir, id.slice('tasks/'.length), 'SKILL.md')
  const [group, name] = id.split('/')
  return join(pluginDir, group, name, 'SKILL.md')
}
