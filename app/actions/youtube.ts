"use server";

import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";

// Schema for YouTube URL validation
const youtubeUrlSchema = z.string().refine((url) => {
  try {
    const urlObj = new URL(url);
    return (
      (urlObj.hostname === "www.youtube.com" ||
        urlObj.hostname === "youtube.com") &&
      (urlObj.pathname === "/watch" || urlObj.pathname.startsWith("/shorts/"))
    );
  } catch {
    return false;
  }
}, "Invalid YouTube URL");

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.pathname === "/watch") {
      return urlObj.searchParams.get("v");
    }
    if (urlObj.pathname.startsWith("/shorts/")) {
      return urlObj.pathname.split("/")[2];
    }
    return null;
  } catch {
    return null;
  }
}

export type TranscriptResponse = {
  success: boolean;
  data?: {
    transcript: Array<{
      text: string;
      offset: number;
      duration: number;
    }>;
  };
  error?: string;
};

export async function getYoutubeTranscript(
  url: string
): Promise<TranscriptResponse> {
  try {
    // Validate URL format
    const validationResult = youtubeUrlSchema.safeParse(url);
    if (!validationResult.success) {
      return {
        success: false,
        error: "Invalid YouTube URL format",
      };
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return {
        success: false,
        error: "Could not extract video ID from URL",
      };
    }

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);

    return {
      success: true,
      data: {
        transcript,
      },
    };
  } catch (error) {
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to fetch transcript",
    };
  }
}
