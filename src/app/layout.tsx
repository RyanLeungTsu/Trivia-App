import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// For tracking analytics with vercel
import { Analytics } from "@vercel/analytics/next"



const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Trivia Board App",
  description: "Create and play trivia boards with friends.",
  keywords: ["trivia", "quiz", "game board", "multiplayer trivia"],
  authors: [{ name: "Your Name" }],
  creator: "Your Name",

  openGraph: {
    title: "Trivia Board App",
    description: "Create and play trivia boards with friends.",
    url: "https://trivia-projects.vercel.app",
    siteName: "Trivia Board",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Trivia Board",
      },
    ],
    type: "website",
  },

  twitter: {
    card: "summary_large_image",
    title: "Trivia Board App",
    description: "Play trivia with friends.",
    images: ["/og-image.png"],
  },

  robots: {
    index: true,
    follow: true,
  },

  metadataBase: new URL("https://trivia-projects.vercel.app"),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <Analytics/>
      </body>
    </html>
  );
}
