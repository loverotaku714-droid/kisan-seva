import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kisan Seva — Voice-Based Farmer Assistant",
  description:
    "A speech-first AI assistant for farmers: ask questions out loud about crop diseases, weather and market prices, and hear the answer spoken back in your language. Built with NLP, Speech Processing and AI.",
  keywords: [
    "voice assistant",
    "farmer",
    "agriculture",
    "crop disease",
    "weather",
    "market price",
    "NLP",
    "speech-to-text",
    "text-to-speech",
    "AI",
  ],
  authors: [{ name: "Kisan Seva Project" }],
  icons: {
    icon: "https://z-cdn.chatglm.cn/z-ai/static/logo.svg",
  },
  openGraph: {
    title: "Kisan Seva — Voice-Based Farmer Assistant",
    description:
      "Speak your farming question, hear expert advice — crop disease, weather and prices in your language.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1a5c38",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
