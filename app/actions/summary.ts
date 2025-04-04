"use server";

import { generateSummary } from "@/utils/summary";
import { getYoutubeTranscript, getVideoMetadata } from "@/utils/youtube";

export async function generateVideoSummary(url: string) {
  const metadata = await getVideoMetadata(url);

  const transcript = await getYoutubeTranscript(url);

  if (!transcript.success || !transcript.data) {
    return {
      success: false,
      error: transcript.error || "Failed to fetch transcript",
    };
  }

  return generateSummary(transcript.data.transcript);
}
