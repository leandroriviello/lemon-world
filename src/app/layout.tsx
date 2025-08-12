"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { MiniKit } from "@worldcoin/minikit-js";

export default function RootLayout({ children }: { children: ReactNode }) {
  useEffect(() => {
    const appId = process.env.NEXT_PUBLIC_APP_ID;
    if (appId) {
      MiniKit.install({ app_id: appId });
    }
  }, []);

  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}