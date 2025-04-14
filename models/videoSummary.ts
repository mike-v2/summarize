import mongoose, { Schema } from "mongoose";
import { VideoSummary } from "@/types";

const videoSummarySchema: Schema<VideoSummary> = new Schema(
  {
    videoId: { type: String, required: true, index: true },
    url: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    publishedAt: { type: Date, required: true },
    duration: { type: String, required: true },
    rawSummary: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.VideoSummary ||
  mongoose.model<VideoSummary>("VideoSummary", videoSummarySchema);
