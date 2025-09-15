'use client';
import { useState } from 'react';
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js";
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import Toast from "@/components/lemon/Toast";
import { useToast } from "@/components/lemon/useToast";
import { LemonIcon } from './LemonIcon';

type ButtonState = "resolviendo" | "pagando" | "verificando" | "success" | undefined;

type PayFinalPayload = {
  status: "success" | "failed" | string;
  reference?: string;
  txHash?: string;
  chainId?: string;
};

type PayResult = {
  finalPayload: PayFinalPayload;
};

export const Pay = () => {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState<string>("");
  const [btnState, setBtnState] = useState<ButtonState>(undefined);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const { toasts, showError, showSuccess, removeToast } = useToast();

  const onSubmit = async (): Promise<void> => {
    try {
      const toAddress = address.trim();
      const num = Number(amount);
      
      const looksLikeEth = toAddress.startsWith("0x") && toAddress.length === 42;
      if (!looksLikeEth || Number.isNaN(num) || num <= 0) {
        showError("Revisa la dirección y el monto");
        return;
      }

      // 1) Iniciar pago -> id de referencia
      setBtnState("pagando");
      const r2 = await fetch("/api/initiate-payment", { method: "POST" });
      if (!r2.ok) {
        showError("Servicio no disponible (init)");
        setBtnState(undefined);
        return;
      }
      const { id } = (await r2.json()) as { id: string };

      // 2) Ejecutar pay (real en World App, mock en local/preview)
      const isMock = process.env.NEXT_PUBLIC_MOCK === "true";

      const payload = {
        reference: id,
        to: toAddress,
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(num, Tokens.WLD).toString(),
          },
        ],
        description: `Envío WLD`,
      };

      let result: PayResult;
      try {
        if (isMock) throw new Error("force-mock");
        result = (await MiniKit.commandsAsync.pay(payload)) as PayResult;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (isMock || msg.includes("unavailable") || msg.includes("not available")) {
          // Fallback local/preview
          result = {
            finalPayload: {
              status: "success",
              reference: id,
              txHash: "0xMOCK",
              chainId: "base-sepolia",
            },
          };
        } else {
          throw e;
        }
      }

      const { finalPayload } = result;

      // 3) Confirmar
      setBtnState("verificando");
      const r3 = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalPayload }),
      });
      const conf = (await r3.json()) as { success?: boolean };

      if (conf?.success) {
        setBtnState("success");
        showSuccess(`¡Listo! Enviaste ${num} WLD`);
      } else {
        showError("No pudimos confirmar la transacción");
        setBtnState(undefined);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("cancel")) {
        showError("Pago cancelado");
      } else {
        console.error(err);
        showError("Algo salió mal");
      }
      setBtnState(undefined);
    }
  };

  const getButtonText = () => {
    switch (btnState) {
      case "pagando": return "Pagando...";
      case "verificando": return "Verificando...";
      case "success": return "¡Enviado!";
      default: return "Enviar WLD";
    }
  };

  const getButtonState = (): 'pending' | 'success' | 'failed' | undefined => {
    if (btnState === "success") return 'success';
    if (btnState === "pagando" || btnState === "verificando") return 'pending';
    return undefined;
  };

  const disabled = btnState === "pagando" || btnState === "verificando";

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      showError("No pudimos leer el portapapeles");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header con logo y título */}
      <div className="flex items-center gap-3">
        <LemonIcon className="w-8 h-8" />
        <h1 className="text-xl font-bold text-foreground">Enviar WLD a Lemon</h1>
      </div>

      {/* Card contenedora */}
      <div className="rounded-2xl border border-border bg-card/90 backdrop-blur p-6 shadow-xl space-y-6">
        {/* Campo dirección de wallet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              Dirección de wallet
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="ml-2 text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                aria-label="Instructivo aquí"
              >
                (instructivo aquí)
              </button>
            </label>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={disabled}
              className="w-full h-12 pr-20 pl-4 bg-secondary border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={disabled}
              className="absolute inset-y-0 right-2 my-2 px-3 text-sm rounded-md bg-muted text-foreground hover:bg-muted/80 disabled:opacity-50"
            >
              Pegar
            </button>
          </div>
        </div>

        {/* Campo monto */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            Monto (WLD)
          </label>
          <input
            type="number"
            placeholder="Monto en WLD"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            disabled={disabled}
            min="0"
            step="0.01"
            className="w-full h-12 px-4 bg-secondary border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
        </div>

        {/* Información de balance */}
        <div className="text-sm text-muted-foreground">
          Disponible en tu wallet: —
        </div>

        {/* Botón de envío */}
        <LiveFeedback
          label={{
            pending: getButtonText(),
            success: "¡Enviado!",
            failed: "Error en el envío",
          }}
          state={getButtonState()}
        >
          <Button
            onClick={onSubmit}
            disabled={disabled}
            size="lg"
            variant="primary"
            className="w-full"
          >
            {getButtonText()}
          </Button>
        </LiveFeedback>

        {/* Mensaje de confirmación */}
        <p className="text-center text-sm text-muted-foreground">
          El envío se confirma dentro de World App
        </p>
      </div>

      {/* Toast de estado */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Modal de ayuda (fullscreen limpio) */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 bg-black/90">
          <button
            onClick={() => setIsHelpOpen(false)}
            aria-label="Cerrar"
            className="absolute top-4 right-4 z-50 rounded-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-base md:text-lg"
          >
            ✕ Cerrar
          </button>
          <iframe
            src="https://www.youtube.com/embed/Fmywwu_YZfE?autoplay=1&mute=0&playsinline=1&modestbranding=1&rel=0&fs=1"
            title="¿Qué es la dirección de wallet?"
            className="w-full h-full"
            allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      )}
    </div>
  );
};
