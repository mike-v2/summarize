import OpenAI from "openai";

import { ClaimData } from "@/types";
import {
  ANNOTATE_CLAIM_INSTRUCTIONS,
  createAnnotateClaimPrompt,
} from "@/prompts/annotateClaim";
import { openAIClient } from "@/config/llmClient";

export async function llmAnnotateClaim(
  transcript: string,
  summary: string,
  rawClaim: string
): Promise<ClaimData> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: ANNOTATE_CLAIM_INSTRUCTIONS },
    {
      role: "user",
      content: createAnnotateClaimPrompt(transcript, summary, rawClaim),
    },
  ];

  try {
    const response = await openAIClient.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      response_format: {
        type: "json_object",
      },
    });

    const content = response.choices[0].message.content;

    const parsedJson = JSON.parse(content as string);
    const claimData = { ...parsedJson, rawClaim };
    return claimData as ClaimData;
  } catch (error) {
    console.error("Claim annotation failed:", error);
    throw new Error("Claim annotation failed.");
  }
}
