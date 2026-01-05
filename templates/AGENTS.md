# Broz OS Bootloader (Always-On)

This repo uses a **BROZ OS** implemented under:

- `~/.cursor/rules/broz/` (Modes + workflows)
- `~/.cursor/commands/broz/` (Entrypoints)
- `plans/context.yaml` (single source of truth for current mode + active work)

## Always do this first (every session)

1. **Read `plans/context.yaml`** and treat it as authoritative for:
   - `project.current_mode`
   - `execution.current_ticket` / `execution.current_task`
2. **Load the Broz OS core guardrails** (always-on): `~/.cursor/rules/broz/core.mdc`
3. **Load the user/project profile** from `RockcapEssentials.md` (treat as always-on context).

## How to start (Broz entrypoints)

Use the Broz commands (not ad-hoc mode switching):

- Menu: `~/.cursor/commands/broz/menu.md`
- Plan: `~/.cursor/commands/broz/plan.md`
- Build: `~/.cursor/commands/broz/build.md`
- Task: `~/.cursor/commands/broz/task.md`
- Research: `~/cursor/commands/broz/research.md`
- Docs: `~/bro.cursor/commands/broz/docs.md`

Each entrypoint:
- sets `project.current_mode` in `plans/context.yaml`
- loads the corresponding mode rule under `.cursor/rules/broz/`
- displays a menu and **stops** (waits for user selection)

## Hard gating rules (non-negotiable)

- **Never build in PLAN**:
  - PLAN may edit **planning artifacts** only (typically under `plans/` and optionally `docs/`).
  - PLAN must **not** change product code under `src/`, `lib/`, `scripts/`, `tests/`.
  - Meta exception: PLAN may evolve the OS itself under `.cursor/`.

- **Build mode (ticketed work)**:
  - Product code changes are allowed only if `project.current_mode: build` and `execution.current_ticket` is set.

- **Task mode (one-off work)**:
  - Product code changes are allowed only if `project.current_mode: task` and `execution.current_task` is set.

## Ticket structure rules

All tickets must follow `plans/templates/ticket.md`.

- **Acceptance Criteria ↔ Tasks mapping is mandatory**:
  - Every **top-level task** must include `(AC: AC-#...)`.
  - Every `AC-#` must be covered by at least one top-level task.

- **No false completions**:
  - Never mark `[x]` unless the work exists and validations/tests pass.
  - Reviews must validate every AC and every checked task with evidence.

## Repo commands (app + tests)

- Docs build: `npm run docs:build` (writes to `src/public/docs`)
- Docs watch: `npm run docs:watch`
- Dev server: `cd src && npm run dev -- --hostname 0.0.0.0 --port 3000`
- Lint: `cd src && npm run lint`

## Git

- Do **not** create commits, branches, PRs, or push unless explicitly asked.

## Code style

Follow the project style guide:
- `/home/broz/code/rockcap/.cursor/commands/styleguide.md`
