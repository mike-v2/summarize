import { TranscriptSegment, YoutubeTranscriptSegment } from "@/types";

// Helper function to format timestamp in HH:MM:SS format
function formatTimestamp(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  return [
    hours.toString().padStart(2, "0"),
    minutes.toString().padStart(2, "0"),
    secs.toString().padStart(2, "0"),
  ].join(":");
}

function formatTranscriptTimestamps(transcript: YoutubeTranscriptSegment[]): {
  segments: TranscriptSegment[];
} {
  return {
    segments: transcript.map((segment) => ({
      text: segment.text,
      timestamp: formatTimestamp(segment.offset),
      duration: segment.duration,
    })),
  };
}

export { formatTranscriptTimestamps };
