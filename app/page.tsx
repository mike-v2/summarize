"use client";

import React, { useState, useRef, useEffect } from "react";

import AuthStatus from "@/components/authStatus";
import HighlightedSummary from "@/components/highlightedSummary";
import ClaimDetailSidebar from "@/components/claimDetailSidebar";
import { generateVideoSummary } from "@/app/actions/summary";
import { useSummaryPolling } from "@/hooks/useSummaryPolling";
import { VideoMetadata, Claim } from "@/types";

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawSummaryText, setRawSummaryText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [startPolling, setStartPolling] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(null);

  // Determine if polling should be active
  const shouldPoll = startPolling && summaryId !== null;

  const {
    pollingStatus,
    claims: claimsData,
    pollingError,
  } = useSummaryPolling({
    summaryId: summaryId ?? "",
    shouldPoll: shouldPoll, // Use the combined condition
  });

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
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

  // Handlers for claim selection and sidebar
  const handleClaimClick = (claim: Claim) => {
    setSelectedClaim(claim);
  };

  const handleCloseSidebar = () => {
    setSelectedClaim(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 bg-gray-100">
      <div className="z-10 max-w-4xl w-full items-center justify-between font-mono text-sm lg:flex mb-8">
        <h1 className="text-2xl font-bold mb-4 lg:mb-0 text-center lg:text-left w-full">
          Video Summarizer
        </h1>
        <div className="text-right">
          <AuthStatus />
        </div>
      </div>

      <div className="w-full max-w-4xl bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="mb-6">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            className="w-full p-2 border rounded mb-2"
            required
          />
          <button
            type="submit"
            disabled={loading || isStreaming}
            className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
          >
            {loading
              ? "Loading..."
              : isStreaming
              ? "Streaming..."
              : "Generate Summary"}
          </button>
          {error && <p className="text-red-500 mt-2 text-sm">Error: {error}</p>}
        </form>

        {(loading || rawSummaryText || metadata) && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {metadata?.title || "Summary"}
            </h2>
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
            {/* Conditionally render based on shouldPoll or summaryId existing */}
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

      {/* Render Sidebar */}
      <ClaimDetailSidebar claim={selectedClaim} onClose={handleCloseSidebar} />
    </main>
  );
}

