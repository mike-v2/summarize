import { Types } from "mongoose";

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

export type VideoSummary = Summary & {
  videoId: string;
  url: string;
  duration: string;
};

export type Summary = {
  _id: Types.ObjectId | string;
  title: string;
  description: string;
  publishedAt?: Date;
  rawSummary?: string;
  createdAt: Date;
  updatedAt: Date;
};