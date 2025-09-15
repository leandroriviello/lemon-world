'use client';
import { useState } from 'react';
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js";
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { isAddress } from 'viem';
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
  const { isInstalled } = useMiniKit();
  const [addressError, setAddressError] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");

  const validateAddress = (value: string) => {
    const v = value.trim();
    if (!v) return "Ingresá una dirección";
    if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return "Formato inválido";
    const body = v.slice(2);
    const hasLower = /[a-f]/.test(body);
    const hasUpper = /[A-F]/.test(body);
    if (hasLower && hasUpper) {
      // Si es mixto, exigimos checksum EIP-55
      if (!isAddress(v, { strict: true })) return "Checksum inválido";
    }
    return "";
  };

  const validateAmount = (value: string) => {
    if (!value) return "Ingresá un monto";
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0) return "Monto inválido";
    return "";
  };

  const onSubmit = async (): Promise<void> => {
    try {
      const toAddress = address.trim();
      const num = Number(amount);

      const addrErr = validateAddress(toAddress);
      const amtErr = validateAmount(amount);
      setAddressError(addrErr);
      setAmountError(amtErr);
      if (addrErr || amtErr) return;

      // 0) Verificar MiniKit instalado
      if (!isInstalled) {
        showError("Abrí esta mini app dentro de World App");
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
        if (isMock || /unavailable|not available|install/i.test(msg)) {
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

  const disabled = btnState === "pagando" || btnState === "verificando";

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      showError("No pudimos leer el portapapeles");
    }
  };

  const isPending = btnState === "pagando" || btnState === "verificando";
  const addressValid = validateAddress(address.trim()) === "";
  const amountValid = validateAmount(amount) === "";
  const canShowButton = addressValid && amountValid && isInstalled;

  const getHint = () => {
    if (!isInstalled) return "Abrí esta mini app desde World App para enviar WLD.";
    const trimmed = address.trim();
    if (!trimmed) return "Pegá la dirección de wallet (0x...)";
    if (!addressValid) return validateAddress(trimmed);
    if (!amount) return "Ingresá el monto en WLD";
    if (!amountValid) return validateAmount(amount);
    return "";
  };

  return (
    <div className="w-full space-y-6">
      {/* Header con logo y título */}
      <div className="flex items-center gap-3 justify-center">
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
              onChange={(e) => {
                setAddress(e.target.value);
                if (addressError) setAddressError("");
              }}
              disabled={disabled}
              className="w-full h-12 pr-20 pl-4 bg-black/30 border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            />
            <button
              type="button"
              onClick={handlePaste}
              disabled={disabled}
              className="absolute inset-y-0 right-2 my-2 px-3 text-sm rounded-md bg-zinc-800 text-white hover:bg-zinc-700 disabled:opacity-50"
            >
              Pegar
            </button>
          </div>
          {addressError && (
            <p className="text-sm text-red-400" aria-live="polite">{addressError}</p>
          )}
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
            onChange={(e) => {
              setAmount(e.target.value);
              if (amountError) setAmountError("");
            }}
            disabled={disabled}
            min="0"
            step="0.01"
            className="w-full h-12 px-4 bg-black/30 border border-input rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          />
          {amountError && (
            <p className="text-sm text-red-400" aria-live="polite">{amountError}</p>
          )}
        </div>

        {/* Información de balance */}
        <div className="text-sm text-muted-foreground">
          Disponible en tu wallet: —
        </div>
        {/* Área del botón / hint para evitar saltos de layout */}
        {!canShowButton && (
          <div
            className="w-full h-14 rounded-full bg-zinc-800/50 text-zinc-400 text-base font-medium flex items-center justify-center"
            aria-live="polite"
          >
            {getHint()}
          </div>
        )}

        {/* Botón de envío */}
        {canShowButton && (
          <Button
            onClick={onSubmit}
            disabled={disabled}
            size="lg"
            variant="primary"
            className="w-full h-14 rounded-full bg-[#FFD100] text-black hover:bg-[#ffcc00] active:bg-[#e6b800] disabled:opacity-60 disabled:cursor-not-allowed text-base font-semibold flex items-center justify-center gap-2"
          >
            {isPending && (
              <span className="inline-block h-5 w-5 rounded-full border-2 border-black/40 border-t-black animate-spin" aria-hidden />
            )}
            <span>{getButtonText()}</span>
          </Button>
        )}

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
