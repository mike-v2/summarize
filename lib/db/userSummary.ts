import { UserSummary } from "@/types";
import dbConnect from "@/lib/db/mongoose";
import UserSummaryModel from "@/models/userSummary";

export async function createUserSummary(
  userId: string,
  summaryId: string
): Promise<UserSummary> {
  await dbConnect();

  try {
    const savedClaim = await UserSummaryModel.create({
      userId,
      summaryId,
    });
    console.log(`User summary saved successfully for summary ${summaryId}`);
    return {
      ...savedClaim.toObject(),
      _id: savedClaim._id.toString(),
      userId: savedClaim.userId.toString(),
      summaryId: savedClaim.summaryId.toString(),
    };
  } catch (error: any) {
    console.error(`Error saving user summary for summary ${summaryId}:`, error);
    throw new Error("Failed to save user summary.");
  }
}
