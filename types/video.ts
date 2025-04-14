import { Summary } from "@/types";

export type VideoMetadata = {
  id: string;
  title: string;
  transcript: YoutubeTranscriptSegment[];
  description: string;
  publishedAt: string;
  duration?: string;
};

export type YoutubeTranscriptSegment = {
  text: string;
  offset: number;
  duration: number;
};

export type VideoSummary = Summary & {
  videoId: string;
  url: string;
  duration: string;
};
