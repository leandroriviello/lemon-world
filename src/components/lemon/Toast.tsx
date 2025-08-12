"use client";

import { useEffect } from "react";
import type { Toast as ToastType } from "./useToast";

type Props = {
  toasts: ToastType[];
  removeToast: (id: string) => void;
};

export default function Toast({ toasts, removeToast }: Props) {
  useEffect(() => {
    const timers = toasts.map(t =>
      setTimeout(() => removeToast(t.id), t.duration ?? 4000)
    );
    return () => { timers.forEach(clearTimeout); };
  }, [toasts, removeToast]);

  if (!toasts?.length) return null;

  return (
    <div className="fixed inset-x-0 bottom-4 mx-auto w-[92%] max-w-sm space-y-2">
      {toasts.map(t => (
        <div
          key={t.id}
          className="flex items-center justify-between gap-3 rounded-2xl px-4 py-3
                     text-sm text-black bg-white/90 shadow ring-1 ring-white/40 backdrop-blur"
        >
          <span
            className={
              t.type === "error" ? "text-red-600"
              : t.type === "success" ? "text-emerald-600"
              : "text-zinc-600"
            }
            aria-hidden
          >●</span>
          <span className="flex-1 text-center">{t.message}</span>
          <button
            onClick={() => removeToast(t.id)}
            aria-label="Cerrar"
            className="opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}