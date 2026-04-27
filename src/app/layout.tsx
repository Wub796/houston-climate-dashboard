import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Houston Climate Dashboard",
  description: "Real-time satellite tracking for Houston",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}