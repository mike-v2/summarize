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

export type VideoSummary = {
  _id: Types.ObjectId | string;
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
