"use client";

import React from "react";
import { Claim, Evidence } from "@/types";

type ClaimDetailSidebarProps = {
  claim: Claim | null;
  onClose: () => void;
};

export default function ClaimDetailSidebar({
  claim,
  onClose,
}: ClaimDetailSidebarProps) {
  return (
    <div className="bg-white shadow-lg p-6 rounded-lg h-full border border-gray-200 overflow-y-auto">
      {/* Content is conditionally rendered based on claim, but outer div is always present */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">
          {claim ? "Claim Details" : " "}
        </h2>
        {claim && (
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            aria-label="Close sidebar"
          >
            &times;
          </button>
        )}
      </div>

      {claim ? (
        <>
          {/* ... claim details content ... */}
          <div className="mb-6">
            <h3 className="font-medium mb-1">Claim:</h3>
            <p className="bg-yellow-100 p-2 rounded text-sm text-gray-800">
              {claim.text}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Timestamp: {claim.timestamp}
            </p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Evidence:</h3>
            {claim.evidence.length > 0 ? (
              <ul className="space-y-3">
                {claim.evidence.map((evi, index) => (
                  <li
                    key={index}
                    className="border p-3 rounded bg-gray-50 text-sm"
                  >
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
        </>
      ) : (
        <div className="text-gray-500">{/* Hidden structure content */}</div>
      )}
    </div>
  );
};
