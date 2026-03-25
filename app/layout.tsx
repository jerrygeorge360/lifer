import type { Metadata, Viewport } from "next";
import { Playfair_Display, DM_Mono } from "next/font/google";
import "./globals.css";
import { PWAInstallBanner } from "@/components/PWAInstallBanner";

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
  // Prevents phone numbers being auto-linked on iOS
  formatDetection: { telephone: false },
};

// Next.js 14+ requires viewport as a separate named export — not inside metadata
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  // viewportFit: cover makes the app fill behind the iPhone notch / Dynamic Island
  viewportFit: "cover",
  themeColor: "#080808",
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
        {/* iOS home screen icon — Safari doesn't read manifest icons */}
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <link rel="apple-touch-icon" sizes="512x512" href="/icon-512.png" />
      </head>
      <body className={dmMono.className}>
        {children}
        {/* Shows install prompt on Android/Desktop, iOS guide on Safari */}
        <PWAInstallBanner />
      </body>
    </html>
  );
}