"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { SpeedInsights } from "@vercel/speed-insights/next";
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
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}