"use server";

import { getServerSession } from "next-auth/next";

import { nextAuthOptions } from "@/config/nextAuthOptions";
import {
  createVideoData,
  updateVideoSummary,
  findSummaryByVideoId,
} from "@/lib/db/videoSummaries";
import { createUserSummary } from "@/lib/db/userSummary";
import { llmGenerateSummary } from "@/utils/llm/createSummary";
import { getVideoMetadata, extractVideoId } from "@/utils/youtube";
import { VideoMetadata, YoutubeTranscriptSegment } from "@/types";

type ActionResult = {
  success: boolean;
  stream?: ReadableStream<Uint8Array>;
  metadata?: VideoMetadata;
  summaryId?: string;
  rawSummary?: string;
  error?: string;
};

async function processAndSaveStream(
  summaryStream: ReadableStream<Uint8Array>,
  summaryId: string,
  writable: WritableStream<Uint8Array>
) {
  const reader = summaryStream.getReader();
  const writer = writable.getWriter();
  const textDecoder = new TextDecoder();
  let completeResponse = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunk = textDecoder.decode(value, { stream: true });
      completeResponse += chunk;
      await writer.write(value);
    }
    updateVideoSummary(summaryId, completeResponse);
  } catch (streamError) {
    console.error(
      `Error processing summary stream for ${summaryId}:`,
      streamError
    );
    writer.abort(streamError);
  } finally {
    writer.close();
  }
}

export async function generateVideoSummary(url: string): Promise<ActionResult> {
  const session = await getServerSession(nextAuthOptions);
  const userId = session?.user?.id;

  if (!userId) {
    return { success: false, error: "User not authenticated" };
  }

  try {
    const videoId = extractVideoId(url);
    if (!videoId) {
      return { success: false, error: "Invalid YouTube URL" };
    }

    const existingSummary = await findSummaryByVideoId(videoId);

    if (existingSummary) {
      const summaryId = existingSummary._id.toString();
      await createUserSummary(userId, summaryId);
      const transcript: YoutubeTranscriptSegment[] = JSON.parse(
        existingSummary.sourceText
      );

      const existingMetadata: VideoMetadata = {
        id: existingSummary.videoId,
        title: existingSummary.title,
        description: existingSummary.description || "",
        publishedAt: existingSummary.publishedAt?.toISOString() || "",
        duration: existingSummary.duration,
        transcript: transcript,
      };

      if (existingSummary.rawSummary) {
        return {
          success: true,
          metadata: existingMetadata,
          summaryId: summaryId,
          rawSummary: existingSummary.rawSummary,
        };
      }

      // Summary exists but raw summary is missing
      const combinedTranscript = transcript.map((item) => item.text).join(" ");
      const summaryStream = await llmGenerateSummary(combinedTranscript);
      const { readable, writable } = new TransformStream();

      processAndSaveStream(summaryStream, summaryId, writable);

      return {
        success: true,
        stream: readable,
        metadata: existingMetadata,
        summaryId: summaryId,
      };
    }

    // Generate new summary
    const metadataResult = await getVideoMetadata(url);
    if (!metadataResult.success || !metadataResult.data) {
      return {
        success: false,
        error: metadataResult.error || "Failed to fetch video metadata",
      };
    }
    const metadata = metadataResult.data;

    const summaryMetadata = {
      videoId: videoId,
      url,
      title: metadata.title,
      description: metadata.description || "No description available",
      publishedAt: new Date(metadata.publishedAt),
      duration: String(metadata.duration),
      sourceText: JSON.stringify(metadata.transcript),
    };
    const savedSummary = await createVideoData(summaryMetadata);
    const summaryId = savedSummary._id.toString();

    await createUserSummary(userId, summaryId);

    const combinedTranscript = metadata.transcript
      .map((item) => item.text)
      .join(" ");
    const summaryStream = await llmGenerateSummary(combinedTranscript);
    const { readable, writable } = new TransformStream();

    processAndSaveStream(summaryStream, summaryId, writable);

    return {
      success: true,
      stream: readable,
      metadata: metadata,
      summaryId: summaryId,
    };
  } catch (error: any) {
    console.error("Error in generateVideoSummary action:", error);
    if (
      error.message.includes("Validation Error") ||
      error.message.includes("Failed to create video summary") ||
      error.message.includes("Failed to query database")
    ) {
      return { success: false, error: error.message };
    }
    return {
      success: false,
      error: "An unexpected error occurred while processing the video.",
    };
  }
}
