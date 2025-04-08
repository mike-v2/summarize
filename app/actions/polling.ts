"use server";

import { getServerSession } from "next-auth/next";
import { nextAuthOptions } from "@/config/nextAuthOptions";
import { findLatestVideoSummaryByUrl } from "@/lib/db/videoSummaries";
import { VideoData } from "@/types";

type PollStatus = "processing" | "complete" | "error" | "not_found";

type PollResult = {
  status: PollStatus;
  videoData?: VideoData;
  error?: string;
};

export async function checkClaimStatus(url: string): Promise<PollResult> {
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
    const latestSummary = await findLatestVideoSummaryByUrl(userId, url);

    if (!latestSummary) {
      console.log(`Polling: Summary for URL ${url} not found yet.`);
      // It might not have been created yet by the main action
      return { status: "not_found" };
    }

    // Check if claims exist and are non-empty
    if (latestSummary.claims && latestSummary.claims.length > 0) {
      console.log(`Polling: Claims found for URL ${url}.`);
      return {
        status: "complete",
        videoData: latestSummary as VideoData,
      };
    } else {
      console.log(`Polling: Claims not yet processed for URL ${url}.`);
      // Document exists, but claims are not ready
      return { status: "processing" };
    }
  } catch (error: any) {
    console.error(`Polling Error checking status for URL ${url}:`, error);
    return {
      status: "error",
      error: `An unexpected error occurred during polling: ${error.message}`,
    };
  }
}
