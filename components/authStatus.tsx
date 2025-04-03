"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";

export default function AuthStatus() {
  const { data: session, status } = useSession();
  const isLoading = status === "loading";

  if (isLoading) {
    return <div className="text-sm">Loading...</div>;
  }

  if (session) {
    return (
      <div className="flex items-center gap-3">
        {session.user?.image && (
          <img
            src={session.user.image}
            alt={session.user.name || "User"}
            className="h-8 w-8 rounded-full"
          />
        )}
        <div className="text-sm">
          <p className="font-medium">
            {session.user?.name || session.user?.email}
          </p>
          <button
            onClick={() => signOut()}
            className="text-xs text-gray-500 hover:underline"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => signIn()}
        className="text-sm font-medium hover:underline"
      >
        Sign in
      </button>
    </div>
  );
}
