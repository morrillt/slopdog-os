---
title: "Changelog"
updated: "2026-01-29"
facets:
  type: changelog
  status: active
  repo:
    path: plans/changelog.md
  summary:
    human: "Release notes and change history for Broz OS."
    vector: "Changelog tracking all significant changes to Broz OS workflow system. Includes new features, breaking changes, deprecations, and bug fixes. Organized by date with brief descriptions of what changed and why. Covers commands, modes, workflows, skills, and context.yaml schema changes."
tags:
  - changelog
  - release-notes
  - broz-os
---

# Changelog

All notable changes to Broz OS are documented here.

Format: `[YYYY-MM-DD] [Category] - Description`

Categories: `ADDED`, `CHANGED`, `DEPRECATED`, `REMOVED`, `FIXED`

---

## [2026-01-29] CHANGED - Architecture doc maintenance
- Added "Maintaining Documentation" subsection to Section 7
- Added `changelog.md` to Appendix file paths
- Removed duplicate Audience/Key Principle sections
- Updated footer date

## [2026-01-29] ADDED - Update Architecture workflow
- Added `paths.architecture_doc` and `paths.changelog` to context.yaml schema
- Created `templates/docs/changelog.md` template
- Created `workflows/docs/update_architecture.mdc` workflow
- Added menu item #6 "📚 Update Architecture" to Docs mode
- Created `commands/broz/updatedocs.md` — direct command trigger (`/broz/updatedocs`)
- Created initial `plans/changelog.md` for Broz OS
