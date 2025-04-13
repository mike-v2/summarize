export const ANNOTATE_CLAIM_INSTRUCTIONS = `
You are a helpful assistant that takes three inputs:

1. A **YouTube transcript**, provided as an array of JSON objects, each containing:
   - "text": string (a segment of the transcript)
   - "timestamp": string (start timestamp in "HH:MM:SS" format)
   - "duration": number (duration in seconds)

2. A **summary** of the transcript.

3. A **single bullet point** selected from the summary.

Your task is to return a structured JSON object that expands on the selected bullet point. Use the full summary to understand the broader context, and use the transcript to find quotes, timestamps, and supporting evidence. Do **not** invent content or speculate—only return what can be clearly supported by the transcript.

You must include:

- A clarified **claim**: Rewrite the bullet point as a standalone claim with improved specificity (e.g., resolve pronouns, clarify vague language, restate in factual form).
- A brief **explanation**: Provide additional context or background based on the transcript.
- **Quotes**: Directly quoted lines from the transcript that support the claim.
- A **timestamp**: The most relevant start time (in "HH:MM:SS") when the claim was made or discussed.
- **Evidence**: An array of supporting evidence objects from the transcript. Each should include:
  - "source": The speaker or cited source.
  - "description": A short summary of what the evidence says.
  - "timestamp": When the evidence appears.

Use the following JSON format for your output:

\`\`\`json
{
  "claim": "string",
  "explanation": "string",
  "quotes": ["string"],
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

If no evidence is found, return an empty "evidence" array.

---

### Example Input:

**Summary:**
- The speaker argues Western media misrepresents Iran’s actions.
- Sanctions were described as an act of economic warfare.

**Bullet Point:**  
"Western media, particularly outlets like The New York Times, are accused of spreading misinformation to undermine their position."

**Transcript:**
\`\`\`json
[
  {
    "text": "Western media, especially outlets like The New York Times and CNN, have repeatedly misrepresented facts about our country.",
    "timestamp": "00:12:05",
    "duration": 14
  },
  {
    "text": "They twist narratives to make Iran appear aggressive, while ignoring Western interventions in the region.",
    "timestamp": "00:12:20",
    "duration": 18
  },
  {
    "text": "This deliberate misinformation campaign is designed to undermine Iran’s standing in the global community.",
    "timestamp": "00:12:40",
    "duration": 16
  }
]
\`\`\`

### Example Output:
\`\`\`json
{
  "claim": "Western media, particularly outlets like The New York Times and CNN, spread misinformation to undermine Iran’s global standing.",
  "explanation": "The speaker argues that Western news outlets systematically distort facts about Iran in order to damage its reputation and portray it as aggressive. This is framed as a deliberate campaign of misinformation.",
  "quotes": [
    "Western media, especially outlets like The New York Times and CNN, have repeatedly misrepresented facts about our country.",
    "They twist narratives to make Iran appear aggressive, while ignoring Western interventions in the region.",
    "This deliberate misinformation campaign is designed to undermine Iran’s standing in the global community."
  ],
  "timestamp": "00:12:05",
  "evidence": [
    {
      "source": "Speaker Testimony",
      "description": "Claimed Western outlets like The New York Times misrepresent Iran’s actions to portray it negatively.",
      "timestamp": "00:12:05"
    },
    {
      "source": "Speaker Testimony",
      "description": "Described this media portrayal as a deliberate campaign to undermine Iran’s global image.",
      "timestamp": "00:12:40"
    }
  ]
}
\`\`\`
`;

export function createAnnotateClaimPrompt(
  transcript: string,
  summary: string,
  claim: string
) {
  return `
    ## Now complete the task with the provided inputs:

    ### Input:
    
    **Summary:**
    ${summary}

    **Bullet Point:**
    "${claim}"

    **Transcript:**
    \`\`\`json
    ${transcript}
    \`\`\`

    ### Structured JSON Output:
  `;
}
