"use client";

import { useState, useRef, useEffect } from "react";
import AuthStatus from "@/components/authStatus";
import { generateVideoSummary } from "@/app/actions/summary";
import React from "react";

// Helper function to parse only inline markdown (bold/italic)
const parseInlineFormatting = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let remainingText = text;
  let keyIndex = 0;
  const regex = /(\*\*|\*)(.*?)\1/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remainingText)) !== null) {
    const delimiter = match[1];
    const content = match[2];
    const startIndex = match.index;

    if (startIndex > lastIndex) {
      nodes.push(remainingText.substring(lastIndex, startIndex));
    }

    if (delimiter === "**") {
      nodes.push(
        <strong key={`md-inline-bold-${keyIndex++}`}>{content}</strong>
      );
    } else if (delimiter === "*") {
      nodes.push(<em key={`md-inline-italic-${keyIndex++}`}>{content}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < remainingText.length) {
    nodes.push(remainingText.substring(lastIndex));
  }

  // If the input text resulted in no nodes (e.g., empty string), return empty array
  // Let the caller handle empty lines / whitespace
  if (nodes.length === 0 && text.trim() === "") {
    return [];
  }

  return nodes;
};

// Main parser: handles block elements (headings) and calls inline parser
const parseSimpleMarkdownToReact = (text: string): React.ReactNode[] => {
  // Check for headings first
  const headingMatch = text.match(/^(#+)\s+(.*)/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const content = headingMatch[2];
    const safeLevel = Math.max(1, Math.min(6, level));
    const HeadingTag = `h${safeLevel}`;
    // Parse the *content* of the heading for inline formatting
    const headingContentNodes = parseInlineFormatting(content);
    // Determine Tailwind classes based on heading level
    let headingClasses = "";
    switch (safeLevel) {
      case 1:
        headingClasses = "text-3xl font-bold mb-4 mt-6"; // Tailwind classes for H1
        break;
      case 2:
        headingClasses = "text-2xl font-bold mb-3 mt-5"; // Tailwind classes for H2
        break;
      case 3:
        headingClasses = "text-xl font-bold mb-2 mt-4"; // Tailwind classes for H3
        break;
      case 4:
        headingClasses = "text-lg font-semibold mb-2 mt-3"; // Tailwind classes for H4
        break;
      case 5:
        headingClasses = "text-base font-semibold mb-1 mt-2"; // Tailwind classes for H5
        break;
      case 6:
      default:
        headingClasses = "text-sm font-semibold mb-1 mt-1"; // Tailwind classes for H6
        break;
    }

    // Create the heading element with potentially formatted children and Tailwind classes
    return [
      React.createElement(
        HeadingTag,
        { key: "md-heading", className: headingClasses },
        ...headingContentNodes
      ),
    ];
  }

  // If not a heading, parse the whole line for inline formatting
  const inlineNodes = parseInlineFormatting(text);

  // Handle lines that are empty or only whitespace after parsing
  if (inlineNodes.length === 0 && text.trim() === "") {
    return [<React.Fragment key={`md-empty-line`}>&nbsp;</React.Fragment>];
  }

  return inlineNodes;
};

export default function Home() {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rawSummaryText, setRawSummaryText] = useState<string>("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRawSummaryText("");
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
        while (true) {
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
        setLoading(false);
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
      setLoading(false);
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

        {/* Display the streaming text directly, parsing simple markdown */}
        {(loading || rawSummaryText) && (
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {isStreaming ? "Generating Summary" : "Summary:"}
            </h2>
            <div className="p-4 bg-gray-50 rounded">
              {/* Split summary text into lines and parse each line */}
              {rawSummaryText.split("\n").map((line, index) => {
                const nodes = parseSimpleMarkdownToReact(line);

                // Check if the result is a heading tag
                // It returns an array, so check the first element
                const firstNode = nodes[0];
                const isHeading =
                  React.isValidElement(firstNode) &&
                  typeof firstNode.type === "string" &&
                  firstNode.type.startsWith("h");

                if (isHeading) {
                  // Render the heading directly, adding the map index as the key
                  // Clone the element to add the key prop
                  return React.cloneElement(firstNode as React.ReactElement, {
                    key: index,
                  });
                } else if (line.trim() === "") {
                  // Render an empty paragraph for lines that were just whitespace
                  return (
                    <p key={index} className="mb-2 min-h-[1em]">
                      &nbsp;
                    </p>
                  );
                } else if (nodes.length > 0 || line.trim() !== "") {
                  // Render non-heading lines (text, strong, em) within a paragraph
                  return (
                    <p key={index} className="mb-2 min-h-[1em]">
                      {nodes} {/* Render the array of nodes */}
                    </p>
                  );
                }
                // Return null if the line is effectively empty and not caught above
                return null;
              })}
              {/* Show loading indicator if streaming and no text yet */}
              {isStreaming && !rawSummaryText && (
                <p className="animate-pulse">Loading...</p>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
