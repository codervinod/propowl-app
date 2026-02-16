import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PropOwl - Smart Rental Property Accounting",
  description: "AI-powered rental property accounting that eliminates manual data entry and generates tax-ready Schedule E reports.",
  keywords: [
    "rental property accounting",
    "Schedule E",
    "tax reporting",
    "property management",
    "real estate",
    "tax forms",
    "rental income",
    "property expenses"
  ],
  authors: [{ name: "PropOwl" }],
  creator: "PropOwl",
  publisher: "PropOwl",
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
    ],
    shortcut: '/favicon.ico',
    apple: [
      { url: '/apple-icon.svg', sizes: '180x180', type: 'image/svg+xml' },
    ],
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://propowl.ai',
    title: 'PropOwl - Smart Rental Property Accounting',
    description: 'AI-powered rental property accounting that eliminates manual data entry and generates tax-ready Schedule E reports.',
    siteName: 'PropOwl',
    images: [
      {
        url: '/opengraph-image',
        width: 1200,
        height: 630,
        alt: 'PropOwl - Smart Rental Property Accounting',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PropOwl - Smart Rental Property Accounting',
    description: 'AI-powered rental property accounting that eliminates manual data entry and generates tax-ready Schedule E reports.',
    images: ['/opengraph-image'],
    creator: '@propowl',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
