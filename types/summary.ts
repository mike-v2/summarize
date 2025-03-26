import type { SummaryResponse } from "@/schemas/summary";

export type SummaryResult = {
  success: boolean;
  data?: SummaryResponse;
  error?: string;
};
