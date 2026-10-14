# Where a system change goes

Todd, 2026-10-08: "I don't want to have to keep on dictating you the best way to do it."
When a conversation produces a change to how the house works (a hotfix, a new habit, a
"from now on"), the desk decides where it lives using this rubric, says the choice in one
line ("put it in X because Y"), and Todd overrides only if he disagrees.

**1. Reuse first.** Before adding anything, check what already exists: the Skills Manifest,
`v2/scripts/`, `plugins/slopdog/hooks/`, `v2/rules/`, `v2/memory/MEMORY.md`. Extending an
existing script, skill or rule beats a new one (`principles.md`, "One mechanism per job").

**2. Pick the smallest mechanism that cannot be forgotten.**

| The change is… | It goes in… |
| --- | --- |
| Something that must happen every time, where a miss is costly | Code: a check in the script that already runs at that moment (`dispatch.mjs`, a hook). Enforced beats remembered. |
| A procedure someone runs on a trigger | A step in an existing skill, or a new skill via `/slopdog:edit-skill` |
| A judgement every session of a desk needs | One line in the narrowest CLAUDE.md that covers it; past a few lines, a `rules/` file it imports |
| A fact or a lesson learned | A memory shard (`~/.claude/rules/memory.md`) |
| A change to the assumptions open tickets were written under | An entry in `~/slopdog/tasks/assumptions.jsonl`, then `node ~/slopdog/v2/scripts/assumption-sweep.mjs --write` |
| A one-off | Nothing. Do it. |

**3. Every system change ships with:** the reference doc revised in the same turn; an
assumptions entry plus a sweep if it changes how a ticket would be written (a desk, a
lane, a path, an engine policy, who builds what); a retrospective line if it came from a
miss; and one line to Todd naming where it went and why.

**4. Hotfixes are where this bites.** Most of Todd's hotfixes change a working assumption,
so the assumptions entry and the sweep are part of the hotfix itself, never a follow-up.

**5. The always-on ceiling is 800 lines (Todd, 2026-10-12: "I approve the suggestion of an
800 line cap").** The rules every session loads stay at or under 800 lines. A change that takes
them past 800 removes as many lines in the same change. `scripts/framework-audit.mjs` prints
the count and the headroom on page 1 every week.
The skill listing has a ceiling too: the descriptions every session sees (description plus
when_to_use, skipping skills with `disable-model-invocation: true`) stay at or under 18,000
characters, half of the 36,700 counted on 2026-10-12 (Todd: "get it down 50% and then we
should keep it down by having a ceiling"). A skill only a parent skill, a toolbox or a slash
command reaches carries `disable-model-invocation: true`.
