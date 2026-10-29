import type { Metadata } from "next";
import {
  Caveat,
  Inter_Tight,
  JetBrains_Mono,
  Newsreader,
  Pinyon_Script,
} from "next/font/google";
import SmoothScroll from "@/components/SmoothScroll";
import "./globals.css";

const sans = Inter_Tight({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-sans",
});
const serif = Newsreader({ subsets: ["latin"], variable: "--font-serif" });
const script = Pinyon_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-script",
});
const hand = Caveat({ subsets: ["latin"], variable: "--font-hand" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: "Zero",
  // TODO: confirm final meta description copy
  description: "Learn. Build. Get hired.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${sans.variable} ${serif.variable} ${script.variable} ${hand.variable} ${mono.variable} font-sans antialiased`}
      >
        <SmoothScroll />
        {children}
      </body>
    </html>
  );
}
