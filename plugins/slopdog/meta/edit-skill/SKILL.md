---
name: edit-skill
description: >-
  Create a new personal skill or adjust an existing one so it lands in the right place under the slopdog plugin — correct group folder, unique name, manifest entry, absolute script paths, installer-owned sources respected, reload — and always finishes by refreshing the Skills Manifest in the vault and committing. Use whenever Todd says "edit skill", "/slopdog:edit-skill", "make a skill", "new skill", "add a skill", "change the X skill", "move X to another group", "fix the X skill", or describes a repeatable thing he wants as a skill. Two modes: create and adjust.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# edit-skill — every personal skill ends up in the same shape

**Step 0 — read the manifest.** It lives in the vault, and **only** there:

```
~/slopdog/notes/Slopdog/How Slopdog Works/Skills Manifest.md
```

One file, no copies, no symlink. Its frontmatter says which skills read and
write it (this one does both). It is the convention *and* the inventory of
every skill Todd owns. Read it before touching anything; the last two steps of
both modes write back to it. Nothing here is finished until the manifest says so.

## Where things are, in one breath

The plugin's source is **`~/slopdog/v2/plugins/slopdog/`**, inside the
`~/slopdog` repo (`morrillt/slopdog`). Claude Code reaches it through the
skills symlink in the personal skills folder, `$HOME/.claude/skills/slopdog`,
a relative link (`../../slopdog/v2/plugins/slopdog`) that `bin/slopdog use vN`
retargets, so the same link resolves on the Mac and the ThinkPad. Edit under
`~/slopdog/v2/plugins/slopdog/`; the symlinked paths inside skills keep
resolving. Never edit through the symlink.

A skill is `~/slopdog/v2/plugins/slopdog/<group>/<name>/SKILL.md`, invoked as
`/slopdog:<name>`. The group is a folder listed in
`~/slopdog/v2/plugins/slopdog/.claude-plugin/plugin.json` → `skills`. The group
is **not** in the command, so `<name>` must be unique across every group.

Three git repos are involved, each its own remote: `~/slopdog` (the plugin,
`v2/`, `v1/`), `~/slopdog/tasks` (the project skills), `~/slopdog/notes` (the
manifest). `~/slopdog/v1` is frozen: copy out of it, never edit it.

## Mode 1 — create

**Step 1 — personal or project-scoped?** Useful in any folder → the slopdog
plugin. Tied to one folder (a task list, a deal, one repo) →
`<that folder>/.claude/skills/<name>/`, no prefix. Unsure → personal.

**Step 2 — pick the group.** Reuse one from manifest §2 (meta, session,
reports, writing). Nothing fits → **ask Todd
before creating a group**, naming the closest existing one and why it
doesn't fit. Only after he says yes: make the folder, add `"./<group>/"` to
`plugin.json`'s `skills` array, add the §2 row.

**Step 3 — pick the name.** Kebab-case, reads alone without the group
(`small-text` yes, `up` no). Confirm it's unused:
`find ~/slopdog/v2/plugins/slopdog -name SKILL.md -path "*/<name>/*"`.

**Step 4 — write `SKILL.md`.** Frontmatter: `name`, `description` written as
*when to use me*, with the phrases Todd actually says (that's what triggers
it), `allowed-tools` if it needs fewer than everything. Body: numbered steps —
Todd wants step one, step two, step three — what to run, what to say back,
what not to do. Short. Retired words: Peak, peak, lane. Say slopdog screen and
desk.

**Step 5 — scripts** go in `scripts/`, called by **full path** in the body,
through the skills symlink so the line works on both machines:
`$HOME/.claude/skills/slopdog/<group>/<name>/scripts/<file>`. Node (`.mjs`)
over bash for anything beyond a one-liner. `chmod +x`.

**Step 6 — validate.** `claude plugin validate ~/slopdog/v2/plugins/slopdog`.

**Step 7 — register.** A skill added to an existing group loads live; a new
group needs Todd to run `/reload-plugins`. Say so — you cannot run it.

**Step 8 — refresh the manifest.** Add the row to the group's table in the
manifest (path in Step 0): the command as a `file://` link to its
`SKILL.md`, a one-liner, links to any scripts. Bump the count in "Checking it
worked". Then prove it:

```bash
node ~/slopdog/v2/plugins/slopdog/meta/edit-skill/scripts/check-manifest.mjs
```

It exits 1 and names every skill on disk without a row and every link that
doesn't resolve. **Do not go to step 9 until it prints `manifest is fresh`.**
The manifest's `file://` links are absolute Mac paths, so on the ThinkPad the
check reports every link dead; there, run it on a copy with
`~` rewritten to `$HOME` and say which machine you checked on.

**Step 9 — reference doc.** If a note under
`~/slopdog/notes/Slopdog/How Slopdog Works/` describes this skill or the piece
of the harness it changes, read that note now — never from memory — and
revise it in place to match what you just built: delete the stale sentence,
never append a correction. Add one dated line to that folder's
`Changelog.md`. No such note exists → say so; nothing to update. When the
change touches how Claude Code itself behaves (a hook, a subagent's
`tools`/`model`, a slash command, a setting) rather than only this skill's own
text, consult the `claude-code-best-practices` subagent first and cite what it
found before writing the doc. This step folds in what `sd-meta-docs` used to
do — that subagent is retired.

**Step 10 — commit and push** — two repos: `~/slopdog` for the skill,
`~/slopdog/notes` for the manifest and any reference doc, staged by path. The
messages say why the skill exists.

## Mode 2 — adjust

**Step 1 — find it in the manifest.** The row gives the path and says whether
it's installer-managed.

**Step 2 — installer-managed?** (`conversation-log`, `web-search`,
`youtube-publish`.) Then the
copy under `slopdog/` is **not** the source. Edit `~/.slopdog/skills/<name>/`,
run `cd ~/.slopdog && ./install.sh`, and commit and push `~/.slopdog` (repo
`slopdog-os`) in step 6 as well. On a machine where `~/.slopdog` has no
`skills/` folder, the installer never ran there: edit in place and say so.

**Step 3 — make the change.** Text-only edits to a `SKILL.md` pick up live,
no reload. Renaming or moving groups: `git -C ~/slopdog mv` the folder, then
grep for the old path and the old `/slopdog:<name>` in
`~/slopdog/v2`, `~/slopdog/**/CLAUDE.md`, `~/slopdog/**/.claude`, the
personal `agents/` and `skills/` folders, and `~/.slopdog`, and fix every
hit. If installer-managed, the group column in `~/.slopdog/skills.conf`
changes too. Moves need `/reload-plugins` — say so.

**Bringing a skill in from v1.** Copy the folder (`cp -r`, never `git mv`) from
`~/slopdog/v1/...` into its v2 group. In the copy, rewrite every `~/slopdog/v1/`
path to its v2 equivalent (or drop it when v2 has no equivalent, and say so),
and retire Peak/peak/lane for slopdog screen/desk. v1 keeps its copy.

**Step 4 — validate.** `claude plugin validate ~/slopdog/v2/plugins/slopdog`.

**Step 5 — refresh the manifest.** Update the row — one-liner, path, name,
whichever changed — then run the same check as create step 8. **`manifest is
fresh` or you're not done.**

**Step 6 — reference doc**, same as create step 9.

**Step 7 — commit and push**, same as create step 10.

## Project skills (no prefix)

Same steps minus the manifest and the prefix. Path is
`<folder>/.claude/skills/<name>/SKILL.md`; the task skills live in
`~/slopdog/tasks/.claude/skills/` and commit to the `tasks` repo. So a desk
under `~/slopdog/v2/` loads them too, `~/slopdog/v2/.claude/skills/` holds one
**relative** symlink per task skill (`../../../tasks/.claude/skills/<name>`);
a new task skill gets its link there in the same turn. The manifest row goes
under "Project skills"; `check-manifest.mjs` scans those folders too.

## Don't

- Don't put a skill flat in the personal skills folder — that's for
  third-party plugins only.
- Don't invent a second prefix level. `/slopdog:meta:x` doesn't exist.
- Don't edit `humanizer/` or anything in the plugin cache.
- Don't name a group `synced`.
- Don't edit `~/slopdog/v1`. It is frozen; copy from it.
- Don't open the manifest or the skill in a panel afterwards. Todd opens what he
  wants to read.
- Don't skip the manifest, and don't make a second copy of it anywhere. It's
  the inventory; stale or duplicated means the next edit lands in the wrong
  place. The check exists so this can't be forgotten quietly.

## Reply format

Path written, command to type, whether `/reload-plugins` is needed, the
check-manifest result line and which machine it ran on, what the reference
doc step did (updated a note, consulted best-practices, or nothing to
update), commit hashes (both repos). Nothing else.
