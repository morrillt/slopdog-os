---
name: reddit-search
description: Search Reddit for community opinions, recommendations, and complaints on any topic — without Reddit credentials — via Gemini's Google Search grounding. Use when Todd asks "what does Reddit think about X", wants user experiences with a product/tool, or gives a Reddit topic. For full comment threads with vote counts use the last30days plugin instead.
---
# Reddit search via Gemini grounding

Reddit returns 403 to every unauthenticated request and new Reddit OAuth apps need manual
approval. This skill sidesteps that: Google licenses Reddit content, so Google's index has
the threads, and Gemini's `google_search` tool reads Google's copy. Nothing here touches
reddit.com except resolving the cited URLs.

## Run

```bash
python3 ~/.claude/skills/reddit-search/scripts/reddit_search.py "what do people think of Claude Code skills"
```

Options: `--model gemini-2.5-pro` (slower, deeper), `--raw` (send the prompt verbatim, no
Reddit steering), `--json` (full API response). 15–30 s per query. Prints a synthesized
answer with subreddit + thread titles, quoted opinions, then a `Sources:` list of resolved
`reddit.com` URLs.

Key: `GEMINI_API_KEY`, read from the environment or `~/.config/gemini/env` (free AI Studio
tier, 250 req/day — plenty).

## Prompting

- Give a topic, not a question stack: `"Ooni Koda 16 vs Gozney Arc"` beats
  `"Compare the Ooni Koda 16 and Gozney Arc for a small restaurant, focusing on…"`. The
  script adds the Reddit steering itself.
- Don't put dates in the topic. Gemini turns them into exact-phrase searches that match
  nothing. Say "recent" or leave it out.
- If the answer says it found no reddit.com results, rephrase with plainer keywords and
  retry once; then fall back to `last30days`.

## When to use the other tool

| Want | Use |
|---|---|
| Opinions, consensus, recommendations, "what does Reddit think" | this skill |
| Actual comment text, vote counts, last-30-days recency, HN/X/YouTube alongside | `/last30days <topic> --search reddit` |

## Why not Gemini CLI

The original version shelled out to `gemini -p`. Two things killed that (2026-08-31):
the free "Login with Google" tier was retired in favor of Antigravity CLI, and with an API
key the CLI's agent loop hung for minutes and returned nothing. A direct API call returns
in seconds. Don't reintroduce the CLI.
