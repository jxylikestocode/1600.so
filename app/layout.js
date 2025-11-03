import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "katex/dist/katex.min.css";
import { UserDataProvider } from "@/contexts/user-data-context";
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AnalyticsInit } from "@/components/analytics-init";
import CommentFAB from "@/components/comment-fab";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "1600.so",
  description: "1600.so is a platform for SAT prep. ",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <Script
          src="https://www.desmos.com/api/v1.11/calculator.js?apiKey=d7e7dfac8a174cb69df6e65dd451d60d"
          strategy="beforeInteractive"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AnalyticsInit />
        <UserDataProvider>{children}</UserDataProvider>
        <CommentFAB />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
