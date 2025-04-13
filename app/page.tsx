"use client";

import React, { useState, useRef, useEffect } from "react";
import { twMerge } from "tailwind-merge";

import { generateVideoSummary } from "@/app/actions/summary";
import { annotateClaim } from "@/app/actions/claimInfo";
import { VideoMetadata, Claim, YoutubeTranscriptSegment } from "@/types";

import HighlightedSummary from "@/app/home.components/highlightedSummary";
import ClaimDetailSidebar from "@/app/home.components/claimDetailSidebar";
import MetadataView from "@/app/home.components/metadataView";
import Heading from "@/app/home.components/heading";
import InputForm from "@/app/home.components/inputForm";

type CachedClaim = Claim & { lineNumber: number };

export default function Home() {
  const [error, setError] = useState("");
  const [rawSummaryText, setRawSummaryText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [summaryId, setSummaryId] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<
    YoutubeTranscriptSegment[] | null
  >(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [selectedClaimData, setSelectedClaimData] = useState<Claim | null>(
    null
  );
  const [annotatingClaim, setAnnotatingClaim] = useState(false);
  const [cachedClaims, setCachedClaims] = useState<CachedClaim[]>([]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent, url: string) => {
    e.preventDefault();
    setError("");
    setRawSummaryText("");
    setIsStreaming(false);
    setMetadata(null);
    setTranscript(null);
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
        transcript: newTranscript,
        error: actionError,
      } = await generateVideoSummary(url);

      if (!success || !(stream instanceof ReadableStream)) {
        setError(actionError || "Failed to initialize streaming");
        return;
      }

      if (newSummaryId) {
        setSummaryId(newSummaryId);
      }
      if (newMetadata) {
        setMetadata(newMetadata);
      }
      if (newTranscript) {
        setTranscript(newTranscript);
      }

      setIsStreaming(true);
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
        abortControllerRef.current = null;
      }
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
      console.error(err);
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleBulletPointClick = async (
    bulletText: string,
    lineNumber: number
  ) => {
    if (!transcript || !rawSummaryText) {
      setError("Missing transcript or summary for annotation.");
      return;
    }
    setSelectedClaimData(null);
    setAnnotatingClaim(true);
    setError("");

    const cachedClaim = cachedClaims.find(
      (claim) => claim.lineNumber === lineNumber
    );
    if (cachedClaim) {
      setSelectedClaimData(cachedClaim);
      setAnnotatingClaim(false);
      return;
    }

    try {
      const claimDetails = await annotateClaim(
        transcript,
        rawSummaryText,
        summaryId || "",
        bulletText.trim()
      );
      console.log("Annotation result:", claimDetails);
      if (claimDetails) {
        setSelectedClaimData(claimDetails);
        setCachedClaims((prevClaims) => [
          ...prevClaims,
          { ...claimDetails, lineNumber },
        ]);
      } else {
        setError("Could not retrieve details for this point.");
      }
    } catch (err: any) {
      console.error("Annotation error:", err);
      setError(err.message || "Failed to annotate the selected point.");
    } finally {
      setAnnotatingClaim(false);
    }
  };

  const handleCloseSidebar = () => {
    setSelectedClaimData(null);
  };

  return (
    <main className="flex min-h-screen flex-col items-center p-4 md:p-24 bg-gray-100">
      <div className="flex gap-12 w-full justify-center">
        {metadata && <MetadataView metadata={metadata} />}
        <div className="flex flex-col gap-4 max-w-lg w-full">
          <Heading />
          <InputForm
            handleSubmit={handleSubmit}
            disabled={isStreaming}
            error={error}
          />
        </div>
      </div>

      <div className="flex gap-4 w-full justify-center transition-all">
        <div className="bg-white max-w-4xl p-6 rounded-lg shadow-md h-full">
          {(rawSummaryText || metadata) && (
            <div className="mb-6">
              <div className="p-4 bg-gray-50 rounded text-gray-800 leading-relaxed">
                <HighlightedSummary
                  summaryText={rawSummaryText}
                  onBulletPointClick={handleBulletPointClick}
                />

                {isStreaming && !rawSummaryText && (
                  <p className="animate-pulse">Loading initial stream...</p>
                )}
              </div>
            </div>
          )}
        </div>

        <div
          className={twMerge(
            "transition-all duration-300 ease-in-out overflow-hidden flex-shrink-0 w-0",
            (annotatingClaim || selectedClaimData) && "w-96"
          )}
        >
          {(annotatingClaim || selectedClaimData) && (
            <ClaimDetailSidebar
              claim={selectedClaimData}
              isLoading={annotatingClaim}
              onClose={handleCloseSidebar}
            />
          )}
        </div>
      </div>
    </main>
  );
}

