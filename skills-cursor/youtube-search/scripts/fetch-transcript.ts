#!/usr/bin/env npx ts-node
/**
 * =============================================================================
 * FETCH TRANSCRIPT CLI
 * =============================================================================
 *
 * CLI tool to fetch YouTube video transcripts.
 *
 * ## Usage
 *   npx ts-node fetch-transcript.ts <youtube-url-or-video-id> [output-file]
 *
 * ## Examples
 *   npx ts-node fetch-transcript.ts https://www.youtube.com/watch?v=dQw4w9WgXcQ
 *   npx ts-node fetch-transcript.ts dQw4w9WgXcQ transcript.txt
 *
 * ## Requirements
 *   - Node.js 20+
 *   - yt-dlp installed (pip install yt-dlp)
 *
 * @module youtube-search/scripts/fetch-transcript
 */

import fs from "fs";
import { extractVideoId } from "./youtube.js";
import { fetchTranscript } from "./transcript.js";

// =============================================================================
// MAIN
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error("Usage: fetch-transcript.ts <youtube-url-or-video-id> [output-file]");
    console.error("");
    console.error("Examples:");
    console.error("  npx ts-node fetch-transcript.ts https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    console.error("  npx ts-node fetch-transcript.ts dQw4w9WgXcQ transcript.txt");
    process.exit(1);
  }

  const input = args[0];
  const outputFile = args[1];

  // Extract video ID (handles both URLs and raw IDs)
  let videoId: string;
  if (input.includes("youtube.com") || input.includes("youtu.be")) {
    videoId = extractVideoId(input);
  } else if (/^[a-zA-Z0-9_-]{11}$/.test(input)) {
    videoId = input;
  } else {
    console.error(`Error: Invalid input. Provide a YouTube URL or 11-character video ID.`);
    process.exit(1);
  }

  console.error(`Fetching transcript for video: ${videoId}`);

  try {
    const result = await fetchTranscript(videoId);
    
    if (!result.content) {
      console.error("Error: No transcript available for this video.");
      process.exit(1);
    }

    if (outputFile) {
      fs.writeFileSync(outputFile, result.content, "utf-8");
      console.error(`Transcript saved to: ${outputFile}`);
      console.error(`Length: ${result.content.length} characters, ${result.segments.length} segments`);
    } else {
      // Output to stdout
      console.log(result.content);
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
    process.exit(1);
  }
}

main();
