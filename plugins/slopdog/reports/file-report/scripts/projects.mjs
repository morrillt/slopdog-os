// projects.mjs -- reads tasks/projects/*.md the one way file-report.mjs and
// check-repo-collisions.mjs both need (T-718): each project's slug and the repo
// its `repo:` line claims, taken as the line's first token so a trailing note
// such as "(morrillt/dashboard)" still counts. A file counts only when it opens with front matter
// whose `project:` equals its file name.
import { readdirSync, readFileSync } from 'node:fs'

export function knownProjects (projectsDir, homeDir) {
  const out = []
  let names = []
  try { names = readdirSync(projectsDir).filter(n => n.endsWith('.md')) } catch { return out }
  for (const name of names.sort()) {
    const text = readFileSync(`${projectsDir}/${name}`, 'utf8')
    if (!text.startsWith('---\n')) continue
    const fm = text.slice(4).split('\n---')[0]
    const slug = /^project:\s*(\S+)\s*$/m.exec(fm)?.[1]
    if (!slug || slug !== name.slice(0, -3)) continue
    const repo = /^repo:\s*(\S+)/m.exec(fm)?.[1]?.replace(/^~(?=\/|$)/, homeDir).replace(/\/+$/, '') ?? ''
    out.push({ slug, repo })
  }
  return out
}

// Every repo claimed by more than one project: [{ repo, slugs: [...] }], sorted by repo.
export function repoCollisions (projects) {
  const byRepo = new Map()
  for (const p of projects) {
    if (!p.repo) continue
    byRepo.set(p.repo, [...(byRepo.get(p.repo) ?? []), p.slug])
  }
  return [...byRepo].filter(([, slugs]) => slugs.length > 1)
    .map(([repo, slugs]) => ({ repo, slugs }))
    .sort((a, b) => a.repo.localeCompare(b.repo))
}
