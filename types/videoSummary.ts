import { Types } from "mongoose";
import { FactBasedClaimData } from "@/types";

export type VideoMetadata = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  duration?: string;
};

export type YoutubeTranscriptSegment = {
  text: string;
  offset: number;
  duration: number;
};

export type TranscriptSegment = {
  text: string;
  timestamp: string;
  duration: number;
};

export type TranscriptResponse = {
  success: boolean;
  data?: {
    videoId: string;
    transcript: TranscriptSegment[];
  };
  error?: string;
};

export type VideoSummary = {
  _id: string;
  userId: string;
  videoId: string;
  url: string;
  title: string;
  description: string;
  publishedAt: Date;
  duration: string;
  rawSummary?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type VideoData = {
  videoId: string;
  title: string;
  description: string;
  publishedAt: Date;
  duration: string;
  claims?: FactBasedClaimData[];
};
