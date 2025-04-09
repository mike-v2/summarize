import React from "react";
import { FactBasedClaim } from "@/types"; // Import the claim type
import { parseSimpleMarkdownToReact } from "@/utils/markdownParser";

interface HighlightedSummaryProps {
  summaryText: string;
  claims: FactBasedClaim[] | null;
}

// Helper function to escape regex special characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"); // $& means the whole matched string
}

// Helper map for claim lookup
let claimTimestampMap = new Map<string, string>();
let highlightRegex: RegExp | null = null;

// Recursive function to render nodes, applying highlighting to text strings
function renderNodeWithHighlighting(
  node: React.ReactNode,
  key: string | number
): React.ReactNode {
  if (typeof node === "string") {
    // If it's a simple string, apply highlighting logic
    if (!highlightRegex) return node; // No regex means no claims to highlight

    const parts = node.split(highlightRegex);
    return (
      <React.Fragment key={key}>
        {parts.map((part, index) => {
          const trimmedPart = part.trim();
          const timestamp = claimTimestampMap.get(trimmedPart);
          if (timestamp) {
            return (
              <React.Fragment key={`${key}-${index}`}>
                <mark className="bg-yellow-200 rounded px-1 mx-0.5">
                  {part}
                </mark>
                <span className="text-xs text-gray-500 ml-1">
                  ({timestamp})
                </span>
              </React.Fragment>
            );
          } else {
            return (
              <React.Fragment key={`${key}-${index}`}>{part}</React.Fragment>
            );
          }
        })}
      </React.Fragment>
    );
  }

  // Check if it's a valid React element *and* we can safely access props
  if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
    const children = node.props.children;
    let processedChildren: React.ReactNode = children;

    if (Array.isArray(children)) {
      processedChildren = children.map((child, index) =>
        renderNodeWithHighlighting(child, `${key}-${index}`)
      );
    } else if (children) {
      processedChildren = renderNodeWithHighlighting(children, `${key}-child`);
    }

    // Now TypeScript knows node.props exists and is an object
    return React.cloneElement(
      node,
      { key: key, ...node.props },
      processedChildren
    );
  }

  // Handle other node types (null, undefined, boolean, number) - likely render nothing or default
  return null;
}

function HighlightedSummary({ summaryText, claims }: HighlightedSummaryProps) {
  const hasClaims = claims && claims.length > 0;

  if (hasClaims) {
    // Build regex and map only if claims exist
    const sortedClaims = [...claims].sort(
      (a, b) => b.text.length - a.text.length
    );
    const claimTexts = sortedClaims.map((claim) =>
      escapeRegex(claim.text.trim())
    );
    highlightRegex = new RegExp(`(${claimTexts.join("|")})`, "g");
    claimTimestampMap = new Map(
      claims.map((claim) => [claim.text.trim(), claim.timestamp])
    );
  } else {
    highlightRegex = null;
    claimTimestampMap.clear();
  }

  const paragraphs = summaryText.split("\n");

  return (
    <>
      {paragraphs.map((paragraph, pIndex) => {
        if (paragraph.trim() === "") {
          return (
            <p key={`p-${pIndex}`} className="mb-2 min-h-[1em]">
              {"\u00A0"}
            </p>
          );
        }

        // 1. Parse paragraph with markdown parser first
        const nodes = parseSimpleMarkdownToReact(paragraph);

        // Check if the first node is a heading (special handling)
        const firstNode = nodes[0];
        const isHeading =
          React.isValidElement(firstNode) &&
          typeof firstNode.type === "string" &&
          firstNode.type.startsWith("h");

        if (isHeading) {
          // For simplicity, render heading as is.
          // Recursive highlighting within headings requires careful handling of nested elements.
          return React.cloneElement(firstNode as React.ReactElement, {
            key: `p-${pIndex}`,
          });
        }

        // 2. Render normal nodes, applying highlighting to text content
        return (
          <p key={`p-${pIndex}`} className="mb-2 min-h-[1em]">
            {nodes.map((node, index) =>
              renderNodeWithHighlighting(node, index)
            )}
          </p>
        );
      })}
    </>
  );
}

export default HighlightedSummary;
