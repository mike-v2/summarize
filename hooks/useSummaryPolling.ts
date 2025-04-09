import { useState, useEffect, useRef } from "react";

import { checkClaimStatus } from "@/app/actions/polling";
import { VideoData, FactBasedClaim } from "@/types";

type ClientPollStatus =
  | "idle"
  | "not_found"
  | "processing"
  | "complete"
  | "error";

type UseSummaryPollingProps = {
  url: string;
  shouldPoll: boolean;
  summaryId: string;
  pollingIntervalMs?: number;
  maxPollAttempts?: number;
};

type UseSummaryPollingReturn = {
  pollingStatus: ClientPollStatus;
  claims: FactBasedClaim[] | null;
  pollingError: string | null;
};

const DEFAULT_POLLING_INTERVAL_MS = 5000;
const DEFAULT_MAX_POLL_ATTEMPTS = 30;

export function useSummaryPolling({
  url,
  shouldPoll,
  summaryId,
  pollingIntervalMs = DEFAULT_POLLING_INTERVAL_MS,
  maxPollAttempts = DEFAULT_MAX_POLL_ATTEMPTS,
}: UseSummaryPollingProps): UseSummaryPollingReturn {
  const [pollingStatus, setPollingStatus] = useState<ClientPollStatus>("idle");
  const [pollingError, setPollingError] = useState<string | null>(null);
  const [claims, setClaims] = useState<FactBasedClaim[] | null>(null);
  const pollingIntervalId = useRef<NodeJS.Timeout | null>(null);
  const pollAttempts = useRef(0);

  useEffect(() => {
    // Stop polling if the signal is false or url is missing
    if (!shouldPoll || !url) {
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
      }
      // Reset state when polling stops explicitly
      setPollingStatus("idle");
      setClaims(null);
      setPollingError(null);
      pollAttempts.current = 0;
      return;
    }

    // Start polling
    console.log(`Polling Hook: Activated for url: ${url}`);
    setPollingError(null); // Clear previous errors
    setClaims(null); // Clear previous data
    pollAttempts.current = 0; // Reset attempts
    setPollingStatus("processing"); // Set initial status when starting

    const poll = async () => {
      if (pollAttempts.current >= maxPollAttempts) {
        console.error("Polling Hook: Timed out.");
        setPollingError("Timed out waiting for claim processing.");
        setPollingStatus("error");
        if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
        return;
      }

      pollAttempts.current++;
      console.log(
        `Polling Hook: Attempt ${pollAttempts.current} for url: ${url}`
      );

      try {
        const result = await checkClaimStatus(summaryId);
        console.log("Polling Hook: Action result:", result);

        // Only update status if polling is still supposed to be active
        // This prevents state updates after polling should have stopped
        if (!pollingIntervalId.current && result.status !== "complete") return;

        setPollingStatus(result.status);

        if (result.status === "complete") {
          setClaims(result.claims || null);
          console.log("Polling Hook: Complete. Claims received.");
          if (pollingIntervalId.current)
            clearInterval(pollingIntervalId.current);
          pollingIntervalId.current = null;
        } else if (result.status === "error") {
          setPollingError(result.error || "An unknown polling error occurred.");
          console.error("Polling Hook: Error status received.");
          if (pollingIntervalId.current)
            clearInterval(pollingIntervalId.current);
          pollingIntervalId.current = null;
        } else {
          console.log("Polling Hook: Claims still processing...");
        }
      } catch (err: any) {
        console.error("Polling Hook: Error during checkClaimStatus call:", err);
        setPollingError(`Failed to poll for status: ${err.message}`);
        setPollingStatus("error");
        if (pollingIntervalId.current) clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
      }
    };

    // Initial poll immediately
    poll();

    // Set up interval only if not already completed/errored by initial poll
    if (pollingStatus !== "complete" && pollingStatus !== "error") {
      pollingIntervalId.current = setInterval(poll, pollingIntervalMs);
      console.log(`Polling Hook: Interval set: ${pollingIntervalId.current}`);
    } else {
      if (pollingIntervalId.current) {
        clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
      }
    }

    // Cleanup function for this effect run
    return () => {
      if (pollingIntervalId.current) {
        console.log(
          `Polling Hook: Clearing interval: ${pollingIntervalId.current}`
        );
        clearInterval(pollingIntervalId.current);
        pollingIntervalId.current = null;
      }
    };
  }, [shouldPoll, url, pollingIntervalMs, maxPollAttempts]); // Dependencies for the effect

  return { pollingStatus, claims, pollingError };
}
