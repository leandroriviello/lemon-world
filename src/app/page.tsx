"use client";

import { useState } from "react";
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js";

// 🔹 Componentes generados por v0 (si tu alias @ no funciona, cambia a import relativo ../components/lemon/...)
import TagInput from "@/components/lemon/TagInput";
import AmountInput from "@/components/lemon/AmountInput";
import PrimaryButton from "@/components/lemon/PrimaryButton";
import StatusStrip from "@/components/lemon/StatusStrip";

import Toast from "@/components/lemon/Toast";
import { useToast } from "@/components/lemon/useToast";

type ButtonState = "resolviendo" | "pagando" | "verificando" | "success" | undefined;

export default function Page() {
  const [tag, setTag] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [btnState, setBtnState] = useState<ButtonState>(undefined);

  const { toasts, showError, showSuccess, removeToast } = useToast();

  const onSubmit = async () => {
    try {
      const rawTag = tag.trim().replace(/^@/, "");
      const num = Number(amount);

      if (!rawTag || isNaN(num) || num <= 0) {
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

      let result: any;
      try {
        if (isMock) throw new Error("force-mock");
        result = await MiniKit.commandsAsync.pay(payload);
      } catch (e: any) {
        const msg = String(e?.message || e);
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
      const conf = await r3.json();

      if (conf?.success) {
        setBtnState("success");
        showSuccess(`¡Listo! Enviaste ${num} WLD a @${rawTag}`);
      } else {
        showError("No pudimos confirmar la transacción");
        setBtnState(undefined);
      }
    } catch (err: any) {
      if (String(err?.message || "").toLowerCase().includes("cancel")) {
        showError("Pago cancelado");
      } else {
        showError("Algo salió mal");
        console.error(err);
      }
      setBtnState(undefined);
    }
  };

  const disabled = btnState === "resolviendo" || btnState === "pagando" || btnState === "verificando";

  return (
    <main className="min-h-dvh text-white grid place-items-start p-6">
      <div className="w-full max-w-3xl mx-auto rounded-3xl border border-white/20 bg-black/60 backdrop-blur px-6 py-6 space-y-6">
        <h1 className="text-3xl font-bold">Enviar WLD a Lemon</h1>

        <div className="space-y-1">
          <label className="text-zinc-300">Lemontag</label>
          <TagInput value={tag} onChange={setTag} />
        </div>

        <div className="space-y-1">
          <label className="text-zinc-300">Monto (WLD)</label>
          <AmountInput value={amount} onChange={setAmount} />
        </div>

        <PrimaryButton onClick={onSubmit} disabled={disabled}>
          Enviar WLD
        </PrimaryButton>

        <p className="text-center text-zinc-400">
          El envío se confirma dentro de World App
        </p>

        <StatusStrip state={btnState} />
      </div>

      <Toast toasts={toasts} removeToast={removeToast} />
    </main>
  );
}