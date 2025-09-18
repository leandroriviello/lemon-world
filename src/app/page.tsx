"use client";

import { useSession } from 'next-auth/react';
import { SendOrCalc } from "@/components/SendOrCalc";
import { Auth } from "@/components/Auth";

export default function Page() {
  const { data: session, status } = useSession();

  if (status === 'loading') {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 rounded-full border-2 border-white/40 border-t-white animate-spin mb-4" />
            <p className="text-white/60">Cargando...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  return <SendOrCalc />;
}
