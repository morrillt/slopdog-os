---
name: reddit-fetch
description: Fetch content from Reddit using Gemini CLI. Use when accessing Reddit URLs, researching topics on Reddit, finding community opinions, or discovering subreddits.
---
# Reddit Fetch via Gemini CLI

Reddit blocks direct access. Use Gemini CLI to fetch Reddit content.

## Quick Start

Use Gemini CLI's non-interactive mode with the `-p` flag:

```bash
gemini -p "Your Reddit query here"
```

Response time varies (30-90 seconds typical). Set appropriate timeouts.

## Query Patterns

### Topic Search

```bash
gemini -p "Search Reddit for discussions about 'your topic' and summarize the top results"
```

### Direct URL Fetch

```bash
gemini -p "Fetch and summarize this Reddit thread: https://reddit.com/r/subreddit/comments/..."
```

### Subreddit Research

```bash
gemini -p "Find recent posts in r/subreddit about 'topic' and summarize key insights"
```

### Pros/Cons Summary

```bash
gemini -p "Search Reddit for discussions about 'product/tool' and summarize what users like and dislike"
```

### Troubleshooting

```bash
gemini -p "Search Reddit for solutions to 'error message or problem description'"
```

## Trigger Scenarios

- User asks to research a topic on Reddit
- User wants community opinions or experiences from Reddit
- User needs to find relevant subreddits
- User mentions "Reddit" or wants discussion-based research
- User provides a Reddit URL to fetch

## Limitations

- Response time varies (30-90 seconds typical)
- Requires Gemini CLI to be installed and authenticated
