'use client';

import { useRef, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { Pay } from '@/components/Pay';
import { Calc } from '@/components/Calc';

type View = 'send' | 'calc';

export const SendOrCalc = () => {
  const [view, setView] = useState<View>('send');
  const sx = useRef<number | null>(null);
  const sy = useRef<number | null>(null);

  const triggerHaptic = () => {
    try {
      type NavigatorWithVibrate = Navigator & { vibrate?: (pattern: number | number[]) => boolean };
      const w = (typeof window !== 'undefined' ? window : undefined) as (Window & { navigator: NavigatorWithVibrate }) | undefined;
      if (w?.navigator?.vibrate) {
        w.navigator.vibrate(15);
        return;
      }
      type MKAsync = { commandsAsync?: { haptics?: (opts: { intensity: 'light' | 'medium' | 'heavy' }) => Promise<void>; vibrate?: (opts: { duration: number }) => Promise<void> } };
      const mk = (MiniKit as unknown) as MKAsync;
      mk.commandsAsync?.haptics?.({ intensity: 'light' }).catch(() => {});
      mk.commandsAsync?.vibrate?.({ duration: 10 }).catch(() => {});
    } catch {}
  };

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
    if (dx < 0) {
      setView('calc');
      triggerHaptic();
    }
    if (dx > 0) {
      setView('send');
      triggerHaptic();
    }
  };

  return (
    <div
      className="w-full space-y-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Sticky segmented control */}
      <div className="sticky z-20" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        <div className="relative w-full h-14 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden">
          {/* Sliding indicator */}
          <div
            key={view}
            className={`absolute top-1 bottom-1 left-1 w-[calc(50%-0.25rem)] rounded-full transition-transform duration-300 ease-out
                      ring-1 ring-black/5 shadow-[0_8px_22px_rgba(255,209,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]
                       ${view === 'send'
                         ? 'bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] translate-x-0'
                         : 'bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] translate-x-[calc(100%+0.25rem)]'
                       } glow-pop`}
            aria-hidden
          />
          {/* Buttons */}
          <div className="relative grid grid-cols-2 h-full">
            <button
              type="button"
            onClick={() => { setView('send'); triggerHaptic(); }}
              className={`z-10 font-semibold text-sm transition-colors ${
                view === 'send' ? 'text-black' : 'text-white'
              }`}
            >
              ENVIAR
            </button>
            <button
              type="button"
            onClick={() => { setView('calc'); triggerHaptic(); }}
              className={`z-10 font-semibold text-sm transition-colors ${
                view === 'calc' ? 'text-black' : 'text-white'
              }`}
            >
              CALCULADORA
            </button>
          </div>
        </div>
      </div>

      {/* Title area with fixed height and crossfade */}
      <div className="h-10 flex items-center justify-center overflow-hidden">
        <h1 key={view} className="fade-in-up text-xl font-bold text-foreground">
          {view === 'send' ? 'Enviar WLD a Lemon' : 'Calculadora'}
        </h1>
      </div>

      {view === 'send' ? <Pay hideHeader /> : <Calc hideHeader />}
    </div>
  );
};

export default SendOrCalc;
