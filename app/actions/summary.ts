"use server";

import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/config/nextAuthOptions";
import { createVideoSummary } from "@/lib/db/videoSummaries";
import { generateSummary } from "@/utils/summary";
import { getYoutubeTranscript, getVideoMetadata } from "@/utils/youtube";
import { SummaryResponse, summarySchema } from "@/schemas/summary";

type ActionResult = {
  success: boolean;
  data?: SummaryResponse;
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
    if (!transcriptResult.success || !transcriptResult.data) {
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

    // Create a TransformStream to process the data before sending to client
    const { readable, writable } = new TransformStream();

    // Get the raw stream from the summary generator
    const summaryStream = await generateSummary(transcriptData.transcript);

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

          if (done) {
            break;
          }

          // Decode the chunk to add to our complete response
          const chunk = textDecoder.decode(value, { stream: true });
          completeResponse += chunk;

          // Forward the chunk to the client
          await writer.write(value);
        }

        // Process and save the complete response
        try {
          const parsedSummary = JSON.parse(completeResponse);
          const validatedSummary = summarySchema.parse(parsedSummary);

          // Save the summary to the database asynchronously
          // (don't await to avoid delaying stream completion)
          const videoSummaryData = {
            userId: summaryMetadata.userId,
            videoId: summaryMetadata.videoId,
            url: summaryMetadata.url,
            title: summaryMetadata.title,
            description: summaryMetadata.description,
            publishedAt: summaryMetadata.publishedAt,
            duration: summaryMetadata.duration,
            summary: validatedSummary,
          };
          console.log("saving videoSummaryData", videoSummaryData);

          createVideoSummary(videoSummaryData).catch((error) => {
            console.error("Failed to save summary to database:", error);
          });
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
