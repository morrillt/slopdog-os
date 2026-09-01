# How the shims work

Broz OS lives in one place — `~/.slopdog` — and is *installed* into each tool
that needs to see it. Nothing under `~/.claude` or `~/.cursor` is edited by
hand. Run `./install.sh` and it is rebuilt from this repo.

```
                    ~/.slopdog            (canonical, git)
                         |
        ./install.sh  --- reads targets.conf + skills.conf
                         |
        +----------------+----------------+
        |                                 |
   ~/.claude/...                     ~/.cursor/...
   Claude Code                       Cursor
```

## Why this exists

`TICKET-US-018` hand-copied 18 command files out of a clone and then deleted the
clone. All seven acceptance criteria passed anyway, because AC-4 counted files
instead of resolving them:

```bash
find ~/.claude/commands/broz -maxdepth 1 -type f -name '*.md' | wc -l   # = 18
```

That returns 18 whether or not the thing those files point at exists. Every
shim's first instruction was *"read `~/.cursor/rules/broz/<x>.mdc`"*, and
`~/.cursor` did not exist on the Mac. `/brozmenu` was dead on a Done ticket.

The fix is not "remember to copy the files next time". It is that copies are
**generated artifacts** now, and `./install.sh --check` resolves what they point
at instead of counting them.

## The three artifact types

They are handled differently on purpose, because the tools treat them
differently.

| Artifact | Claude Code | Cursor | How |
|---|---|---|---|
| **commands** | `~/.claude/commands/broz/*.md` | `~/.cursor/commands/broz-*.md` | copied, rendered per tool |
| **skills** | `~/.claude/skills/slopdog/<group>/<name>/` | *same directory, via compat* | copied wholesale |
| **rules** | — | `~/.cursor/rules/broz` → symlink | symlinked |

Commands are copied because each tool wants a different file shape. Skills are
copied because the repo is their source of truth. Rules are symlinked because
they are one shared content tree read in place, not a per-tool artifact.

---

## Claude Code

**Commands** live in `~/.claude/commands/` (personal) or `.claude/commands/`
(project). Ours go in the `broz/` subdirectory, which is where the `broz:`
prefix comes from: `commands/broz/menu.md` → `/broz:menu`.

> One caveat worth knowing: the docs' naming table only covers the flat case —
> *"File under `.claude/commands/` … Command name source: File name without
> extension … `.claude/commands/deploy.md` → `/deploy`"*. It does not specify
> what a subdirectory does. The `broz:` prefix is **observed behaviour**, not
> documented behaviour. If a Claude Code release ever flattens it, the commands
> become `/menu`, `/plan`, `/task` — colliding with everything. That is the one
> assumption in this setup that is not backed by a doc.

**Frontmatter.** Command files take the same frontmatter as skills *except*
`name` and `paths`, which are ignored in a command file. We emit `description`,
which is what the picker shows:

```markdown
---
description: "Activate Broz Menu. (Trigger: `broz:menu`)"
---
```

**Skills** live in `~/.claude/skills/slopdog/<group>/<name>/SKILL.md` (the `slopdog` skills-dir plugin; see its README), and the command name
comes from the directory name — `.claude/skills/deploy-staging/SKILL.md` →
`/deploy-staging`.

**Direction of travel.** From the Claude Code docs:

> **Custom commands have been merged into skills.** A file at
> `.claude/commands/deploy.md` and a skill at `.claude/skills/deploy/SKILL.md`
> both create `/deploy` and work the same way. Your existing `.claude/commands/`
> files keep working. Skills add optional features: a directory for supporting
> files, frontmatter to control whether you or Claude invokes them, and the
> ability for Claude to load them automatically when relevant.

And on precedence:

> if a skill and a command share the same name, the skill takes precedence.

So the commands layout is supported, not deprecated, but skills are the
recommended shape. Converting would rename every command (`broz:menu` →
`broz-menu`, since skill names are `[a-z0-9-]+`), which is why it has not been
done. It is a one-line change to `targets.conf` plus a rename when it is wanted.

*Source: [code.claude.com/docs/en/skills](https://code.claude.com/docs/en/skills)*

---

## Cursor

**Rules** live in `.cursor/rules` as `.mdc` files:

> Project rules live in `.cursor/rules` as `.mdc` files and are
> version-controlled.

Frontmatter is `alwaysApply` (boolean), `description` (string), and `globs`
(string). `alwaysApply: true` ignores the other two.

We symlink rather than copy:

```
~/.cursor/rules/broz -> ../../.slopdog/rules/broz
```

The target is **relative**. US-018's ThinkPad symlinks were absolute and dangled
the moment the tree moved; a relative one does not.

**Commands** live in `.cursor/commands/*.md`, with `~/.cursor/commands/` as the
global equivalent. They are plain markdown prompt files — **no frontmatter
contract**, which is why the Cursor rendering omits the YAML block that the
Claude one carries. Cursor has no subdirectory namespacing, so the prefix moves
into the filename: `broz-menu.md` → `/broz-menu`.

> ⚠️ **Known Cursor bug.** Commands in the *global* `~/.cursor/commands` are
> reported as not always detected, despite being documented as supported. See
> [forum.cursor.com/t/…/150967](https://forum.cursor.com/t/commands-are-not-detected-in-the-global-cursor-directory/150967).
> If `/broz-menu` does not appear in Cursor's picker, this is why — and it is
> not a fault in this install. The workaround is below.

**Skills** are the reliable path, and they need no extra install. Cursor loads
skills from:

| Scope | Directories |
|---|---|
| Project | `.agents/skills/`, `.cursor/skills/` |
| Global | `~/.agents/skills/`, `~/.cursor/skills/` |
| Compatibility | `.claude/skills/`, `~/.claude/skills/`, `.codex/skills/`, `~/.codex/skills/` |

> For compatibility, Cursor also loads skills from Claude and Codex directories.

That last row is why `targets.conf` sets Cursor's skills dir to `-`. The skills
synced into `~/.claude/skills` are **already visible to Cursor**; copying them
into `~/.cursor/skills` as well would only produce duplicate picker entries.

`SKILL.md` requires two frontmatter fields: `name` (lowercase letters, numbers
and hyphens only, and it must match the parent folder name) and `description`.

**Cross-tool standard.** BMAD-METHOD points Cursor at `~/.agents/skills` — the
shared directory 27 of its ~40 supported platforms target. Nothing here uses it
yet, but it is the direction the ecosystem is converging on, and it is one line
in `targets.conf` if that becomes worthwhile.

*Sources: [cursor.com/docs/context/rules](https://cursor.com/docs/context/rules),
[cursor.com/docs/skills](https://cursor.com/docs/skills)*

---

## Using it

```bash
cd ~/.slopdog
./install.sh            # install/refresh; hand-edited shims are preserved
./install.sh --force    # overwrite hand-edited shims too
./install.sh --check    # report drift, change nothing; exit 1 if out of sync
```

`--check` is the one that matters. It resolves paths rather than counting files,
which is the check US-018 needed and did not have. Worth running after any tool
update that might rewrite its own config directory.

### Adding a tool

One line in `targets.conf`:

```
<id>	<display name>	<style>	<commands dir>	<skills dir>
```

Tab-separated. `style` is `claude` (frontmatter, nested dir supplies the prefix)
or `cursor` (plain markdown, flat dir, prefix in the filename). Use `-` for a
directory to skip that artifact type.

Targets whose parent directory does not exist are **skipped, not failed** — so
listing a tool you have not installed yet is harmless. Install it later and
re-run. That is exactly what happened here: Cursor was absent on the first run
and picked everything up on the second.

### Hand edits

Every generated file ends with:

```html
<!-- generated by ~/.slopdog/install.sh -- edit the source in ~/.slopdog/commands/broz/ -->
```

A file carrying that marker is refreshed in place. A file *without* it is
treated as hand-written and left alone, with a `keep` line in the output.
`--force` overrides. This follows BMAD's `looksLikeGeneratorOutput` check, which
exists for the same reason: a generator that silently eats hand edits gets
turned off, and then you are back to hand-copying.

### `skills.conf` is a safety list, not bookkeeping

`~/.claude/skills` also holds `broz-report`, `cmux-panel`, `gdocs`,
`file-report`, `humanizer` and the `pizza-*` skills, none of which come from
this repo. The sync only touches names listed in `skills.conf` and **never
cleans the directory**, so a target's standalone skills can never be collateral.

---

## Design notes

**Why `~/.slopdog` and not `~/.cursor`.** `~/.cursor` was doing two jobs: Cursor's
own config directory (2.7 GB of gitignored extensions, worktrees and chat logs)
*and* the canonical home of Broz OS (69 MiB of real content). That collision is
what made the migration lossy — the agent could not clone over a live config
dir, so it cloned to a temp, copied files out, and deleted the source. Splitting
them makes that failure impossible, and `~/.slopdog` matches the `~/slopdog/`
root naming.

**Why copies and not symlinks for commands.** Copies were never the problem.
BMAD copies too, cleaning the target first. The problem was copies with *no
installer to re-run*. Copies also let each tool get the file shape it wants —
Claude's frontmatter, Cursor's plain markdown — which a single symlinked file
cannot do.

**Why literal `~/.slopdog` in the content, not a placeholder.** BMAD expands
`{project-root}` everywhere because it ships to thousands of users with
different roots. There is one machine here. Templating 200 content files would
add a build step between Todd and files he edits by hand, and buy portability
that will never be spent. The placeholders stay where they earn their keep: the
shim templates, which are the thing that broke.

*Pattern reference: BMAD-METHOD v6.11.0, `tools/installer/ide/_config-driven.js`
and `tools/installer/ide/platform-codes.yaml`.*
