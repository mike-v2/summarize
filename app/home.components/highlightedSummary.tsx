import React from "react";
import { parseSimpleMarkdownToReact } from "@/utils/markdownParser";

// Define a helper function to identify bullet points
const isBulletPoint = (line: string): boolean => {
  return line.trim().startsWith("-");
};

interface HighlightedSummaryProps {
  summaryText: string;
  onBulletPointClick: (bulletText: string) => void; // New prop
}

const HighlightedSummary: React.FC<HighlightedSummaryProps> = ({
  summaryText,
  onBulletPointClick,
}) => {
  if (!summaryText) return null;

  const lines = summaryText.split("\n");

  return (
    <div>
      {lines.map((line, index) => {
        const trimmedLine = line.trim();
        const isBullet = isBulletPoint(trimmedLine);

        // 1. Parse the line with the markdown parser
        const nodes = parseSimpleMarkdownToReact(line);

        // Render the parsed nodes
        const renderedContent = nodes.map((node, nodeIndex) => {
          // Basic check if it's a text node - more complex handling might be needed
          if (typeof node === "string") {
            return node;
          } else if (React.isValidElement(node)) {
            // Clone element to ensure unique keys if needed, though map index might suffice
            return React.cloneElement(node, { key: `${index}-${nodeIndex}` });
          }
          return null; // Handle other potential node types
        });

        if (isBullet) {
          // Make the entire bullet point line clickable
          return (
            <div // Use div instead of p for block behavior with nested elements
              key={index}
              className="cursor-pointer hover:bg-gray-200 transition-colors duration-150 p-1 rounded mb-1" // Added margin-bottom
              onClick={() =>
                onBulletPointClick(trimmedLine.substring(1).trim())
              } // Pass the text after the hyphen
            >
              {renderedContent} {/* Display parsed markdown content */}
            </div>
          );
        } else {
          // Render non-bullet point lines, handling potential empty lines/nodes
          if (nodes.length === 0 || (nodes.length === 1 && nodes[0] === "")) {
            // Render a non-breaking space for visually empty lines to maintain spacing
            return (
              <p key={index} className="mb-1 min-h-[1em]">
                {"\u00A0"}
              </p>
            );
          } else {
            // Wrap parsed non-bullet content in a paragraph
            return (
              <p key={index} className="mb-1 min-h-[1em]">
                {renderedContent}
              </p>
            );
          }
        }
      })}
    </div>
  );
};

export default HighlightedSummary;
