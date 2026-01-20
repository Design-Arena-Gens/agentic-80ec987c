import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Terminal Orchestrator",
  description: "Autonomous CLI agent for translating natural language to shell commands",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-mono antialiased bg-terminal-bg text-terminal-text">
        {children}
      </body>
    </html>
  );
}
