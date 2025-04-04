"use client";

import { useState } from "react";
import AuthStatus from "@/components/authStatus";

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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">YouTube Video Summarizer</h1>
          <AuthStatus />
        </div>

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
              <p className="mb-4">{summary.introduction}</p>

              <h3 className="text-lg font-medium mb-2">Claims</h3>
              <div className="space-y-6">
                {summary.mainPoints.map((mainPoint, index) => (
                  <div key={index} className="mb-4">
                    <h4 className="text-md font-semibold">
                      {mainPoint.heading}
                    </h4>
                    <ul className="list-disc pl-6 space-y-2 mt-2">
                      {mainPoint.subpoints.map((subpoint, subIndex) => (
                        <li key={subIndex} className="space-y-1">
                          <div className="flex items-start">
                            <p>{subpoint.text}</p>
                            <span className="text-xs text-gray-500 ml-2">
                              {subpoint.timestamp}
                            </span>
                          </div>
                          {subpoint.isFactBased && (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Fact-based
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <h3 className="text-lg font-medium mt-4 mb-2">Conclusion</h3>
              <p>{summary.conclusion}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
