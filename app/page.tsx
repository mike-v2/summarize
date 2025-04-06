"use client";

import { useState, useRef, useEffect } from "react";
import AuthStatus from "@/components/authStatus";
import { generateVideoSummary } from "@/app/actions/summary";
import { MainPoint, SummaryResponse } from "@/schemas/summary";

export default function Home() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<SummaryResponse>({
    introduction: "",
    mainPoints: [],
    conclusion: "",
  });
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up any ongoing streams when component unmounts
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Try to progressively parse the JSON as it streams in
  const tryParseStreamingJSON = (text: string) => {
    try {
      // Make a best effort to parse possibly incomplete JSON
      // First, try to parse it normally
      const parsedData = JSON.parse(text);
      return parsedData;
    } catch (e) {
      // If normal parsing fails, try to extract what we can
      try {
        // Extract introduction if available
        const introMatch = text.match(/"introduction"\s*:\s*"([^"]*)/);
        const introduction = introMatch ? introMatch[1] : "";

        // Extract conclusion if available
        const conclusionMatch = text.match(/"conclusion"\s*:\s*"([^"]*)/);
        const conclusion = conclusionMatch ? conclusionMatch[1] : "";

        // Extract main points - this is a simplistic approach that may not work for all cases
        const mainPoints: Array<MainPoint> = [];

        // Try to extract headings
        const headingMatches = text.matchAll(/"heading"\s*:\s*"([^"]*)"/g);
        if (headingMatches) {
          for (const match of headingMatches) {
            if (match[1]) {
              mainPoints.push({
                heading: match[1],
                subpoints: [],
              });
            }
          }
        }

        // Try to extract subpoints (simplified approach)
        const subpointMatches = text.matchAll(/"text"\s*:\s*"([^"]*)"/g);
        if (subpointMatches && mainPoints.length > 0) {
          let pointIndex = 0;
          for (const match of subpointMatches) {
            if (match[1]) {
              // Distribute subpoints across main points - imperfect but better than nothing
              const targetPoint = pointIndex % mainPoints.length;
              // Provide default values for missing fields during streaming fallback
              mainPoints[targetPoint].subpoints.push({
                text: match[1],
                isFactBased: false, // Default value
                timestamp: "", // Default value
              });
              pointIndex++;
            }
          }
        }

        return {
          introduction,
          mainPoints,
          conclusion,
        };
      } catch (parseError) {
        // If all parsing fails, return the current state
        return null;
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary(null);
    setStreamingContent({
      introduction: "",
      mainPoints: [],
      conclusion: "",
    });
    setIsStreaming(false);

    // Stop any existing stream
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    try {
      const result = await generateVideoSummary(url);

      if (!(result instanceof ReadableStream)) {
        // Handle error if we didn't get a stream
        setError(result.error || "Failed to initialize streaming");
        setLoading(false);
        return;
      }

      // Process the streaming response
      setIsStreaming(true);
      const reader = result.getReader();
      const decoder = new TextDecoder();
      abortControllerRef.current = new AbortController();

      try {
        let accumulatedText = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const text = decoder.decode(value, { stream: true });
          accumulatedText += text;

          // Try to progressively parse and display the JSON
          const parsedContent = tryParseStreamingJSON(accumulatedText);
          if (parsedContent) {
            setStreamingContent(parsedContent);
          }
        }

        // After streaming completes, try to parse the complete response
        try {
          const jsonData = JSON.parse(accumulatedText);
          setSummary(jsonData);
          // Summary is automatically saved by the server
        } catch (err) {
          setError("Failed to parse streamed response");
          console.error("JSON parsing error:", err);
        }
      } catch (streamError: any) {
        if (streamError.name !== "AbortError") {
          setError("Stream processing error");
          console.error("Stream error:", streamError);
        }
      } finally {
        setIsStreaming(false);
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
      setLoading(false);
    }
  };

  // Render stream content in a structured way
  const renderStreamingContent = () => {
    return (
      <div className="space-y-6 animate-pulse">
        {streamingContent.introduction && (
          <div>
            <h3 className="text-lg font-medium mb-2">Introduction</h3>
            <p className="mb-4">{streamingContent.introduction}</p>
          </div>
        )}

        {streamingContent.mainPoints.length > 0 && (
          <div>
            <h3 className="text-lg font-medium mb-2">Main Points</h3>
            <div className="space-y-6">
              {streamingContent.mainPoints.map((point, index) => (
                <div key={index} className="mb-4">
                  <h4 className="text-md font-semibold">{point.heading}</h4>
                  {point.subpoints.length > 0 && (
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      {point.subpoints.map((subpoint, subIndex) => (
                        <li key={subIndex}>{subpoint.text}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {streamingContent.conclusion && (
          <div>
            <h3 className="text-lg font-medium mb-2">Conclusion</h3>
            <p>{streamingContent.conclusion}</p>
          </div>
        )}
      </div>
    );
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

        {isStreaming && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              Live Summary (Building...)
            </h2>
            <div className="p-4 bg-gray-50 rounded">
              {renderStreamingContent()}
            </div>
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Summary:</h2>

            <div className="p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-medium mb-2">Introduction</h3>
              <p className="mb-4">{summary.introduction}</p>

              <h3 className="text-lg font-medium mb-2">Claims</h3>
              <div className="space-y-6">
                {summary.mainPoints.map((mainPoint, index) => (
                  <div key={index} className="mb-4">
                    <h4 className="text-md font-semibold">
                      {mainPoint.heading}
                    </h4>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      {mainPoint.subpoints.map((subpoint, subIndex) => (
                        <li key={subIndex} className="space-y-1">
                          <div className="flex items-start">
                            <p>{subpoint.text}</p>
                            <span className="text-xs text-gray-500 ml-2">
                              {subpoint.timestamp}
                            </span>
                          </div>
                          {subpoint.isFactBased && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Fact-based
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">Conclusion</h3>
              <p>{summary.conclusion}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
