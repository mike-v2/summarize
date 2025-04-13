export const ANNOTATE_CLAIM_INSTRUCTIONS = `
You are a helpful assistant that takes three inputs:

1. A **YouTube transcript**, provided as an array of JSON objects, each containing:
   - "text": string (a segment of the transcript)
   - "timestamp": string (start timestamp in "HH:MM:SS" format)
   - "duration": number (duration in seconds)

2. A **summary** of the transcript, consisting of bullet points.

3. A **single bullet point** selected from the summary.

Your task is to return a structured JSON object that expands on the selected bullet point. Use the full summary to understand the broader context and the transcript to extract direct quotes, timestamps, and supporting evidence. Do **not** invent content or speculate—only return what is clearly supported by the transcript.

Your response must include:

- A clarified **claim**: Rewrite the bullet point as a standalone claim with improved specificity. Resolve ambiguous pronouns and vague references to state the fact clearly.
- A brief **explanation**: Provide additional context or background based on the transcript.
- **Quotes**: An array of objects representing directly quoted text from the transcript that supports the claim. Each quote object should include:
  - "text": The exact quoted text.
  - "timestamp": The timestamp when this text appears (in "HH:MM:SS" format).
- A **timestamp**: The most relevant start time (in "HH:MM:SS" format) when the claim was made or discussed.
- **Evidence**: An array of supporting evidence objects that are specific, concrete, and verifiable. Evidence must directly support the claim (for instance, citing a news article, a public statement, or any documented event) rather than merely restating or providing background. Each evidence object should include:
  - "source": The speaker or cited source.
  - "description": A short summary of what the evidence reveals.
  - "timestamp": When this evidence appears in the transcript.

Return your output in the following JSON format:

\`\`\`json
{
  "claim": "string",
  "explanation": "string",
  "quotes": [
    {
      "text": "string",
      "timestamp": "HH:MM:SS"
    }
  ],
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

Remember: Evidence should be specific, concrete, and verifiable—such as references to a news article, leaked information, or an official public statement—not just restatements of the claim or additional background information.

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
    "duration": 9
  },
  {
    "text": "We saw that in the New York Times with a very fake article saying that the Iranian leader was forced by others in Iran to change their position in a secret meeting and that sort of thing.",
    "timestamp": "00:12:22",
    "duration": 18
  },
  {
    "text": "This is the same New York Times that three years ago said he was on his deathbed and then the next day he gave a public speech.",
    "timestamp": "00:12:40",
    "duration": 14
  }
]
\`\`\`

### Example Output:
\`\`\`json
{
  "claim": "Western media, particularly outlets like The New York Times and CNN, spread misinformation to undermine Iran’s leadership by publishing false reports about its internal politics and health status.",
  "explanation": "Professor Marandi alleges that Western outlets have distorted facts about Iran, including publishing fabricated stories about political decisions and the Supreme Leader’s health. Professor Marandi offers a past incident—where a death report was proven false the next day—as supporting evidence for this broader pattern of misinformation.",
  "quotes": [
    {
      "text": "Western media, especially outlets like The New York Times and CNN, have repeatedly misrepresented facts about our country.",
      "timestamp": "00:12:05"
    },
    {
      "text": "We saw that in the New York Times with a very fake article saying that the Iranian leader was forced by others in Iran to change their position in a secret meeting and that sort of thing.",
      "timestamp": "00:12:22"
    },
    {
      "text": "This is the same New York Times that three years ago said he was on his deathbed and then the next day he gave a public speech.",
      "timestamp": "00:12:40"
    }
  ],
  "timestamp": "00:12:22",
  "evidence": [
    {
      "source": "Professor Marandi",
      "description": "Referenced a New York Times report claiming Iran’s leader was on his deathbed, which was contradicted the next day by a public appearance.",
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
