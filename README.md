# Slopdog OS

A **lightweight, persona-driven workflow system** for [Cursor](https://cursor.sh/), inspired by the [BMAD framework](https://github.com/bmadcode/BMAD-METHOD) but streamlined for rapid prototyping with a consistent tech stack.

## Why Slopdog OS?

BMAD is powerful but heavyweight. Slopdog OS takes the same core patterns—modes, personas, XML workflows, ticket gating—and adapts them to a leaner, opinionated setup optimized for speccing and prototyping:

- **Lighter than BMAD**: Fewer moving parts, faster to navigate
- **Consistent tech stack**: Next.js + SQLite + shadcn/ui + Jest + Playwright
- **Consistent theming**: Catppuccin color scheme with utility drawer layouts across all projects
- **Flexible ticket types**: Lightweight one-offs or full TDD tickets with both unit and e2e tests
- **Deep research workflows**: Structured research that goes beyond default tool capabilities
- **CLI utility patterns**: Conventions for building command-line tools alongside web apps
- **Shared scaffolding**: All projects start from [Slopdog Vanilla](https://github.com/morrillt/slopdog-vanilla), a Next.js starter with everything pre-configured

The system is constantly refined—both the scaffolding templates and the planning/build/research workflows evolve as patterns emerge across projects.

## Quick Start

1. Run `/broz/init` to scaffold a new project from Slopdog Vanilla
2. Type `/broz/plan` to enter Plan Mode and start defining work
3. Use `/broz/build` to implement tracked tickets
4. Use `/broz/docs` for documentation and research

## Tech Stack Conventions

All Slopdog OS projects follow the same stack:

| Layer | Tool | Purpose |
|-------|------|---------|
| Framework | **Next.js** | React framework with App Router |
| Database | **SQLite** | Local-first persistence |
| UI Components | **shadcn/ui** | Accessible, composable components |
| Theming | **Catppuccin** | Consistent color scheme across projects |
| Layout | **Utility Drawers** | Consistent navigation and tool panels |
| Unit Tests | **Jest** | Component and utility testing |
| E2E Tests | **Playwright** | Browser automation and integration tests |
| Scaffolding | **Slopdog Vanilla** | Starter template with all of the above |

Every ticket includes both unit and e2e test requirements—no feature ships without coverage.

## Modes & Personas

Each mode has a distinct character that shapes how the AI communicates and what actions are available.

| Mode | Command | Persona | Purpose |
|------|---------|---------|---------|
| **Plan** | `/broz/plan` | Tyrion 🦁 | Epic & ticket creation |
| **Build** | `/broz/build` | Taylor 📐 | Tracked implementation |
| **Docs** | `/broz/docs` | Sam 📜 | Documentation & research |

### Workflows (not modes)

Some operations are workflows within modes rather than standalone modes:

- **Task** (`/broz/task`) — Quick fixes via Docs mode workflows
- **Research** (`/broz/research`) — Deep investigation via Docs mode's research workflow

## Skills

Skills are reusable capabilities that can be invoked across workflows. They encapsulate complex tasks like searching external sources or running scripts.

### Research Skills

| Skill | Purpose |
|-------|---------|
| `youtube-search` | Search YouTube and download video transcripts for research |
| `github-search` | Look up official repos, verify maintenance status, extract README info |
| `reddit-search` | Search Reddit threads for community insights and recommendations |
| `web-search` | General web search best practices and patterns |

### System Skills

| Skill | Purpose |
|-------|---------|
| `create-rule` | Create Cursor rules (`.mdc` files) for persistent AI guidance |
| `create-skill` | Author new agent skills with proper structure |
| `create-subagent` | Create specialized subagents for complex tasks |
| `update-cursor-settings` | Modify Cursor/VSCode settings programmatically |
| `migrate-to-skills` | Migrate existing capabilities into the skills format |

### Using Skills

Skills are automatically discovered by Cursor's agent system. When a trigger scenario matches, the skill is loaded and its instructions are followed.

Example: When you ask "find me a YouTube tutorial on RAG", the `youtube-search` skill activates and guides the AI through searching, evaluating videos, and optionally downloading transcripts.

## Directory Structure

```
~/.cursor/
├── commands/broz/     # Entry points (triggers mode switches)
├── rules/broz/        # Modes + workflows (.mdc)
├── skills-cursor/     # Built-in skills (system-managed)
├── skills/            # User-created personal skills
├── plans/             # State tracking (context.yaml)
├── docs/              # Documentation
└── templates/         # Document templates
```

## How It Works

```
Command → Mode → Workflow → Skill
   │        │        │         │
   │        │        │         └─ Reusable capabilities + scripts
   │        │        └─ Step-by-step logic (the actual work)
   │        └─ Menu + persona + handlers
   └─ Entry point that triggers mode switch
```

1. **Commands** are entry points that trigger mode transitions
2. **Modes** provide context, personas, and menus of available actions
3. **Workflows** contain the step-by-step logic the AI executes
4. **Skills** are reusable capabilities with optional scripts
5. **State** is tracked in `plans/context.yaml`

## Key Features

- **Persona-Driven**: Each mode has a distinct character voice for consistent interactions
- **Ticket-Gated**: Build mode requires a tracked ticket to prevent unstructured code changes
- **State Management**: `context.yaml` tracks current mode, tickets, and tasks
- **Template System**: Standardized templates for epics, tickets, bugs, and documentation
- **Workflow Automation**: XML-based step workflows with user gates and conditional logic
- **Skill System**: Modular capabilities that can be composed across workflows

## Documentation

For detailed architecture and usage:

- [Slopdog OS Architecture](docs/how-to/broz-os-architecture.md) - Complete system documentation
- [CLI Usage](docs/cli-usage.md) - Command reference

## License

MIT
