---
name: BMAD Lite Setup - Deep Dive
overview: I will implement a robust yet lightweight workflow system (Broz-Bmad) featuring 5 distinct modes (Plan, Build, Task, Research, Docs) with an always-on router/menu, XML-style activation + menu-handlers, and a strict YAML state machine for epics/tickets. Rules are the “brains” (modes + workflows) and commands are thin entrypoints (shortcuts).
todos:
  - id: create-config-broz
    content: Create .config/broz/ directory and strict context.yaml state machine
    status: pending
  - id: create-rules-broz
    content: Create ~/.slopdog/rules/broz/ directory
    status: pending
  - id: create-commands-broz
    content: Create ~/.slopdog/commands/broz/ directory (thin entrypoints)
    status: pending
  - id: create-kernel-rule
    content: Create ~/.slopdog/rules/broz/00-router.mdc (ALWAYS-ON router/menu)
    status: pending
  - id: create-plan-rule
    content: Create ~/.slopdog/rules/broz/mode-plan.mdc
    status: pending
  - id: create-build-rule
    content: Create ~/.slopdog/rules/broz/mode-build.mdc
    status: pending
  - id: create-task-rule
    content: Create ~/.slopdog/rules/broz/mode-task.mdc
    status: pending
  - id: create-research-rule
    content: Create ~/.slopdog/rules/broz/mode-research.mdc
    status: pending
  - id: create-docs-rule
    content: Create ~/.slopdog/rules/broz/mode-docs.mdc
    status: pending
  - id: create-user-dirs
    content: Create plans/ and docs/ (+ docs/research/) directories
    status: pending
  - id: create-docs-templates
    content: Add minimal docs templates + frontmatter conventions (docs mode scaffolding)
    status: pending
  - id: create-task-log
    content: Add lightweight task logging path under plans/tasks/
    status: pending
  - id: create-readme
    content: Create ~/.slopdog/rules/broz/README.md
    status: pending
---

1.  **Project Structure & Configuration**:

    -   Create `.config/broz/` for configuration.
    -   Create `.config/broz/context.yaml` as the **single source of truth** (mode + strict epic/ticket state).
        -   Mode: `plan | build | task | research | docs`
        -   Epics: list of epics, each with tickets and statuses
        -   Pointers: `active_epic`, `active_ticket`, `next_ticket`
        -   Strictness rule: **Build may only execute `next_ticket`** (no “ghost stories”)
    -   Create `~/.slopdog/rules/broz/` for all Broz rules, project-agnostic naming (Broz prefix; no “rockcap”).
    -   Create `~/.slopdog/commands/broz/` for **thin entrypoints** only (shortcuts that “call the router”).
    -   Create `plans/` at project root for plan artifacts (epic folders + tickets + task logs).
    -   Create `docs/` at project root (TBD taxonomy), plus `docs/research/` for research outputs.

2.  **Core ALWAYS-ON Router Rule (The Dispatcher + Menu Mode)**:

    -   Create `~/.slopdog/rules/broz/00-router.mdc` with `alwaysApply: true`.
    -   **Function**: Acts as the **single entrypoint** every chat turn starts from:
        -   Loads `.config/broz/context.yaml`
        -   Shows a **menu first** (forced)
        -   Routes selection to the corresponding mode workflow/handler
        -   Provides status at a glance (“past/current/next ticket”) like BMAD’s `workflow-status` pattern
    -   **Why always-on**: you want predictable “start with a menu call” behavior in every mode without remembering to invoke commands.

3.  **Mode Implementation (XML-Style Rules with Activation → Menu → Handlers → Workflows)**:

**Key pattern copied from BMAD**:

    -   XML-like blocks (`<activation>`, `<menu>`, `<menu-handlers>`) are easier to follow and keep consistent.
    -   Menu items map to **workflows** (not ad-hoc actions). Handlers are small routers that select a workflow.

    -   **PLAN Mode** (`~/.slopdog/rules/broz/mode-plan.mdc`):
        -   **Activation**: Always starts by showing the menu (forced).
        -   **Menu (must include)**:

            1.  **Modify existing epic/plan** (select epic) → workflow updates existing plan artifacts
            2.  **Create new epic/plan** → workflow creates a new epic folder under `plans/` and seeds plan file(s)
            3.  **Add ticket to epic** → workflow creates a new ticket file under that epic + updates YAML
            4.  **Shard plan → tickets** → workflow that turns sections into `TICKET*.md` files (optional but present)

        -   **State updates**: Plan workflows are the only ones allowed to create new epics/tickets and to move `next_ticket`.

    -   **BUILD Mode** (`~/.slopdog/rules/broz/mode-build.mdc`):
        -   **Activation**: Always starts by showing the menu (forced).
        -   **Menu (must include)**:

            1.  **Show build status** (past/current/next) from YAML
            2.  **Execute next ticket** (the only allowed build target) → TDD workflow
            3.  **Cannot find a ticket?** → route to Plan mode workflow to create/select tickets
            4.  **One-off instead** → route to Task mode

        -   **Strictness (stronger than previous plan)**:
            -   Build is only allowed when `next_ticket` exists and points to a real ticket file.
            -   Build workflows update YAML from `todo → in_progress → done` and advance `next_ticket` only when done.

    -   **TASK Mode** (`~/.slopdog/rules/broz/mode-task.mdc`):
        -   **Activation**: Always starts by showing the menu (forced), but remains intentionally less strict.
        -   **Menu (must include)**:

            1.  **Quick one-off** (no epic) → execute
            2.  **Log task** → write a task note under `plans/tasks/<slug>.md` (so tasks are referencable later)
            3.  **Promote to ticket** → route to Plan mode (turn task into a real ticket)

    -   **RESEARCH Mode** (`~/.slopdog/rules/broz/mode-research.mdc`):
        -   **Activation**: Always starts by showing the menu (forced).
        -   **Menu (must include)**:

            1.  **Deep dive** (codebase understanding) → semantic search + reading workflow
            2.  **Web research** (facts/data) → web + citations workflow (copy BMAD anti-hallucination essentials)
            3.  **Write research artifact** → saves to `docs/research/<topic>-<date>.md`

    -   **DOCS Mode** (`~/.slopdog/rules/broz/mode-docs.mdc`):
        -   **Activation**: Always starts by showing the menu (forced).
        -   **Scaffolding now, taxonomy later**:
            -   Add minimal doc template(s) with frontmatter (type/tags/source_paths).
            -   Keep mkdocs-friendly structure in mind; don’t over-design on day 1.
        -   **Menu (must include at least one real workflow)**:

            1.  **Create/Update doc from template** (choose doc type) → writes to `docs/`
            2.  **Audit code comments vs standards** → report findings + optional fixes
            3.  **Extract JSDoc to docs/wiki** (scaffold) → placeholder workflow for later expansion

4.  **Refinement on Rules vs. Commands**:

    -   **Rules (`.mdc`)**: The “brains” (operating mode + menu + handlers + workflows). We use Rules so the agent consistently *behaves* per mode, and because the always-on router needs persistent policy.
    -   **Commands (`~/.slopdog/commands/broz/`)**: Thin entrypoints (UX shortcuts) that simply say “open Broz menu” or “switch mode to X then open menu”. Commands should not duplicate business logic.

5.  **Documentation**:

    -   Create `~/.slopdog/rules/broz/README.md` explaining the system.

**Why this structure?**

-   **Broz Prefix**: Namespaces your custom workflow away from project defaults.
-   **XML Style**: Clear, structured prompts that LLMs handle well (e.g., `<menu>`, `<handler>`, `<activation>`).
-   **Router-first**: Copying BMAD’s “workflow-status” idea gives you one authoritative menu + state view (“what should I do now?”).
-   **Strict State**: The `context.yaml` prevents drifting and enforces “only build what exists”.
-   **Commands vs Rules clarity**: Commands are shortcuts; Rules are the system.