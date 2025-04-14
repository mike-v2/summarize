import mongoose, { Schema } from "mongoose";
import { Summary } from "@/types";

const summarySchema: Schema<Summary> = new Schema(
  {
    sourceText: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String },
    publishedAt: { type: Date },
    rawSummary: { type: String },
  },
  {
    timestamps: true,
    discriminatorKey: "kind",
  }
);

export default mongoose.models.Summary ||
  mongoose.model<Summary>("Summary", summarySchema);
