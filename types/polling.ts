import { FactBasedClaim } from "@/schemas/summary";

export type VideoData = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: Date;
  duration: string;
  claims?: FactBasedClaim[];
};
