import OpenAI from "openai";
import { SUMMARIZE_SYSTEM_PROMPT } from "@/prompts/summarize";
import { SummaryResponse } from "@/schemas/summary";

type SummaryResult = {
  success: boolean;
  data?: SummaryResponse;
  error?: string;
};

export async function generateSummary(
  transcript: Array<{
    text: string;
    offset: number;
    duration: number;
  }>
): Promise<ReadableStream<Uint8Array>> {
  if (!process.env.DEEPSEEK_API_KEY) {
    throw new Error("DEEPSEEK_API_KEY is not set");
  }

  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  // Format transcript with timestamps
  const formattedTranscript = JSON.stringify({
    segments: transcript.map((segment) => ({
      text: segment.text,
      timestamp: formatTimestamp(segment.offset),
      duration: segment.duration,
    })),
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SUMMARIZE_SYSTEM_PROMPT },
    { role: "user", content: formattedTranscript },
  ];

  const stream = await client.chat.completions.create({
    model: "deepseek-chat",
    messages,
    response_format: {
      type: "json_object",
    },
    stream: true,
  });

  // Convert to a ReadableStream for Server Actions
  const encoder = new TextEncoder();
  return new ReadableStream({
    async start(controller) {
      try {
        let accumulatedContent = "";

        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || "";
          accumulatedContent += content;
          controller.enqueue(encoder.encode(content));
        }

        // Validate the final JSON after stream completes
        try {
          JSON.parse(accumulatedContent);
        } catch (e) {
          console.error("Streamed response is not valid JSON", e);
          controller.enqueue(encoder.encode(`\nERROR: Invalid JSON response`));
        }

        controller.close();
      } catch (error) {
        console.error("Error in stream processing:", error);
        controller.error(error);
      }
    },
  });
}

// Helper function to format timestamp in HH:MM:SS format
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":");
}
