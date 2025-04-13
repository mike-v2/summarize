import OpenAI from "openai";

const deepseekClient = new OpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  baseURL: "https://api.deepseek.com",
});

const openAIClient = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export { deepseekClient, openAIClient };
