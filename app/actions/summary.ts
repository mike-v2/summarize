"use server";

import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/config/nextAuthOptions";
import { createVideoSummary } from "@/lib/db/videoSummaries";
import { generateSummary } from "@/utils/summary";
import { getYoutubeTranscript, getVideoMetadata } from "@/utils/youtube";
import type { SummaryResponse } from "@/schemas/summary";

type ActionResult = {
  success: boolean;
  data?: SummaryResponse;
  error?: string;
};

export async function generateVideoSummary(url: string): Promise<ActionResult> {
  const session = await getServerSession(nextAuthOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return {
      success: false,
      error: "User not authenticated",
    };
  }

  try {
    const [metadataResult, transcriptResult] = await Promise.all([
      getVideoMetadata(url),
      getYoutubeTranscript(url),
    ]);

    // Handle metadata errors
    if (!metadataResult.success || !metadataResult.data) {
      return {
        success: false,
        error: metadataResult.error || "Failed to fetch video metadata",
      };
    }
    const metadata = metadataResult.data;

    // Handle transcript errors
    if (!transcriptResult.success || !transcriptResult.data) {
      return {
        success: false,
        error: transcriptResult.error || "Failed to fetch transcript",
      };
    }
    const transcriptData = transcriptResult.data;

    // Generate summary
    const summaryResult = await generateSummary(transcriptData.transcript);

    if (!summaryResult.success || !summaryResult.data) {
      return {
        success: false,
        error: summaryResult.error || "Failed to generate summary",
      };
    }
    const summary = summaryResult.data;

    // Prepare data for the database function
    const videoSummaryData = {
      userId: userId,
      videoId: transcriptData.videoId,
      url: url,
      title: metadata.title,
      description: metadata.description,
      publishedAt: new Date(metadata.publishedAt),
      duration: metadata.duration,
      summary: summary,
    };

    await createVideoSummary(videoSummaryData);

    // Return the original summary result
    return summaryResult;
  } catch (error: any) {
    console.error("Error in generateVideoSummary action:", error);

    // Check if it's an error re-thrown from our DB function
    if (
      error.message.includes("Validation Error") ||
      error.message.includes("Failed to create video summary")
    ) {
      return {
        success: false,
        error: error.message,
      };
    }

    // Generic error handling for other potential errors in the action
    return {
      success: false,
      error: "An unexpected error occurred while processing the video.",
    };
  }
}
