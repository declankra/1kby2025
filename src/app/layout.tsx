import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "../styles/globals.css";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { OpenPanelProvider } from "@/lib/analytics/openpanel/OpenPanelProvider";
import { GoogleAnalyticsProvider } from "@/lib/analytics/google/GoogleAnalyticsProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "1000by2025 | dkBuilds 2025 Goal",
  description: "dkBuilds 2025 goal: Generate $1000 in value by 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning
      >
        <GoogleAnalyticsProvider />
        <OpenPanelProvider />
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
