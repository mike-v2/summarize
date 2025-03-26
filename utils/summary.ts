import OpenAI from "openai";
import { z } from "zod";
import { SUMMARIZE_SYSTEM_PROMPT } from "@/prompts/summarize";
import { responseSchema } from "@/schemas/summary";
import type { SummaryResult } from "@/types/summary";

export async function generateSummary(
  transcript: string
): Promise<SummaryResult> {
  try {
    if (!process.env.DEEPSEEK_API_KEY) {
      throw new Error("DEEPSEEK_API_KEY is not set");
    }

    const client = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: "https://api.deepseek.com",
    });

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: SUMMARIZE_SYSTEM_PROMPT },
      { role: "user", content: transcript },
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
    const validatedContent = responseSchema.parse(parsedContent);

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
