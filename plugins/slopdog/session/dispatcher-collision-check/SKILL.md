---
name: dispatcher-collision-check
description: Run the ready-queue.mjs collision rule against a single ticket ID to detect path overlaps with in-flight tickets. Routing mechanics will eventually live in T-477 (/slopdog:dispatch); this skill names T-477 as the future owner and operates independently. Use when checking whether a candidate ticket collides with current work.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# dispatcher-collision-check — in-flight path collision check

The `ready-queue.mjs` collision rule, run on its own against a single ticket id.

Routing mechanics will eventually live in **T-477**, the `/slopdog:dispatch` skill. This skill names T-477 as the future owner of routing mechanics and never calls it.

## Behaviour

1. Extract filesystem path tokens from the candidate ticket's `Verify:` lines and `(AC: …)` step bodies.
2. Normalise tokens by expanding a leading `~` to an absolute path.
3. Compare path tokens against path tokens from every `🟡` (doing) and `🔍` (verifying) ticket on the board.
4. Two tokens overlap when they are equal after normalisation or when either is a directory prefix of the other (one path equals the other or is followed by `/`).
5. Report whether any collision exists and identify the in-flight ticket and conflicting path.
