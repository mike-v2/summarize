import OpenAI from "openai";

import { openAIClient } from "@/config/llmClient";
import { nerPromptTemplate } from "@/prompts/nerExtraction";
import { NamedEntityList } from "@/types";

export async function nerExtraction(passage: string): Promise<NamedEntityList> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] =
    nerPromptTemplate(passage);

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
    return parsedJson as NamedEntityList;
  } catch (error) {
    console.error("NER extraction failed:", error);
    throw new Error("NER extraction failed.");
  }
}
