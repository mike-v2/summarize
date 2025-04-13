import OpenAI from "openai";

import { ClaimData } from "@/types";
import {
  ANNOTATE_CLAIM_INSTRUCTIONS,
  createAnnotateClaimPrompt,
} from "@/prompts/annotateClaim";

export async function llmAnnotateClaim(
  transcript: string,
  summary: string,
  bulletPoint: string
): Promise<ClaimData> {
  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: ANNOTATE_CLAIM_INSTRUCTIONS },
    {
      role: "user",
      content: createAnnotateClaimPrompt(transcript, summary, bulletPoint),
    },
  ];

  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    response_format: {
      type: "json_object",
    },
  });

  const content = response.choices[0].message.content;

  try {
    const parsedJson = JSON.parse(content as string);
    return parsedJson as ClaimData;
  } catch (error) {
    console.error("Failed to parse LLM response as JSON:", error);
    throw new Error("Could not parse annotation response from LLM.");
  }
}
