"use client";

import React, { useState, useRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";

import { generateVideoSummary } from "@/app/actions/summary";
import { useSummaryPolling } from "@/hooks/useSummaryPolling";
import { VideoMetadata, Claim } from "@/types";

import HighlightedSummary from "@/app/home.components/highlightedSummary";
import ClaimDetailSidebar from "@/app/home.components/claimDetailSidebar";
import MetadataView from "@/app/home.components/metadataView";
import Heading from "@/app/home.components/heading";
import InputForm from "@/app/home.components/inputForm";

export default function Home() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawSummaryText, setRawSummaryText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [startPolling, setStartPolling] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  const shouldPoll = startPolling && summaryId !== null;
  const {
    pollingStatus,
    claims: claimsData,
    pollingError,
  } = useSummaryPolling({
    summaryId: summaryId ?? "",
    shouldPoll: shouldPoll,
  });

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent, url: string) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRawSummaryText("");
    setIsStreaming(false);
    setStartPolling(false);
    setMetadata(null);
    setSummaryId(null);

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const {
        success,
        stream,
        metadata: newMetadata,
        summaryId: newSummaryId,
        error: actionError,
      } = await generateVideoSummary(url);

      if (!success || !(stream instanceof ReadableStream)) {
        setError(actionError || "Failed to initialize streaming");
        setLoading(false);
        return;
      }

      if (newMetadata) {
        setMetadata(newMetadata);
      }
      if (newSummaryId) {
        setSummaryId(newSummaryId);
      }

      setIsStreaming(true);
      setLoading(false);
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          if (abortControllerRef.current?.signal.aborted) {
            console.log("Stream reading aborted.");
            reader.cancel("Aborted by user");
            break;
          }
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          setRawSummaryText((prev) => prev + text);
        }
      } catch (streamError: any) {
        if (streamError.name !== "AbortError") {
          setError("Stream processing error");
          console.error("Stream error:", streamError);
        }
      } finally {
        setIsStreaming(false);
        console.log("Stream finished.");
        if (newSummaryId && !abortControllerRef.current?.signal.aborted) {
          console.log(
            "Setting startPolling to true with summaryId:",
            newSummaryId
          );
          setStartPolling(true);
        } else {
          console.log("Polling skipped (no summaryId or aborted).");
        }
        abortControllerRef.current = null;
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      console.error(err);
      setLoading(false);
      setIsStreaming(false);
      setStartPolling(false);
      abortControllerRef.current = null;
    }
  };

  const handleClaimClick = (claim: Claim) => {
    setSelectedClaim(claim);
  };

  const handleCloseSidebar = () => {
    setSelectedClaim(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 bg-gray-100">
      <div className="flex gap-12 w-full justify-center">
        {metadata && <MetadataView metadata={metadata} />}
        <div className="flex flex-col gap-4 max-w-lg w-full">
          <Heading />
          <InputForm
            handleSubmit={handleSubmit}
            disabled={loading || isStreaming}
            error={error}
          />
        </div>
      </div>

      <div className="flex gap-4 w-full justify-center transition-all">
        <div className="bg-white max-w-4xl p-6 rounded-lg shadow-md h-full">
          {(loading || rawSummaryText || metadata) && (
            <div className="mb-6">
              <div className="p-4 bg-gray-50 rounded text-gray-800 leading-relaxed">
                <HighlightedSummary
                  summaryText={rawSummaryText}
                  claims={claimsData}
                  onClaimClick={handleClaimClick}
                />

                {isStreaming && !rawSummaryText && (
                  <p className="animate-pulse">Loading initial stream...</p>
                )}
              </div>

              {/* Polling Status Display */}
              {shouldPoll && pollingStatus !== "complete" && (
                <div className="mt-4 p-2 text-sm text-gray-600 bg-gray-100 rounded">
                  {pollingStatus === "processing" &&
                    "⚙️ Analyzing summary for claims..."}
                  {pollingError && `⚠️ Polling Error: ${pollingError}`}
                </div>
              )}
              {pollingStatus === "complete" && claimsData && (
                <div className="mt-4 p-2 text-sm text-green-700 bg-green-100 rounded">
                  ✅ Claim analysis complete.
                </div>
              )}
              {pollingStatus === "error" && pollingError && (
                <div className="mt-4 p-2 text-sm text-red-700 bg-red-100 rounded">
                  ❌ Error during claim analysis: {pollingError}
                </div>
              )}
            </div>
          )}
        </div>

        <div
          className={twMerge(
            "transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 w-0",
            selectedClaim && "w-96"
          )}
        >
          {selectedClaim && (
            <ClaimDetailSidebar
              claim={selectedClaim}
              onClose={handleCloseSidebar}
            />
          )}
        </div>
      </div>
    </main>
  );
}

