import React from "react";
import { Claim } from "@/types";
import { parseSimpleMarkdownToReact } from "@/utils/markdownParser";

type HighlightedSummaryProps = {
  summaryText: string;
  claims: Claim[] | null;
  onClaimClick?: (claim: Claim) => void;
};

// Helper function to escape regex special characters
function escapeRegex(string: string): string {
  return string.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"); // $& means the whole matched string
}

// Define types for the map and regex accessible within the scope
let claimMap = new Map<string, Claim>();
let highlightRegex: RegExp | null = null;
let currentOnClaimClick: ((claim: Claim) => void) | undefined = undefined;

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
          if (typeof part !== "string") {
            return null; // Skip undefined/non-string parts
          }
          const trimmedPart = part.trim();
          const claim = claimMap.get(trimmedPart); // Get the full claim object
          if (claim) {
            return (
              <React.Fragment key={`${key}-${index}`}>
                <mark
                  className="bg-yellow-200 rounded px-1 mx-0.5 cursor-pointer hover:bg-yellow-300 transition-colors"
                  onClick={() =>
                    currentOnClaimClick && currentOnClaimClick(claim)
                  }
                  title="Click to see evidence"
                >
                  {part}
                </mark>
                <span className="text-xs text-gray-500 ml-1">
                  ({claim.timestamp})
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

function HighlightedSummary({
  summaryText,
  claims,
  onClaimClick,
}: HighlightedSummaryProps) {
  const hasClaims = claims && claims.length > 0;
  currentOnClaimClick = onClaimClick; // Make handler accessible to renderNodeWithHighlighting

  if (hasClaims) {
    // Build regex and map only if claims exist
    const sortedClaims = [...claims].sort(
      (a, b) => b.text.length - a.text.length
    );
    const claimTexts = sortedClaims.map((claim) =>
      escapeRegex(claim.text.trim())
    );
    highlightRegex = new RegExp(`(${claimTexts.join("|")})`, "g");
    // Store the full claim object in the map
    claimMap = new Map(claims.map((claim) => [claim.text.trim(), claim]));
  } else {
    highlightRegex = null;
    claimMap.clear();
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
