import OpenAI from "openai";
import { NamedEntityList } from "@/types";

const nerSystemMessage = `Your task is to extract named entities from the given paragraph. 
Respond with a JSON list like: {"named_entities": ["entity1", "entity2", ...]}
`;

export const nerText = `China is willing to withstand economic losses during the trade conflict with the United States, which escalated in March 2025. China perceives the U.S. market as potentially replaceable, contributing roughly 15% of its total exports.`;

export const nerOutput: NamedEntityList = {
  named_entities: ["China", "United States", "March 2025", "U.S."],
};

export function nerPromptTemplate(
  passage: string
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: "system", content: nerSystemMessage },
    { role: "user", content: nerText },
    { role: "assistant", content: JSON.stringify(nerOutput) },
    { role: "user", content: passage },
  ];
}
