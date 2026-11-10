import type { Metadata } from "next";
import { Public_Sans } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const publicSans = Public_Sans({ subsets: ["latin"], variable: "--font-public-sans", display: "swap" });

export const metadata: Metadata = {
  title: { default: "B4Gone", template: "%s · B4Gone" },
  description: "Track return deadlines, warranty expirations, and subscription renewals.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    // suppressHydrationWarning covers only this element's attributes, which browser extensions often change.
    <html lang="en" className={publicSans.variable} suppressHydrationWarning>
      <body className="min-h-screen font-sans leading-normal antialiased">
        <a
          href="#main"
          className="absolute -top-16 left-2 z-30 whitespace-nowrap rounded-control border-2 border-accent bg-surface px-3 py-2 font-semibold text-accent focus:top-2"
        >
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}
