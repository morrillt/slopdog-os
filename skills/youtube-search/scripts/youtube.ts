/**
 * =============================================================================
 * YOUTUBE UTILITIES
 * =============================================================================
 *
 * Functions for extracting video IDs and metadata from YouTube URLs.
 *
 * @module youtube-search/scripts/youtube
 */

// =============================================================================
// TYPES
// =============================================================================

export interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
}

// =============================================================================
// MAIN / EXPORTED
// =============================================================================

/**
 * Extract video ID from various YouTube URL formats.
 *
 * Supported formats:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - URLs with additional parameters (?t=, &list=, etc.)
 *
 * @param url - YouTube video URL
 * @returns 11-character video ID
 * @throws Error if URL is not a valid YouTube URL
 */
export function extractVideoId(url: string): string {
  // Standard watch URL: youtube.com/watch?v=VIDEO_ID
  const watchMatch = url.match(
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/
  );
  if (watchMatch) {
    return watchMatch[1];
  }

  // Short URL: youtu.be/VIDEO_ID
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch) {
    return shortMatch[1];
  }

  // Embed URL: youtube.com/embed/VIDEO_ID
  const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
  if (embedMatch) {
    return embedMatch[1];
  }

  throw new Error(`Invalid YouTube URL: ${url}`);
}

/**
 * Fetch basic video metadata from YouTube using oembed API.
 * This is a free API that doesn't require an API key.
 *
 * @param videoId - YouTube video ID
 * @returns Video metadata (title, channel)
 */
export async function fetchVideoMetadata(
  videoId: string
): Promise<VideoMetadata> {
  const oembedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  const response = await fetch(oembedUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch video metadata: ${response.statusText}`);
  }

  const data = await response.json();

  return {
    videoId,
    title: data.title,
    channelName: data.author_name,
  };
}
