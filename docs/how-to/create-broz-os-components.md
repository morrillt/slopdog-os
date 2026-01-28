---
title: "How to Create Broz OS Components"
updated: "2026-01-26"
facets:
  type: how-to
  status: active
  repo:
    path: docs/how-to/create-broz-os-components.md
  summary:
    human: "Definitive guide for creating Broz OS Commands, Modes, and Workflows."
    vector: "This procedural guide outlines the architecture and execution flow of Broz OS, a mode-based workflow system for Cursor. It details the three primary components: Commands (entry points in .md), Modes (context and personas in .mdc), and Workflows (step-by-step logic in .mdc). The document provides templates, syntax rules, and best practices for each component, along with state management instructions using context.yaml. It also compares Broz OS with the BMAD framework, highlighting simplifications and retained patterns."
tags:
  - broz-os
  - workflow
  - mode
  - command
  - how-to
---

## Introduction

Broz OS is a **mode-based workflow system** for Cursor, inspired by the BMAD (Build, Manage, Architect, Deploy) framework. This guide is the definitive rulebook for creating **Commands**, **Modes**, and **Workflows** — the three pillars of Broz OS.

### Audience

- **AI Agents**: To understand how to parse, execute, and create new Broz OS components
- **Humans (Broz)**: To understand the architecture and extend the system

### Key Principle: Slimmed-Down BMAD

Broz OS deliberately strips out BMAD's complexity:

| BMAD | Broz OS | Difference |
|------|---------|------------|
| Agents (heavy, multi-step activation) | Modes (light, focused personas) | Broz is simpler |
| External `workflow.xml` engine | Inline workflow logic in `.mdc` | Broz is self-contained |
| Separate step files per workflow | Single file with inline steps | Broz is more compact |
| `config.yaml` for all settings | `plans/context.yaml` for state | Broz is project-local |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        BROZ OS STACK                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ┌─────────────┐    ┌─────────────┐    ┌─────────────┐        │
│   │  COMMAND    │───▶│    MODE     │───▶│  WORKFLOW   │        │
│   │  (.md)      │    │   (.mdc)    │    │   (.mdc)    │        │
│   │             │    │             │    │             │        │
│   │ Entry Point │    │ Menu +      │    │ Step-by-    │        │
│   │ Triggers    │    │ Persona +   │    │ Step Logic  │        │
│   │ Mode Switch │    │ Handlers    │    │ (the work)  │        │
│   └─────────────┘    └─────────────┘    └─────────────┘        │
│         │                  │                  │                 │
│         ▼                  ▼                  ▼                 │
│   ┌─────────────────────────────────────────────────────┐      │
│   │              plans/context.yaml                      │      │
│   │         (State: Mode, Ticket, Task, Doc)            │      │
│   └─────────────────────────────────────────────────────┘      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Execution Flow

1. **User invokes a Command** → `/broz/build`
2. **Command triggers Mode activation** → Sets `current_mode` in `context.yaml`
3. **Mode presents Menu** → User selects an option
4. **Handler loads Workflow** → Step-by-step execution begins
5. **Workflow updates state** → `context.yaml` tracks progress

---

## 1. Commands

**Commands are entry points.** They trigger mode transitions and are invoked via Cursor's command palette (`/broz/...`).

### Location

```
~/.cursor/commands/broz/
├── build.md
├── docs.md
├── plan.md
├── task.md
├── research.md
├── menu.md
└── ...
```

### Template

```markdown
Activate [Mode Name] Mode. (Trigger: `broz:[mode]`)

Do this EXACTLY in order:
1) Read `plans/context.yaml`
2) Set `project.current_mode: [mode]` in `plans/context.yaml`
3) Read `~/.cursor/rules/broz/mode.[mode].mdc`
4) Follow the mode's `<agent-activation>` steps
5) Display the numbered menu and STOP (wait for user choice)

Hard rule: [Any mode-specific constraint]
```

### Syntax Rules

| Element | Rule |
|---------|------|
| **Filename** | `[mode-name].md` (lowercase, kebab-case) |
| **Trigger** | First line describes the trigger |
| **Steps** | Numbered, imperative, EXACT order |
| **Hard rule** | One-line constraint (optional) |
| **Format** | Plain markdown, no front-matter required |

### Example: `build.md`

```markdown
Activate Build Mode. (Trigger: `broz:build`)

Do this EXACTLY in order:
1) Read `plans/context.yaml`, if it does not exist, notify user and exit.
2) Set `project.current_mode: build` in `plans/context.yaml`
3) Read the repo style guide: `docs/styleguide.md`
4) Read `~/.cursor/rules/broz/mode.build.mdc`
5) Follow the mode's `<agent-activation>` steps
6) Display the numbered menu and STOP (wait for user choice)

Hard rule: code changes only allowed if `execution.current_ticket` is set.
```

### Best Practices

- ✅ Keep commands **minimal** — delegate logic to modes
- ✅ Always include context.yaml read/write
- ✅ End with "STOP (wait for user choice)"
- ❌ Don't put workflow logic in commands
- ❌ Don't skip the mode file loading step

---

## 2. Modes

**Modes provide context, personas, and menus.** They define *what* can be done in a given operational state.

### Location

```
~/.cursor/rules/broz/
├── mode.build.mdc
├── mode.docs.mdc
├── mode.plan.mdc
├── mode.task.mdc
├── mode.research.mdc
├── mode.menu.mdc
└── core.mdc (global rules)
```

### Template

```xml
---
description: "Mode: [Name] ([Persona Name])"
globs: []
---
# Mode: [Name]

<mode id="broz.[mode]">
  <persona>
    Role: [Character Name] [Emoji] (The [Archetype])
    Tone: [Tone description]
    "[Catchphrase]"
  </persona>

  <operating-principles>
    - [Principle 1] (Source: [Role]).
    - [Principle 2] (Source: [Role]).
    - [Principle 3] (Source: [Role]).
  </operating-principles>

  <agent-activation CRITICAL="TRUE">
    1. Read `plans/context.yaml`.
    2. Ensure `project.current_mode` is `[mode]` (update if needed).
    3. [Mode-specific setup steps...]
    4. Present <menu> as a numbered list; if the user types `1`, run item #1, etc.
  </agent-activation>

  <menu>
    <item label="1) [Emoji] [Action Name]" handler="h_[handler_id]" description="[Brief description]" />
    <item label="2) [Emoji] [Action Name]" handler="h_[handler_id]" />
    <!-- More items... -->
  </menu>

  <handlers>
    <handler id="h_[handler_id]">
      Load rule: @broz/workflows/[mode]/[workflow_name]
      Run workflow: "Workflow: [Mode] > [Workflow Name]"
    </handler>
    <!-- More handlers... -->
  </handlers>
</mode>
```

### Syntax Rules

| Element | Rule |
|---------|------|
| **`<mode id>`** | `broz.[mode-name]` (lowercase) |
| **`<persona>`** | Character, emoji, archetype, tone, catchphrase |
| **`<operating-principles>`** | 3-5 rules with source attribution |
| **`<agent-activation>`** | Numbered steps, must include context.yaml |
| **`<menu>`** | Numbered items with `label`, `handler`, optional `description` |
| **`<handlers>`** | Map handler IDs to workflow rule paths |

### Personas (Current Roster)

| Mode | Persona | Archetype | Emoji |
|------|---------|-----------|-------|
| Plan | Tyrion Lannister | The Architect | 🦁 |
| Build | Taylor Mason | The Quant Engineer | 📐 |
| Task | Bronn | The Operator | ⚔️ |
| Docs | Samwell Tarly | The Maester | 📜 |
| Research | Varys | The Spider | 🕷️ |

### Best Practices

- ✅ Personas should have **distinct voices** (not generic)
- ✅ Operating principles cite their source (Dev, PM, SM, etc.)
- ✅ Menu items are **action-oriented** (verb first)
- ✅ Handlers use consistent naming: `h_[action]`
- ❌ Don't put workflow logic in modes — only menu + routing
- ❌ Don't exceed 7 menu items (cognitive load)

---

## 3. Workflows

**Workflows are the heart of Broz OS.** They contain the step-by-step logic that the AI executes.

### Location

```
~/.cursor/rules/broz/workflows/
├── build/
│   ├── code_review.mdc
│   ├── continue.mdc
│   └── ...
├── docs/
│   ├── create_how_to.mdc
│   ├── create_research.mdc
│   └── ...
├── plan/
│   ├── add_ticket.mdc
│   ├── validate_ticket.mdc
│   └── ...
└── task/
    ├── new.mdc
    ├── commit_to_main.mdc
    └── ...
```

### Template

```xml
---
description: "Workflow: [Brief description]"
globs: []
---
# Workflow: [Mode] > [Workflow Name]

<critical>Do NOT [critical constraint 1].</critical>
<critical>[Critical constraint 2].</critical>
<critical>Read `plans/context.yaml` ONCE at start. Do NOT write to context.yaml [unless specified].</critical>
<critical>Only ONE file is created at the FINAL step. Do NOT create files before final step.</critical>

<variables>
  {{project_path}} - Read from context.yaml at Step 1
  {{title}} - User-provided value
  {{filename}} - User-provided kebab-case filename
  {{target_path}} - Computed as {{project_path}}/[output]/{{filename}}.md
</variables>

<workflow>

<step n="1" goal="[Step Goal]">
  <action>
    **[Action Name]**:
    - [Specific instruction]
    - [Specific instruction]
    - Report: `[ ✅ | ❌ ] [What was checked]`
  </action>

  <action>
    **[Action Name]**:
    - Ask the user for:
      - **Field 1**: Description.
      - **Field 2**: Description.
    - Store in workflow variables:
      - `{{variable_1}}` = User's input
      - `{{variable_2}}` = User's input
  </action>

  <output>
    ✅ **Ending Step 1: [Step Name]**
    [ ✅ ] `[What was loaded/checked]`
    📝 **Field**: {{variable}}
    
    ➡️ **Beginning Step 2: [Next Step Name]**
  </output>
</step>

<step n="2" goal="[Step Goal]">
  <action>
    **[Action Name]**:
    - [Instructions]
  </action>

  <action>
    **User Confirmation Gate** (STOP):
    - Present [something] to user.
    - Ask: "[Confirmation question]? (Y to proceed, or provide corrections)"
    - **Do NOT proceed to Step 3 until user confirms.**
  </action>

  <output>
    ✅ **Ending Step 2: [Step Name]**
    🤔 [What was accomplished]
    ✋ Awaiting user confirmation.
    
    ➡️ **Beginning Step 3: [Next Step Name]**
  </output>
</step>

<step n="3" goal="[Step Goal]">
  <action>
    **Execute [Action]**:
    - Use `codebase_search`, `grep`, or `web_search` as needed.
    - [Specific instructions]
  </action>

  <check if="[condition]">
    <critical>STOP. [Reason].</critical>
    <action>[Recovery action].</action>
  </check>

  <output>
    ✅ **Ending Step 3: [Step Name]**
    🔍 [What was accomplished]
    
    ➡️ **Beginning Step 4: [Next Step Name]**
  </output>
</step>

<step n="4" goal="Final Output">
  <critical>This is the ONLY step where a file is created. Only ONE file.</critical>

  <action>
    **Ensure Directory Exists**:
    - Create `{{project_path}}/[output_dir]/` if it does not exist.
  </action>

  <action>
    **Load Template** (if applicable):
    - Read template from: `{{project_path}}/templates/[type].md`
    - Report: `[ ✅ | ❌ ] Template loaded`
  </action>

  <action>
    **Commit Single File to Disk**:
    - Target Path: `{{target_path}}`
    - Populate all sections.
    - Report: `[ ✅ | ❌ ] File created`
  </action>

  <output>
    ✅ **Ending Step [N]: [Step Name]**
    
    ### File Created
    - **Template**: [ ✅ ] `{{template_path}}`
    - **Output**: [ ✅ ] `{{target_path}}`
    - **Status**: Draft
    
    📄 Document saved to: `{{target_path}}`
  </output>
</step>

</workflow>
```

### XML Tag Reference

| Tag | Purpose | Attributes |
|-----|---------|------------|
| `<critical>` | Non-negotiable constraint | None |
| `<variables>` | Declare workflow variables | None |
| `<workflow>` | Container for all steps | None |
| `<step>` | Single workflow step | `n` (number), `goal` (description) |
| `<action>` | Discrete action within step | `if` (optional condition) |
| `<check>` | Conditional branch | `if` (condition) |
| `<output>` | Step completion summary | None |
| `<ask>` | User prompt | None |
| `<goto>` | Jump to step/anchor | `step` or `anchor` |
| `<anchor>` | Jump target | `id` |

### Conditional Logic

```xml
<!-- Simple condition -->
<check if="condition failed">
  <critical>STOP. Reason.</critical>
  <action>Recovery action.</action>
</check>

<!-- User choice branch -->
<check if="user selects 'Y'">
  <action>Do something.</action>
</check>
<check if="user selects 'N'">
  <action>Do something else.</action>
</check>

<!-- Loop back -->
<action if="more tasks remain">
  <goto step="3">Process next task</goto>
</action>
```

### Variable Syntax

```xml
<!-- Declaration -->
<variables>
  {{project_path}} - Source/description
  {{user_input}} - From user
  {{computed}} - Derived from other variables
</variables>

<!-- Usage -->
<action>
  - Target: `{{project_path}}/docs/{{filename}}.md`
  - Title: {{title}}
</action>
```

### Best Practices

- ✅ **One file output per workflow** — no scattered file creation
- ✅ **User gates** — always confirm before destructive/final actions
- ✅ **Clear outputs** — use checkboxes `[ ✅ | ❌ ]` and emoji
- ✅ **Step transitions** — always show "Ending Step N" and "Beginning Step N+1"
- ✅ **`<critical>` up front** — list all constraints at the top
- ❌ **Don't skip steps** — no "optimization" of the sequence
- ❌ **Don't create files early** — only in the final step
- ❌ **Don't read context.yaml multiple times** — once at start

---

## 4. State Management: `context.yaml`

All state is tracked in `plans/context.yaml` at the project root.

### Schema

```yaml
project:
  name: "PROJECT_NAME"
  current_mode: "build"  # plan | build | task | research | docs | menu
  path: "/path/to/project"

execution:
  current_epic: ""
  current_ticket: ""
  next_ticket: ""
  current_ticket_status: ""
  current_task: ""
  current_task_status: ""

paths:
  plans: "plans/"
  docs: "docs/"

docs:
  current_doc_type: ""
  current_doc_title: ""
  current_doc_filename: ""
  current_doc_path: ""
```

### Mode Gating Rules

| Mode | Allowed Actions | Required State |
|------|-----------------|----------------|
| `plan` | Write to `plans/`, `docs/` | None |
| `build` | Full code changes | `execution.current_ticket` set |
| `task` | Full code changes | `execution.current_task` set |
| `research` | Write to `docs/research/` | None |
| `docs` | Write to `docs/` | None |

---

## 5. Comparison: Broz OS vs BMAD

### What We Kept from BMAD

| Pattern | BMAD | Broz OS |
|---------|------|---------|
| XML step structure | `<step n="N">` | ✅ Same |
| Conditional checks | `<check if="">` | ✅ Same |
| Critical constraints | `<critical>` | ✅ Same |
| Action blocks | `<action>` | ✅ Same |
| Variable syntax | `{{variable}}` | ✅ Same |
| Menu-driven navigation | Agent menus | ✅ Mode menus |
| Persona/character approach | Named agents | ✅ Named personas |

### What We Simplified

| BMAD Pattern | Broz OS Approach |
|--------------|------------------|
| External `workflow.xml` engine | Inline workflow logic in `.mdc` |
| Separate step files (`step-01.md`, `step-02.md`) | Single file with all steps |
| Heavy agent activation (15+ steps) | Light mode activation (4-5 steps) |
| Global `config.yaml` | Project-local `context.yaml` |
| Menu handlers with `workflow=""` attributes | Simple handler blocks |

### What We Might Borrow

| BMAD Feature | Potential Value |
|--------------|-----------------|
| **Step-file architecture** | For very complex workflows (10+ steps) |
| **`stepsCompleted` tracking** | For resumable workflows |
| **`inputDocuments` discovery** | For context-aware workflows |
| **`<goto anchor="">` jumps** | Already supported, use more |

---

## 6. Creating a New Component: Checklist

### New Command

- [ ] Create `~/.cursor/commands/broz/[name].md`
- [ ] Follow command template
- [ ] Include context.yaml read/write
- [ ] Reference the mode file
- [ ] End with STOP instruction

### New Mode

- [ ] Create `~/.cursor/rules/broz/mode.[name].mdc`
- [ ] Define persona (character, tone, catchphrase)
- [ ] List operating principles (3-5, with sources)
- [ ] Define agent-activation steps
- [ ] Create menu items with handlers
- [ ] Map handlers to workflow paths

### New Workflow

- [ ] Create `~/.cursor/rules/broz/workflows/[mode]/[name].mdc`
- [ ] List `<critical>` constraints at top
- [ ] Declare `<variables>`
- [ ] Structure steps with `<step n="" goal="">`
- [ ] Include user gates where appropriate
- [ ] Use `<check if="">` for conditionals
- [ ] End each step with `<output>` summary
- [ ] Create files ONLY in final step

---

## 7. Quick Reference: XML Tags

```xml
<!-- Top-level constraints -->
<critical>Constraint text.</critical>

<!-- Variable declarations -->
<variables>
  {{var_name}} - Description
</variables>

<!-- Workflow container -->
<workflow>
  <!-- Steps go here -->
</workflow>

<!-- Individual step -->
<step n="1" goal="Step Goal">
  <action>Instructions</action>
  <action if="condition">Conditional action</action>
  <check if="condition">
    <action>Branch action</action>
  </check>
  <output>Summary</output>
</step>

<!-- User prompt -->
<ask>Question?</ask>

<!-- Navigation -->
<goto step="3">Reason</goto>
<goto anchor="anchor_id" />
<anchor id="anchor_id" />
```

---

## Appendix: File Paths Reference

```
~/.cursor/
├── commands/broz/          # Entry point commands
│   ├── build.md
│   ├── docs.md
│   ├── plan.md
│   └── ...
├── rules/broz/             # Mode and workflow rules
│   ├── core.mdc            # Global guardrails
│   ├── index.mdc           # Mode index
│   ├── mode.build.mdc
│   ├── mode.docs.mdc
│   ├── mode.plan.mdc
│   └── workflows/
│       ├── build/
│       ├── docs/
│       ├── plan/
│       └── task/

{project}/
├── plans/
│   └── context.yaml        # State tracking
└── docs/
    ├── how-to/
    └── research/
```

---

*Last updated: 2026-01-09 | Broz OS v1.0*
