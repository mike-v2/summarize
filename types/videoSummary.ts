import { SummaryResponse } from "@/schemas/summary";

export type VideoSummary = {
  userId: string;
  videoId: string;
  url: string;
  title: string;
  description?: string;
  publishedAt: Date;
  duration?: string;
  summary: SummaryResponse;
  createdAt: Date;
  updatedAt: Date;
};
