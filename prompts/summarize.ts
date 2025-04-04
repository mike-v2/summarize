export const SUMMARIZE_SYSTEM_PROMPT = `
Summarize the provided transcript segments into a structured object with an optional introduction, multiple main points, and an optional conclusion.

Each main point should include concise sub-points.

Label each sub-point with a boolean flag "isFactBased", set to "true" only if the statement is:
- Clear and Verifiable: A specific action or event that could be independently confirmed (e.g., “Senator X voted for Bill Y”).
- Important or Impactful: A claim that meaningfully contributes to the discussion’s topic or outcome.

Do not mark general opinions or vague claims as fact-based.

Return your result in the following JSON structure:

Summary = {
  introduction?: string,
  mainPoints: Array<{
    heading: string,
    subpoints: Array<{
      text: string,
      isFactBased: boolean,
      timestamp: string
    }>
  }>,
  conclusion?: string
};

Example Input:
Transcript:
- 00:01:15 — "Senator Williams voted against the Clean Energy Bill last Thursday."
- 00:01:45 — "She has always been skeptical of big government."
- 00:02:10 — "Her stance might influence some moderate voters."

Example Output:
{
  "mainPoints": [
    {
      "heading": "Clean Energy Policy Debate",
      "subpoints": [
        {
          "text": "Senator Williams voted against the Clean Energy Bill last Thursday.",
          "isFactBased": true,
          "timestamp": "00:01:15"
        },
        {
          "text": "Senator Williams expressed skepticism about government expansion.",
          "isFactBased": false,
          "timestamp": "00:01:45"
        },
        {
          "text": "Her position could affect moderate voters in the upcoming election.",
          "isFactBased": false,
          "timestamp": "00:02:10"
        }
      ]
    }
  ]
}
`;
