'use client';
import { useState } from 'react';
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js";
import Toast from "@/components/lemon/Toast";
import { useToast } from "@/components/lemon/useToast";

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

  const disabled =
    btnState === "resolviendo" || btnState === "pagando" || btnState === "verificando";

  return (
    <div className="min-h-screen w-full bg-gradient-dark flex items-center justify-center p-4">
      {/* Contenedor principal con efecto glassmorphism */}
      <div className="w-full max-w-md mx-auto">
        {/* Header con logo y título */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-[#00F068] rounded-full flex items-center justify-center shadow-glow">
            <div className="w-4 h-4 bg-black rounded-full"></div>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">Enviar WLD a Lemon</h1>
        </div>

        {/* Formulario con efecto glassmorphism */}
        <div className="glassmorphism rounded-[20px] p-6 shadow-2xl transition-smooth">
          {/* Campo destinatario */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3 font-sans">
              $lemontag
            </label>
            <input
              type="text"
              placeholder="@usuarioLemon"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              className="glassmorphism-input w-full p-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00F068] focus:ring-2 focus:ring-[#00F068] focus:ring-opacity-20 transition-smooth"
            />
          </div>

          {/* Campo monto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3 font-sans">
              Monto (WLD)
            </label>
            <input
              type="text"
              placeholder="Monto en WLD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glassmorphism-input w-full p-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00F068] focus:ring-2 focus:ring-[#00F068] focus:ring-opacity-20 transition-smooth"
            />
          </div>

          {/* Información de balance */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm font-sans">
              Disponible en tu wallet: —
            </p>
          </div>

          {/* Botón de envío */}
          <button
            onClick={onSubmit}
            disabled={disabled}
            className="w-full py-4 bg-gradient-to-r from-[#00F068] to-[#00A849] rounded-2xl text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#00A849] hover:to-[#00F068] transition-smooth transform hover:scale-[1.02] active:scale-[0.98] shadow-glow shadow-glow-hover"
          >
            {btnState === "resolviendo" ? "Resolviendo..." : 
             btnState === "pagando" ? "Pagando..." : 
             btnState === "verificando" ? "Verificando..." : 
             btnState === "success" ? "¡Enviado!" : 
             "Enviar WLD"}
          </button>

          {/* Mensaje de confirmación */}
          <p className="text-center text-gray-300 text-sm mt-4 font-sans">
            El envío se confirma dentro de World App
          </p>
        </div>
      </div>

      {/* Toast de estado */}
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
};