import OpenAI from "openai";
import { z } from "zod";
import { SUMMARIZE_SYSTEM_PROMPT } from "@/prompts/summarize";
import { SummaryResponse, summarySchema } from "@/schemas/summary";

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
): Promise<SummaryResult> {
  try {
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
        timestamp: formatTimestamp(segment.offset / 1000), // Convert ms to seconds and format
        duration: segment.duration / 1000, // Convert ms to seconds
      })),
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SUMMARIZE_SYSTEM_PROMPT },
      { role: "user", content: formattedTranscript },
    ];

    const response = await client.chat.completions.create({
      model: "deepseek-chat",
      messages,
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in response");
    }

    const parsedContent = JSON.parse(content);
    const validatedContent = summarySchema.parse(parsedContent);

    return {
      success: true,
      data: validatedContent,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: "Invalid response format from API",
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
