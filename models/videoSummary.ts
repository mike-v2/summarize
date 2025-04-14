import mongoose, { Schema } from "mongoose";
import { VideoSummary } from "@/types";
import SummaryModel from "@/models/summary";

const videoSummarySchema: Schema<VideoSummary> = new Schema({
  videoId: { type: String, required: true, index: true, unique: true },
  url: { type: String, required: true },
  duration: { type: String, required: true },
});

export default mongoose.models.VideoSummary ||
  SummaryModel.discriminator<VideoSummary>("VideoSummary", videoSummarySchema);
