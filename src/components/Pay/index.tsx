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
  const [tag, setTag] = useState<string>("");
  const [btnState, setBtnState] = useState<ButtonState>(undefined);
  const { toasts, showError, showSuccess, removeToast } = useToast();

  const onSubmit = async (): Promise<void> => {
    try {
      const rawTag = tag.trim().replace(/^@/, "");
      const num = Number(amount);

      if (!rawTag || Number.isNaN(num) || num <= 0) {
        showError("Revisa el lemontag y el monto");
        return;
      }

      // 1) Resolver tag -> address
      setBtnState("resolviendo");
      const r1 = await fetch("/api/resolve-tag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: rawTag }),
      });

      if (!r1.ok) {
        showError("No encontramos ese lemontag");
        setBtnState(undefined);
        return;
      }
      const { address } = (await r1.json()) as { address: string };

      // 2) Iniciar pago -> id de referencia
      setBtnState("pagando");
      const r2 = await fetch("/api/initiate-payment", { method: "POST" });
      if (!r2.ok) {
        showError("Servicio no disponible (init)");
        setBtnState(undefined);
        return;
      }
      const { id } = (await r2.json()) as { id: string };

      // 3) Ejecutar pay (real en World App, mock en local/preview)
      const isMock = process.env.NEXT_PUBLIC_MOCK === "true";

      const payload = {
        reference: id,
        to: address,
        tokens: [
          {
            symbol: Tokens.WLD,
            token_amount: tokenToDecimals(num, Tokens.WLD).toString(),
          },
        ],
        description: `Envío WLD a @${rawTag}`,
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

      // 4) Confirmar
      setBtnState("verificando");
      const r3 = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalPayload }),
      });
      const conf = (await r3.json()) as { success?: boolean };

      if (conf?.success) {
        setBtnState("success");
        showSuccess(`¡Listo! Enviaste ${num} WLD a @${rawTag}`);
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
      case "resolviendo": return "Resolviendo...";
      case "pagando": return "Pagando...";
      case "verificando": return "Verificando...";
      case "success": return "¡Enviado!";
      default: return "Enviar WLD";
    }
  };

  const getButtonState = (): 'pending' | 'success' | 'failed' | undefined => {
    if (btnState === "success") return 'success';
    if (btnState === "resolviendo" || btnState === "pagando" || btnState === "verificando") return 'pending';
    return undefined;
  };

  const disabled = btnState === "resolviendo" || btnState === "pagando" || btnState === "verificando";

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Header con logo y título */}
      <div className="flex items-center gap-3">
        <LemonIcon className="w-8 h-8" />
        <h1 className="text-xl font-bold text-foreground">Enviar WLD a Lemon</h1>
      </div>

      {/* Formulario */}
      <div className="space-y-6">
        {/* Campo destinatario */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            $lemontag
          </label>
          <input
            type="text"
            placeholder="$usuariodelemon"
            value={tag}
            onChange={(e) => setTag(e.target.value)}
            disabled={disabled}
            className="w-full h-12 px-4 bg-background border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
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
    </div>
  );
};