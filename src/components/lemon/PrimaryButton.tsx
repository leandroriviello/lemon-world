"use client"

import type React from "react"

import { Loader2 } from "lucide-react"

interface PrimaryButtonProps {
  children: React.ReactNode
  onClick?: () => void
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  type?: "button" | "submit"
}

export function PrimaryButton({
  children,
  onClick,
  loading = false,
  disabled = false,
  fullWidth = false,
  type = "button",
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`h-12 px-6 bg-[#00F068] text-black font-semibold rounded-2xl transition-all duration-200 hover:opacity-90 active:opacity-80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
        fullWidth ? "w-full" : ""
      }`}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  )
}
export default PrimaryButton;