import type { Metadata } from "next";
import { IBM_Plex_Mono, Instrument_Serif, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const plusJakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const instrument = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: "italic",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "VersedAI — Learn to use AI",
  description:
    "An AI-native lab for high-school students. Real prompts, real images, real agents — coached every step.",
  openGraph: {
    title: "VersedAI — Learn to use AI",
    description:
      "From I've heard of AI to give me a problem and I'll solve it with AI.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${plusJakarta.variable} ${instrument.variable} ${plexMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
