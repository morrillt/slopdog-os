---
name: small-text
description: Pop a thin text pane (about five rows) directly above Todd's current cmux pane, running an editor on a notes file, and hand the cursor straight back to him. Use when Todd says "small text", "/slopdog:small-text", "pop a little window up", "give me a notes pane", "somewhere to type", "thin pane on top", or wants a scratch editor while the conversation keeps going. Also for resizing that pane afterwards ("make it thinner", "half that").
allowed-tools:
  - Bash
disable-model-invocation: true
---

# small-text — a thin notes pane on top

Todd likes a sliver of editor above the conversation to jot in while we work.
One script does the whole thing; don't reproduce its steps by hand.

## Run it

```bash
node ~/.claude/skills/slopdog/cmux/small-text/scripts/small-text.mjs
```

Defaults: 5 rows, `./notes.md` in the current directory (created if missing),
`$EDITOR` or the first of nvim/vim/nano, cursor handed back to Todd's pane.

```bash
… --rows 8                       # taller
… --file ~/slopdog/tasks/notes.md   # a specific file
… --cmd "tail -f build.log"      # something other than an editor
… --focus                        # leave the cursor in the new pane
```

It prints `pane:N surface:M rows=R`. Tell Todd the pane is up and which file
it's on; nothing else. The editor uses one row for its status line, so
`--rows 5` shows four lines of text — if he asks for "five lines of text",
pass `--rows 6`.

## Resizing it later

`cmux resize-pane` moves a **border**, and the border that matters is the one
between the new pane and Todd's. Resize from Todd's pane, not the small one:

```bash
CMUX=/Applications/cmux.app/Contents/Resources/bin/cmux
$CMUX resize-pane --pane <todd's pane> -U --amount <px>   # thinner (px ≈ rows × 17)
$CMUX resize-pane --pane <todd's pane> -D --amount <px>   # taller
$CMUX focus-pane  --pane <todd's pane>
```

`-U`/`-D` on the small pane itself hits its *top* border and steals from
whatever is above — that's the mistake that made three resizes in a row do
nothing visible (2026-08-31). Verify with
`$CMUX list-panes --json` (`rows` and `pixel_frame.height` per pane) rather
than `capture-pane`, which doesn't reflect size.

## Closing it

Todd quits the editor and the pane's shell stays. Close the pane outright:

```bash
$CMUX close-surface --surface <surface>; $CMUX focus-pane --pane <todd's pane>
```

## Why it lives under slopdog/

`~/.claude/skills/slopdog/` is a skills-dir plugin holding all of Todd's own
skills, grouped in folders (this one: `cmux/`). See
`~/.claude/skills/slopdog/README.md` for how to add more.
