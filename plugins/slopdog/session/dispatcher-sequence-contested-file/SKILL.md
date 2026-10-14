---
name: dispatcher-sequence-contested-file
description: Sequence queued tickets that edit the same file under contested[path] in holds.json so only the head is dispatchable. Routing mechanics will eventually live in T-477 (/slopdog:dispatch); this skill names T-477 as the future owner and operates independently. Use when multiple queued tickets contest the same file.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# dispatcher-sequence-contested-file — sequence tickets contesting the same file

For a file that several queued tickets edit, keep an ordered list in `holds.json` under `contested[path]`; only the head of that list is dispatchable.

Routing mechanics will eventually live in **T-477**, the `/slopdog:dispatch` skill. This skill names T-477 as the future owner of routing mechanics and never calls it.

## Behaviour

1. When multiple queued tickets need to edit the same file path:
2. Record the path in `~/slopdog/v2/desks/build/tyrion/holds.json` under `contested[path]` as an ordered array of ticket IDs: `[headTicketId, nextTicketId, ...]`.
3. `ready-queue.mjs` checks `contested[path]`: only the head of the list (`ids[0]`) is dispatchable. All subsequent tickets in the list are excluded from the ready queue.
4. When the head ticket completes and lands, remove it from `contested[path]`, promoting the next ticket to the head.
