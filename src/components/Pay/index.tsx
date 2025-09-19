'use client';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MiniKit, Tokens, tokenToDecimals } from "@worldcoin/minikit-js";
import { Button } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { isAddress } from 'viem';
import Toast from "@/components/lemon/Toast";
import { useToast } from "@/components/lemon/useToast";
import { useLanguage } from "@/providers/Language";
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

export const Pay = ({ hideHeader }: { hideHeader?: boolean }) => {
  const [amount, setAmount] = useState('');
  const [address, setAddress] = useState<string>("");
  const [btnState, setBtnState] = useState<ButtonState>(undefined);
  const [isHelpOpen, setIsHelpOpen] = useState<boolean>(false);
  const addressInputRef = useRef<HTMLInputElement | null>(null);
  const [portalReady, setPortalReady] = useState(false);
  const { toasts, showError, showSuccess, showInfo, removeToast } = useToast();
  const { isInstalled } = useMiniKit();
  const [addressError, setAddressError] = useState<string>("");
  const [amountError, setAmountError] = useState<string>("");
  const { t } = useLanguage();

  useEffect(() => {
    setPortalReady(true);
  }, []);

  const validateAddress = (value: string) => {
    const v = value.trim();
    if (!v) return t('errEnterAddress');
    if (!/^0x[0-9a-fA-F]{40}$/.test(v)) return t('errInvalidFormat');
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
    if (!value) return t('errEnterAmount');
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0) return t('errAmountInvalid');
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
        showError(t('hintWorldApp'));
        return;
      }

      // 1) Iniciar pago -> id de referencia
      setBtnState("pagando");
      const r2 = await fetch("/api/initiate-payment", { method: "POST" });
      if (!r2.ok) {
        showError(t('serviceInitDown'));
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
        description: t('sendWLD'),
      };

      // Haptic feedback justo antes de abrir el sheet de World App
      const triggerHapticLight = () => {
        try {
          type NavigatorWithVibrate = Navigator & { vibrate?: (pattern: number | number[]) => boolean };
          const w = (typeof window !== 'undefined' ? window : undefined) as (Window & { navigator: NavigatorWithVibrate }) | undefined;
          w?.navigator?.vibrate?.(15);
          type MKAsync = { commandsAsync?: { haptics?: (opts: { intensity: 'light' | 'medium' | 'heavy' }) => Promise<void>; vibrate?: (opts: { duration: number }) => Promise<void> } };
          const mk = (MiniKit as unknown) as MKAsync;
          mk.commandsAsync?.haptics?.({ intensity: 'light' }).catch(() => {});
          mk.commandsAsync?.vibrate?.({ duration: 10 }).catch(() => {});
        } catch {}
      };

      let result: PayResult;
      try {
        if (isMock) throw new Error("force-mock");
        triggerHapticLight();
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

      // Si el usuario canceló o el payload indica error, no continuar
      if (!finalPayload || finalPayload.status !== 'success') {
        showError(t('cancelled'));
        setBtnState(undefined);
        return;
      }

      // 3) Confirmar con el backend (valida status y txHash)
      setBtnState("verificando");
      const r3 = await fetch("/api/confirm-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ finalPayload }),
      });
      const conf = (await r3.json()) as { success?: boolean };

      if (conf?.success) {
        setBtnState("success");
        showSuccess(t('sentOk', { n: num }));
        // No persistimos localmente: el historial se carga on-chain
        
        // Haptic de éxito
        try {
          type NavigatorWithVibrate = Navigator & { vibrate?: (pattern: number | number[]) => boolean };
          const w = (typeof window !== 'undefined' ? window : undefined) as (Window & { navigator: NavigatorWithVibrate }) | undefined;
          w?.navigator?.vibrate?.([10, 40, 10]);
          type MKAsync = { commandsAsync?: { haptics?: (opts: { intensity: 'light' | 'medium' | 'heavy' }) => Promise<void> } };
          const mk = (MiniKit as unknown) as MKAsync;
          await mk.commandsAsync?.haptics?.({ intensity: 'medium' });
        } catch {}
      } else {
        showError(t('cannotConfirm'));
        setBtnState(undefined);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.toLowerCase().includes("cancel")) {
        showError(t('cancelled'));
      } else {
        console.error(err);
        showError(t('genericError'));
      }
      setBtnState(undefined);
    }
  };

  const getButtonText = () => {
    switch (btnState) {
      case "pagando": return t('paying');
      case "verificando": return t('verifying');
      case "success": return t('sent');
      default: return t('sendWLD');
    }
  };

  const disabled = btnState === "pagando" || btnState === "verificando";

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) setAddress(text.trim());
    } catch {
      showError(t('cannotClipboard'));
    }
  };

  const isPending = btnState === "pagando" || btnState === "verificando";
  const addressValid = validateAddress(address.trim()) === "";
  const amountValid = validateAmount(amount) === "";
  const canShowButton = addressValid && amountValid && isInstalled;

  const getHint = () => {
    if (!isInstalled) return t('hintWorldApp');
    const trimmed = address.trim();
    if (!trimmed) return t('hintPasteAddress');
    if (!addressValid) return validateAddress(trimmed);
    if (!amount) return t('hintEnterAmount');
    if (!amountValid) return validateAmount(amount);
    return "";
  };

  const handleOpenLemon = () => {
    try {
      const fallback = process.env.NEXT_PUBLIC_LEMON_FALLBACK_URL || 'https://lemon.me';
      const iosStore = process.env.NEXT_PUBLIC_LEMON_IOS_STORE_URL || '';
      const androidStore = process.env.NEXT_PUBLIC_LEMON_ANDROID_STORE_URL || '';
      const ua = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
      const isAndroid = /Android/i.test(ua);
      const isIOS = /iPhone|iPad|iPod/i.test(ua);
      let didHide = false;
      const onVis = () => {
        if (document.hidden) didHide = true;
      };
      document.addEventListener('visibilitychange', onVis);
      // Intenta abrir el deeplink
      window.location.href = 'lemoncash://app/currency/WLD';
      // Si no cambia de app en ~1s, vamos al fallback
      setTimeout(() => {
        document.removeEventListener('visibilitychange', onVis);
        if (!didHide) {
          showInfo(t('deeplinkStore'));
          if (isAndroid) {
            // 1) Intento abrir Play Store app vía market://
            let pkg = 'com.applemoncash';
            try {
              if (androidStore) {
                const u = new URL(androidStore);
                pkg = u.searchParams.get('id') || pkg;
              }
              if (!pkg && androidStore) {
                const m = androidStore.match(/id=([^&]+)/);
                if (m && m[1]) pkg = m[1];
              }
            } catch {}

            const onVis2 = () => {
              if (document.hidden) didHide = true;
            };
            document.addEventListener('visibilitychange', onVis2);
            window.location.href = `market://details?id=${pkg}`;
            // 2) Si tampoco abre, caemos a la URL web
            setTimeout(() => {
              document.removeEventListener('visibilitychange', onVis2);
              if (!didHide) {
                const targetWeb = androidStore || fallback;
                window.open(targetWeb, '_blank', 'noopener,noreferrer');
              }
            }, 900);
          } else if (isIOS) {
            const targetUrl = iosStore || fallback;
            window.open(targetUrl, '_blank', 'noopener,noreferrer');
          } else {
            window.open(fallback, '_blank', 'noopener,noreferrer');
          }
        }
      }, 1200);
    } catch (e) {
      console.error('deeplink error', e);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Header con logo y título */}
      {!hideHeader && (
        <div className="flex items-center gap-3 justify-center">
          <LemonIcon className="w-8 h-8" />
        <h1 className="text-xl font-bold text-foreground">{t('titleSend')}</h1>
        </div>
      )}

      {/* Card contenedora - estilo Liquid Glass */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_8px_30px_rgba(0,0,0,0.45)]">
        {/* Campo dirección de wallet */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">
              {t('walletAddress')}
              <button
                type="button"
                onClick={() => setIsHelpOpen(true)}
                className="ml-2 text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                aria-label="Instructivo aquí"
              >
                {t('instructionHere')}
              </button>
            </label>
          </div>
      <div className="relative">
        <input
          type="text"
              placeholder={t('placeholderAddress')}
          value={address}
          ref={addressInputRef}
          onChange={(e) => {
            setAddress(e.target.value);
            if (addressError) setAddressError("");
          }}
          disabled={disabled}
          className="focus-pulse w-full h-12 pr-20 pl-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          />
            <button
              type="button"
              onClick={handlePaste}
              disabled={disabled}
              className="absolute inset-y-0 right-2 my-2 px-3 text-sm rounded-xl text-white
                         bg-white/10 backdrop-blur-sm border border-white/10
                         transition-all duration-200
                         hover:bg-[linear-gradient(180deg,rgba(255,255,255,0.28)_0%,rgba(255,255,255,0.12)_100%)]
                         hover:shadow-[0_6px_18px_rgba(255,255,255,0.15)]
                         active:scale-[0.98]
                         focus:outline-none focus:ring-2 focus:ring-white/20 disabled:opacity-50"
            >
              {t('paste')}
            </button>
          </div>
          {addressError && (
            <p className="text-sm text-red-400" aria-live="polite">{addressError}</p>
          )}
        </div>

        {/* Campo monto */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">
            {t('amountWLD')}
          </label>
          <input
            type="number"
            placeholder={t('placeholderAmount')}
            value={amount}
            onChange={(e) => {
              setAmount(e.target.value);
              if (amountError) setAmountError("");
            }}
            disabled={disabled}
            min="0"
            step="0.01"
            className="focus-pulse w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#FFD100] focus:border-[#FFD100] disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
          />
          {amountError && (
            <p className="text-sm text-red-400" aria-live="polite">{amountError}</p>
          )}
        </div>

        {/* Información de balance */}
        <div className="text-sm text-muted-foreground">
          {t('available')}
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
            className="btn-sheen relative overflow-hidden w-full h-14 rounded-full text-black text-base font-semibold flex items-center justify-center gap-2
                       bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)]
                       ring-1 ring-black/5
                       shadow-[0_10px_30px_rgba(255,209,0,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]
                       transition-[transform,box-shadow] duration-200
                       hover:shadow-[0_14px_34px_rgba(255,209,0,0.45),inset_0_1px_0_rgba(255,255,255,0.9)]
                       active:scale-[0.98]
                       focus:ring-4 focus:ring-[#FFD100]/30 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isPending && (
              <span className="inline-block h-5 w-5 rounded-full border-2 border-black/40 border-t-black animate-spin" aria-hidden />
            )}
            <span>{getButtonText()}</span>
          </Button>
        )}

        {/* Mensaje de confirmación quitado (World App muestra pop-up) */}
      </div>

      {/* Toast de estado */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Modal de ayuda (fullscreen limpio) via portal para evitar clipping por transform/overflow */}
      {isHelpOpen && portalReady && createPortal(
        <div className="fixed inset-0 z-[9999] bg-black overflow-hidden">
          <button
            onClick={() => {
              setIsHelpOpen(false);
              setTimeout(() => {
                addressInputRef.current?.focus();
                try {
                  addressInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                } catch {}
              }, 50);
            }}
            aria-label="Cerrar"
            className="absolute right-6 top-6 z-[10000] rounded-full bg-white/20 hover:bg-white/30 text-white px-4 py-2 text-base md:text-lg transition-colors duration-200 shadow-lg"
            style={{ top: `calc(env(safe-area-inset-top, 0px) + 24px)` }}
          >
            ✕ {t('close')}
          </button>
          <div
            className="relative w-full mx-auto"
            style={{
              height: 'calc(100dvh - (env(safe-area-inset-top, 0px) + 64px) - (env(safe-area-inset-bottom, 0px) + 112px))',
              marginTop: 'calc(env(safe-area-inset-top, 0px) + 48px)'
            }}
          >
            <iframe
              src="https://www.youtube.com/embed/Fmywwu_YZfE?autoplay=1&mute=0&playsinline=1&modestbranding=1&rel=0&fs=1&controls=0"
              title="¿Qué es la dirección de wallet?"
              className="absolute inset-0 w-full h-full"
              allow="autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>
          <div
            className="pointer-events-none absolute inset-x-0 p-4 bg-gradient-to-t from-black/70 to-transparent"
            style={{ bottom: `calc(env(safe-area-inset-bottom, 0px))` }}
          >
            <button
              onClick={handleOpenLemon}
              className="pointer-events-auto w-full h-14 rounded-full text-black font-semibold text-base flex items-center justify-center
                         bg-[linear-gradient(180deg,#5CFFAA_0%,#00F068_55%,#00D65C_100%)]
                         ring-1 ring-black/5
                         shadow-[0_10px_30px_rgba(0,240,104,0.35),inset_0_1px_0_rgba(255,255,255,0.7)]
                         transition-[transform,box-shadow] duration-200 hover:shadow-[0_14px_34px_rgba(0,240,104,0.45),inset_0_1px_0_rgba(255,255,255,0.9)] active:scale-[0.98]"
            >
              {t('openLemon')}
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
