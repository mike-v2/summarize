import type { Metadata } from "next";
import { AuthProvider } from "../components/authProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Summarize",
  description: "Content summarization app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
