"use client";

import React from "react";
import { Claim, Evidence } from "@/types";

type ClaimDetailSidebarProps = {
  claim: Claim;
  onClose: () => void;
};

export default function ClaimDetailSidebar({
  claim,
  onClose,
}: ClaimDetailSidebarProps) {
  return (
    <div className="bg-white shadow-lg p-6 rounded-lg h-full border border-gray-200 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Claim Details</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="Close sidebar"
        >
          &times;
        </button>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-1">Claim:</h3>
        <p className="bg-yellow-100 p-2 rounded text-sm text-gray-800">
          {claim.claim}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Timestamp: {claim.timestamp}
        </p>
      </div>

      <div className="mb-6">
        <h3 className="font-medium mb-1">Explanation:</h3>
        <p className="bg-blue-50 p-2 rounded text-sm text-gray-800">
          {claim.explanation}
        </p>
      </div>

      {claim.quotes && claim.quotes.length > 0 && (
        <div className="mb-6">
          <h3 className="font-medium mb-2">Supporting Quotes:</h3>
          <ul className="space-y-2 list-disc list-inside">
            {claim.quotes.map((quote: string, index: number) => (
              <li
                key={index}
                className="text-sm text-gray-700 bg-gray-50 p-2 rounded"
              >
                "{quote}"
              </li>
            ))}
          </ul>
        </div>
      )}

      <div>
        <h3 className="font-medium mb-2">Evidence:</h3>
        {claim.evidence && claim.evidence.length > 0 ? (
          <ul className="space-y-3">
            {claim.evidence.map((evi: Evidence, index: number) => (
              <li key={index} className="border p-3 rounded bg-gray-50 text-sm">
                <p className="font-semibold mb-1">
                  Source: <span className="font-normal">{evi.source}</span>
                </p>
                <p className="mb-1">
                  Description:{" "}
                  <span className="font-normal">{evi.description}</span>
                </p>
                <p className="text-xs text-gray-500">
                  Timestamp: {evi.timestamp}
                </p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No evidence provided for this claim.
          </p>
        )}
      </div>

      {/* Placeholder for future actions */}
      <div className="mt-6 pt-4 border-t">
        <button
          // onClick={handleAddClaimToGraph}
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 mt-2"
          disabled
        >
          Add to Knowledge Graph (Coming Soon)
        </button>
        <button
          // onClick={handleEditClaim}
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 mt-2"
          disabled
        >
          Edit Claim (Coming Soon)
        </button>
      </div>
    </div>
  );
};
