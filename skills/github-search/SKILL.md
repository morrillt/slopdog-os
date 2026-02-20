---
name: github-search
description: Look up official GitHub repos for known technologies. Use when finding the official homepage/repo for a specific library, tool, or framework already identified in research.
---
# GitHub Lookup

Find official GitHub repositories for technologies already identified in research. This is a **lookup** skill, not a discovery skill.

## Purpose

When you have a list of specific technologies (libraries, tools, frameworks) from prior research, use this skill to:
1. Find the official/canonical GitHub repository
2. Enrich understanding from the README and docs
3. Verify the technology is actively maintained

## Quick Start

For each technology in your list:

```
site:github.com "[exact technology name]"
```

Or construct the direct URL if you know the org:

```
https://github.com/[org]/[repo]
```

## Lookup Workflow

### 1. Find Official Repo

For each technology:

```bash
# Search for the official repo
site:github.com "langchain"
site:github.com "prisma orm"
site:github.com "fastapi"
```

### 2. Verify It's Official

Check these signals:
- **Organization name** matches expected (e.g., `langchain-ai/langchain`)
- **Stars** - official repos typically have more stars than forks
- **Description** matches what you expect
- **Links** - official site links back to this repo

### 3. Enrich from README

Read the README to extract:
- **What it does**: Core purpose (1-2 sentences)
- **Installation**: `npm install X` or `pip install X`
- **Key features**: Bullet points of capabilities
- **Limitations**: Known constraints or gotchas
- **Links**: Official docs, Discord, etc.

## Repository Evaluation Criteria

| Signal | Good | Caution |
|--------|------|---------|
| Stars | >100 stars | <10 stars |
| Last commit | Within 6 months | >2 years ago |
| README | Comprehensive docs | Empty or minimal |
| License | MIT, Apache, BSD | No license |

## Using the GitHub MCP

If available, use the `user-github` MCP for direct API access:

- Get repository details (stars, forks, issues)
- Read file contents directly (README.md)
- Check recent activity

## Trigger Scenarios

- Research workflow Step 5 (GitHub Lookup)
- User has a list of technologies to look up
- User wants to find the official repo for a known library
- User needs to verify a technology is actively maintained

## What This Skill is NOT For

- **Not for discovery**: Don't use this to find new technologies
- **Not for code search**: Don't use this to find implementations
- **Not for comparisons**: Don't use this to find alternatives

For discovery, use the research workflow's Reddit/YouTube steps first.
