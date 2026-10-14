#!/usr/bin/env node
// check-repo-collisions.mjs -- lists every repo that more than one
// tasks/projects/<slug>.md claims with `repo:` (T-718). file-report.mjs refuses
// to file from such a repo without --project, so a collision here is a filing
// that will stop; resolve it by dropping or changing one project's `repo:` line.
// Usage: check-repo-collisions.mjs [projects-dir]   (default ~/slopdog/tasks/projects)
// Exit 1 when any repo is claimed twice, 0 when none is.
import { homedir } from 'node:os'
import { knownProjects, repoCollisions } from './projects.mjs'

const HOME_DIR = process.env.HOME || homedir()
const dir = process.argv[2] || `${HOME_DIR}/slopdog/tasks/projects`
const projects = knownProjects(dir, HOME_DIR)
const collisions = repoCollisions(projects)
const claimed = projects.filter(p => p.repo).length
if (!collisions.length) {
  console.log(`no repo collisions: ${claimed} of ${projects.length} projects in ${dir} declare repo:, each claimed once`)
  process.exit(0)
}
for (const c of collisions) console.log(`${c.repo} claimed by ${c.slugs.join(', ')}`)
console.log(`${collisions.length} repo(s) claimed by more than one project in ${dir}`)
process.exit(1)
