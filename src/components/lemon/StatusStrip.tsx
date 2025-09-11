"use client"

import { Loader2, CheckCircle, AlertCircle } from "lucide-react"

interface StatusStripProps {
  status: "idle" | "resolving" | "paying" | "verifying" | "success" | "error"
  message?: string
}

export function StatusStrip({ status, message }: StatusStripProps) {
  if (status === "idle") return null

  const getStatusConfig = () => {
    switch (status) {
      case "resolving":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: "Resolviendo...",
          className: "text-zinc-200",
        }
      case "paying":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: "Pagando...",
          className: "text-[#00F068]",
        }
      case "verifying":
        return {
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
          text: "Verificando...",
          className: "text-zinc-200",
        }
      case "success":
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: message || "Completado",
          className: "text-[#00F068]",
        }
      case "error":
        return {
          icon: <AlertCircle className="h-4 w-4" />,
          text: message || "Error",
          className: "text-red-400",
        }
      default:
        return null
    }
  }

  const config = getStatusConfig()
  if (!config) return null

  return (
    <div className={`flex items-center gap-2 text-sm ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </div>
  )
}
export default StatusStrip;