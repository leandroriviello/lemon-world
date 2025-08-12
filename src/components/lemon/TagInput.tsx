"use client";

import type React from "react";
import { useMemo, useState } from "react";

// Regex: 3 a 20 caracteres, letras/números/._-
const LEMONTAG_RE = /^[a-zA-Z0-9_.-]{3,20}$/;

export interface TagInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * Opcional: si lo pasas, fuerza el estado de validez desde afuera.
   * Si no lo pasas, el componente valida internamente con LEMONTAG_RE.
   */
  isValid?: boolean;
}

export function TagInput({
  value,
  onChange,
  placeholder = "@usuarioLemon",
  isValid,
}: TagInputProps) {
  const [focused, setFocused] = useState(false);

  // Limpia el valor (quita @ inicial solo para validar)
  const clean = useMemo(() => value.replace(/^@/, ""), [value]);

  // Si no me pasan isValid, valido yo
  const localValid = useMemo(() => LEMONTAG_RE.test(clean), [clean]);
  const valid = isValid ?? (value.length === 0 ? true : localValid);

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        className={`w-full h-12 px-4 bg-black/40 border rounded-2xl text-white placeholder-zinc-400 transition-all duration-200 ${
          focused
            ? "border-[#00F068] ring-1 ring-[#00F068]"
            : valid
            ? "border-white/15"
            : "border-red-500/50"
        }`}
        inputMode="text"
        autoCapitalize="none"
        autoCorrect="off"
        spellCheck={false}
      />
      {!valid && value.length > 0 && (
        <p className="mt-2 text-sm text-red-400">
          Usa letras/números (3 a 20)
        </p>
      )}
    </div>
  );
}

export default TagInput;