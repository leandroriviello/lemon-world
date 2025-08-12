"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
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
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}