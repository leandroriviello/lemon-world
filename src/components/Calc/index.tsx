'use client';

import { useEffect, useMemo, useState } from 'react';

type Vs = 'usdt' | 'ars' | 'cop';

type Prices = {
  usd?: number;
  usdt?: number;
  ars?: number;
  cop?: number;
};

export const Calc = () => {
  const [amountWLD, setAmountWLD] = useState<string>('');
  const [vs, setVs] = useState<Vs>('usdt');
  const [prices, setPrices] = useState<Prices | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const fetchPrices = async () => {
    try {
      setLoading(true);
      setError('');
      // Coingecko simple price
      const url = 'https://api.coingecko.com/api/v3/simple/price?ids=worldcoin-wld&vs_currencies=usd,usdt,ars,cop';
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error('No pudimos obtener precios');
      const json = await res.json();
      const p = json?.['worldcoin-wld'] || {};
      setPrices({
        usd: Number(p.usd) || undefined,
        usdt: Number(p.usdt) || Number(p.usd) || undefined, // fallback a USD
        ars: Number(p.ars) || undefined,
        cop: Number(p.cop) || undefined,
      });
    } catch (e) {
      console.error(e);
      setError('No pudimos cargar precios (Coingecko)');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
    const id = setInterval(fetchPrices, 60_000);
    return () => clearInterval(id);
  }, []);

  const parsedAmount = useMemo(() => Number(amountWLD) || 0, [amountWLD]);
  const converted = useMemo(() => {
    const rate = prices?.[vs];
    if (!rate) return '';
    const val = parsedAmount * rate;
    // Formato compacto sin notación científica
    return new Intl.NumberFormat('es-AR', { maximumFractionDigits: 2 }).format(val);
  }, [parsedAmount, prices, vs]);

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 justify-center">
        <h1 className="text-xl font-bold text-foreground">Calculadora</h1>
      </div>

      {/* Card - Liquid Glass */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_30px_rgba(0,0,0,0.45)]">
        {/* Input WLD */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Monto en WLD
          </label>
          <input
            type="number"
            inputMode="decimal"
            placeholder="Ej: 1.5"
            value={amountWLD}
            onChange={(e) => setAmountWLD(e.target.value)}
            min="0"
            step="0.0001"
            className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          />
        </div>

        {/* Output con selector de moneda */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Recibís aproximado
            </label>
            <div className="inline-flex rounded-full overflow-hidden border border-white/10 bg-white/5 backdrop-blur-sm p-0.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              {(['usdt','ars','cop'] as Vs[]).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setVs(k)}
                  className={`px-3 py-1.5 text-xs font-semibold transition-all rounded-full ${
                    vs === k
                      ? 'text-black bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] shadow-[0_8px_22px_rgba(255,209,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)] ring-1 ring-black/5'
                      : 'text-white/85 bg-white/0 hover:bg-white/10 active:scale-[0.98]'
                  }`}
                >
                  {k.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input
              type="text"
              value={converted}
              readOnly
              placeholder={loading ? 'Cargando precios…' : (error || '0')}
              className="w-full h-12 pr-24 pl-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
            />
            <span className="absolute inset-y-0 right-3 my-auto h-7 inline-flex items-center text-sm text-muted-foreground">
              {vs.toUpperCase()}
            </span>
          </div>
        </div>

        <p className="text-xs text-muted-foreground">*IMPORTANTE: Los valores son estimados.</p>

        {error && (
          <div className="text-sm text-red-400">{error}</div>
        )}
      </div>
    </div>
  );
};

export default Calc;
