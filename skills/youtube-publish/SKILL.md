---
name: youtube-publish
description: Publishes OBS recordings to YouTube. Transcodes the video to 1440p and uploads it via the YouTube Data API. Use when the user says "youtube publish", "publish to youtube", "upload to youtube", or asks to publish/upload a video recording.
---

# YouTube Publish

Converts an OBS recording to 1440p MP4 and uploads it to YouTube as unlisted.

## Workflow

1. **Find the video** — list files in `/d/recordings/` and ask the user to confirm which one to publish (or they can specify it directly).
2. **Ask for metadata** — confirm the title and optionally a description.
3. **Run the workflow script** — it converts then uploads automatically.
4. **Report the result** — share the YouTube video URL when done.

## Commands

**List available recordings:**
```bash
ls -lht /d/recordings/ | head -20
```

**Run the full pipeline:**
```bash
~/scripts/youtube_workflow.sh "/d/recordings/FILENAME" "Video Title" "Description" "1440p"
```

The script will:
- Convert the file to 1440p MP4 using FFmpeg (Lanczos upscale, 16 Mbps)
- Upload it to YouTube as **unlisted** using the saved OAuth token
- Print the video ID on success

## Key Paths

| Resource | Path |
|---|---|
| Workflow script | `~/scripts/youtube_workflow.sh` |
| Upload script | `~/scripts/upload_to_youtube.py` |
| Converted files | `~/scripts/youtube_uploads/` |
| OAuth token | `~/scripts/token.pickle` |
| Google credentials | `~/scripts/client_secrets.json` |

## Re-authentication

If the upload fails with an auth error, delete the token and re-run — the script will open a browser to re-authorize:
```bash
rm ~/scripts/token.pickle
```

## Privacy & Resolution Options

Default is `unlisted` at `1440p`. Override via args:
```bash
# Public, 1080p
~/scripts/youtube_workflow.sh "/d/recordings/FILE" "Title" "Description" "1080p"
# Then update privacy via the API or YouTube Studio
```

Available resolutions: `720p`, `1080p`, `1440p`, `4k`
