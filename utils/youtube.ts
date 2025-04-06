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
      if (urlObj.pathname.startsWith("/shorts/")) {
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
    videoId: string;
    transcript: Array<{
      text: string;
      offset: number;
      duration: number;
    }>;
  };
  error?: string;
};

export type VideoMetadata = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  duration?: string;
};

export type MetadataResponse = {
  success: boolean;
  data?: VideoMetadata;
  error?: string;
};

export async function getVideoMetadata(url: string): Promise<MetadataResponse> {
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

    if (!process.env.YOUTUBE_API_KEY) {
      return {
        success: false,
        error: "YouTube API key is not configured",
      };
    }

    // Get video details using YouTube API
    const apiUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,contentDetails&id=${videoId}&key=${process.env.YOUTUBE_API_KEY}`;
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const errorData = await response.json();
      return {
        success: false,
        error: `YouTube API error: ${
          errorData.error?.message || response.statusText
        }`,
      };
    }

    const data = await response.json();

    if (!data.items || data.items.length === 0) {
      return {
        success: false,
        error: "Video not found",
      };
    }

    const videoData = data.items[0];
    const snippet = videoData.snippet;
    const contentDetails = videoData.contentDetails;

    return {
      success: true,
      data: {
        id: videoId,
        title: snippet.title,
        description: snippet.description,
        publishedAt: snippet.publishedAt,
        duration: contentDetails?.duration,
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

    return {
      success: true,
      data: {
        videoId,
        transcript,
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
