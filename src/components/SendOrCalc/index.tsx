'use client';

import { useEffect, useRef, useState } from 'react';
import { MiniKit } from '@worldcoin/minikit-js';
import { Pay } from '@/components/Pay';
import { Calc } from '@/components/Calc';
import { History } from '@/components/History';
import { LanguageToggle } from '@/components/LanguageToggle';
import { useLanguage } from '@/providers/Language';

type View = 'send' | 'calc' | 'history';

export const SendOrCalc = () => {
  const [view, setView] = useState<View>('send');
  const sx = useRef<number | null>(null);
  const sy = useRef<number | null>(null);
  const outerRef = useRef<HTMLDivElement | null>(null);
  const sendRef = useRef<HTMLDivElement | null>(null);
  const calcRef = useRef<HTMLDivElement | null>(null);
  const historyRef = useRef<HTMLDivElement | null>(null);
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
      // Swipe left - go to next view
      if (view === 'send') {
        setView('calc');
        triggerHaptic();
      } else if (view === 'calc') {
        setView('history');
        triggerHaptic();
      }
    }
    if (dx > 0) {
      // Swipe right - go to previous view
      if (view === 'history') {
        setView('calc');
        triggerHaptic();
      } else if (view === 'calc') {
        setView('send');
        triggerHaptic();
      }
    }
  };

  // Measure active panel height to avoid vertical jumps
  const measure = () => {
    const el = view === 'send' ? sendRef.current : view === 'calc' ? calcRef.current : historyRef.current;
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

  // React to content growth/shrink (e.g., history list after fetch)
  useEffect(() => {
    const el = view === 'send' ? sendRef.current : view === 'calc' ? calcRef.current : historyRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setContainerHeight(cr.height);
    });
    ro.observe(el);
    return () => ro.disconnect();
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
        <div className="w-full flex justify-end mb-10">
          <div className="w-[198px]"><LanguageToggle /></div>
        </div>
        {/* Big segmented control full width below */}
        <div className="relative w-full h-14 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_8px_30px_rgba(0,0,0,0.3)] overflow-hidden">
            {/* Sliding indicator */}
            <div
              key={view}
              className={`absolute top-1 bottom-1 left-1 w-[calc(33.333%-0.25rem)] rounded-full transition-transform duration-300 ease-out
                        ring-1 ring-black/5 shadow-[0_8px_22px_rgba(255,209,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]
                          ${view === 'send'
                            ? 'bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] translate-x-0'
                            : view === 'calc'
                            ? 'bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] translate-x-[calc(100%+0.25rem)]'
                            : 'bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] translate-x-[calc(200%+0.5rem)]'
                          } glow-pop`}
              aria-hidden
            />
            {/* Buttons */}
            <div className="relative grid grid-cols-3 h-full">
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
              <button
                type="button"
                onClick={() => { setView('history'); triggerHaptic(); }}
                className={`z-10 font-semibold text-sm transition-colors ${
                  view === 'history' ? 'text-black' : 'text-white'
                }`}
              >
                {t('history')}
              </button>
            </div>
        </div>
      </div>

      {/* Title area with fixed height and crossfade */}
      <div className="h-10 flex items-center justify-center overflow-hidden">
        <h1 key={view} className="fade-in-up text-xl font-bold text-foreground">
          {view === 'send' ? t('titleSend') : view === 'calc' ? t('titleCalc') : t('titleHistory')}
        </h1>
      </div>

      <div
        ref={outerRef}
        className="relative overflow-hidden"
        style={{ height: containerHeight ? `${containerHeight}px` : undefined, transition: 'height 250ms ease' }}
      >
        <div
          className="flex w-[300%] transition-transform duration-300 ease-out will-change-transform"
          style={{ 
            transform: view === 'send' 
              ? 'translateX(0%)' 
              : view === 'calc' 
              ? 'translateX(-33.333%)' 
              : 'translateX(-66.666%)' 
          }}
        >
          <div ref={sendRef} className="w-1/3 px-0">
            <Pay hideHeader />
          </div>
          <div ref={calcRef} className="w-1/3 px-0">
            <Calc hideHeader />
          </div>
          <div ref={historyRef} className="w-1/3 px-0">
            <History hideHeader />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendOrCalc;
