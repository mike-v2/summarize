import { z } from "zod";

// Schema for subpoint
const subpointSchema = z.object({
  text: z.string(),
  isFactBased: z.boolean(),
  timestamp: z.string(), // Format: "HH:MM:SS"
});

// Schema for claim
const mainPointSchema = z.object({
  heading: z.string(),
  subpoints: z.array(subpointSchema),
});

type MainPoint = z.infer<typeof mainPointSchema>;

// Schema for summary
const summarySchema = z.object({
  introduction: z.string(),
  mainPoints: z.array(mainPointSchema),
  conclusion: z.string(),
});

type SummaryResponse = z.infer<typeof summarySchema>;

// Schema for evidence
const evidenceSchema = z.object({
  source: z.string(),
  type: z.enum(["primary", "secondary", "tertiary"]),
  date: z.string(),
});

// Schema for knowledge triple
const tripleSchema = z.object({
  subject: z.string(),
  relation: z.string(),
  object: z.string(),
  evidence: z.array(evidenceSchema),
});

export { summarySchema, type SummaryResponse, type MainPoint };