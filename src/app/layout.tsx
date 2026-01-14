import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/layout/BottomNav";
import QueryProvider from "@/components/providers/QueryProvider";
import { InactivityHandler } from "@/components/auth/InactivityHandler";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "더더 간단한 가계부",
  description: "노션 스타일의 심플하고 빠른 PWA 가계부",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "더간가",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

import Script from "next/script";

export const dynamic = 'force-dynamic'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* [Expert Security] Instant PWA Kill Switch */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(regs => {
                  for(let reg of regs) reg.unregister().then(() => console.log('🛡️ Security: SW Unregistered Path: ' + reg.scope));
                });
              }
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-50 min-h-screen pb-20`}
      >
        <QueryProvider>
          <InactivityHandler />
          <main className="max-w-md mx-auto bg-white min-h-screen shadow-sm relative">
            {children}
          </main>
          <BottomNav />
        </QueryProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
