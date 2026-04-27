import type { Metadata } from "next";
import "./globals.css";
import Script from 'next/script';

export const metadata: Metadata = {
  title: "Houston Climate Dashboard",
  description: "Real-time satellite tracking for Houston",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="/cesium/Cesium.js" strategy="beforeInteractive" />
      </head>
      <body>{children}</body>
    </html>
  );
}