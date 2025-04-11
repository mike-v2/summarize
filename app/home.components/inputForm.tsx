"use client";

import { useState } from "react";

type inputFormProps = {
  handleSubmit: (e: React.FormEvent, url: string) => void;
  disabled: boolean;
  error: string;
};

export default function InputForm({
  handleSubmit,
  disabled,
  error,
}: inputFormProps) {
  const [url, setUrl] = useState("");

  return (
    <form onSubmit={(e) => handleSubmit(e, url)} className="mb-6">
      <input
        type="text"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="Enter YouTube URL"
        className="w-full p-2 border rounded mb-2"
        required
      />
      <button
        type="submit"
        disabled={disabled}
        className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {disabled ? "Loading..." : "Generate Summary"}
      </button>
      {error && <p className="text-red-500 mt-2 text-sm">Error: {error}</p>}
    </form>
  );
}
