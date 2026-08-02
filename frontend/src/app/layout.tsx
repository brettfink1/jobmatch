import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "JobMatch — AI-Powered Job Search",
  description:
    "Upload your resume and let AI find the best matching jobs for you across LinkedIn, Indeed, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-900 text-slate-100">{children}</body>
    </html>
  );
}
