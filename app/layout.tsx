import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigOnce — Chennai–Kancheepuram Civic Works Coordination Portal",
  description: "Map-centric civic coordination dashboard with deterministic repeat-dig conflict detection.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-civic-slate text-civic-navy antialiased">
        {children}
      </body>
    </html>
  );
}
