/**
 * =============================================================================
 * TRANSCRIPT FETCHING
 * =============================================================================
 *
 * Functions for fetching video transcripts from YouTube.
 * Primary method: yt-dlp (most robust for 2026).
 *
 * @module youtube-search/scripts/transcript
 */

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import os from "os";

// =============================================================================
// TYPES
// =============================================================================

export interface TranscriptSegment {
  text: string;
  offset: number;
  duration: number;
}

export interface TranscriptResult {
  content: string;
  segments: TranscriptSegment[];
}

// =============================================================================
// MAIN / EXPORTED
// =============================================================================

/**
 * Fetch transcript for a YouTube video using yt-dlp.
 *
 * @param videoId - YouTube video ID
 * @returns Transcript content and segments
 * @throws Error if transcript is not available
 */
export async function fetchTranscript(videoId: string): Promise<TranscriptResult> {
  const tempDir = os.tmpdir();
  const tempFileBase = path.join(tempDir, `transcript_${videoId}`);
  
  // Possible output files (yt-dlp may add language suffix)
  const possibleFiles = [
    `${tempFileBase}.en.vtt`,
    `${tempFileBase}.en-orig.vtt`,
    `${tempFileBase}.vtt`,
  ];

  try {
    // Command to download auto-generated English subtitles in VTT format
    const command = `yt-dlp --write-auto-sub --write-sub --skip-download --sub-lang en --sub-format vtt --output "${tempFileBase}" "https://www.youtube.com/watch?v=${videoId}" 2>&1`;
    
    execSync(command, { encoding: "utf-8" });

    // Find the created file
    let vttFile: string | null = null;
    for (const file of possibleFiles) {
      if (fs.existsSync(file)) {
        vttFile = file;
        break;
      }
    }

    // Also check for any .vtt file in temp dir with our prefix
    if (!vttFile) {
      const files = fs.readdirSync(tempDir);
      const match = files.find(f => f.startsWith(`transcript_${videoId}`) && f.endsWith('.vtt'));
      if (match) {
        vttFile = path.join(tempDir, match);
      }
    }

    if (!vttFile) {
      throw new Error(`No transcript available for video ${videoId}`);
    }

    const vttContent = fs.readFileSync(vttFile, "utf-8");
    const segments = parseVttTranscript(vttContent);
    const content = segments.map((s) => s.text).join(" ");

    // Cleanup
    fs.unlinkSync(vttFile);

    return { content, segments };
  } catch (error) {
    // Cleanup any temp files
    for (const file of possibleFiles) {
      if (fs.existsSync(file)) {
        fs.unlinkSync(file);
      }
    }
    
    if (error instanceof Error) {
      throw new Error(`Failed to fetch transcript: ${error.message}`);
    }
    throw error;
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Parse VTT transcript content into segments.
 * Cleans up YouTube's duplicate word-level lines.
 */
function parseVttTranscript(vtt: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const lines = vtt.split("\n");
  
  let currentSegment: Partial<TranscriptSegment> | null = null;
  const seenTexts = new Set<string>();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Match timestamp line: 00:00:00.080 --> 00:00:02.070
    const timeMatch = line.match(/(\d{2}:\d{2}:\d{2}\.\d{3}) --> (\d{2}:\d{2}:\d{2}\.\d{3})/);
    
    if (timeMatch) {
      const start = parseVttTimestamp(timeMatch[1]);
      const end = parseVttTimestamp(timeMatch[2]);
      
      currentSegment = {
        offset: start,
        duration: end - start,
      };
      continue;
    }

    if (currentSegment && line && !line.startsWith("WEBVTT") && !line.startsWith("Kind:") && !line.startsWith("Language:") && !line.startsWith("NOTE")) {
      // Clean up YouTube's word-level timing tags: <00:00:00.320><c> text </c>
      let cleanText = line.replace(/<[^>]+>/g, "").trim();
      
      if (cleanText && !seenTexts.has(cleanText)) {
        segments.push({
          text: cleanText,
          offset: currentSegment.offset!,
          duration: currentSegment.duration!,
        });
        seenTexts.add(cleanText);
        currentSegment = null;
      }
    }
  }

  return segments;
}

/**
 * Parse VTT timestamp (HH:MM:SS.mmm) into milliseconds.
 */
function parseVttTimestamp(timestamp: string): number {
  const [hms, mmm] = timestamp.split(".");
  const [h, m, s] = hms.split(":").map(Number);
  return (h * 3600 + m * 60 + s) * 1000 + parseInt(mmm, 10);
}
