# Broz OS

A **persona-driven, mode-based workflow system** for [Cursor](https://cursor.sh/), inspired by the BMAD framework.

Broz OS provides structured AI-assisted development workflows with distinct operational modes, each guided by a unique persona character.

## Quick Start

1. Open any project in Cursor
2. Type `/broz/plan` to enter Plan Mode and start defining work
3. Use `/broz/build` to implement tracked tickets
4. Use `/broz/task` for quick one-off fixes

## Modes & Personas

| Mode | Command | Persona | Purpose |
|------|---------|---------|---------|
| **Plan** | `/broz/plan` | Tyrion 🦁 | Epic & ticket creation |
| **Build** | `/broz/build` | Taylor 📐 | Tracked implementation |
| **Task** | `/broz/task` | Bronn ⚔️ | Quick fixes & one-offs |
| **Docs** | `/broz/docs` | Sam 📜 | Documentation |
| **Research** | `/broz/research` | Varys 🕷️ | Deep investigation |

## Directory Structure

```
~/.cursor/
├── commands/broz/     # Entry points (triggers mode switches)
├── rules/broz/        # Modes + workflows (.mdc)
├── skills-cursor/     # Reusable capabilities + scripts
├── plans/             # State tracking (context.yaml)
├── docs/              # Documentation
└── templates/         # Document templates
```

## How It Works

1. **Commands** are entry points that trigger mode transitions
2. **Modes** provide context, personas, and menus
3. **Workflows** contain step-by-step logic the AI executes
4. **Skills** are reusable capabilities with optional scripts
5. **State** is tracked in `plans/context.yaml`

## Key Features

- **Persona-Driven**: Each mode has a distinct character voice for consistent interactions
- **Ticket-Gated**: Build mode requires a tracked ticket to prevent unstructured code changes
- **State Management**: `context.yaml` tracks current mode, tickets, and tasks
- **Template System**: Standardized templates for epics, tickets, bugs, and documentation
- **Workflow Automation**: XML-based step workflows with user gates and conditional logic

## Documentation

For detailed architecture and usage:

- [Broz OS Architecture](docs/how-to/broz-os-architecture.md) - Complete system documentation
- [CLI Usage](docs/cli-usage.md) - Command reference

## Skills

Built-in skills for common tasks:

| Skill | Purpose |
|-------|---------|
| `create-rule` | Create Cursor rules for AI guidance |
| `create-skill` | Author new agent skills |
| `update-cursor-settings` | Modify Cursor/VSCode settings |

## License

MIT
