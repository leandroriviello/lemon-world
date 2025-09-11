'use client';
import { useState } from 'react';
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js";
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import Toast from "@/components/lemon/Toast";
import { useToast } from "@/components/lemon/useToast";
import { LemonIcon } from './LemonIcon';

type ButtonState = "pagando" | "verificando" | "success" | undefined;

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
  const [showHelp, setShowHelp] = useState(false);
  const { toasts, showError, showSuccess, removeToast } = useToast();

  const onSubmit = async (): Promise<void> => {
    try {
      const addr = address.trim();
      const num = Number(amount);

      // Validación mínima de dirección EVM (0x + 40 hex)
      const isValidEvm = /^0x[a-fA-F0-9]{40}$/.test(addr);
      if (!isValidEvm || Number.isNaN(num) || num <= 0) {
        showError("Revisa la dirección de billetera y el monto");
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
        to: addr,
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

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      showError("No pudimos leer el portapapeles");
    }
  };

  const isReady = new RegExp('^0x[a-fA-F0-9]{40}$','i').test(address.trim()) && Number(amount) > 0;

  return (
    <div className="min-h-dvh w-full grid place-items-center px-4 relative overflow-hidden">
      {/* Fondo degradado sutil, estilo diagonal */}
      <div className="absolute inset-0 -z-20 bg-black" />
      <div className="absolute inset-0 -z-10 opacity-90 bg-hero" />
      <div className="w-full max-w-md mx-auto space-y-6 rounded-2xl border border-border card-elevated p-6">
        {/* Header con logo y título */}
        <div className="flex items-center gap-3">
          <LemonIcon className="w-8 h-8" />
          <h1 className="text-xl font-bold text-foreground">Enviar WLD a Lemon</h1>
        </div>

        {/* Formulario */}
        <div className="space-y-6">
        {/* Campo dirección de billetera */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-foreground">
              Dirección de billetera
            </label>
            <button
              type="button"
              onClick={() => setShowHelp(true)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-input text-xs text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
              aria-label="¿Cómo obtengo mi dirección?"
            >
              ?
            </button>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="0x..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              disabled={disabled}
              className="w-full h-12 pr-16 px-4 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <button
              type="button"
              onClick={pasteFromClipboard}
              disabled={disabled}
              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 text-sm rounded-md bg-secondary text-foreground hover:bg-secondary/80 border border-input"
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
            className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            className={`w-full font-semibold text-black transition-colors ${
              isReady && !disabled
                ? 'bg-yellow-400 hover:bg-yellow-300'
                : 'bg-emerald-400 hover:bg-emerald-300'
            }`}
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

      {/* Modal de ayuda */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="absolute inset-0" onClick={() => setShowHelp(false)} />
          <div className="relative w-full h-full p-4 sm:p-8">
            <div className="absolute right-4 top-4 z-10">
              <button
                type="button"
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 rounded-lg bg-[#00F068] text-black font-medium shadow hover:opacity-90"
              >
                Cerrar
              </button>
            </div>
            <div className="w-full h-full">
              <iframe
                title="Cómo obtener tu dirección de Lemon"
                className="w-full h-full rounded-xl border border-white/10 bg-black"
                src="https://www.youtube.com/embed/Fmywwu_YZfE?autoplay=1&modestbranding=1&rel=0&controls=0&fs=1"
                allow="autoplay; encrypted-media; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};