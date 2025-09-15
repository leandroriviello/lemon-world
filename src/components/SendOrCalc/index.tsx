'use client';

import { useRef, useState } from 'react';
import { Pay } from '@/components/Pay';
import { Calc } from '@/components/Calc';

type View = 'send' | 'calc';

export const SendOrCalc = () => {
  const [view, setView] = useState<View>('send');
  const sx = useRef<number | null>(null);
  const sy = useRef<number | null>(null);

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    const t = e.touches[0];
    sx.current = t.clientX;
    sy.current = t.clientY;
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (sx.current == null || sy.current == null) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - sx.current;
    const dy = t.clientY - sy.current;
    sx.current = null;
    sy.current = null;
    if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) setView('calc');
    if (dx > 0) setView('send');
  };

  return (
    <div
      className="w-full space-y-6"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Liquid Glass segmented control */}
      <div className="relative w-full h-14 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden">
        {/* Sliding indicator */}
        <div
          className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full transition-transform duration-300 ease-out
                      ring-1 ring-black/5 shadow-[0_8px_22px_rgba(255,209,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]
                      ${view === 'send'
                        ? 'bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] translate-x-0'
                        : 'bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] translate-x-[calc(100%+0.25rem)]'
                      }`}
          aria-hidden
        />
        {/* Buttons */}
        <div className="relative grid grid-cols-2 h-full">
          <button
            type="button"
            onClick={() => setView('send')}
            className={`z-10 font-semibold text-sm transition-colors ${
              view === 'send' ? 'text-black' : 'text-white'
            }`}
          >
            ENVIAR
          </button>
          <button
            type="button"
            onClick={() => setView('calc')}
            className={`z-10 font-semibold text-sm transition-colors ${
              view === 'calc' ? 'text-black' : 'text-white'
            }`}
          >
            CALCULADORA
          </button>
        </div>
      </div>

      {view === 'send' ? <Pay /> : <Calc />}
    </div>
  );
};

export default SendOrCalc;
