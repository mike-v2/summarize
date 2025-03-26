"use server";

import { generateSummary } from "@/utils/summary";
import { getYoutubeTranscript } from "@/utils/youtube";

export async function generateVideoSummary(url: string) {
  const transcriptResult = await getYoutubeTranscript(url);

  if (!transcriptResult.success || !transcriptResult.data) {
    return {
      success: false,
      error: transcriptResult.error || "Failed to fetch transcript",
    };
  }

  return generateSummary(transcriptResult.data.transcript);
}
