import mongoose, { Schema } from "mongoose";
import { UserSummary } from "@/types";

const userSummarySchema: Schema<UserSummary> = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    summaryId: {
      type: Schema.Types.ObjectId,
      ref: "Summary",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.UserSummary ||
  mongoose.model<UserSummary>("UserSummary", userSummarySchema);
