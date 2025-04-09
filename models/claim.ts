import mongoose, { Schema } from "mongoose";
import { Evidence } from "@/types";
import { FactBasedClaim, VideoSummary } from "@/types";

const evidenceSchema = new Schema<Evidence>(
  {
    timestamp: { type: String, required: true },
    type: { type: String, required: true },
    source: { type: String, required: true },
    description: { type: String, required: true },
  },
  { _id: false }
);

const factBasedClaimSchema = new Schema<FactBasedClaim>(
  {
    summaryId: {
      type: Schema.Types.ObjectId,
      ref: "VideoSummary",
      required: true,
    },
    text: { type: String, required: true },
    timestamp: { type: String, required: true },
    evidence: { type: [evidenceSchema], required: true },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.FactBasedClaim ||
  mongoose.model<FactBasedClaim>("FactBasedClaim", factBasedClaimSchema);
