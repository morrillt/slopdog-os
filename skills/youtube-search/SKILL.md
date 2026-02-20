---
name: youtube-search
description: Search YouTube for videos and download transcripts. Use when researching topics via YouTube, finding tutorial videos, extracting video transcripts, or when the user needs video content for analysis.
---
# YouTube Search

Search for YouTube videos via web search and download full transcripts for research.

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
cd ~/.cursor/skills/youtube-search/scripts
npx ts-node fetch-transcript.ts "https://www.youtube.com/watch?v=VIDEO_ID" output.txt
```

Or output to stdout:

```bash
npx ts-node fetch-transcript.ts "https://www.youtube.com/watch?v=VIDEO_ID"
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
- yt-dlp (`pip install yt-dlp` or `brew install yt-dlp`)
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
cd ~/.cursor/skills/youtube-search/scripts
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

- User asks to research a topic on YouTube
- User wants to find tutorial or explainer videos
- User needs a video transcript for analysis
- User mentions "watch", "video", or "YouTube"

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
- If user requests more than 3, WARN them and require explicit confirmation
- Help user evaluate and pick the highest-quality videos rather than bulk fetching

## Limitations

- Transcript fetching requires yt-dlp installed
- Some videos have no captions available
- Auto-generated captions may have errors
- Age-restricted or private videos won't work
- Rate limiting applies (see above)
