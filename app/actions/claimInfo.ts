"use server";

import { findClaimByRawClaim, createClaim } from "@/lib/db/claims";
import { Claim, YoutubeTranscriptSegment } from "@/types";
import { llmAnnotateClaim } from "@/utils/llmAnnotateClaim";
import { formatTranscriptTimestamps } from "@/utils/timestamp";

export async function annotateClaim(
  transcript: YoutubeTranscriptSegment[],
  rawSummary: string,
  summaryId: string,
  rawClaim: string
): Promise<Claim> {
  try {
    const existingClaim = await findClaimByRawClaim(rawClaim, summaryId);
    if (existingClaim) {
      console.log("Found existing claim");
      return existingClaim;
    }

    const formattedTranscript = JSON.stringify(
      formatTranscriptTimestamps(transcript)
    );

    const claimData = await llmAnnotateClaim(
      formattedTranscript,
      rawSummary,
      rawClaim
    );
    const savedClaim = await createClaim(summaryId, claimData);
    return savedClaim;
  } catch (error) {
    console.error(`Error processing/updating a claim:`, error);
    throw error;
  }
}
