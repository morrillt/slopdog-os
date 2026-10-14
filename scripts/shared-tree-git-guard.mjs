#!/usr/bin/env node
// PreToolUse(Bash) guard for the shared trees, ~/slopdog and ~/slopdog/tasks, which every desk has
// open at once (principles.md, "Never check out a branch, or stash, in the shared tree"). The
// retrospectives logged ~37 collisions and 15+ hours from exactly these moves, so they are refused
// here instead of remembered:
//   git stash (any form), --autostash, git checkout/switch to a branch, and a git commit that does
//   not name its paths after `--` (a bare commit ships whatever another desk had staged).
// Allowed: `git checkout -- <file>`, `git commit ... -- <paths>`, everything outside the two trees
// (a worktree at ~/slopdog-<branch> or a nested repo like dev/playground/runner is its own tree).
// Exit 2 refuses with the reason on stderr; anything unexpected exits 0 so a bug never blocks work.
import { readFileSync, realpathSync } from 'node:fs'
import { homedir } from 'node:os'
import { resolve } from 'node:path'
import { spawnSync } from 'node:child_process'

const HOME = homedir()
const real = (p) => { try { return realpathSync(p) } catch { return resolve(p) } }
const SHARED = new Set([real(`${HOME}/slopdog`), real(`${HOME}/slopdog/tasks`)])

const expand = (p, cwd) => resolve(cwd, p.replace(/^~(?=\/|$)/, HOME).replace(/^["']|["']$/g, ''))
function toplevel(dir) {
  const r = spawnSync('git', ['-C', dir, 'rev-parse', '--show-toplevel'], { encoding: 'utf8' })
  return r.status === 0 ? real(r.stdout.trim()) : null
}

/** The refusal reason for one shell command run from `cwd`, or null. Exported for the test. */
export function refusal(command, cwd, isShared = (dir) => SHARED.has(toplevel(dir))) {
  let dir = cwd
  // Quoted strings (a multi-line commit message, a --what "…") become one placeholder word, so a
  // newline or a `git stash` inside a message never splits or trips a command.
  const unquoted = command.replace(/"(?:[^"\\]|\\.)*"|'[^']*'/g, 'Q')
  for (const part of unquoted.split(/&&|\|\||;|\n|\|/)) {
    const words = part.trim().split(/\s+/).filter(Boolean)
    if (words[0] === 'cd' && words[1]) { dir = expand(words[1], dir); continue }
    // git as the command itself (after any VAR=x prefixes), never a word inside a quoted message.
    const g = words.findIndex((w) => !/^[A-Za-z_][A-Za-z0-9_]*=/.test(w))
    if (g === -1 || words[g] !== 'git') continue
    let i = g + 1
    let target = dir
    while (words[i] && words[i].startsWith('-')) {
      if (words[i] === '-C' && words[i + 1]) { target = expand(words[i + 1], target); i += 2 } else i += 1
    }
    const sub = words[i]
    const rest = words.slice(i + 1)
    if (!sub || !isShared(target)) continue
    const where = `the shared tree (${target})`
    if ((sub === 'stash' && !['list', 'show'].includes(rest[0])) || rest.includes('--autostash'))
      return `git stash / --autostash in ${where} unstages every other desk's work. Commit your own paths instead: git add <paths> && git commit -m "…" -- <paths>.`
    if ((sub === 'checkout' || sub === 'switch') && !rest.includes('--') && rest.some((w) => !w.startsWith('-') || w === '-b' || w === '-c'))
      return `git ${sub} to a branch in ${where} rewrites files other desks are editing. Use a worktree: git worktree add ../slopdog-<branch> <branch>. (Restoring a file is fine: git checkout -- <file>.)`
    if (sub === 'commit' && !rest.includes('--'))
      return `a git commit in ${where} without "-- <paths>" ships whatever another desk has staged. Name your paths: git add <paths> && git commit -m "…" -- <paths>.`
  }
  return null
}

if (import.meta.url === `file://${real(process.argv[1] || '')}`) {
  try {
    const input = JSON.parse(readFileSync(0, 'utf8'))
    const reason = refusal(String(input.tool_input?.command || ''), input.cwd || process.cwd())
    if (reason) { process.stderr.write(`shared-tree-git-guard: ${reason}\n`); process.exit(2) }
  } catch {}
  process.exit(0)
}
