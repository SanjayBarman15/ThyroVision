import type React from "react";
import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "ThyroSight",
  description:
    "AI-assisted thyroid ultrasound analysis platform for clinical decision support",
  generator: "none",
};

export const viewport: Viewport = {
  themeColor: "#0f172a",
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          async
          crossOrigin="anonymous"
          src="https://tweakcn.com/live-preview.min.js"
        />
      </head>
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster richColors position="bottom-left" closeButton />
      </body>
    </html>
  );
}
