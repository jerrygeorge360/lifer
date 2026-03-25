import type { Metadata } from "next";
import { Playfair_Display, DM_Mono } from "next/font/google";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

// Typography: Playfair Display for headings (editorial, authoritative)
const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-playfair",
  display: "swap",
});

// Typography: DM Mono for body/UI (clinical, precise)
const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Lifer — Decentralized Safety Canary",
  description: "Proof-of-life system for journalists, activists, and whistleblowers.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Lifer",
  },
};

export const viewport = {
  themeColor: "#080808",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmMono.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body className={dmMono.className}>
        <PWARegister />
        {children}
      </body>
    </html>
  );
}