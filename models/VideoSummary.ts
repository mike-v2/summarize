import mongoose, { Schema, Types } from "mongoose";
import { VideoSummary } from "@/types";
import { Evidence, FactBasedClaim } from "@/schemas/summary";

const evidenceSchema = new Schema<Evidence>({
  timestamp: { type: String, required: true },
  type: { type: String, required: true },
  source: { type: String, required: true },
  description: { type: String, required: true },
});

const claimSchema = new Schema<FactBasedClaim>({
  text: { type: String, required: true },
  timestamp: { type: String, required: true },
  evidence: { type: [evidenceSchema], required: true },
});

const VideoSummarySchema: Schema<VideoSummary> = new Schema(
  {
    userId: [
      {
        type: Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    videoId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    duration: { type: String, required: true },
    rawSummary: {
      type: String,
      required: true,
    },
    claims: {
      type: [claimSchema],
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.VideoSummary ||
  mongoose.model<VideoSummary>("VideoSummary", VideoSummarySchema);
