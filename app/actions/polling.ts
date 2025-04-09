"use server";

import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/config/nextAuthOptions";
import { findClaimsBySummaryId } from "@/lib/db/claims";
import { FactBasedClaim } from "@/types";

type PollStatus = "processing" | "complete" | "error";

type PollResult = {
  status: PollStatus;
  claims?: FactBasedClaim[];
  error?: string;
};

export async function checkClaimStatus(summaryId: string): Promise<PollResult> {
  const session = await getServerSession(nextAuthOptions);
  const userId = session?.user?.id;

  if (!userId) {
    console.error("Polling Error: User not authenticated.");
    return {
      status: "error",
      error: "User not authenticated",
    };
  }

  try {
    const claims = await findClaimsBySummaryId(summaryId);

    if (claims.length > 0) {
      console.log(
        `Polling: ${claims.length} claims found for summary ${summaryId}. Status: complete.`
      );
      return {
        status: "complete",
        claims: claims,
      };
    } else {
      // If the array is empty, claims are not processed yet
      console.log(
        `Polling: Claims not yet processed for summary ${summaryId}. Status: processing.`
      );
      return { status: "processing" };
    }
  } catch (error: any) {
    // Errors from findAndFormatClaimsBySummaryId indicate a DB issue
    console.error(
      `Polling Error fetching claims for summary ${summaryId}:`,
      error
    );
    return {
      status: "error",
      error: `An unexpected error occurred during polling: ${error.message}`,
    };
  }
}
