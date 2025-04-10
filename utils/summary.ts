import OpenAI from "openai";
import { SIMPLE_SUMMARIZE_SYSTEM_PROMPT } from "@/prompts/summarize";
import {
  createAnnotateSummaryPrompt,
  ANNOTATE_SUMMARY_PROMPT,
} from "@/prompts/annotateSummary";
import { ClaimData } from "@/types";

export async function llmGenerateSummary(
  text: string
): Promise<ReadableStream<Uint8Array>> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SIMPLE_SUMMARIZE_SYSTEM_PROMPT },
    { role: "user", content: text },
  ];

  const stream = await client.chat.completions.create({
    model: "deepseek-chat",
    messages,
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

        controller.close();
      } catch (error) {
        console.error("Error in stream processing:", error);
        controller.error(error);
      }
    },
  });
}

export async function llmExtractClaimsFromSummary(
  transcript: string,
  summary: string
): Promise<ClaimData[]> {
  const client = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: "https://api.deepseek.com",
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: ANNOTATE_SUMMARY_PROMPT },
    { role: "user", content: createAnnotateSummaryPrompt(transcript, summary) },
  ];

  const response = await client.chat.completions.create({
    model: "deepseek-chat",
    messages,
    response_format: {
      type: "json_object",
    },
  });

  const content = response.choices[0].message.content;

  try {
    const parsedJson = JSON.parse(content as string);
    return parsedJson.claims as ClaimData[];
  } catch (error) {
    console.error("Failed to parse LLM response as JSON:", error);
    throw new Error("Could not parse annotation response from LLM.");
  }
}
