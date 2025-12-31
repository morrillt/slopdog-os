---
name: Slim Cursor rules+commands
overview: Create a lightweight, BMAD-inspired menu+handlers system under `.cursor/rules/broz/` and `.cursor/commands/broz/`, with strict BUILD gating via one `plans/context.yaml`, plus a separate repo `docs/` space (incl. `docs/research/`) for longer-lived documentation.
todos:
  - id: define-schema
    content: Finalize `plans/context.yaml` schema (past/current/next ticket status) + ensure all modes read it first.
    status: done
  - id: create-rules
    content: Create `.cursor/rules/broz/*.mdc` (core + index + mode rules with personas + menu + handlers referencing separate workflow rules).
    status: done
  - id: create-workflows
    content: Create `.cursor/rules/broz/workflows/<mode>/*.mdc` (organized by subfolder; at least 3 per mode).
    status: done
  - id: create-commands
    content: Create `.cursor/commands/broz/*` commands so every mode invocation starts with its menu (no silent handlers).
    status: done
  - id: bootstrap-artifacts
    content: Create repo scaffolding for `plans/` (plans/tickets/tasks) and `docs/` (incl. docs/research + templates).
    status: done
---

## Goals (what we’re optimizing for)

- **Keep the best BMAD parts**: Personas + Activation + Menu + Handlers.
- **Project-agnostic**: `broz/` prefix.
- **Maintainable Composition**: Mode Rules (Routers) + Workflow Rules (Actions in subfolders).
- **Strict Gating**: BUILD only works on tracked tickets.
- **Artifact Separation**: `plans/` (execution) vs `docs/` (knowledge).
- **Personality**: High-character personas for work modes; functional simplicity for the menu.

## Proposed lightweight file layout

### Editor-side behavior

**`.cursor/rules/broz/`** (The "Controllers")

- `index.mdc` (manual): Router index.
- `core.mdc` (**alwaysApply: true**): Global guardrails, context.yaml reader, smart triggers.
- `mode.menu.mdc`: Global menu router (**System Gear** ⚙️).
- `mode.plan.mdc`: PLAN mode (**Tyrion Lannister** 🦁).
- `mode.build.mdc`: BUILD mode (**Taylor Mason** 📐).
- `mode.task.mdc`: TASK mode (**Bronn** ⚔️).
- `mode.research.mdc`: RESEARCH mode (**Varys** 🕷️).
- `mode.docs.mdc`: DOCS mode (**Samwell Tarly** 📜).

**`.cursor/rules/broz/workflows/`** (The "Actions" - organized by mode)

- **`plan/`**: `new_epic.mdc`, `edit_epic.mdc`, `shard_tickets.mdc`, `add_ticket.mdc`
- **`build/`**: `continue.mdc`, `start_next.mdc`, `update_status.mdc`
- **`task/`**: `new.mdc`, `resume.mdc`, `summarize.mdc`
- **`research/`**: `new.mdc`, `resume.mdc`, `promote.mdc`
- **`docs/`**: `create.mdc`, `audit.mdc`, `extract.mdc`

**`.cursor/commands/broz/`**

- `menu.md`, `plan.md`, `build.md`, `task.md`, `research.md`, `docs.md` (Entrypoints that load the corresponding Mode Rule).

## Mode Rule Structure (Persona + Menu + Handler references)

Each `mode.*.mdc` file follows this template:

```xml
<mode id="broz.plan">
  <persona>
    Role: Tyrion Lannister 🦁 (The Architect)
    Tone: Witty, strategic, articulate. Values structure and clever plans.
    "I drink and I know things. Let us turn this chaos into a plan."
  </persona>

  <agent-activation CRITICAL="TRUE">
    1. Read `plans/context.yaml`
    2. Summarize state (in character)
    3. Present <menu>
  </agent-activation>

  <menu>
    <item label="New Epic" handler="h_new_epic" />
    <item label="Edit Epic" handler="h_edit_epic" />
    <item label="Shard Tickets" handler="h_shard" />
  </menu>

  <handlers>
    <handler id="h_new_epic">
      Load rule: @broz/workflows/plan/new_epic
      Run workflow: "workflow.plan.new_epic"
    </handler>
    <!-- other handlers -->
  </handlers>
</mode>
```

## Workflows (Specifics)

### PLAN Mode (Tyrion Lannister 🦁)

*The Architect*

1. `plan.new_epic`: Scaffolds `plans/epics/EPIC-####/PLAN.md`.
2. `plan.shard_tickets`: Generates tickets from plan tasks.
3. `plan.add_ticket`: Adds single ticket to existing epic + updates yaml.

### BUILD Mode (Taylor Mason 📐)

*The Quant Engineer* — *Constraint: No Ghost Stories.*

1. `build.continue`: Resumes `tickets.current`.
2. `build.start_next`: Promotes `tickets.next` to `current`.
3. `build.update_status`: (Scaffold) explicit workflow to log progress/completion without switching tasks.

### RESEARCH Mode (Varys 🕷️)

*The Master of Whisperers* — *Constraint: Anti-Hallucination.*

1. `research.new`: Creates `docs/research/RESEARCH-*.md`.
2. `research.resume`: Resumes investigation.
3. `research.promote`: Formalizes findings into a Plan recommendation.

### TASK Mode (Bronn ⚔️)

*The Operator*

1. `task.new`: Creates `plans/tasks/TASK-*.md`.
2. `task.resume`: Appends to existing task log.
3. `task.summarize`: (Scaffold) summarizes recent task logs.

### DOCS Mode (Samwell Tarly 📜)

*The Maester*

1. `docs.create`: Templated creation (howto/design).
2. `docs.audit`: Comments/JSDoc audit.
3. `docs.extract`: JSDoc -> Wiki extractor.

## Implementation Steps

1. Create `plans/` and `docs/` scaffolding + `context.yaml`.
2. Create `.cursor/rules/broz/workflows/` subfolders (`plan/`, `build/`, etc.) and populate the workflows.
3. Create `.cursor/rules/broz/mode.*.mdc` files with the specific Personas and Menus.
4. Create `.cursor/commands/broz/*.md`.