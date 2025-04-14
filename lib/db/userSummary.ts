import { UserSummary } from "@/types";
import dbConnect from "@/lib/db/mongoose";
import UserSummaryModel from "@/models/userSummary";
import { Types } from "mongoose";

export async function createUserSummary(
  userId: string,
  summaryId: string
): Promise<UserSummary | null> {
  await dbConnect();

  const data = {
    userId: new Types.ObjectId(userId),
    summaryId: new Types.ObjectId(summaryId),
  };

  try {
    const userSummaryDoc = await UserSummaryModel.findOneAndUpdate(
      data,
      {
        $setOnInsert: data,
      },
      {
        upsert: true,
        new: true,
        setDefaultsOnInsert: true,
      }
    );

    const result: UserSummary = {
      ...userSummaryDoc.toObject(),
      _id: userSummaryDoc._id.toString(),
      userId: userSummaryDoc.userId.toString(),
      summaryId: userSummaryDoc.summaryId.toString(),
    };

    console.log(
      `User summary saved successfully for user ${userId}, summary ${summaryId}`
    );
    return result;
  } catch (error: any) {
    console.error(`Error saving user summary for summary ${summaryId}:`, error);
    throw new Error("Failed to save user summary.");
  }
}
