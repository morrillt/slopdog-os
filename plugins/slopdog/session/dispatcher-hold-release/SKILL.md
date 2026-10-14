---
name: dispatcher-hold-release
description: Manage dispatcher holds in holds.json and leave progress notes on release. Holds live in ~/slopdog/v2/desks/build/tyrion/holds.json. Routing mechanics will eventually live in T-477 (/slopdog:dispatch); this skill names T-477 as the future owner and operates independently. Use when placing or releasing a hold on a ticket.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# dispatcher-hold-release — hold and release dispatcher tickets

Holds live in one file, `~/slopdog/v2/desks/build/tyrion/holds.json`, each entry `{id, reason, held_by, release_when}`. `ready-queue.mjs` excludes any ticket with a hold. Releasing one removes its entry and leaves a Progress note on the ticket.

Routing mechanics will eventually live in **T-477**, the `/slopdog:dispatch` skill. This skill names T-477 as the future owner of routing mechanics and never calls it.

## Behaviour

1. **Holds file**: `~/slopdog/v2/desks/build/tyrion/holds.json`, the build lane's `lanes.json` folder; if `lanes.json` moves that lane, the file moves with it.
2. **Hold entry format**: `{id, reason, held_by, release_when}`.
3. **Queue exclusion**: `ready-queue.mjs` excludes any ticket with an active entry in `holds.json`.
4. **Releasing a hold**:
   - Remove the entry matching `id` from `holds.json`.
   - Leave a Progress note on the ticket file recording that the hold was released.
