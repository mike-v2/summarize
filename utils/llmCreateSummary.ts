import OpenAI from "openai";
import { SIMPLE_SUMMARIZE_SYSTEM_PROMPT } from "@/prompts/summarize";

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
