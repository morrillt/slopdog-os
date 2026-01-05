# Broz OS: Persona-Driven Workflow System

Broz OS is a sophisticated, mode-based workflow system designed for Cursor. It leverages distinct personas, strict operational gating, and structured planning to manage the software development lifecycle.

## 🚀 Migration & Environment

Initially developed within individual project directories, Broz OS is currently being migrated to the **`.cursor/` user directory** (`/home/broz/.cursor/`). This centralizes the workflow logic, making it available across all projects opened in Cursor while maintaining project-specific state in the local `plans/` directory of the active workspace.

## 🏗️ System Architecture

The system is powered by Cursor Rules (`.mdc`) and Commands (`.md`) located in the global `.cursor/` directory.

- **`.cursor/rules/broz/`**: Contains the core logic and mode definitions.
    - `index.mdc`: The main router and index of available modes.
    - `core.mdc`: Global context and critical guardrails (gating).
    - `mode.*.mdc`: Detailed definitions for each mode (Plan, Build, Task, Research, Docs, Menu).
    - `workflows/`: Step-by-step guides for specific activities within a mode.
- **`.cursor/commands/broz/`**: Commands used to trigger mode transitions (e.g., `broz-plan`).
- **`plans/`**: Directory for planning artifacts, epics, and tickets.
- **`plans/context.yaml`**: The source of truth for the current system state (Mode, Ticket, Task).

---

## 🎭 Modes & Personas

Broz OS operates in distinct "Modes," each with a dedicated persona and set of responsibilities.

### 🦁 Plan Mode (`broz:plan`)
- **Persona**: **Tyrion Lannister** (The Architect)
- **Focus**: Strategy, architecture, and ticket creation.
- **Gating**: **STRICTLY NO PRODUCT CODE CHANGES**.
- **Outputs**: Epics and Tickets in the `plans/` directory.
- **Activation**: Triggers the "New Epic," "Shard Tickets," and "Validate Ticket" workflows.

### 📐 Build Mode (`broz:build`)
- **Persona**: **Taylor Mason** (The Quant Engineer)
- **Focus**: Implementation and coding of specific tickets.
- **Requirements**: Requires an active `execution.current_ticket`.
- **Outputs**: Feature implementation, tests, and succint execution logs.
- **Rule**: Every change must map to an Acceptance Criterion (AC).

### ⚔️ Task Mode (`broz:task`)
- **Persona**: **Bronn** (The Operator)
- **Focus**: Quick, ad-hoc tasks, bug fixes, and maintenance.
- **Requirements**: Requires an active `execution.current_task`.
- **Outputs**: Rapid fixes and task summaries.

### 🕷️ Research Mode (`broz:research`)
- **Persona**: **Varys** (The Master of Whisperers)
- **Focus**: Investigation, SPIKEs, and deep dives.
- **Gating**: Writes to `docs/research/`, no product code changes.
- **Outputs**: Findings, hypotheses, and recommended next steps.

### 📜 Docs Mode (`broz:docs`)
- **Persona**: **Samwell Tarly** (The Maester)
- **Focus**: Documentation and knowledge management.
- **Outputs**: Drafts, published docs, and reference extractions.

### ⚙️ Menu Mode (`broz:menu`)
- **Persona**: **System Gear**
- **Focus**: Main navigation hub to switch between modes.

---

## 🛠️ Utility Commands

Broz OS includes automation commands to streamline common tasks:

- **`committomain`**: Automatically stages all changes, analyzes them, determines an appropriate prefix (`feat:`, `fix:`, `task:`, etc.), generates a detailed commit message referencing the current ticket, and commits to the local `main` branch.
- **`broz:freeball`**: (Inferred) A more flexible mode for ad-hoc work outside the strict ticket system, while still maintaining some process awareness.

---

## 🛡️ Critical Guardrails (Gating)

Broz OS enforces strict rules to ensure quality and process integrity:

1.  **Code Gating**: Implementation changes (under `src/`, `lib/`, `scripts/`, `tests/`) are **ONLY** allowed in **Build** or **Task** modes.
2.  **State Awareness**: The agent must always read `plans/context.yaml` at the start of any interaction to understand the current mode and active task.
3.  **Acceptance Criteria (AC)**: In Build mode, every task must be linked to a specific AC.
4.  **Evidence Over Vibes**: Task completion requires concrete evidence (file paths, line ranges) and passing tests.
5.  **No False Completions**: Never mark a task as complete unless the work is verified and tests pass.

---

## ⚠️ Known Issues & Ongoing Work

1.  **Hard-linked References**: We are currently working on migrating references within Commands to use hard-linked full paths to their corresponding workflows (prompt directory). This ensures that triggers remain robust even when the project context or workspace root changes.

---

## 🚀 How to Use Broz OS

### 1. Starting a Project
- Run `broz-plan` to enter Plan Mode.
- Use **New Epic** to define the high-level goal.
- Use **Shard Tickets** to break the epic into actionable tickets.
- Use **Mark Ticket Ready** once a ticket is fully defined.

### 2. Implementation
- Run `broz-build` to enter Build Mode.
- Select **Start Next Ticket** or **Jump to Ticket**.
- Use **Execute Ticket** to follow the Plan -> Code -> Test -> Log loop.
- Once complete, use **Code Review Ticket** for final verification.

### 3. Quick Fixes
- Run `broz-task` for minor adjustments or bug fixes that don't require a full epic/ticket structure.

### 4. Deep Dives
- Run `broz-research` when you need to investigate a complex problem or explore new technologies.

---

## 📝 The `plans/context.yaml` File

This file tracks the current state of the system. Example structure:

```yaml
project:
  current_mode: build # or plan, task, research, docs, menu
  active_epic: "my_cool_feature"

execution:
  current_ticket: "tickets/implement_auth_01.md"
  current_task: "Fixing login button alignment"
  last_mode: "plan"
```

