---
name: youtube-search
description: Search YouTube for videos and download transcripts. Use when researching topics via YouTube, finding tutorial videos, extracting video transcripts, or when the user needs video content for analysis.
disable-model-invocation: true
---
# YouTube Search

Search for YouTube videos via web search and download full transcripts for research.
`disable-model-invocation` is set — Todd types `/slopdog:youtube-search`, it never
triggers on its own (Todd, 2026-09-26: split back out of `/slopdog:source-search` so a
Reddit or GitHub question can't accidentally pull YouTube in).

Before any live YouTube call, follow the one-bot-per-site rule in
`~/slopdog/v2/rules/workspaces.md` if a browser session is involved.

## Quick Start

### 1. Find Videos via Web Search

Use the `web_search` tool with YouTube-specific queries:

```
site:youtube.com "your topic" tutorial
site:youtube.com "your topic" explained
site:youtube.com "your topic" 2026
```

### 2. Download Transcript

Once you have a video URL, use the transcript script:

```bash
cd ~/.claude/skills/slopdog/research/youtube-search/scripts
npx tsx fetch-transcript.ts "https://www.youtube.com/watch?v=VIDEO_ID" output.txt
```

Or output to stdout:

```bash
npx tsx fetch-transcript.ts "https://www.youtube.com/watch?v=VIDEO_ID"
```

## Search Patterns

### Finding Tutorial Content

```
site:youtube.com "topic" tutorial beginner
site:youtube.com "topic" how to
site:youtube.com "topic" explained simply
```

### Finding Recent Content

```
site:youtube.com "topic" 2026
site:youtube.com "topic" latest
```

### Finding In-Depth Content

```
site:youtube.com "topic" deep dive
site:youtube.com "topic" comprehensive guide
site:youtube.com "topic" full course
```

## Transcript Script

### Requirements

- Node.js 20+
- `uvx yt-dlp` (the system `yt-dlp` binary is broken on this machine — always run it
  through `uvx`, never the bare command)
- tsx (`npx tsx` - no global install needed)

### Usage

```bash
# From URL (output to stdout)
npx tsx fetch-transcript.ts "https://www.youtube.com/watch?v=dQw4w9WgXcQ"

# From video ID
npx tsx fetch-transcript.ts dQw4w9WgXcQ

# Save to file (recommended for analysis)
npx tsx fetch-transcript.ts "https://www.youtube.com/watch?v=VIDEO_ID" /tmp/transcript.txt
```

### In Research Workflow

When using in the research workflow, save transcripts to `/tmp/` for analysis:

```bash
cd ~/.claude/skills/slopdog/research/youtube-search/scripts
npx tsx fetch-transcript.ts "VIDEO_URL" /tmp/transcript-VIDEO_ID.txt
```

### Output

- Without output file: transcript text to stdout
- With output file: saves transcript, prints stats to stderr

## Video Evaluation Criteria

When selecting videos for research:

| Signal | Good | Caution |
|--------|------|---------|
| View count | >10K views | <1K views |
| Upload date | Recent (2024-2026) | >3 years old |
| Channel | Verified, known expert | Unknown creator |
| Duration | 10-60 min for depth | <5 min may be superficial |
| Comments | Positive, substantive | Disabled or negative |

## Trigger Scenarios

- Todd explicitly asks to search YouTube or pull a transcript
- Todd wants to find tutorial or explainer videos
- Todd needs a video transcript for analysis

## Rate Limits (CRITICAL)

To avoid YouTube rate limiting / account restrictions:

| Rule | Limit |
|------|-------|
| Max transcripts per session | **3** |
| Delay between fetches | **5+ seconds** (`sleep 5`) |
| Preferred approach | Pick 1-2 best videos, not many |

**Enforcement:**
- Do NOT fetch more than 3 transcripts in a single conversation
- Always run `sleep 5` between transcript fetch commands
- If Todd requests more than 3, WARN him and require explicit confirmation
- Help evaluate and pick the highest-quality videos rather than bulk fetching

## Limitations

- Transcript fetching requires `uvx yt-dlp` to work
- Some videos have no captions available
- Auto-generated captions may have errors
- Age-restricted or private videos won't work
- Rate limiting applies (see above)
