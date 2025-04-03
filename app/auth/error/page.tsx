"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export default function AuthError() {
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const errorType = searchParams.get("error");
    let errorMessage: string;

    switch (errorType) {
      case "Configuration":
        errorMessage = "There is a problem with the server configuration.";
        break;
      case "AccessDenied":
        errorMessage = "You do not have access to sign in.";
        break;
      case "Verification":
        errorMessage =
          "The verification link may have been used or is invalid.";
        break;
      case "OAuthSignin":
      case "OAuthCallback":
      case "OAuthCreateAccount":
      case "EmailCreateAccount":
      case "Callback":
      case "OAuthAccountNotLinked":
      case "EmailSignin":
      case "CredentialsSignin":
        errorMessage = "There was an error signing in with your credentials.";
        break;
      case "SessionRequired":
        errorMessage = "Please sign in to access this page.";
        break;
      default:
        errorMessage = "An unknown error occurred.";
    }

    setError(errorMessage);
  }, [searchParams]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 rounded-lg border p-6 shadow-md text-center">
        <h1 className="text-2xl font-bold text-red-600">
          Authentication Error
        </h1>
        <div className="py-4">
          <p className="text-gray-700">{error}</p>
        </div>
        <div>
          <Link
            href="/auth/signin"
            className="inline-block rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
