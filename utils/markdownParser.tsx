import React from "react";

// Helper function to parse only inline markdown (bold/italic)
export const parseInlineFormatting = (text: string): React.ReactNode[] => {
  const nodes: React.ReactNode[] = [];
  let remainingText = text;
  let keyIndex = 0;
  // Regex to find **bold** or *italic* text (non-greedy)
  const regex = /(\*\*|\*)(.*?)\1/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(remainingText)) !== null) {
    const delimiter = match[1]; // ** or *
    const content = match[2];
    const startIndex = match.index;

    // Add preceding plain text if any
    if (startIndex > lastIndex) {
      nodes.push(remainingText.substring(lastIndex, startIndex));
    }

    // Add the formatted React element
    if (delimiter === "**") {
      nodes.push(
        <strong key={`md-inline-bold-${keyIndex++}`}>{content}</strong>
      );
    } else if (delimiter === "*") {
      nodes.push(<em key={`md-inline-italic-${keyIndex++}`}>{content}</em>);
    }

    lastIndex = regex.lastIndex;
  }

  // Add any remaining text after the last match
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
export const parseSimpleMarkdownToReact = (text: string): React.ReactNode[] => {
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
        { key: "md-heading", className: headingClasses }, // Add Tailwind classes here
        ...headingContentNodes
      ),
    ];
  }

  // If not a heading, parse the whole line for inline formatting
  const inlineNodes = parseInlineFormatting(text);

  // Handle lines that are empty or only whitespace after parsing
  if (inlineNodes.length === 0 && text.trim() === "") {
    // Return a fragment with a non-breaking space for the caller to handle
    return [<React.Fragment key={`md-empty-line`}>&nbsp;</React.Fragment>];
  }

  return inlineNodes;
};
