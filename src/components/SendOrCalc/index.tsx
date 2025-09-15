'use client';

import { useState } from 'react';
import { Pay } from '@/components/Pay';
import { Calc } from '@/components/Calc';

type View = 'send' | 'calc';

export const SendOrCalc = () => {
  const [view, setView] = useState<View>('send');

  return (
    <div className="w-full space-y-6">
      {/* Toggle */}
      <div className="flex w-full gap-2">
        <button
          type="button"
          onClick={() => setView('send')}
          className={`w-1/2 h-12 rounded-full font-semibold ${
            view === 'send'
              ? 'bg-[#FFD100] text-black'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          ENVIAR
        </button>
        <button
          type="button"
          onClick={() => setView('calc')}
          className={`w-1/2 h-12 rounded-full font-semibold ${
            view === 'calc'
              ? 'bg-[#FFD100] text-black'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
          }`}
        >
          CALCULADORA
        </button>
      </div>

      {view === 'send' ? <Pay /> : <Calc />}
    </div>
  );
};

export default SendOrCalc;

