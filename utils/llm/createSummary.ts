import OpenAI from "openai";
import { SIMPLE_SUMMARIZE_SYSTEM_PROMPT } from "@/prompts/summarize";
import { deepseekClient } from "@/config/llmClient";

export async function llmGenerateSummary(
  text: string
): Promise<ReadableStream<Uint8Array>> {
  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SIMPLE_SUMMARIZE_SYSTEM_PROMPT },
    { role: "user", content: text },
  ];

  let stream: AsyncIterable<any>;

  try {
    stream = await deepseekClient.chat.completions.create({
      model: "deepseek-chat",
      messages,
      stream: true,
    });
  } catch (error) {
    console.error("Summary generation failed:", error);
    throw new Error("Summary generation failed.");
  }

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
