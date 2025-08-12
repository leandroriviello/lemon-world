"use client"

import type React from "react"

import { useState } from "react"
import { User } from "lucide-react"

interface TagInputProps {
  value: string
  onChange: (value: string) => void
  isValid: boolean
}

export function TagInput({ value, onChange, isValid }: TagInputProps) {
  const [focused, setFocused] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value

    // Ensure it starts with @ if user types without it
    if (inputValue && !inputValue.startsWith("@")) {
      inputValue = "@" + inputValue
    }

    onChange(inputValue)
  }

  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-10">
        <User className="h-5 w-5 text-zinc-400" />
      </div>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder="@usuarioLemon"
        className={`w-full h-12 pl-12 pr-4 bg-black/40 border rounded-2xl text-white placeholder-zinc-400 transition-all duration-200 ${
          focused
            ? "border-[#00F068] ring-1 ring-[#00F068]"
            : isValid
              ? "border-white/15"
              : value
                ? "border-red-500/50"
                : "border-white/15"
        }`}
        maxLength={21} // @ + 20 characters
      />
    </div>
  )
}
export default TagInput;