"use server";

import { getServerSession } from "next-auth/next";

import { nextAuthOptions } from "@/config/nextAuthOptions";
import { saveVideoMetadata, updateVideoSummary } from "@/lib/db/videoSummaries";
import { createUserSummary } from "@/lib/db/userSummary";
import { llmGenerateSummary } from "@/utils/llmCreateSummary";
import { getYoutubeTranscript, getVideoMetadata } from "@/utils/youtube";
import { VideoMetadata, YoutubeTranscriptSegment } from "@/types";

type ActionResult = {
  success: boolean;
  stream?: ReadableStream<Uint8Array>;
  metadata?: VideoMetadata;
  summaryId?: string;
  transcript?: YoutubeTranscriptSegment[];
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

    // Save summary to DB (initially just metadata)
    const summaryMetadata = {
      videoId: transcriptData.videoId,
      url,
      title: metadata.title,
      description: metadata.description || "No description available",
      publishedAt: new Date(metadata.publishedAt),
      duration: String(metadata.duration),
    };
    const savedSummary = await saveVideoMetadata(summaryMetadata);
    createUserSummary(userId, savedSummary._id.toString());

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

      let completeResponse = "";

      try {
        while (true) {
          const { done, value } = await reader.read();

          if (done) break;

          const chunk = textDecoder.decode(value, { stream: true });
          completeResponse += chunk;

          await writer.write(value);
        }

        updateVideoSummary(savedSummary._id.toString(), completeResponse);
      } catch (streamError) {
        console.error("Error processing summary stream:", streamError);
      } finally {
        writer.close();
      }
    })();

    return {
      success: true,
      stream: readable,
      metadata: metadata,
      summaryId: savedSummary._id.toString(),
      transcript: transcriptData.transcript,
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
