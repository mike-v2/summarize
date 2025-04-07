import { z } from "zod";

const evidenceSchema = z.object({
  type: z.enum(["primary", "secondary", "tertiary"]),
  source: z.string(),
  description: z.string(),
  timestamp: z.string(),
});

type Evidence = z.infer<typeof evidenceSchema>;

const factBasedClaimSchema = z.object({
  text: z.string(),
  timestamp: z.string(),
  evidence: z.array(evidenceSchema),
});

type FactBasedClaim = z.infer<typeof factBasedClaimSchema>;

const tripleSchema = z.object({
  subject: z.string(),
  relation: z.string(),
  object: z.string(),
  evidence: z.array(evidenceSchema),
});

export { factBasedClaimSchema, type FactBasedClaim, type Evidence };