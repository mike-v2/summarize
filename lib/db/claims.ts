import dbConnect from "@/lib/db/mongoose";
import FactBasedClaimModel from "@/models/claim";
import { FactBasedClaim } from "@/types";

export async function findClaimsBySummaryId(
  summaryId: string
): Promise<FactBasedClaim[]> {
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

    return claims as unknown as FactBasedClaim[];
  } catch (error: any) {
    console.error(
      `Database error finding claims for summary ${summaryId}:`,
      error
    );
    throw new Error("Failed to query database for claims.");
  }
}
