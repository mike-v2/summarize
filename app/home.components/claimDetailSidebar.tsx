"use client";

import React from "react";
import { twMerge } from "tailwind-merge";
import { Claim, Evidence, Quote } from "@/types";

type ClaimDetailSidebarProps = {
  claim: Claim | null;
  isLoading: boolean;
  onClose: () => void;
};

// Skeleton component for placeholder UI
const SkeletonLoader = ({ className = "" }: { className?: string }) => (
  <div
    className={twMerge("bg-gray-200 rounded animate-pulse h-4", className)}
  ></div>
);

export default function ClaimDetailSidebar({
  claim,
  isLoading,
  onClose,
}: ClaimDetailSidebarProps) {
  return (
    <div className="bg-white shadow-lg p-6 rounded-lg h-full border border-gray-200 overflow-y-auto flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h2 className="text-xl font-semibold">Claim Details</h2>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-2xl"
          aria-label="Close sidebar"
        >
          &times;
        </button>
      </div>

      <div className="flex-grow overflow-y-auto">
        {isLoading ? (
          <LoadingView />
        ) : claim ? (
          <DataView claim={claim} />
        ) : (
          // Error/No Data State (if needed, could show an error message)
          <p className="text-gray-500">Could not load claim details.</p>
        )}
      </div>

      {/* Placeholder for future actions - kept outside loading state */}
      <div className="mt-6 pt-4 border-t flex-shrink-0">
        <button
          className="w-full p-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-400 mt-2"
          disabled={isLoading || !claim}
        >
          Add to Knowledge Graph (Coming Soon)
        </button>
        <button
          className="w-full p-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 mt-2"
          disabled={isLoading || !claim}
        >
          Edit Claim (Coming Soon)
        </button>
      </div>
    </div>
  );
}

function LoadingView() {
  return (
    // Loading State: Show Skeleton Loaders
    <div className="space-y-6">
      {/* Claim Skeleton */}
      <div>
        <h3 className="font-medium mb-1">Claim:</h3>
        <SkeletonLoader className="h-10" />
        <SkeletonLoader className="w-1/3 mt-1" />
      </div>

      {/* Explanation Skeleton */}
      <div>
        <h3 className="font-medium mb-1">Explanation:</h3>
        <SkeletonLoader className="h-16" />
      </div>

      {/* Quotes Skeleton */}
      <div>
        <h3 className="font-medium mb-2">Supporting Quotes:</h3>
        <div className="space-y-2">
          <SkeletonLoader className="h-8" />
          <SkeletonLoader className="h-8" />
        </div>
      </div>

      {/* Evidence Skeleton */}
      <div>
        <h3 className="font-medium mb-2">Evidence:</h3>
        <div className="space-y-3">
          <div className="border p-3 rounded bg-gray-50">
            <SkeletonLoader className="h-6 w-3/4 mb-1" />
            <SkeletonLoader className="w-full mb-1" />
            <SkeletonLoader className="w-1/4" />
          </div>
          <div className="border p-3 rounded bg-gray-50">
            <SkeletonLoader className="h-6 w-3/4 mb-1" />
            <SkeletonLoader className="w-full mb-1" />
            <SkeletonLoader className="w-1/4" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DataView({ claim }: { claim: Claim }) {
  return (
    // Data Loaded State: Show Claim Details
    <>
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
            {/* TODO: Add button to play video at timestamp */}
            {claim.quotes.map((quote: Quote, index: number) => (
              <li
                key={index}
                className="text-sm text-gray-700 bg-gray-50 p-2 rounded"
              >
                "{quote.text}"
                <p className="text-xs text-gray-500 mt-1">{quote.timestamp}</p>
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
    </>
  );
}