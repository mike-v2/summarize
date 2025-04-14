import dbConnect from "@/lib/db/mongoose";
import VideoSummaryModel from "@/models/videoSummary";
import { VideoSummary } from "@/types";

type VideoSummaryData = Omit<
  VideoSummary,
  "_id" | "rawSummary" | "createdAt" | "updatedAt"
>;

export async function createVideoData(
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

export async function findSummaryByVideoId(
  videoId: string
): Promise<VideoSummary | null> {
  await dbConnect();
  try {
    const videoSummary = await VideoSummaryModel.findOne({ videoId })
      .lean<VideoSummary>() // lean() does not return correct types https://github.com/Automattic/mongoose/issues/13523
      .exec();

    if (!videoSummary) return null;

    return videoSummary as VideoSummary;
  } catch (error: any) {
    console.error(
      `Database error finding summary for video ${videoId}:`,
      error
    );
    throw new Error("Failed to query database for summary.");
  }
}
