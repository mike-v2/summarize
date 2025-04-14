import { Types } from "mongoose";

import dbConnect from "@/lib/db/mongoose";
import ClaimModel from "@/models/claim";
import { Claim, ClaimData } from "@/types";

export async function findClaimsBySummaryId(
  summaryId: string
): Promise<Claim[]> {
  await dbConnect();
  try {
    const claims = await ClaimModel.find({
      summaryId: summaryId,
    })
      .lean<Claim[]>() // lean() does not return correct types https://github.com/Automattic/mongoose/issues/13523
      .exec();

    if (!claims || claims.length === 0) {
      return [];
    }

    return claims.map((claim) => ({
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

export async function findClaimByRawClaim(
  rawClaim: string,
  summaryId: string
): Promise<Claim | null> {
  await dbConnect();
  try {
    const claim = await ClaimModel.findOne<Claim>({ rawClaim, summaryId })
      .lean<Claim>() // lean() does not return correct types https://github.com/Automattic/mongoose/issues/13523
      .exec();

    if (!claim) return null;

    return claim;
  } catch (error: any) {
    console.error(`Error finding claim by raw claim ${rawClaim}:`, error);
    throw new Error("Failed to query database for claim.");
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

    const savedClaim = await ClaimModel.create(claimToSave);
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
