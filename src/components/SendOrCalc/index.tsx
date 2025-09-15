'use client';

import { useEffect, useRef, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { Pay } from '@/components/Pay';
import { Calc } from '@/components/Calc';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/providers/Language';

type View = 'send' | 'calc';

export const SendOrCalc = () => {
  const [view, setView] = useState<View>('send');
  const sx = useRef<number | null>(null);
  const sy = useRef<number | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const sendRef = useRef<HTMLDivElement | null>(null);
  const calcRef = useRef<HTMLDivElement | null>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(undefined);
  const { t } = useLanguage();

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

  // Measure active panel height to avoid vertical jumps
  const measure = () => {
    const el = (view === 'send' ? sendRef.current : calcRef.current);
    if (el) setContainerHeight(el.offsetHeight);
  };
  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    // wait next paint for smoother height transition
    const id = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view]);

  return (
    <div
      className="w-full space-y-4"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Sticky segmented control */}
      <div className="sticky z-20" style={{ top: 'calc(env(safe-area-inset-top, 0px) + 8px)' }}>
        {/* Language toggle on top-right */}
        <div className="w-full flex justify-end mb-4">
          <div className="w-[132px]"><LanguageToggle /></div>
        </div>
        {/* Big segmented control full width below */}
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
                {t('send')}
              </button>
              <button
                type="button"
                onClick={() => { setView('calc'); triggerHaptic(); }}
                className={`z-10 font-semibold text-sm transition-colors ${
                  view === 'calc' ? 'text-black' : 'text-white'
                }`}
              >
                {t('calculator')}
              </button>
            </div>
        </div>
      </div>

      {/* Title area with fixed height and crossfade */}
      <div className="h-10 flex items-center justify-center overflow-hidden">
        <h1 key={view} className="fade-in-up text-xl font-bold text-foreground">
          {view === 'send' ? t('titleSend') : t('titleCalc')}
        </h1>
      </div>

      <div
        ref={outerRef}
        className="relative overflow-hidden"
        style={{ height: containerHeight ? `${containerHeight}px` : undefined, transition: 'height 250ms ease' }}
      >
        <div
          className="flex w-[200%] transition-transform duration-300 ease-out will-change-transform"
          style={{ transform: view === 'send' ? 'translateX(0%)' : 'translateX(-50%)' }}
        >
          <div ref={sendRef} className="w-1/2 px-0">
            <Pay hideHeader />
          </div>
          <div ref={calcRef} className="w-1/2 px-0">
            <Calc hideHeader />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendOrCalc;
