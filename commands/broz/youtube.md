Search YouTube for videos and optionally fetch transcripts. (Trigger: `broz:youtube`)

Do this EXACTLY in order:
1) Read the YouTube skill at `~/.cursor/skills-cursor/youtube-search/SKILL.md`
2) Follow the skill's instructions to search YouTube using the user's query
3) Present the top video results with evaluation criteria (views, date, channel)
4) Ask the user if they want transcripts fetched for any specific videos
5) If yes, use the transcript script to fetch and analyze the content

## Rate Limits (IMPORTANT)

To avoid YouTube rate limiting:
- **Max 3 transcripts per session** - Do NOT fetch more than 3 transcripts in a single conversation
- **Wait 5+ seconds between fetches** - Use `sleep 5` between transcript requests
- **Prefer quality over quantity** - Help user pick the 1-2 best videos rather than fetching many
- If user requests more than 3, WARN them and ask to confirm before proceeding

## Usage Examples

- `/youtube cursor rules tutorial` → Search for Cursor rules tutorials
- `/youtube react server components 2026` → Find recent RSC content
- `/youtube "topic" deep dive` → Find in-depth explanations

## What This Command Does

1. Searches YouTube via `site:youtube.com` web search
2. Evaluates video quality (views, recency, channel reputation)
3. Can fetch full transcripts using `yt-dlp` for deeper analysis
4. Summarizes key insights from video content
