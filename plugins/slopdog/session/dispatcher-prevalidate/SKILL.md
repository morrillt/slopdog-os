---
name: dispatcher-prevalidate
description: Run tickets-validate on a ticket before dispatch and refuse to dispatch if readiness.by is not tickets-validate. Routing mechanics will eventually live in T-477 (/slopdog:dispatch); this skill names T-477 as the future owner and operates independently. Use when prevalidating a candidate ticket prior to builder dispatch.
allowed-tools:
  - Bash
  - Read
  - Edit
  - Write
  - Grep
  - Glob
---

# dispatcher-prevalidate — ticket validation gate before builder dispatch

Run `tickets-validate` on a ticket before dispatch, and refuse to dispatch a ticket whose `readiness.by` is not `tickets-validate`.

Routing mechanics will eventually live in **T-477**, the `/slopdog:dispatch` skill. This skill names T-477 as the future owner of routing mechanics and never calls it.

## Behaviour

1. Given a target ticket (by ID or path in `~/slopdog/tasks/tickets/`):
2. Run `tickets-validate` against the ticket.
3. Check the ticket's frontmatter:
   - Ensure `readiness.state` is `ready`.
   - Ensure `readiness.by` is `tickets-validate`.
4. If `readiness.by` is not `tickets-validate`, refuse to dispatch the ticket and report the validation gap.
