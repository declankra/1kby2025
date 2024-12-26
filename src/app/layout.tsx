import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import "@/app/globals.css";
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "1000by2025 | dkBuilds 2025 Goal",
  description: "dkBuilds 2025 goal: Create $1000 in value by 2025",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans antialiased`} suppressHydrationWarning>
        <Providers>
          <Header />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}