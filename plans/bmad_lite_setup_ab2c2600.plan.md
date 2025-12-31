---
name: BMAD Lite Setup
overview: I will implement a lightweight version of the BMAD method with 5 primary modes (Plan, Build, Task, Research, Docs) driven by a central context file and simplified Cursor rules.
todos:
  - id: create-dirs
    content: Create .config directory and subdirectories
    status: pending
  - id: create-context
    content: Create .config/project-context.yaml
    status: pending
  - id: create-kernel-rule
    content: Create .cursor/rules/00-bmad-kernel.mdc
    status: pending
  - id: create-plan-rule
    content: Create .cursor/rules/mode-plan.mdc
    status: pending
  - id: create-build-rule
    content: Create .cursor/rules/mode-build.mdc
    status: pending
  - id: create-task-rule
    content: Create .cursor/rules/mode-task.mdc
    status: pending
  - id: create-research-rule
    content: Create .cursor/rules/mode-research.mdc
    status: pending
  - id: create-docs-rule
    content: Create .cursor/rules/mode-docs.mdc
    status: pending
  - id: create-help-doc
    content: Create .cursor/commands/help.md
    status: pending
---

1.  **Create Configuration Directory**:

    -   Create `.config/` directory.
    -   Create `.config/plans/` directory for storing plan/ticket artifacts.
    -   Create `.config/project-context.yaml` as the single source of truth for the project state (current mode, active epic, etc.).

2.  **Define Project Context (YAML)**:

    -   Initialize `.config/project-context.yaml` with fields: `mode`, `current_epic`, `active_plan`, `active_ticket`, `project_root`.

3.  **Implement Cursor Rules (The "Menu" & "Handlers")**:

    -   **Kernel/Menu**: Create `.cursor/rules/00-bmad-kernel.mdc` to read the context and direct the agent.
    -   **Plan Mode**: Create `.cursor/rules/mode-plan.mdc` (Triggers: `@plan`, `mode: plan`). Enforces planning workflows (requirements, specs).
    -   **Build Mode**: Create `.cursor/rules/mode-build.mdc` (Triggers: `@build`, `mode: build`). Enforces coding standards, TDD, and ticket execution.
    -   **Task Mode**: Create `.cursor/rules/mode-task.mdc` (Triggers: `@task`, `mode: task`). Allows for quick, one-off command execution.
    -   **Research Mode**: Create `.cursor/rules/mode-research.mdc` (Triggers: `@research`, `mode: research`). Focuses on exploration, deep dives into code/docs, and hypothesis generation without modifying code.
    -   **Docs Mode**: Create `.cursor/rules/mode-docs.mdc` (Triggers: `@docs`, `mode: docs`). Focuses on updating, creating, and maintaining documentation, including architectural diagrams and API docs.

4.  **Documentation/Commands**:

    -   Create `.cursor/commands/readme.md` (or `help.md`) explaining the system and how to switch modes.

5.  **Cleanup (Optional/Manual)**:

    -   *Note*: The existing `.cursor/rules/bmad` folder remains. You can delete it manually later.

**Why this structure?**

-   **Simplicity**: Flat list of rules, easy to understand.
-   **Context-Aware**: The YAML file keeps track of "where we are" so you don't have to repeat yourself.
-   **Scalability**: Added Research and Docs modes as requested to separate exploration and documentation from active building.