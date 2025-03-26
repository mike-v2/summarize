"use client";

import { useState } from "react";

import { generateVideoSummary } from "@/app/actions/summary";
import { SummaryResponse } from "@/schemas/summary";

export default function Home() {
  const [url, setUrl] = useState("");
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSummary(null);

    try {
      const result = await generateVideoSummary(url);
      if (result.success && result.data) {
        setSummary(result.data);
      } else {
        setError(result.error || "Failed to generate summary");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">YouTube Video Summarizer</h1>

        <form onSubmit={handleSubmit} className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter YouTube URL"
              className="flex-1 p-2 border rounded"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? "Generating Summary..." : "Generate Summary"}
            </button>
          </div>
        </form>

        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            {error}
          </div>
        )}

        {summary && (
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Summary:</h2>

            <div className="p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-medium mb-2">Introduction</h3>
              <p className="mb-4">{summary.summary.introduction}</p>

              <h3 className="text-lg font-medium mb-2">Claims</h3>
              <ul className="list-decimal pl-6 space-y-4">
                {summary.summary.claims.map((claim, index) => (
                  <li key={index} className="space-y-2">
                    <p>{claim.claim_text}</p>
                    <ul className="list-disc pl-6">
                      {claim.evidence.map((evidence, evidenceIndex) => (
                        <li
                          key={evidenceIndex}
                          className="text-sm text-gray-600"
                        >
                          <span className="font-medium">{evidence.type}:</span>{" "}
                          {evidence.source}
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>

              <h3 className="text-lg font-medium mt-4 mb-2">Conclusion</h3>
              <p>{summary.summary.conclusion}</p>
            </div>

            <div className="p-4 bg-gray-50 rounded">
              <h3 className="text-lg font-medium mb-2">Knowledge Triples</h3>
              <ul className="space-y-2">
                {summary.triples.map((triple, index) => (
                  <li key={index} className="text-sm">
                    <span className="font-medium">{triple.subject}</span>{" "}
                    <span className="text-gray-600">{triple.relation}</span>{" "}
                    <span className="font-medium">{triple.object}</span>
                    <span className="text-gray-500 text-xs ml-2">
                      ({triple.evidence_type} - {triple.source})
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
