import dbConnect from "@/lib/db/mongoose";
import VideoSummaryModel from "@/models/VideoSummary";
import { VideoSummary } from "@/types";
import { FactBasedClaim } from "@/schemas/summary";

type CreateVideoSummaryInput = Omit<
  VideoSummary,
  "_id" | "rawSummary" | "createdAt" | "updatedAt"
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

export async function updateVideoSummary(
  id: string,
  rawSummary: string,
  claims: FactBasedClaim[]
): Promise<VideoSummary> {
  await dbConnect();

  try {
    const updatedSummary = await VideoSummaryModel.findByIdAndUpdate(id, {
      $set: { claims: claims, rawSummary: rawSummary },
    });

    console.log("Video summary updated successfully");
    return updatedSummary;
  } catch (error: any) {
    console.error(`Error updating video summary ${id} in DB function:`, error);
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((el: any) => el.message);
      throw new Error(`Validation Error during update: ${messages.join(", ")}`);
    }
    throw new Error(`Failed to update video summary ${id} in database.`);
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
      .lean() // Use .lean() for faster, plain JS object results if we don't need Mongoose documents
      .exec();

    return latestSummary as VideoSummary | null; // Cast might be needed depending on lean() usage
  } catch (error: any) {
    console.error(
      `Database error finding latest summary for user ${userId} and url ${url}:`,
      error
    );
    // Re-throw or handle as appropriate for your error strategy
    throw new Error("Failed to query database for latest summary.");
  }
}
