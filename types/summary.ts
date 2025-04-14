import { Types } from "mongoose";

export type Summary = {
  _id: Types.ObjectId | string;
  sourceText: string;
  title: string;
  description?: string;
  publishedAt?: Date;
  rawSummary?: string;
  createdAt: Date;
  updatedAt: Date;
};
