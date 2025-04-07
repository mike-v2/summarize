"use server";

import { getServerSession } from "next-auth/next";
import { z } from "zod";

import { nextAuthOptions } from "@/config/nextAuthOptions";
import {
  createVideoSummary,
  updateVideoSummary,
} from "@/lib/db/videoSummaries";
import {
  llmExtractClaimsFromSummary,
  llmGenerateSummary,
} from "@/utils/summary";
import { getYoutubeTranscript, getVideoMetadata } from "@/utils/youtube";
import { factBasedClaimSchema, type FactBasedClaim } from "@/schemas/summary";
import { YoutubeTranscriptSegment } from "@/types";
import { formatTranscriptTimestamps } from "@/utils/timestamp";

type ActionResult = {
  success: boolean;
  data?: string;
  error?: string;
};

export async function generateVideoSummary(
  url: string
): Promise<ReadableStream<Uint8Array> | ActionResult> {
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

    // Create metadata object for saving later
    const summaryMetadata = {
      userId,
      videoId: transcriptData.videoId,
      url,
      title: metadata.title,
      description: metadata.description,
      publishedAt: new Date(metadata.publishedAt),
      duration: String(metadata.duration),
    };

    // Combine transcript
    const combinedTranscript = transcriptData.transcript
      .map((item) => item.text)
      .join(" ");

    // Get the raw stream from the summary generator
    const summaryStream = await llmGenerateSummary(combinedTranscript);

    // Create a TransformStream to process the data before sending to client
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
          // Save summary to DB
          const videoSummaryData = {
            ...summaryMetadata,
            rawSummary: completeResponse,
          };
          const savedSummary = await createVideoSummary(videoSummaryData);

          const claims = await extractClaims(
            savedSummary._id.toString(),
            transcriptData.transcript,
            completeResponse
          );

          updateVideoSummary(savedSummary._id.toString(), claims);
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

    return readable;
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
  savedSummaryId: string,
  transcript: YoutubeTranscriptSegment[],
  rawSummary: string
): Promise<FactBasedClaim[]> {
  try {
    const formattedTranscript = JSON.stringify(
      formatTranscriptTimestamps(transcript)
    );

    const extractedClaims = await llmExtractClaimsFromSummary(
      rawSummary,
      formattedTranscript
    );
    const claimsSchema = z.array(factBasedClaimSchema);
    const validatedClaims = claimsSchema.parse(extractedClaims);

    return validatedClaims;
  } catch (error) {
    console.error(
      `Error processing/updating claims for summary ${savedSummaryId}:`,
      error
    );
    if (error instanceof z.ZodError) {
      console.error("Validation Error during claim update:", error.errors);
    }
    return [];
  }
}
