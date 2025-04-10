import { Types } from "mongoose";

export type Evidence = {
  source: string;
  description: string;
  timestamp: string;
};

export type ClaimData = {
  text: string;
  timestamp: string;
  evidence: Evidence[];
};

export type Claim = ClaimData & {
  _id: Types.ObjectId | string;
  summaryId: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
};
