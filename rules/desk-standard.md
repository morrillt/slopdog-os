# The desk standard

What every desk folder (`desks/<key>/`) holds. `/slopdog:memory-audit` checks each desk against
this file.

- **Identity block.** The desk's `CLAUDE.md` opens with one role line whose name and title match
  the lane's `name` and `title` in `lanes.json`.
- **Thin instructions.** `CLAUDE.md` is a role and pointers, under about forty lines; depth lives
  in `rules/` and is imported.
- **Shared imports.** It @-imports `rules/principles.md`, `rules/output-style.md`,
  `rules/before-asking-todd.md`, `rules/memory.md` and `rules/desk-clear.md`, with no stale paths.
- **Memory.** A `memory/` folder with a `MEMORY.md` index of one-line pointers, one fact per
  shard, each shard carrying front matter `name`, `description` and `metadata.type` (one of
  `user`, `feedback`, `project`, `reference`).
- **Inbox and pickup.** An `inbox/` folder other desks write into, and a `PICKUP.md` written only
  when the desk clears.
