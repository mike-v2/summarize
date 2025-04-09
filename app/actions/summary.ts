"use server";

import { getServerSession } from "next-auth/next";

import { nextAuthOptions } from "@/config/nextAuthOptions";
import {
  saveVideoMetadata,
  saveClaims,
  updateVideoSummary,
} from "@/lib/db/videoSummaries";
import {
  llmExtractClaimsFromSummary,
  llmGenerateSummary,
} from "@/utils/summary";
import { getYoutubeTranscript, getVideoMetadata } from "@/utils/youtube";
import { formatTranscriptTimestamps } from "@/utils/timestamp";
import { type FactBasedClaimData } from "@/types";
import { VideoMetadata, YoutubeTranscriptSegment } from "@/types";

type ActionResult = {
  success: boolean;
  stream?: ReadableStream<Uint8Array>;
  metadata?: VideoMetadata;
  summaryId?: string;
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
    if (
      !transcriptResult.success ||
      !transcriptResult.data?.transcript ||
      !Array.isArray(transcriptResult.data.transcript)
    ) {
      return {
        success: false,
        error: transcriptResult.error || "Failed to fetch transcript",
      };
    }
    const transcriptData = transcriptResult.data;

    // Save summary to DB
    const summaryMetadata = {
      userId,
      videoId: transcriptData.videoId,
      url,
      title: metadata.title,
      description: metadata.description,
      publishedAt: new Date(metadata.publishedAt),
      duration: String(metadata.duration),
    };
    // Use await to avoid race condition
    // Though db entry should be set by the time llm response is finished
    const savedSummaryPromise = saveVideoMetadata(summaryMetadata);

    const combinedTranscript = transcriptData.transcript
      .map((item) => item.text)
      .join(" ");
    const summaryStream = await llmGenerateSummary(combinedTranscript);
    const { readable, writable } = new TransformStream();

    // Process the stream, save the result, and pass it through to the client
    (async () => {
      const reader = summaryStream.getReader();
      const writer = writable.getWriter();
      const textDecoder = new TextDecoder();
      const textEncoder = new TextEncoder();

      let completeResponse = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = textDecoder.decode(value, { stream: true });
          completeResponse += chunk;

          await writer.write(value);
        }

        try {
          const savedSummary = await savedSummaryPromise;
          updateVideoSummary(savedSummary._id.toString(), completeResponse);

          const claims = await extractClaims(
            transcriptData.transcript,
            completeResponse
          );

          saveClaims(savedSummary._id.toString(), claims);
        } catch (parseError) {
          console.error("Error parsing summary:", parseError);

          // Add error message to the stream
          const errorMessage =
            "\n\nERROR: Failed to process summary for saving.";
          await writer.write(textEncoder.encode(errorMessage));
        }
      } catch (streamError) {
        console.error("Error processing summary stream:", streamError);
      } finally {
        writer.close();
      }
    })();

    const savedSummary = await savedSummaryPromise;
    return {
      success: true,
      stream: readable,
      metadata: metadata,
      summaryId: savedSummary._id.toString(),
    };
  } catch (error: any) {
    console.error("Error in generateVideoSummary action:", error);

    if (
      error.message.includes("Validation Error") ||
      error.message.includes("Failed to create video summary")
    ) {
      return {
        success: false,
        error: error.message,
      };
    }

    return {
      success: false,
      error: "An unexpected error occurred while processing the video.",
    };
  }
}

async function extractClaims(
  transcript: YoutubeTranscriptSegment[],
  rawSummary: string
): Promise<FactBasedClaimData[]> {
  try {
    const formattedTranscript = JSON.stringify(
      formatTranscriptTimestamps(transcript)
    );

    return await llmExtractClaimsFromSummary(rawSummary, formattedTranscript);
  } catch (error) {
    console.error(`Error processing/updating claims:`, error);
    return [];
  }
}
