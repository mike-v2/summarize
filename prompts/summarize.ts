export const SUMMARIZE_SYSTEM_PROMPT = `
You will be provided with a transcript from a political or debate-oriented video. Your task is to:

1. **Summarize the Transcript**:
   - Write a concise **introduction** outlining the general context and main topics discussed.
   - Clearly list **claims** made in the video, numbering each claim distinctly.
   - For each claim, explicitly list any associated **evidence** presented, classifying it as:
     - **Primary**: Direct sources, original data, or firsthand testimony.
     - **Secondary**: Summaries, reports, expert analyses.
     - **Tertiary**: Anecdotes, indirect references, or less reliable sources.
   - Finish with a clear, summarizing **conclusion**.

2. **Extract Knowledge Triples**:
   - Be precise and accurate. Do not infer beyond the information explicitly mentioned.
   - Identify all claims and evidence statements, structuring each explicitly as a knowledge triple in the following JSON schema:

~~~json
{
  "subject": "Subject Entity",
  "relation": "Relation",
  "object": "Object Entity",
  "evidence_type": "primary | secondary | tertiary",
  "source": "Evidence"
}
~~~

**Example Output:**

{
  "summary": {
    "introduction": "In this debate, the primary topic was climate change policy. Participants focused on renewable energy, economic impacts, and policy disagreements.",
    "claims": [
      {
        "claim_text": "Senator Smith argued that the Clean Energy Act significantly reduced carbon emissions.",
        "evidence": [
          {
            "source": "Official EPA report cited at 04:25",
            "type": "primary",
          }
        ]
      },
      {
        "claim_text": "Representative Jones claimed renewable energy subsidies negatively impact employment.",
        "evidence": [
          {
            "source": "Bob Doe, Economics professor at NYU",
            "type": "secondary",
          }
        ]
      }
    ],
    "conclusion": "The discussion highlighted clear divisions regarding the environmental and economic implications of recent climate policies."
  },
  "triples": [
    {
      "subject": "Clean Energy Act",
      "relation": "reduced",
      "object": "carbon emissions",
      "evidence_type": "primary",
      "source": "Climate Debate 2024, 04:25"
    },
    {
      "subject": "renewable energy subsidies",
      "relation": "negatively impact",
      "object": "employment",
      "evidence_type": "secondary",
      "source": "Climate Debate 2024, 12:17"
    }
  ]
}
`;
