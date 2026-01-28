import { describe, it, expect } from "vitest";
import { extractVideoId } from "../youtube-search/scripts/youtube";

describe("YouTube Video ID Extraction", () => {
  describe("extractVideoId", () => {
    it("UT-1: extracts video ID from standard YouTube URL", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
      expect(extractVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("UT-1b: extracts video ID from URL with additional params", () => {
      const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120";
      expect(extractVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("UT-2: extracts video ID from short URL (youtu.be)", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ";
      expect(extractVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("UT-2b: extracts video ID from short URL with timestamp", () => {
      const url = "https://youtu.be/dQw4w9WgXcQ?t=45";
      expect(extractVideoId(url)).toBe("dQw4w9WgXcQ");
    });

    it("UT-3: throws error for invalid URL", () => {
      const url = "https://example.com/not-a-youtube-url";
      expect(() => extractVideoId(url)).toThrow("Invalid YouTube URL");
    });

    it("UT-3b: throws error for empty string", () => {
      expect(() => extractVideoId("")).toThrow("Invalid YouTube URL");
    });

    it("extracts video ID from embed URL", () => {
      const url = "https://www.youtube.com/embed/dQw4w9WgXcQ";
      expect(extractVideoId(url)).toBe("dQw4w9WgXcQ");
    });
  });
});
