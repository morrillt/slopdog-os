# slopdog — the Slopdog plugin

`~/.claude/skills/slopdog/` is a skills-dir plugin (`slopdog@skills-dir`).
Everything in it invokes as **`/slopdog:<name>`**. Anything else under
`~/.claude/skills/` (`humanizer/`, …) is third-party — that's the whole point
of the convention: the prefix says whose it is.

Claude Code doesn't nest skill folders on its own; the grouping comes from the
manifest. Each directory listed in `.claude-plugin/plugin.json` → `skills` is
scanned for `<name>/SKILL.md`.

    slopdog/
      .claude-plugin/plugin.json     lists the group folders
      hooks/hooks.json               the hooks (gates, the context gauge, inbox wake-up, the turn log)
      meta/  session/  reports/  writing/
      <group>/<name>/SKILL.md        one skill; folder name = group name, always

- **Add a skill to a group:** `<group>/<name>/SKILL.md`. Loads live.
- **Add a group:** make the folder, append it to `skills` in the manifest.
- **The inventory is the Skills Manifest** — `~/slopdog/notes/Slopdog/How Slopdog Works/Skills Manifest.md`, the only copy. `/slopdog:edit-skill` keeps it current; this README is just the mechanics.
- **Names are one flat namespace.** The group folder is not in the invocation,
  so `reports/sync` and `git/sync` would collide. Pick names that read alone.
- Skill bodies that call their own scripts use the full path
  (`~/.claude/skills/slopdog/<group>/<name>/scripts/…`); moving a skill between
  groups means updating that line.
- Don't name a group `synced` — reserved by Claude Code.
- Project-scoped skills (`~/slopdog/.claude/skills`, `~/slopdog/tasks/.claude/skills`)
  stay where they are; they're already yours by location.
