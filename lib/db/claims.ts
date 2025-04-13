import { Types } from "mongoose";

import dbConnect from "@/lib/db/mongoose";
import FactBasedClaimModel from "@/models/claim";
import { Claim, ClaimData } from "@/types";

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

export async function saveClaim(id: string, claim: ClaimData): Promise<Claim> {
  await dbConnect();

  try {
    const claimToSave = {
      ...claim,
      summaryId: new Types.ObjectId(id),
    };
    console.log("saving claim:", claimToSave);

    const savedClaim = await FactBasedClaimModel.create(claimToSave);
    console.log(`Claim saved successfully for summary ${id}`);
    return {
      ...savedClaim.toObject(),
      _id: savedClaim._id.toString(),
      summaryId: savedClaim.summaryId.toString(),
    };
  } catch (error: any) {
    console.error(`Error saving claim for summary ${id}:`, error);
    throw new Error("Failed to save claim.");
  }
}
