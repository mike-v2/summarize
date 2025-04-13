import { Types } from "mongoose";

export type Evidence = {
  source: string;
  description: string;
  timestamp: string;
};

export type Quote = {
  text: string;
  timestamp: string;
};

export type ClaimData = {
  claim: string;
  explanation: string;
  quotes: Quote[];
  timestamp: string;
  evidence: Evidence[];
};

export type Claim = ClaimData & {
  _id: Types.ObjectId | string;
  summaryId: Types.ObjectId | string;
  createdAt?: Date;
  updatedAt?: Date;
};
