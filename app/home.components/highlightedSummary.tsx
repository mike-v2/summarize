import React from "react";
import { parseSimpleMarkdownToReact } from "@/utils/markdownParser";

const isBulletPoint = (line: string): boolean => {
  return line.trim().startsWith("-");
};

interface HighlightedSummaryProps {
  summaryText: string;
  onBulletPointClick: (bulletText: string, lineNumber: number) => void;
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

        const trimmedLine = line.trim();
        if (isBulletPoint(trimmedLine)) {
          // Make the entire bullet point line clickable
          return (
            <div // Use div instead of p for block behavior with nested elements
              key={index}
              className="cursor-pointer hover:bg-gray-200 transition-colors duration-150 p-1 rounded mb-1" // Added margin-bottom
              onClick={() =>
                onBulletPointClick(trimmedLine.substring(1).trim(), index)
              } // Pass the text after the hyphen
            >
              {renderedContent} {/* Display parsed markdown content */}
            </div>
          );
        } else {
          // For non-bullet lines, check if the parsed content contains block elements
          const containsBlockElement = nodes.some(
            (node) =>
              React.isValidElement(node) &&
              typeof node.type === "string" &&
              [
                "p",
                "h1",
                "h2",
                "h3",
                "h4",
                "h5",
                "h6",
                "div",
                "ul",
                "ol",
                "li",
                "blockquote",
                "pre",
                "hr",
                "table",
              ].includes(node.type)
          );

          // Handle empty lines
          if (nodes.length === 0 || (nodes.length === 1 && nodes[0] === "")) {
            return (
              <div key={index} className="mb-1 min-h-[1em]">
                {"\u00A0"} {/* Non-breaking space for empty lines */}
              </div>
            );
          } else if (containsBlockElement) {
            // If it contains block elements, render inside a div
            return (
              <div key={index} className="mb-1">
                {renderedContent}
              </div>
            );
          } else {
            // Otherwise, wrap inline content in a paragraph
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
