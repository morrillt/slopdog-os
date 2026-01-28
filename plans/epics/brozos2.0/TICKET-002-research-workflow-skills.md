---
title: "TICKET-002 Research Workflow 2.0: Keyword-First Search with Cursor Skills"
updated: "2026-01-28"
facets:
  type: plan
  status: draft
  epic:
    number: "EPIC-BROZOS2.0"
    name: "Broz OS 2.0 Docs & Metadata"
  repo:
    path: plans/epics/brozos2.0/TICKET-002-research-workflow-skills.md
  progress:
    completed: 0
    total: 8
questions:
  updated: "2026-01-28"
  items:
    - id: "Q-1"
      status: resolved
      owner: "PO"
      question: "Should the skills be personal (~/.cursor/skills/) or project-level (.cursor/skills/)?"
      answer: "User-level skills at ~/.cursor/skills/ for use across all projects."
    - id: "Q-2"
      status: resolved
      owner: "PO"
      question: "Should the youtube-search skill include the full summarization pipeline or just transcript download?"
      answer: "Transcript download only. Grab the entire transcript, no summarization."
validation:
  state: pending
  updated: "2026-01-28"
  issues: []
review:
  state: pending
  updated: "2026-01-28"
  ac_results: []
  task_results: []
  concerns: []
tags:
  - plan/ticket
  - meta/research
  - meta/skills
---

# TICKET-002 Research Workflow 2.0: Keyword-First Search with Cursor Skills

Status: Draft

## User Story

As a semi-technical PO,
I want a research workflow that uses iterative keyword discovery and modular search skills,
so that research is systematic, reproducible, and not dependent on MCPs.

## Acceptance Criteria

- [ ] AC-1: Update `rules/broz/workflows/docs/create_research.mdc` to include a "Keyword Discovery" step between Step 2 (Problem Statement) and the current Step 3 (Reddit Search).
- [ ] AC-1b: Problem Statement step must include explicit user confirmation before proceeding to Keyword Discovery (confirmation gate).
- [ ] AC-2: The new Keyword Discovery step must be iterative: AI proposes keywords → user confirms/modifies → loop until confirmed.
- [ ] AC-3: Remove all MCP tool references (`mcp_reddit_*`, `mcp_youtube_*`, `mcp_github_*`) from the research workflow; replace with `web_search` calls.
- [ ] AC-4: Each search step (Reddit, YouTube, GitHub, Web) searches ONE keyword at a time (not bulk).
- [ ] AC-5: Create `~/.cursor/skills/youtube-search/SKILL.md` with instructions for YouTube video discovery and transcript download.
- [ ] AC-6: Create `~/.cursor/skills/youtube-search/scripts/fetch-transcript.ts` adapted from `scraper-yt` libs (video ID extraction + full transcript fetching, no DB, no summarization).
- [ ] AC-7: Create `~/.cursor/skills/reddit-search/SKILL.md` with instructions for Reddit research via web search.
- [ ] AC-8: Create `~/.cursor/skills/github-search/SKILL.md` with instructions for GitHub repo/code discovery via web search.
- [ ] AC-9: Create `~/.cursor/skills/web-search/SKILL.md` with general web search patterns and best practices.
- [ ] AC-10: Update the research workflow to reference skills via `See [skill-name] skill for detailed instructions`.

## Tests

### Unit Tests

- [ ] UT-1: `fetch-transcript.ts` correctly extracts video ID from standard YouTube URL.
- [ ] UT-2: `fetch-transcript.ts` correctly extracts video ID from short URL (youtu.be).
- [ ] UT-3: `fetch-transcript.ts` throws error for invalid URL.
- [ ] UT-4: Keyword iteration logic handles empty keyword list gracefully.

### E2E Tests

- [ ] E2E-1: Run research workflow with test problem statement; verify Keyword Discovery step prompts user.
- [ ] E2E-2: Invoke `youtube-search` skill; verify it provides web search instructions and transcript script usage.
- [ ] E2E-3: Run `fetch-transcript.ts` against a known public video; verify transcript file is created.

## Tasks

- [ ] Task 1: Scaffold Skills Directory (AC: AC-5, AC-7, AC-8, AC-9)
  - [ ] Subtask 1.1: Create failing test — verify `~/.cursor/skills/` directory structure exists.
  - [ ] Subtask 1.2: Create `~/.cursor/skills/youtube-search/SKILL.md` stub.
  - [ ] Subtask 1.3: Create `~/.cursor/skills/reddit-search/SKILL.md` stub.
  - [ ] Subtask 1.4: Create `~/.cursor/skills/github-search/SKILL.md` stub.
  - [ ] Subtask 1.5: Create `~/.cursor/skills/web-search/SKILL.md` stub.

- [ ] Task 2: Implement YouTube Search Skill (AC: AC-5, AC-6)
  - [ ] Subtask 2.1: Create failing tests for video ID extraction (UT-1, UT-2, UT-3).
  - [ ] Subtask 2.2: Copy/adapt `youtube.ts` → `~/.cursor/skills/youtube-search/scripts/youtube.ts`.
  - [ ] Subtask 2.3: Copy/adapt `transcript.ts` → `~/.cursor/skills/youtube-search/scripts/transcript.ts`.
  - [ ] Subtask 2.4: Copy/adapt `transcript-ytdlp.ts` → `~/.cursor/skills/youtube-search/scripts/transcript-ytdlp.ts`.
  - [ ] Subtask 2.5: Create `fetch-transcript.ts` CLI entry point (no DB, full transcript to stdout/file).
  - [ ] Subtask 2.6: Write `SKILL.md` body with usage instructions and trigger scenarios.
  - [ ] Subtask 2.7: Run and validate tests pass.

- [ ] Task 3: Implement Reddit Search Skill (AC: AC-7)
  - [ ] Subtask 3.1: Write `SKILL.md` body — web search patterns for Reddit (site:reddit.com queries).
  - [ ] Subtask 3.2: Include subreddit discovery heuristics.
  - [ ] Subtask 3.3: Include post quality signals (upvotes, comment count).

- [ ] Task 4: Implement GitHub Search Skill (AC: AC-8)
  - [ ] Subtask 4.1: Write `SKILL.md` body — web search patterns for GitHub (site:github.com queries).
  - [ ] Subtask 4.2: Include repo evaluation criteria (stars, last commit, README quality).
  - [ ] Subtask 4.3: Include code search patterns (finding implementations).

- [ ] Task 5: Implement Web Search Skill (AC: AC-9)
  - [ ] Subtask 5.1: Write `SKILL.md` body — general web search best practices.
  - [ ] Subtask 5.2: Include site-specific search operators.
  - [ ] Subtask 5.3: Include source credibility evaluation.

- [ ] Task 6: Update Research Workflow — Keyword Discovery (AC: AC-1, AC-1b, AC-2)
  - [ ] Subtask 6.1: Add confirmation gate to Problem Statement step (user must confirm before proceeding).
  - [ ] Subtask 6.2: Insert new Step 2.5 "Keyword Discovery" after confirmed Problem Statement.
  - [ ] Subtask 6.3: Implement iterative keyword proposal/confirmation loop.
  - [ ] Subtask 6.4: Store confirmed keywords in workflow variables.

- [ ] Task 7: Update Research Workflow — Remove MCPs (AC: AC-3, AC-4, AC-10)
  - [ ] Subtask 7.1: Remove all `mcp_reddit_*` references; replace with web_search + skill reference.
  - [ ] Subtask 7.2: Remove all `mcp_youtube_*` references; replace with web_search + skill reference.
  - [ ] Subtask 7.3: Remove all `mcp_github_*` references; replace with web_search + skill reference.
  - [ ] Subtask 7.4: Update each search step to iterate ONE keyword at a time.
  - [ ] Subtask 7.5: Add skill references: "See `youtube-search` skill for transcript download."

- [ ] Task 8: Final Validation (AC: All)
  - [ ] Subtask 8.1: Run E2E-1 — verify Keyword Discovery step works.
  - [ ] Subtask 8.2: Run E2E-2 — verify skills are discoverable.
  - [ ] Subtask 8.3: Run E2E-3 — verify transcript script works.
  - [ ] Subtask 8.4: Run full research workflow end-to-end with test topic.

## Dev Notes

- **Source Project**: YouTube transcript logic adapted from `/home/broz/code/playground/scraper-yt/src/lib/`
- **Dependencies for youtube-search skill**: Node.js 20+, `yt-dlp` (pip install)
- **Skills Location**: `~/.cursor/skills/` (user-level, available across all projects)
- **Transcript Scope**: Full transcript download only — no summarization, no chunking. The research workflow handles synthesis.
- **Output Format**: Transcript saved to file (stdout or specified path).

## Dev Agent Record

- [2026-01-28] [Created] Initial ticket for Research Workflow 2.0 with keyword-first methodology and Cursor skills.
- [2026-01-28] [Decision] Q-1 resolved: Skills will be user-level at `~/.cursor/skills/`.
- [2026-01-28] [Decision] Q-2 resolved: YouTube skill downloads full transcript only, no summarization.
- [2026-01-28] [Refined] Added AC-1b: Problem Statement must have explicit user confirmation before Keyword Discovery begins.
