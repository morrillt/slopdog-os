---
name: slopdog-ticket-runner
overview: "Create a new slopdog ticket runner app with a local web UI and CLI backend that processes markdown tickets sequentially and gates progression on status: completed, starting from a fresh slopdog-vanilla pull plus slopdog init and docs-router integration."
todos:
  - id: fresh-base
    content: Pull fresh slopdog-vanilla from git@github.com:morrillt/slopdog-vanilla.git into new project folder
    status: completed
  - id: init-project
    content: Run slopdog init and integrate docs-router module per HOWTO
    status: completed
    dependencies:
      - fresh-base
  - id: ticket-parser
    content: Implement markdown ticket parsing + status detection
    status: completed
    dependencies:
      - init-project
  - id: runner-core
    content: Implement sequential gating and state handling
    status: completed
    dependencies:
      - ticket-parser
  - id: web-ui
    content: Build basic local web UI for tickets and run controls
    status: completed
    dependencies:
      - runner-core
  - id: command-config
    content: Add model/provider + command template config UI
    status: completed
    dependencies:
      - web-ui
  - id: docs
    content: Write README and ticket format usage
    status: completed
    dependencies:
      - command-config
---

# Slopdog Ticket Runner Plan

## Scope

- Create a new project at `/home/broz/code/playground/slopdog-ticket-runner` from a fresh slopdog-vanilla GitHub pull (`git@github.com:morrillt/slopdog-vanilla.git`), then run slopdog init and integrate docs-router per the module HOWTO.
- Build a local web UI and a CLI-backed runner.
- Tickets are defined in a markdown file; runner processes them one at a time and only advances when status is `completed`.
- Provide UI controls to select model/provider and the command template for Cursor CLI, but the exact command can be configured later.

## Proposed structure

- New project folder `/home/broz/code/playground/slopdog-ticket-runner` seeded from slopdog-vanilla
- Run slopdog init after cloning/pulling the base
- Pull in docs module and wire up API routes + pages per `docs-router` HOWTO
- Runner core + state handling (tickets, status updates, sequential gating)
- Local web UI for viewing tickets, running next ticket, setting model/command options
- Minimal docs: README and ticket format spec

## Key files

- `/home/broz/code/playground/slopdog-ticket-runner/README.md`
- `/home/broz/code/playground/slopdog-ticket-runner/plans/context.yaml`
- `/home/broz/code/playground/slopdog-ticket-runner/src/runner/*`
- `/home/broz/code/playground/slopdog-ticket-runner/src/ui/*`
- `/home/broz/code/playground/slopdog-ticket-runner/config/*`

## Flow

- Parse markdown tickets into a structured list.
- Track status in-ticket (e.g., `status: completed` in front-matter or a standard field).
- UI shows current/next ticket; user triggers “run next”.
- Runner builds a prompt packet and executes the configured command; user marks status completed in UI.

## Docs-router integration (from HOWTO)

- Install `@rockcap/docs-router` and wire Next.js API routes:
- `src/app/api/docs/manifest/route.ts` using `createManifestHandler`
- `src/app/api/docs/content/route.ts` using `createContentHandler`
- Add docs pages:
- `src/app/docs/page.tsx` using `DocsExplorer`
- `src/app/docs/[...slug]/page.tsx `using `DocViewer`
- Update `globals.css` to scan docs-router sources for Tailwind classes

## Open items resolved

- Project name: `slopdog-ticket-runner`.
- Status gate: `status: completed` in the ticket.
- UI: Local web UI (browser).

## Implementation todos

- `fresh-base`: pull slopdog-vanilla from GitHub into `/home/broz/code/playground/slopdog-ticket-runner`.
- `init-project`: run slopdog init and integrate docs-router module.
- `ticket-parser`: implement markdown ticket parser and status detection.
- `runner-core`: implement sequential gating and state handling.
- `web-ui`: build basic web UI for viewing tickets and running next.
- `command-config`: add config screen for model/provider and command template.
- `docs`: document ticket format and usage.