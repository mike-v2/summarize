import dbConnect from "@/lib/db/mongoose";
import FactBasedClaimModel from "@/models/claim";
import { Claim } from "@/types";

export async function findClaimsBySummaryId(
  summaryId: string
): Promise<Claim[]> {
  await dbConnect();
  try {
    const claims = await FactBasedClaimModel.find({
      summaryId: summaryId,
    })
      .lean()
      .exec();

    if (!claims || claims.length === 0) {
      return [];
    }

    return (claims as unknown as Claim[]).map((claim) => ({
      ...claim,
      _id: claim._id.toString(),
      summaryId: claim.summaryId.toString(),
    }));
  } catch (error: any) {
    console.error(
      `Database error finding claims for summary ${summaryId}:`,
      error
    );
    throw new Error("Failed to query database for claims.");
  }
}
