Commit all changes to main. (Trigger: `committomain`)

Do this EXACTLY in order:
1) Read `plans/context.yaml` (for context, but this command works in any mode)
2) Run `git status` to check for changes
3) If no changes, inform user and exit
4) Run `git add -A`
5) Analyze staged changes:
   - Group files by type (modified, added, deleted)
   - For each file, summarize the nature of changes from git diff
   - Identify patterns (e.g., workflow updates, new features, refactoring, bug fixes)
   - Check if current_ticket is set in context.yaml for context
6) Determine commit prefix (REQUIRED - must be first in title):
   - **feat:** - New features, new functionality, new API endpoints, new components
   - **fix:** - Bug fixes, error corrections, security patches
   - **task:** - Task/workflow updates, tooling improvements, process changes, cursor commands
   - **refactor:** - Code restructuring without changing behavior, code cleanup
   - **docs:** - Documentation changes, README updates, comments
   - **chore:** - Maintenance, dependency updates, file moves/renames, cleanup
   - **test:** - Test additions, test updates, test infrastructure
   - **perf:** - Performance improvements
   - **style:** - Code style changes (formatting, whitespace)
   - Rules:
     * Analyze file paths and change patterns to determine primary type
     * If multiple types, choose the most significant/primary one
     * If workflow/tooling files (.cursor/, scripts/, configs), prefer "task:"
     * If new user-facing features (src/app/, components/), prefer "feat:"
     * If bug fixes (fixes errors, corrects logic), prefer "fix:"
     * If documentation only (docs/, README), prefer "docs:"
7) Auto-generate commit message:
   - **Title**: Generate based on:
     * Start with determined prefix (e.g., "feat:", "task:", "fix:")
     * If current_ticket is set, reference it (e.g., "task: Complete TICKET-009")
     * Follow with concise description (50-72 chars total including prefix)
     * Use present tense, imperative mood (e.g., "Add auth system" not "Added auth system")
     * Be specific and descriptive
   - **Description**: Generate based on:
     * What was changed (high-level summary)
     * Why (if inferable from context or ticket)
     * Key files/areas affected
   - **Changes section**: List each file with a brief summary:
     * For modified files: summarize what changed (e.g., "Added validation", "Refactored logic")
     * For added files: describe purpose (e.g., "New workflow for publishing docs")
     * For deleted files: note removal reason if clear
     * Group related files together logically
8) Build formatted commit message:
   ```
   <prefix>: <Title>

   <Description>

   Changes:
   - <file1>: <summary>
   - <file2>: <summary>
   ...
   ```
9) Run `git commit -m "<formatted message>"` (use proper escaping for multi-line)
10) Display commit hash and summary
11) Verify clean working tree:
    - Run `git status --short` to check if working tree is clean
    - If clean (no output): Display ✅ **Working tree is clean**
    - If not clean (has output): Display ❌ **Working tree has uncommitted changes** and show the status
12) Note: Do NOT push to origin (user must do this explicitly)

**Important**: Do NOT prompt the user for title/description. Auto-generate everything based on analysis. The whole point is automation. ALWAYS include a prefix in the title.
