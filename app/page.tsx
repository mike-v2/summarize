"use client";

import React, { useState, useRef, useEffect } from "react";

import AuthStatus from "@/components/authStatus";
import { generateVideoSummary } from "@/app/actions/summary";
import { parseSimpleMarkdownToReact } from "@/utils/markdownParser";
import { useSummaryPolling } from "@/hooks/useSummaryPolling";

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawSummaryText, setRawSummaryText] = useState<string>("");
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [startPolling, setStartPolling] = useState(false);

  const {
    pollingStatus,
    videoData: claimsData,
    pollingError,
  } = useSummaryPolling({
    url: url,
    shouldPoll: startPolling,
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

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      const result = await generateVideoSummary(url);

      if (!(result instanceof ReadableStream)) {
        setError(result.error || "Failed to initialize streaming");
        setLoading(false);
        return;
      }

      setIsStreaming(true);
      setLoading(false);
      const reader = result.getReader();
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
        if (!abortControllerRef.current?.signal.aborted) {
          console.log("Setting startPolling to true...");
          setStartPolling(true);
        } else {
          console.log("Polling skipped due to abortion.");
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

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">YouTube Video Summarizer</h1>
          <AuthStatus />
        </div>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4 mb-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="flex-1 p-2 border rounded"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isStreaming ? "Generating Summary..." : "Generate Summary"}
          </button>
        </form>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            {error}
          </div>
        )}

        {(loading || rawSummaryText) && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {isStreaming ? "Generating Summary" : "Summary:"}
            </h2>
            <div className="p-4 bg-gray-50 rounded">
              {rawSummaryText.split("\n").map((line, index) => {
                const nodes = parseSimpleMarkdownToReact(line);
                const firstNode = nodes[0];
                const isHeading =
                  React.isValidElement(firstNode) &&
                  typeof firstNode.type === "string" &&
                  firstNode.type.startsWith("h");

                if (isHeading) {
                  return React.cloneElement(firstNode as React.ReactElement, {
                    key: index,
                  });
                } else if (line.trim() === "") {
                  return (
                    <p key={index} className="mb-2 min-h-[1em]">
                      &nbsp;
                    </p>
                  );
                } else if (nodes.length > 0 || line.trim() !== "") {
                  return (
                    <p key={index} className="mb-2 min-h-[1em]">
                      {nodes}
                    </p>
                  );
                }
                return null;
              })}
              {isStreaming && !rawSummaryText && (
                <p className="animate-pulse">Loading initial stream...</p>
              )}
            </div>

            {pollingStatus !== "idle" && pollingStatus !== "complete" && (
              <div className="mt-4 p-2 text-sm text-gray-600 bg-gray-100 rounded">
                {pollingStatus === "processing" &&
                  "⚙️ Analyzing summary for claims..."}
                {pollingStatus === "not_found" &&
                  "⏳ Locating summary entry..."}
                {pollingError && `⚠️ Error: ${pollingError}`}
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
    </main>
  );
}

