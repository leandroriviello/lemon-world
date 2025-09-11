"use client";

import { useState, useCallback } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showError = useCallback((message: string) => addToast({ message, type: "error" }), [addToast]);
  const showSuccess = useCallback((message: string) => addToast({ message, type: "success" }), [addToast]);
  const showInfo = useCallback((message: string) => addToast({ message, type: "info" }), [addToast]);

  const showTagNotFound = useCallback(() => showError("No encontramos ese lemontag"), [showError]);
  const showServiceUnavailable = useCallback(() => showError("Servicio no disponible"), [showError]);
  const showPaymentCancelled = useCallback(() => showError("Pago cancelado"), [showError]);
  const showGenericError = useCallback(() => showError("Algo salió mal"), [showError]);

  return {
    toasts,
    addToast,
    removeToast,
    showError,
    showSuccess,
    showInfo,
    showTagNotFound,
    showServiceUnavailable,
    showPaymentCancelled,
    showGenericError,
  };
}