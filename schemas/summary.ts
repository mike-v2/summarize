import { z } from "zod";

// Schema for evidence
export const evidenceSchema = z.object({
  source: z.string(),
  type: z.enum(["primary", "secondary", "tertiary"]),
});

export type Evidence = z.infer<typeof evidenceSchema>;

// Schema for claim
export const claimSchema = z.object({
  claim_text: z.string(),
  evidence: z.array(evidenceSchema),
});

export type Claim = z.infer<typeof claimSchema>;

// Schema for summary
export const summarySchema = z.object({
  introduction: z.string(),
  claims: z.array(claimSchema),
  conclusion: z.string(),
});

export type Summary = z.infer<typeof summarySchema>;

// Schema for knowledge triple
export const tripleSchema = z.object({
  subject: z.string(),
  relation: z.string(),
  object: z.string(),
  evidence_type: z.enum(["primary", "secondary", "tertiary"]),
  source: z.string(),
});

export type Triple = z.infer<typeof tripleSchema>;

// Schema for the complete response
export const responseSchema = z.object({
  summary: summarySchema,
  triples: z.array(tripleSchema),
});

export type SummaryResponse = z.infer<typeof responseSchema>;
