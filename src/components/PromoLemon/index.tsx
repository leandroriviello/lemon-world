'use client';

import { useEffect, useMemo, useState } from 'react';

type Country = 'AR' | 'CO' | 'PE' | 'OTHER';

function detectCountry(): Country {
  try {
    const nav = typeof navigator !== 'undefined' ? navigator : undefined;
    // Check navigator.languages first for region codes
    const langs: string[] = (nav?.languages as unknown as string[]) || [];
    const all = [...langs, nav?.language || ''].filter(Boolean).map(s => String(s));
    const match = all.find((l) => /-(AR|CO|PE)/i.test(l));
    if (match) {
      const m = match.toUpperCase().match(/-(AR|CO|PE)/);
      if (m && (m[1] === 'AR' || m[1] === 'CO' || m[1] === 'PE')) return m[1] as Country;
    }
  } catch {}
  return 'OTHER';
}

export const PromoLemon = () => {
  const [open, setOpen] = useState(false);
  const [country, setCountry] = useState<Country>('OTHER');

  useEffect(() => {
    setCountry(detectCountry());
  }, []);

  const inviteCode = useMemo(() => {
    if (country === 'AR') return 'LEMON';
    if (country === 'CO') return 'LEMONCOLOMBIA';
    if (country === 'PE') return 'LEMONPERU';
    return '';
  }, [country]);

  if (country === 'OTHER') return null;

  return (
    <>
      {/* Floating button on the right */}
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 top-1/2 -translate-y-1/2 z-[999] rounded-full px-4 py-3 text-sm font-semibold shadow-lg
                   bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] text-black
                   ring-1 ring-black/5 hover:shadow-xl transition"
        aria-label="¿Aún no tienes Lemon?"
      >
        ¿Aún no tienes Lemon?
      </button>

      {open && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center">
          {/* backdrop */}
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          {/* modal */}
          <div className="relative z-[1001] w-[92%] max-w-md rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-xl p-6 text-white shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full bg-white/20 hover:bg-white/30 text-white px-3 py-1 text-sm"
              aria-label="Cerrar"
            >
              ✕ Cerrar
            </button>

            <div className="space-y-4">
              <h2 className="text-xl font-bold">¡Registrate ahora y gana 1 USD!</h2>
              <p className="text-sm text-white/80">
                Descarga la app, registrate y cuando te pregunte quien te invitó pon el siguiente código:
              </p>

              {/* Invite code button */}
              <div>
                <button
                  type="button"
                  className="w-full h-12 rounded-xl font-semibold text-black
                             bg-[linear-gradient(180deg,#FFFFFF_0%,#EDEDED_100%)] shadow-md"
                >
                  {inviteCode}
                </button>
              </div>

              <div className="pt-2">
                <p className="text-sm text-white/80 mb-2">Descarga la app ahora:</p>
                <a
                  href="https://lemon.go.link/jyKWs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center w-full h-12 rounded-full text-black font-semibold
                             bg-[linear-gradient(180deg,#5CFFAA_0%,#00F068_55%,#00D65C_100%)]
                             ring-1 ring-black/5 shadow-[0_10px_30px_rgba(0,240,104,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]
                             hover:shadow-[0_14px_34px_rgba(0,240,104,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] transition"
                >
                  Descargar
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PromoLemon;

