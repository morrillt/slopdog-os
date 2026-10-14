# House Vocabulary

Canonical definitions of key house terms in Todd's own words. Mirrored in Notion with the local path named (`~/slopdog/v2/rules/vocabulary.md`). Loaded into every session via `~/slopdog/v2/CLAUDE.md`.

- Local Path: `~/slopdog/v2/rules/vocabulary.md`

## Terms

### Sprint

> "A sprint is basically allocating weekly allowances per department of token usage, and we're setting off each team with a sprint planning meeting."
— Todd Morrill, 2026-10-03 (Batch 6-sprint-holder / Round 4 feedback)

### Slopdog framework

> "all of the hooks, skills, rules, and scripts associated with this Slopdog process, as well as the adapted interfaces for those workflows."
— Todd Morrill, 2026-10-03 (Batch 6-sprint-holder / Round 4 feedback)

### Hotfix

> "Applied to an idea or a ticket, it means don't wait for the next sprint planning meeting — process it immediately. Normally things get added to the next sprint planning, but hotfix overrides that and means do it right now."
— Todd Morrill, 2026-10-03 (Slack)

### Sprint report

> "when I say sprint report, what I mean is an overlying artifact with its dependencies, meaning the related batch and project."
— Todd Morrill, 2026-10-03 (Slack, round 6 feedback)

A sprint report is the artifact that sits over the work and carries its dependencies with it: the batches and the project it relates to, linked rather than summarised.

### The three departments

> "Rename it so Slopdog is the new meta and the features is just projects... influencer can fold into projects, it's a type of project... IT can stay outside of it, so it's just projects, IT, and meta [now Slopdog]."
— Todd Morrill, 2026-10-10

The departments are The Harness, Projects and IT. The Harness (the Slopdog harness) is improving
Slopdog itself, the whole pipeline from ideation to execution to verification; it was called Meta,
then Slopdog. Projects is building the things we ship, including communicating about them; an
influencer project is a project with `project_type: influencer` under `type: projects`, not a
department of its own (Features was renamed Projects and Influencer folded into it). IT is
tooling at the OS level, tooling problems and bugs in our actual tools, not really the harness. A
project or batch file carries `type: slopdog` (The Harness; the file key has not been renamed yet),
`type: projects` or `type: it`.

### The Harness

> "Sure, we can call it slopdog harness, THE HARNESS can go to our dictionary."
— Todd Morrill, 2026-10-12

The Harness is the department that builds Slopdog itself: the hooks, skills, rules, scripts and
interfaces of the Slopdog framework. It holds projects with features like any other department,
so "feature" never names a department or a separate list of harness parts.

### The taxonomy

A department holds projects, a project holds features, a feature holds batches, and a batch holds
tickets. Each word means one thing only (Todd, 2026-10-12: "it's confusing to have features ->
projects -> features").

Each department gets one sprint planning meeting a day on a fixed weekly rhythm: The Harness on Friday,
which always runs first, and Projects on Saturday, which also plans the influencer projects that
used to have Sunday. IT is a side department and is not scheduled for now. The gates of the sprint
planning pipeline batch into that day's single session rather than interrupting Todd one at a time.

### Feature

> "Batches map to features going forward: one feature can have one batch this sprint and another batch the next, but we're always mapping batches to features."
— Todd Morrill, 2026-10-10

Every batch names exactly one feature on its `feature:` line, the same kebab-case slug a ticket
carries. A feature collects batches across sprints. A feature is never a ticket: there are no
feature tickets. One feature per batch holds for now, and may be broken later; an integration of
two features is usually a feature of its own.

> "I want to keep our features kind of trim... five features is good. Maybe eight."
— Todd Morrill, 2026-10-12

A project keeps about five features and never more than eight.

### Seat

> "The idea is a desk has seats, and the seat can be the different TUIs. This is Cursor Agent, and it doesn't seem that the skills are coming through here, but they do when I'm running Claude."
— Todd Morrill, 2026-10-10 (Slack desk pane)

A desk is the role and its folder; a seat is the program a desk sits in to do the work (Claude Code, Cursor Agent, agy). Anything a desk relies on, skills first, has to reach every seat it can sit in, not only the Claude one.
