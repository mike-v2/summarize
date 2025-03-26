import { z } from "zod";
import { YoutubeTranscript } from "youtube-transcript";

// Schema for YouTube URL validation
const youtubeUrlSchema = z.string().refine((url) => {
  const pattern = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/;
  return pattern.test(url);
}, "Please enter a valid YouTube URL");

// Extract video ID from YouTube URL
function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    if (urlObj.hostname === "youtu.be") {
      return urlObj.pathname.slice(1);
    }
    if (
      urlObj.hostname === "www.youtube.com" ||
      urlObj.hostname === "youtube.com"
    ) {
      if (urlObj.pathname === "/watch") {
        return urlObj.searchParams.get("v");
      }
      if (urlObj.pathname === "/shorts") {
        return urlObj.pathname.split("/")[2];
      }
    }
    return null;
  } catch {
    return null;
  }
}

export type TranscriptResponse = {
  success: boolean;
  data?: {
    transcript: string;
    videoId: string;
  };
  error?: string;
};

export async function getYoutubeTranscript(
  url: string
): Promise<TranscriptResponse> {
  try {
    // Validate URL format
    const validatedUrl = youtubeUrlSchema.parse(url);

    // Extract video ID
    const videoId = extractVideoId(validatedUrl);
    if (!videoId) {
      return {
        success: false,
        error: "Could not extract video ID from URL",
      };
    }

    // Fetch transcript
    const transcript = await YoutubeTranscript.fetchTranscript(videoId);
    const transcriptText = transcript
      .map((item: { text: string }) => item.text)
      .join(" ");

    return {
      success: true,
      data: {
        transcript: transcriptText,
        videoId,
      },
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
      };
    }
    if (error instanceof Error) {
      return {
        success: false,
        error: error.message,
      };
    }
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
