---
name: team-layout
description: After named teammates are spawned in a cmux claude-teams session, move their panes into a left-hand strip — the caller keeps ~2/3 of the width, the teammates stack vertically in a ~1/3 strip on the caller's LEFT — then hand focus back. Use when Todd says "team layout", "/slopdog:team-layout", "arrange the team", "fix the panes", "stack the teammates", "put them on the left", "clean up the panel", or right after spawning multiple named teammates when their panes are still scattered below the caller. Optional width arg (default 1/3, e.g. "half").
allowed-tools:
  - Bash
---

# team-layout — move teammates into a left strip

cmux always splits a teammate's pane **down** from the caller — that's
decided inside `cmux __tmux-compat`, not controllable at spawn. So this skill
is entirely post-hoc rearrangement: build a strip to the caller's left, move
each teammate surface into it, discard the placeholders, resize, refocus.

Facts below are from hands-on experiment (2026-09-01, cmux 0.64.x, Claude
Code v2.1.251). Don't re-derive them; use them.

```bash
CMUX=${CMUX_CLAUDE_TEAMS_CMUX_BIN:-/Applications/cmux.app/Contents/Resources/bin/cmux}
MAP="node ~/.claude/skills/slopdog/cmux/team-layout/scripts/pane-map.mjs"
```

`$CMUX` is not on `PATH` — always call it by full path or through the env var.
`$MAP` prints every pane sorted by (x, y): `ref`, geometry, a `*` if it's
focused, its `selected_surface_ref`, and `(+N more)` if it holds more than
one surface as tabs. It does **not** print titles — `list-panes --json` has
no title field, only `ref`, `pixel_frame`, `focused`, `selected_surface_ref`,
`surface_refs` (verified against cmux 0.64 output). Get titles from `cmux
tree` (step 3) and match them to panes by `selected_surface_ref`. Run `$MAP`
after every move or resize, not just at the start — a resize on a column
boundary can move panes you didn't touch.

## Steps

1. **Identify the caller.** `$CMUX identify` → `caller.pane_ref` and
   `caller.surface_ref`. This is stable even after teammates have already
   split below it, so it's safe to call this after spawn, not just before.

2. **Map the panes.** Run `$MAP` and note the caller pane's `x`, `y`, `width`,
   `height` — `width` is what the strip's target width is computed from.

3. **Find the teammate panes.** Each teammate's surface title starts with
   `✳` (its session title). Run `$CMUX tree --workspace <caller's workspace>`
   to map panes → surfaces → titles and pick out every `✳`-titled surface
   that isn't the caller's own.

   **Order them by what they do, in the order the work flows through them** —
   not by current `y`, and not by spawn order. Spawn order is an accident of
   which `Agent` call the harness started first; the strip should read top to
   bottom the same direction as the pipeline, so the screen matches the mental
   model. An estimate/validate/answer team stacks `Estimator → Validator →
   Answerer`, matching `/tickets-estimate → /tickets-validate →
   /tickets-answer`.

   If the roles don't imply an order, ask Todd for it once, in one line. Don't
   invent a pipeline from names you haven't been told about.

4. **Reuse the strip if one already exists.** Look at the pane map for a
   column of panes immediately left of the caller's `x`. If Todd has run
   this skill before, that column is the strip. Panes in it whose current
   surface is a plain shell (title doesn't start with `✳`) are empty slots
   from a teammate that already finished — reuse them before creating
   anything new. Only build new slots for teammates beyond what's already
   free.

5. **Build any new slots needed.**
   - First new slot: `$CMUX new-split left --surface <caller surface> --focus false`
     → `OK surface:N`. That pane becomes the top (or next) of the strip.
   - Each additional slot: `$CMUX new-split down --surface <strip surface> --focus false`,
     splitting off the last slot pane, once per remaining teammate.
   - Every `new-split` creates a placeholder terminal surface sitting in the
     new pane — track its surface ref, you'll close it in the next step.

6. **Place each teammate**, top of the strip to bottom, one at a time:
   ```bash
   $CMUX move-surface --surface <teammate surface> --pane <slot pane> --focus false
   $CMUX close-surface --surface <placeholder surface>
   ```
   The teammate's *original* pane (the one it split down from the caller)
   is now empty and closes itself — no separate cleanup for it. `--focus
   false` on `move-surface` does not reliably hold focus, so don't rely on
   it; step 8 fixes focus at the end regardless.

7. **Resize to target.**
   - Strip target width = `width_arg` (default `1/3`, "half" → `1/2`) ×
     the caller's *original* width from step 2.
   - The strip and the caller share a column boundary, so one resize moves
     both: `$CMUX resize-pane --pane <a strip pane> -R --amount <px>` grows
     the strip rightward (shrinking the caller) by `<px>`. The flag names
     the edge of the *given* pane that moves outward — `-R` on the strip
     pane, not `-L` on the caller, since growing the strip is the intent.
   - Resizing a column boundary resizes the **whole column**, not just the
     one pane you named — run `$MAP` after to confirm every strip pane and
     the caller moved together, not just one row.
   - Equalize stack heights: target each slot at `(strip height / n)`.
     Resize from the pane *above* the border you want to move, same
     "shrink the neighbour" logic as `-R` above, and re-check `$MAP` after
     each one — resizing the wrong pane's border is a silent no-op, not an
     error.

8. **Refocus.** `$CMUX focus-pane --pane <caller pane>`. Do this last, after
   every move and resize — earlier `--focus false` calls are not durable.

## Gotchas

- `drag-surface-to-split` refuses on a single-surface pane ("splitting off
  would leave the source pane empty") — so it is no use for the initial build,
  where every teammate sits alone in its own pane. `new-split` + `move-surface`
  is the only path there.

  It *is* the way to **reorder** a strip that already exists, though (verified
  2026-09-02). To lift one teammate above another:

  ```bash
  $CMUX move-surface --surface <mover> --pane <pane it should sit above> --focus false
  $CMUX drag-surface-to-split --surface <mover> up --focus false
  ```

  The first call parks the mover as a second tab in the target pane — which
  makes the target a two-surface pane, and collapses the mover's now-empty
  original. The second splits it back out above. There is no `reorder-pane`;
  pane order is geometry, and this is how you change it.

- `resize-pane -U` grows a pane **upward**, into its neighbour above; `-D`
  grows it downward. Picking the wrong one silently inverts the resize instead
  of erroring, so re-run `$MAP` after every single one.
- Don't try to control split direction at spawn time — it's always `down`,
  decided inside `cmux __tmux-compat`. This skill exists because that can't
  be changed; placement is necessarily after the fact.
- A ~19-column strip is unreadable, just an activity light. Default to 1/3
  of the caller's original width; let Todd say "half" for wider.

## Related

- `/layout` in `~/slopdog/tasks` — the full three-column house layout for that
  project, which owns the same pipeline-order rule. This skill is the general
  case: teammates into a strip, any project.

## Why it lives under slopdog/

`~/.claude/skills/slopdog/` is a skills-dir plugin holding all of Todd's own
skills, grouped in folders (this one: `cmux/`, alongside
`small-text`). See `~/.claude/skills/slopdog/README.md`.
