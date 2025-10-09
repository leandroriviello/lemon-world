'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLanguage } from '@/providers/Language';

type Vs = 'usdt' | 'ars' | 'cop' | 'pen' | 'rea';

type Prices = {
  usd?: number;
  usdt?: number;
  ars?: number;
  cop?: number;
  pen?: number;
  rea?: number; // BRL
};

export const Calc = ({ hideHeader }: { hideHeader?: boolean }) => {
  const [amountWLD, setAmountWLD] = useState<string>('');
  const [vs, setVs] = useState<Vs>('usdt');
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const { t } = useLanguage();
  const [vsMenuOpen, setVsMenuOpen] = useState(false);
  const vsRef = useRef<HTMLDivElement | null>(null);

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError('');
      // Coingecko simple price
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=worldcoin-wld&vs_currencies=usd,usdt,ars,cop,pen,brl';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('prices');
      const json = await res.json();
      const p = json?.['worldcoin-wld'] || {};
      setPrices({
        usd: Number(p.usd) || undefined,
        usdt: Number(p.usdt) || Number(p.usd) || undefined, // fallback a USD
        ars: Number(p.ars) || undefined,
        cop: Number(p.cop) || undefined,
        pen: Number(p.pen) || undefined,
        rea: Number(p.brl) || undefined,
      });
    } catch (e) {
      console.error(e);
      setError('coingecko');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 60_000);
    return () => clearInterval(id);
  }, []);

  // Close currency menu on outside click or ESC
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!vsRef.current) return;
      if (!vsRef.current.contains(e.target as Node)) setVsMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setVsMenuOpen(false); };
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, []);

  const parsedAmount = useMemo(() => Number(amountWLD) || 0, [amountWLD]);
  const labelFor = (k: Vs) => (
    k === 'pen' ? 'S/' :
    k === 'rea' ? 'R$' :
    k === 'usdt' ? 'USDT' :
    k === 'ars' ? '$ ARS' :
    k === 'cop' ? '$ COP' :
    k.toUpperCase()
  );
  const converted = useMemo(() => {
    const rate = prices?.[vs];
    if (!rate) return '';
    const val = parsedAmount * rate * 0.95; // -5% aprox comisiones
    // Fracción por moneda
    const digits = (
      vs === 'pen' ? { minimumFractionDigits: 1, maximumFractionDigits: 1 }
      : vs === 'rea' ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    );
    const sym = (
      vs === 'pen' ? 'S/' :
      vs === 'rea' ? 'R$' :
      '$'
    );
    const num = new Intl.NumberFormat('es-AR', digits).format(val);
    return `${sym} ${num}`;
  }, [parsedAmount, prices, vs]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center gap-3 justify-center">
          <h1 className="text-xl font-bold text-foreground">{t('titleCalc')}</h1>
        </div>
      )}

      {/* Card - Liquid Glass */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_30px_rgba(0,0,0,0.45)]">
        {/* Input WLD */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">{t('calcAmount')}</label>
          <input
            type="text"
            inputMode="decimal"
            placeholder="1.5"
            value={amountWLD}
            onChange={(e) => {
              let v = e.target.value || '';
              v = v.replace(/,/g, '.');
              v = v.replace(/[^0-9.]/g, '');
              const first = v.indexOf('.');
              if (first !== -1) {
                const intPart = v.slice(0, first);
                let fracPart = v.slice(first + 1).replace(/\./g, '');
                if (fracPart.length > 6) fracPart = fracPart.slice(0, 6);
                v = `${intPart}.${fracPart}`;
              }
              if (v.startsWith('.')) v = '0' + v;
              setAmountWLD(v);
            }}
            className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          />
        </div>

        {/* Output con selector de moneda (dropdown) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">{t('calcReceive')}</label>
            <div />
          </div>

          <div ref={vsRef} className="relative">
            <input
              type="text"
              value={converted}
              readOnly
              placeholder={loading ? '...' : (error ? '—' : '0')}
              className="w-full h-12 pr-24 pl-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            />
            <button
              type="button"
              onClick={() => setVsMenuOpen((v) => !v)}
              className="absolute inset-y-0 right-2 my-auto h-9 inline-flex items-center gap-2 px-3 rounded-xl text-xs font-semibold
                         bg-white/10 border border-white/10 backdrop-blur-sm text-white hover:bg-white/15"
              aria-haspopup="listbox"
              aria-expanded={vsMenuOpen}
            >
              <span>{labelFor(vs)}</span>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
                <path d="M7 10l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {vsMenuOpen && (
              <div
                role="listbox"
                className="absolute right-2 top-full mt-2 min-w-28 rounded-xl border border-white/10 bg-white/10 backdrop-blur-md p-1 z-50
                           shadow-[0_8px_30px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.08)]"
              >
                {(['usdt','ars','cop','pen','rea'] as Vs[]).map((k) => (
                  <button
                    key={k}
                    role="option"
                    aria-selected={vs === k}
                    onClick={() => { setVs(k); setVsMenuOpen(false); }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${
                      vs === k
                        ? 'text-black bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)]'
                        : 'text-white/90 hover:bg-white/10'
                    }`}
                  >
                    {labelFor(k)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t('calcImportant')}</p>

        {error && (
          <div className="text-sm text-red-400">{error === 'coingecko' ? 'Coingecko error' : error}</div>
        )}
      </div>
    </div>
  );
};

export default Calc;
