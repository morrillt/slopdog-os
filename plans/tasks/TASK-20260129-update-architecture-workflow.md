# TASK-20260129: Update Architecture Workflow

## Meta
- **Created**: 2026-01-29
- **Status**: completed
- **Approach**: Direct
- **Complexity**: Medium

## Description
Create a new workflow/command that updates the main architecture documentation after changes are made. This includes adding a changelog concept to track changes over time.

## Requirements

### 1. Schema Changes to `context.yaml`
- [x] Add `architecture_doc` field pointing to main "how this works" file
- [x] Add `changelog_path` field pointing to changelog document

### 2. New Template
- [x] Create `templates/docs/changelog.md` template

### 3. New Workflow: `docs/update_architecture.mdc`
- [x] Step 1: Scan for new logic that needs to be added to architecture doc
- [x] Step 2: Scan for deprecated logic/language that needs revision
- [x] Step 3: Update changelog with summary (can pull from last commit message)

### 4. Integration
- [x] Add menu item to docs mode (or create standalone command)
- [x] Wire up handler to workflow

## Files to Create/Modify
1. `plans/context.yaml` — add new fields
2. `plans/templates/changelog.md` — new template
3. `rules/broz/workflows/docs/update_architecture.mdc` — new workflow
4. `rules/broz/mode.docs.mdc` — add menu item + handler (if docs mode)
5. `docs/changelog.md` — create initial changelog (for this project)

## Log
- **2026-01-29 [init]**: Task created. Medium complexity, Direct approach.
- **2026-01-29 [impl]**: Created all files:
  - Updated `plans/context.yaml` with `architecture_doc` and `changelog` paths
  - Created `templates/docs/changelog.md`
  - Created `rules/broz/workflows/docs/update_architecture.mdc`
  - Updated `rules/broz/mode.docs.mdc` with menu item #6
  - Created `docs/changelog.md` (initial changelog for Broz OS)
  - Updated `docs/how-to/broz-os-architecture.md` with new schema + workflow
- **2026-01-29 [add]**: Created `commands/broz/updatedocs.md` for direct command trigger
- **2026-01-29 [done]**: Task completed.
