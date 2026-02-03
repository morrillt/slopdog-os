# Broz OS

A **persona-driven, mode-based workflow system** for [Cursor](https://cursor.sh/), inspired by the BMAD framework.

## Why Broz OS?

AI coding assistants are powerful, but without structure they can be chaotic—jumping between tasks, making untracked changes, and losing context. Broz OS solves this by providing:

- **Structured workflows** that guide the AI through multi-step tasks
- **Mode-based thinking** that matches the right persona to the right job
- **Ticket gating** that prevents unplanned code changes
- **State persistence** so you can pause and resume work

Built by a semi-technical product owner learning to code, Broz OS emphasizes teaching through building—every mode explains what it's doing and why.

## Quick Start

1. Open any project in Cursor
2. Type `/broz/plan` to enter Plan Mode and start defining work
3. Use `/broz/build` to implement tracked tickets
4. Use `/broz/task` for quick one-off fixes

## Modes & Personas

Each mode has a distinct character that shapes how the AI communicates and what actions are available.

| Mode | Command | Persona | Purpose |
|------|---------|---------|---------|
| **Plan** | `/broz/plan` | Tyrion 🦁 | Epic & ticket creation |
| **Build** | `/broz/build` | Taylor 📐 | Tracked implementation |
| **Task** | `/broz/task` | Bronn ⚔️ | Quick fixes & one-offs |
| **Docs** | `/broz/docs` | Sam 📜 | Documentation |
| **Research** | `/broz/research` | Varys 🕷️ | Deep investigation |

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

- [Broz OS Architecture](docs/how-to/broz-os-architecture.md) - Complete system documentation
- [CLI Usage](docs/cli-usage.md) - Command reference

## License

MIT
