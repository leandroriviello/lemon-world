"use client"

import type React from "react"

import { useState } from "react"

interface AmountInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
}

export function AmountInput({ value, onChange, error }: AmountInputProps) {
  const [focused, setFocused] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value

    // Allow empty string
    if (inputValue === "") {
      onChange("")
      return
    }

    // Only allow numbers and one decimal point
    const regex = /^\d*\.?\d{0,6}$/
    if (regex.test(inputValue)) {
      onChange(inputValue)
    }
  }

  return (
    <div className="relative">
      <input
        type="text"
        inputMode="decimal"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="Monto en WLD"
        className={`w-full h-12 px-4 bg-black/40 border rounded-2xl text-white placeholder-zinc-400 transition-all duration-200 ${
          focused ? "border-[#00F068] ring-1 ring-[#00F068]" : error ? "border-red-500/50" : "border-white/15"
        }`}
      />
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  )
}
export default AmountInput;