import dbConnect from "@/lib/db/mongoose";
import VideoSummaryModel from "@/models/videoSummary";
import { VideoSummary } from "@/types";

type VideoSummaryData = Omit<
  VideoSummary,
  "_id" | "claims" | "rawSummary" | "createdAt" | "updatedAt"
>;

export async function saveVideoMetadata(
  data: VideoSummaryData
): Promise<VideoSummary> {
  await dbConnect();

  try {
    const newSummary = await VideoSummaryModel.create(data);

    console.log("Video summary created successfully with metadata");
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

export async function updateVideoSummary(id: string, rawSummary: string) {
  await dbConnect();

  try {
    const updatedSummary = await VideoSummaryModel.findByIdAndUpdate(
      id,
      {
        $set: { rawSummary: rawSummary },
      },
      {
        new: true,
      }
    ).lean();

    if (!updatedSummary) {
      console.error(
        `Error updating summary: VideoSummary with id ${id} not found.`
      );
    } else console.log("Video summary updated successfully with raw summary");
  } catch (error: any) {
    console.error(`Error updating summary ${id} in DB function:`, error);
  }
}

export async function findLatestVideoSummaryByUrl(
  userId: string,
  url: string
): Promise<VideoSummary | null> {
  await dbConnect();
  try {
    const latestSummary = await VideoSummaryModel.findOne({
      userId: userId,
      url: url,
    })
      .sort({ createdAt: -1 }) // Get the most recent one
      .lean()
      .exec();

    return latestSummary as VideoSummary | null;
  } catch (error: any) {
    console.error(
      `Database error finding latest summary for user ${userId} and url ${url}:`,
      error
    );
    // Re-throw or handle as appropriate for your error strategy
    throw new Error("Failed to query database for latest summary.");
  }
}
