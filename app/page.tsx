"use client";

import { useState } from "react";
import { getYoutubeTranscript } from "./actions/youtube";

export default function Home() {
  const [url, setUrl] = useState("");
  const [transcript, setTranscript] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setTranscript([]);

    try {
      const result = await getYoutubeTranscript(url);
      if (result.success && result.data) {
        setTranscript(result.data.transcript.map((item) => item.text));
      } else {
        setError(result.error || "Failed to fetch transcript");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">YouTube Transcript Fetcher</h1>

      <form onSubmit={handleSubmit} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter YouTube URL"
            className="flex-1 p-2 border rounded"
          />
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {loading ? "Loading..." : "Get Transcript"}
          </button>
        </div>
      </form>

      {error && <div className="text-red-500 mb-4">{error}</div>}

      {transcript.length > 0 && (
        <div className="space-y-2">
          {transcript.map((text, index) => (
            <p key={index} className="p-2 bg-gray-50 rounded">
              {text}
            </p>
          ))}
        </div>
      )}
    </main>
  );
}
