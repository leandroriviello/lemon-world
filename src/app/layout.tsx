"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ClientProviders from "@/providers";
import "./globals.css";

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_APP_ID;
    if (appId) {
      // En esta versión del SDK, install() recibe el APP_ID como string
      MiniKit.install(appId);
    }
  }, []);

  return (
    <html lang="es" className="dark">
      <body className="bg-background text-foreground min-h-dvh">
        <ClientProviders session={null}>
          <div className="min-h-dvh w-full flex items-center justify-center px-4 py-6">
            <div className="w-full max-w-md">{children}</div>
          </div>
        </ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}
