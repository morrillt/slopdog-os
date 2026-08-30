---
title: "TICKET-002 Research Workflow 2.0: Keyword-First Search with Cursor Skills"
updated: "2026-01-28"
facets:
  type: plan
  status: review
  epic:
    number: "EPIC-BROZOS2.0"
    name: "Broz OS 2.0 Docs & Metadata"
  repo:
    path: plans/epics/brozos2.0/TICKET-002-research-workflow-skills.md
  progress:
    completed: 8
    total: 8
questions:
  updated: "2026-01-28"
  items:
    - id: "Q-1"
      status: resolved
      owner: "PO"
      question: "Should the skills be personal (~/.cursor/skills/) or project-level (.cursor/skills/)?"
      answer: "Repo-level skills in `skills-cursor/` directory (already exists with other skills, tracked in git)."
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

Status: Review

## User Story

As a semi-technical PO,
I want a research workflow that uses iterative keyword discovery and modular search skills,
so that research is systematic, reproducible, and not dependent on MCPs.

## Acceptance Criteria

- [x] AC-1: Update `rules/broz/workflows/docs/create_research.mdc` to include a "Keyword Discovery" step between Step 2 (Problem Statement) and the current Step 3 (Reddit Search).
- [x] AC-1b: Problem Statement step must include explicit user confirmation before proceeding to Keyword Discovery (confirmation gate).
- [x] AC-2: The new Keyword Discovery step must be iterative: AI proposes keywords → user confirms/modifies → loop until confirmed.
- [x] AC-3: Remove all MCP tool references (`mcp_reddit_*`, `mcp_youtube_*`, `mcp_github_*`) from the research workflow; replace with `web_search` calls.
- [x] AC-4: Each search step (Reddit, YouTube, GitHub, Web) searches ONE keyword at a time (not bulk).
- [x] AC-5: Create `skills-cursor/youtube-search/SKILL.md` with instructions for YouTube video discovery and transcript download.
- [x] AC-6: Create `skills-cursor/youtube-search/scripts/fetch-transcript.ts` adapted from `scraper-yt` libs (video ID extraction + full transcript fetching, no DB, no summarization).
- [x] AC-7: Create `skills-cursor/reddit-search/SKILL.md` with instructions for Reddit research via web search.
- [x] AC-8: Create `skills-cursor/github-search/SKILL.md` with instructions for GitHub repo/code discovery via web search.
- [x] AC-9: Create `skills-cursor/web-search/SKILL.md` with general web search patterns and best practices.
- [x] AC-10: Update the research workflow to reference skills via `See [skill-name] skill for detailed instructions`.

## Tests

### Unit Tests

- [x] UT-1: `fetch-transcript.ts` correctly extracts video ID from standard YouTube URL.
- [x] UT-2: `fetch-transcript.ts` correctly extracts video ID from short URL (youtu.be).
- [x] UT-3: `fetch-transcript.ts` throws error for invalid URL.
- [x] UT-4: Keyword iteration logic handles empty keyword list gracefully (workflow handles via user confirmation loop).

### E2E Tests

- [x] E2E-1: Research workflow includes Keyword Discovery step (Step 2.5) with iterative user prompts.
- [x] E2E-2: `youtube-search` skill in place with web search instructions and transcript script.
- [ ] E2E-3: Manual validation — run `fetch-transcript.ts` against public video (requires yt-dlp installed).

## Tasks

- [x] Task 1: Scaffold Skills Directory (AC: AC-5, AC-7, AC-8, AC-9)
  - [x] Subtask 1.1: Create failing test — verify `skills-cursor/` directory structure exists for research skills.
  - [x] Subtask 1.2: Create `skills-cursor/youtube-search/SKILL.md` stub.
  - [x] Subtask 1.3: Create `skills-cursor/reddit-search/SKILL.md` stub.
  - [x] Subtask 1.4: Create `skills-cursor/github-search/SKILL.md` stub.
  - [x] Subtask 1.5: Create `skills-cursor/web-search/SKILL.md` stub.

- [x] Task 2: Implement YouTube Search Skill (AC: AC-5, AC-6)
  - [x] Subtask 2.1: Create failing tests for video ID extraction (UT-1, UT-2, UT-3).
  - [x] Subtask 2.2: Copy/adapt `youtube.ts` → `skills-cursor/youtube-search/scripts/youtube.ts`.
  - [x] Subtask 2.3: Copy/adapt `transcript.ts` → `skills-cursor/youtube-search/scripts/transcript.ts`.
  - [x] Subtask 2.4: (Merged into transcript.ts - yt-dlp logic included).
  - [x] Subtask 2.5: Create `fetch-transcript.ts` CLI entry point (no DB, full transcript to stdout/file).
  - [x] Subtask 2.6: Write `SKILL.md` body with usage instructions and trigger scenarios.
  - [x] Subtask 2.7: Run and validate tests pass (15/15 passing).

- [x] Task 3: Implement Reddit Search Skill (AC: AC-7)
  - [x] Subtask 3.1: Write `SKILL.md` body — web search patterns for Reddit (site:reddit.com queries).
  - [x] Subtask 3.2: Include subreddit discovery heuristics.
  - [x] Subtask 3.3: Include post quality signals (upvotes, comment count).

- [x] Task 4: Implement GitHub Search Skill (AC: AC-8)
  - [x] Subtask 4.1: Write `SKILL.md` body — web search patterns for GitHub (site:github.com queries).
  - [x] Subtask 4.2: Include repo evaluation criteria (stars, last commit, README quality).
  - [x] Subtask 4.3: Include code search patterns (finding implementations).

- [x] Task 5: Implement Web Search Skill (AC: AC-9)
  - [x] Subtask 5.1: Write `SKILL.md` body — general web search best practices.
  - [x] Subtask 5.2: Include site-specific search operators.
  - [x] Subtask 5.3: Include source credibility evaluation.

- [x] Task 6: Update Research Workflow — Keyword Discovery (AC: AC-1, AC-1b, AC-2)
  - [x] Subtask 6.1: Add confirmation gate to Problem Statement step (user must confirm before proceeding).
  - [x] Subtask 6.2: Insert new Step 2.5 "Keyword Discovery" after confirmed Problem Statement.
  - [x] Subtask 6.3: Implement iterative keyword proposal/confirmation loop.
  - [x] Subtask 6.4: Store confirmed keywords in workflow variables.

- [x] Task 7: Update Research Workflow — Remove MCPs (AC: AC-3, AC-4, AC-10)
  - [x] Subtask 7.1: Remove all `mcp_reddit_*` references; replace with web_search + skill reference.
  - [x] Subtask 7.2: Remove all `mcp_youtube_*` references; replace with web_search + skill reference.
  - [x] Subtask 7.3: Remove all `mcp_github_*` references; replace with web_search + skill reference.
  - [x] Subtask 7.4: Update each search step to iterate ONE keyword at a time.
  - [x] Subtask 7.5: Add skill references: "See `youtube-search` skill for transcript download."

- [x] Task 8: Final Validation (AC: All)
  - [x] Subtask 8.1: Verify Keyword Discovery step in workflow (Step 2.5 added with iterative loop).
  - [x] Subtask 8.2: Verify skills are in place (4 SKILL.md files created).
  - [x] Subtask 8.3: Verify transcript script exists (fetch-transcript.ts CLI ready).
  - [x] Subtask 8.4: Run unit tests — 15/15 passing.

## Dev Notes

- **Source Project**: YouTube transcript logic adapted from `~/code/playground/scraper-yt/src/lib/`
- **Dependencies for youtube-search skill**: Node.js 20+, `yt-dlp` (pip install)
- **Skills Location**: `skills-cursor/` (repo-level, tracked in git)
- **Transcript Scope**: Full transcript download only — no summarization, no chunking. The research workflow handles synthesis.
- **Output Format**: Transcript saved to file (stdout or specified path).

## Dev Agent Record

- [2026-01-28] [Created] Initial ticket for Research Workflow 2.0 with keyword-first methodology and Cursor skills.
- [2026-01-28] [Decision] Q-1 resolved: Skills will be user-level at `~/.cursor/skills/`.
- [2026-01-28] [Decision] Q-2 resolved: YouTube skill downloads full transcript only, no summarization.
- [2026-01-28] [Refined] Added AC-1b: Problem Statement must have explicit user confirmation before Keyword Discovery begins.
- [2026-01-28] [Revised] Q-1: Changed skills location from `~/.cursor/skills/` to `skills-cursor/` (repo-level, tracked in git).
- [2026-01-28] [Completed] Task 1: Scaffolded 4 research skill stubs with test infrastructure (vitest).
- [2026-01-28] [Completed] Task 2: YouTube search skill with transcript download script (adapted from scraper-yt).
- [2026-01-28] [Completed] Tasks 3-5: Reddit, GitHub, Web search skills with detailed SKILL.md documentation.
- [2026-01-28] [Completed] Tasks 6-7: Research workflow updated with Keyword Discovery (Step 2.5) and MCP removal.
- [2026-01-28] [Completed] Task 8: Final validation — 15/15 tests passing, all ACs verified.
- [2026-01-28] [Completed] Task 1: Scaffolded 4 research skill stubs with test infrastructure (vitest). Files: `skills-cursor/{youtube,reddit,github,web}-search/SKILL.md`.
