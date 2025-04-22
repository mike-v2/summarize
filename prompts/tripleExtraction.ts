import OpenAI from "openai";

import { nerOutput, nerText } from "@/prompts/nerExtraction";
import { NamedEntityList, TripleList } from "@/types";

const tripleSystemMessage = `Your task is to construct an RDF (Resource Description Framework) graph. From the supplied paragraph and named entity list, create a list of triples for the RDF graph.
Each triple should contain at least one, but preferably two, of the named entities in the list for each passage.
Clearly resolve pronouns to their specific names to maintain clarity.
`;

function tripleInput(passage: string, entityJson: NamedEntityList) {
  return `Convert the paragraph into JSON triples.
Paragraph:
\`\`\`
${passage}
\`\`\`

${entityJson}
`;
}

const tripleOneShotOutput: TripleList = {
  triples: [
    ["China", "is willing to withstand", "economic losses"],
    ["US-China Trade Conflict", "escalated in", "March 2025"],
    ["US-China Trade Conflict", "involves", "China"],
    ["US-China Trade Conflict", "involves", "United States"],
    ["China", "perceives as replaceable", "U.S. market"],
    ["U.S. market", "accounts for 15% of", "China's exports"],
  ],
};

export function triplePromptTemplate(
  passage: string,
  entityJson: NamedEntityList
): OpenAI.Chat.ChatCompletionMessageParam[] {
  return [
    { role: "system", content: tripleSystemMessage },
    { role: "user", content: tripleInput(nerText, nerOutput) },
    { role: "assistant", content: JSON.stringify(tripleOneShotOutput) },
    {
      role: "user",
      content: tripleInput(passage, entityJson),
    },
  ];
}
