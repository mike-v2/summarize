import { Types } from "mongoose";

export type UserSummary = {
  _id: Types.ObjectId | string;
  userId: Types.ObjectId | string;
  summaryId: Types.ObjectId | string;
  createdAt: Date;
  updatedAt: Date;
};
