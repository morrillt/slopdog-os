# Slopdog OS

![Slopdog OS Crew](assets/slopdog-crew.png)

A **spec-driven, test-driven workflow system** for [Cursor](https://cursor.sh/)[^1].

A set of opinions and conventions that use the same project scaffolding, tech stack, and approach to build fully functional greenfield projects—from idea to shareable—in the shortest possible path.

We're also building **Slopdog UI**, a standalone interface for running these workflows outside of Cursor.

[^1]: While Slopdog OS should work just as well in Claude, I stick to Cursor because I prefer using Gemini 3 Flash for execution and Opus/Codex 5.1 for reasoning. Cursor is more open and doesn't lock you into a single family of models.

## Why Slopdog OS?

Inspired by [BMAD](https://github.com/bmadcode/BMAD-METHOD) and [Agent OS](https://github.com/anthropics/agent-os) but much lighter and more opinionated. Built for fresh greenfield, medium-complexity projects:

- **Spec-first**: Every ticket has acceptance criteria and test requirements before code
- **Consistent scaffolding**: All projects start from [Slopdog Vanilla](https://github.com/morrillt/slopdog-vanilla)
- **Same stack, every time**: Predictable tech choices across all projects
- **Same folder conventions**: Predictable file structure across all projects
- **Deep research workflows**: Structured research that goes beyond default tool capabilities

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
| Unit Tests | **Vitest** | Component and utility testing |
| E2E Tests | **Playwright** | Browser automation and integration tests |
| Scaffolding | **Slopdog Vanilla** | Starter template with all of the above |

Every ticket includes both unit and e2e test requirements—no feature ships without coverage.

## Modes & Personas

Each mode has a distinct character that shapes how the AI communicates and what actions are available.

| Mode | Command | Persona | Purpose |
|------|---------|---------|---------|
| **Plan** | `/broz/plan` | Tyrion Lannister 🦁 | Epic & ticket creation |
| **Build** | `/broz/build` | Geordi La Forge 🔧 | Tracked implementation |
| **Docs** | `/broz/docs` | Samwell Tarly 📜 | Documentation & research |

## Workflows

Each mode has workflows—step-by-step processes the AI follows.

### Plan Workflows
| Workflow | Purpose |
|----------|---------|
| `new_epic` | Create a new epic/PRD |
| `add_ticket` | Add a ticket to an epic |
| `shard_tickets` | Break an epic into tickets |
| `validate_ticket` | Verify ticket is ready for build |

### Build Workflows
| Workflow | Purpose |
|----------|---------|
| `continue` | Execute/continue ticket implementation |
| `code_review` | Review completed ticket work |

### Docs Workflows
| Workflow | Purpose |
|----------|---------|
| `create_research` | Deep research on a topic |
| `create_how_to` | Create a how-to guide |
| `create_dev_note` | Create a developer note |
| `audit` | Audit existing documentation |
| `update_architecture` | Update architecture docs + changelog |
| `publish` | Publish documentation |

### Task Workflows
| Workflow | Purpose |
|----------|---------|
| `new` | Start a new quick task |
| `file_bug` | File a bug report |
| `confirm_bug_fixed` | Verify a bug fix |
| `commit_to_main` | Commit changes to main |
| `summarize` | Summarize task work |

### Other
| Workflow | Purpose |
|----------|---------|
| `init` | Bootstrap a new project from Slopdog Vanilla |

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

- **Spec-Driven**: Every ticket starts with acceptance criteria and test requirements
- **Ticket-Gated**: Build mode requires a tracked ticket to prevent unstructured code changes
- **State Management**: `context.yaml` tracks current mode, tickets, and tasks
- **Template System**: Standardized templates for epics, tickets, bugs, and documentation
- **Workflow Automation**: XML-based step workflows with user gates and conditional logic
- **Skill System**: Modular capabilities that can be composed across workflows

## Documentation

For detailed architecture and usage:

- [Slopdog OS Architecture](docs/how-to/broz-os-architecture.md) - Complete system documentation

## License

MIT

ENJOY!
