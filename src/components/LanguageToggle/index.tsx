"use client";

import { useLanguage, type Lang } from "@/providers/Language";

export const LanguageToggle = () => {
  const { lang, setLang } = useLanguage();
  const items: Lang[] = ["es","en","pt"];
  const label: Record<Lang, string> = { es: "ES", en: "EN", pt: "PT" };

  return (
    <div className="relative h-10 rounded-full border border-white/10 bg-white/5 backdrop-blur-md shadow-[0_6px_20px_rgba(0,0,0,0.25)] overflow-hidden">
      <div
        className={`absolute top-1 bottom-1 left-1 w-[calc(33.333%-0.5rem)] rounded-full transition-transform duration-300 ease-out ring-1 ring-black/5
          bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)] shadow-[0_8px_22px_rgba(255,209,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]`}
        style={{ transform: `translateX(${items.indexOf(lang) * 100}%)` }}
        aria-hidden
      />
      <div className="relative grid grid-cols-3 h-full text-xs font-semibold">
        {items.map((it) => (
          <button
            key={it}
            type="button"
            onClick={() => setLang(it)}
            className={`z-10 ${lang === it ? 'text-black' : 'text-white'}`}
          >
            {label[it]}
          </button>
        ))}
      </div>
    </div>
  );
};

export default LanguageToggle;

