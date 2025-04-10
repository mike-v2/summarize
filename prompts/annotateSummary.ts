export const ANNOTATE_SUMMARY_PROMPT = `
### Prompt for Second Pass (Structured Fact-based Claim Extraction)

You are given two inputs:

1. A YouTube transcript provided as an array of objects, each containing properties:
   - \`text\`: The transcript segment.
   - \`timestamp\`: The start timestamp in \`HH:MM:SS\` format.
   - \`duration\`: Duration of the segment in seconds.
2. A **summary** created from the transcript.

Your task is to identify all **fact-based claims** from the provided summary. For each claim, produce a structured JSON object:
{
  "text": "string",
  "timestamp": "HH:MM:SS",
  "evidence": [
    {
      "source": "string",
      "description": "string", 
      "timestamp": "HH:MM:SS"
    }
  ]
}
\`\`\`

## Example (One-Shot Learning):

### Transcript:

\`\`\`json
[
  { "text": "Our recent tax reform has clearly benefited the middle class.", "timestamp": "00:02:10", "duration": 15 },
  { "text": "Employment increased by 3% after the tax reform bill was passed.", "timestamp": "00:03:45", "duration": 20 },
  { "text": "A new report from the Bureau of Labor Statistics confirms the 3% increase in employment.", "timestamp": "00:04:10", "duration": 18 },
  { "text": "The new housing policy created thousands of affordable homes.", "timestamp": "00:05:22", "duration": 18 },
  { "text": "We believe these economic changes are beneficial for the community.", "timestamp": "00:07:30", "duration": 12 }
]
\`\`\`

### Summary:

\`\`\`
The debate mainly discussed economic issues. Employment increased by 3% after the tax reform bill was passed. The new housing policy created thousands of affordable homes.
\`\`\`

### Structured JSON Output:

\`\`\`json
{
  "claims": [
    {
      "text": "employment increased by 3% following the tax reform.",
      "timestamp": "00:03:45",
      "evidence": [
        {
          "source": "Bureau of Labor Statistics",
          "description": "Report confirms the 3% increase in employment.",
          "timestamp": "00:04:10"
        }
      ]
    },
    {
      "text": "the housing policy led to the creation of thousands of affordable homes.",
      "timestamp": "00:05:22",
      "evidence": [
        {
          "source": "Speaker Testimony",
          "description": "Speaker stated the new housing policy created thousands of affordable homes.",
          "timestamp": "00:05:22"
        }
      ]
    }
  ]
}
\`\`\`
`;

export function createAnnotateSummaryPrompt(
  transcript: string,
  summary: string
) {
  return `
    ## Now complete the task with the provided inputs:

    ### Transcript:

    \`\`\`json
    ${transcript}
    \`\`\`

    ### Summary:

    \`\`\`
    ${summary}
    \`\`\`

    ### Structured JSON Output:
  `;
}
