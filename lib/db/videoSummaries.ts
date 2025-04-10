import dbConnect from "@/lib/db/mongoose";
import VideoSummaryModel from "@/models/videoSummary";
import FactBasedClaimModel from "@/models/claim";
import { VideoSummary } from "@/types";
import { ClaimData } from "@/types";

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
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((el: any) => el.message);
      throw new Error(`Validation Error during update: ${messages.join(", ")}`);
    }
    throw new Error(`Failed to update summary ${id} in database.`);
  }
}

export async function saveClaims(id: string, claims: ClaimData[]) {
  await dbConnect();

  try {
    const claimsToSave = claims.map((claimData) => ({
      ...claimData,
      summaryId: id,
    }));

    await FactBasedClaimModel.insertMany(claimsToSave);
    console.log(
      `${claimsToSave.length} claims saved successfully for summary ${id}`
    );
  } catch (error: any) {
    console.error(
      `Error saving summary and/or claims for summary ${id}:`,
      error
    );
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((el: any) => el.message);
      throw new Error(`Validation Error: ${messages.join(", ")}`);
    }
    throw new Error(`Failed to save summary and/or claims for summary ${id}.`);
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
