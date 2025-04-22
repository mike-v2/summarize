import OpenAI from "openai";

import { openAIClient } from "@/config/llmClient";
import { triplePromptTemplate } from "@/prompts/tripleExtraction";
import { NamedEntityList, TripleList } from "@/types";

export async function tripleExtraction(
  passage: string,
  entityJson: NamedEntityList
): Promise<TripleList> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] =
    triplePromptTemplate(passage, entityJson);

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
    return parsedJson as TripleList;
  } catch (error) {
    console.error("Triple extraction failed:", error);
    throw new Error("Triple extraction failed.");
  }
}
