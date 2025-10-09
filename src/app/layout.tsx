"use client";

import { useEffect } from "react";
import type { ReactNode } from "react";
import { MiniKit } from "@worldcoin/minikit-js";
import { SpeedInsights } from "@vercel/speed-insights/next";
import ClientProviders from "@/providers";
import { LanguageProvider, useLanguage } from "@/providers/Language";
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
          <LanguageProvider>
            <div className="min-h-dvh w-full flex flex-col items-center justify-start px-4 py-6">
              <div className="w-full max-w-md">
                {children}
                <FooterDisclaimer />
              </div>
            </div>
          </LanguageProvider>
        </ClientProviders>
        <SpeedInsights />
      </body>
    </html>
  );
}

function FooterDisclaimer() {
  const { t } = useLanguage();
  return (
    <div className="w-full text-center text-[11px] text-white/40 mt-6 pb-3">
      {t('footer')}
    </div>
  );
}
