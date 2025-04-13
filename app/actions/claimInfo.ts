"use server";

import { saveClaim } from "@/lib/db/claims";
import { Claim, YoutubeTranscriptSegment } from "@/types";
import { llmAnnotateClaim } from "@/utils/llmAnnotateClaim";
import { formatTranscriptTimestamps } from "@/utils/timestamp";

export async function annotateClaim(
  transcript: YoutubeTranscriptSegment[],
  rawSummary: string,
  summaryId: string,
  claim: string
): Promise<Claim> {
  try {
    const formattedTranscript = JSON.stringify(
      formatTranscriptTimestamps(transcript)
    );

    const claimData = await llmAnnotateClaim(
      formattedTranscript,
      rawSummary,
      claim
    );
    const savedClaim = await saveClaim(summaryId, claimData);
    return savedClaim;
  } catch (error) {
    console.error(`Error processing/updating claims:`, error);
    throw error;
  }
}
