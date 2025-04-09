import { Types } from "mongoose";

export type Evidence = {
  type: "primary" | "secondary" | "tertiary";
  source: string;
  description: string;
  timestamp: string;
};

export type FactBasedClaimData = {
  text: string;
  timestamp: string;
  evidence: Evidence[];
};

export type FactBasedClaim = FactBasedClaimData & {
  _id: string;
  summaryId: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};
