import dbConnect from "@/lib/db/mongoose";
import VideoSummaryModel from "@/models/VideoSummary";
import { VideoSummary } from "@/types";

type CreateVideoSummaryInput = Omit<
  VideoSummary,
  "_id" | "createdAt" | "updatedAt"
>;

export async function createVideoSummary(
  data: CreateVideoSummaryInput
): Promise<VideoSummary> {
  await dbConnect();

  try {
    const newSummary = await VideoSummaryModel.create(data);
    console.log("Video summary created successfully");
    return newSummary;
  } catch (error: any) {
    console.error("Error creating video summary in DB function:", error);
    if (error.name === "ValidationError") {
      // Extract more specific messages if possible
      const messages = Object.values(error.errors).map((el: any) => el.message);
      throw new Error(`Validation Error: ${messages.join(", ")}`);
    }
    throw new Error("Failed to create video summary in database.");
  }
}
