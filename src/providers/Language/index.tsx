"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "es" | "en" | "pt";

type Dict = Record<Lang, Record<string, string>>;

const dict: Dict = {
  es: {
    send: "ENVIAR",
    calculator: "CALCULADORA",
    titleSend: "Enviar WLD a Lemon",
    titleCalc: "Calculadora",
    walletAddress: "Dirección de wallet",
    instructionHere: "(instructivo aquí)",
    placeholderAddress: "0x...",
    paste: "Pegar",
    amountWLD: "Monto (WLD)",
    placeholderAmount: "Monto en WLD",
    available: "Disponible en tu wallet: —",
    hintWorldApp: "Abrí esta mini app desde World App",
    hintPasteAddress: "Pegá la dirección de wallet (0x...)",
    hintEnterAmount: "Ingresá el monto en WLD",
    errEnterAddress: "Ingresá una dirección",
    errInvalidFormat: "Formato inválido",
    errChecksum: "Checksum inválido",
    errEnterAmount: "Ingresá un monto",
    errAmountInvalid: "Monto inválido",
    sendWLD: "Enviar WLD",
    paying: "Pagando...",
    verifying: "Verificando...",
    sent: "¡Enviado!",
    serviceInitDown: "Servicio no disponible (init)",
    cannotClipboard: "No pudimos leer el portapapeles",
    cancelled: "Pago cancelado",
    genericError: "Algo salió mal",
    cannotConfirm: "No pudimos confirmar la transacción",
    sentOk: "¡Listo! Enviaste {n} WLD",
    close: "Cerrar",
    openLemon: "Abrir app de Lemon",
    deeplinkStore: "No se detectó la app. Abriendo la tienda...",
    calcAmount: "Monto en WLD",
    calcReceive: "Recibís aproximado",
    calcImportant: "*IMPORTANTE: Los valores son estimados.",
    footer: "Lemon World no tiene relación ni con Lemon ni con Worldcoin",
  },
  en: {
    send: "SEND",
    calculator: "CALCULATOR",
    titleSend: "Send WLD to Lemon",
    titleCalc: "Calculator",
    walletAddress: "Wallet address",
    instructionHere: "(guide here)",
    placeholderAddress: "0x...",
    paste: "Paste",
    amountWLD: "Amount (WLD)",
    placeholderAmount: "Amount in WLD",
    available: "Available in your wallet: —",
    hintWorldApp: "Open this mini app inside World App",
    hintPasteAddress: "Paste the wallet address (0x...)",
    hintEnterAmount: "Enter the amount in WLD",
    errEnterAddress: "Enter an address",
    errInvalidFormat: "Invalid format",
    errChecksum: "Invalid checksum",
    errEnterAmount: "Enter an amount",
    errAmountInvalid: "Invalid amount",
    sendWLD: "Send WLD",
    paying: "Paying...",
    verifying: "Verifying...",
    sent: "Sent!",
    serviceInitDown: "Service unavailable (init)",
    cannotClipboard: "Clipboard read failed",
    cancelled: "Payment cancelled",
    genericError: "Something went wrong",
    cannotConfirm: "Could not confirm the transaction",
    sentOk: "Done! You sent {n} WLD",
    close: "Close",
    openLemon: "Open Lemon app",
    deeplinkStore: "App not detected. Opening the store...",
    calcAmount: "Amount in WLD",
    calcReceive: "You receive (approx)",
    calcImportant: "*IMPORTANT: Values are estimates.",
    footer: "Lemon World is not affiliated with Lemon or Worldcoin",
  },
  pt: {
    send: "ENVIAR",
    calculator: "CALCULADORA",
    titleSend: "Enviar WLD para Lemon",
    titleCalc: "Calculadora",
    walletAddress: "Endereço da wallet",
    instructionHere: "(instruções aqui)",
    placeholderAddress: "0x...",
    paste: "Colar",
    amountWLD: "Quantia (WLD)",
    placeholderAmount: "Quantia em WLD",
    available: "Disponível na sua carteira: —",
    hintWorldApp: "Abra este mini app no World App",
    hintPasteAddress: "Cole o endereço da wallet (0x...)",
    hintEnterAmount: "Digite a quantia em WLD",
    errEnterAddress: "Digite um endereço",
    errInvalidFormat: "Formato inválido",
    errChecksum: "Checksum inválido",
    errEnterAmount: "Digite uma quantia",
    errAmountInvalid: "Quantia inválida",
    sendWLD: "Enviar WLD",
    paying: "Pagando...",
    verifying: "Verificando...",
    sent: "Enviado!",
    serviceInitDown: "Serviço indisponível (init)",
    cannotClipboard: "Falha ao ler a área de transferência",
    cancelled: "Pagamento cancelado",
    genericError: "Algo deu errado",
    cannotConfirm: "Não foi possível confirmar a transação",
    sentOk: "Pronto! Você enviou {n} WLD",
    close: "Fechar",
    openLemon: "Abrir app do Lemon",
    deeplinkStore: "App não detectado. Abrindo a loja...",
    calcAmount: "Quantia em WLD",
    calcReceive: "Você recebe (aprox)",
    calcImportant: "*IMPORTANTE: Valores são estimativas.",
    footer: "Lemon World não tem relação com Lemon nem com Worldcoin",
  },
};

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (k: keyof typeof dict["es"], vars?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<Ctx | null>(null);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = (typeof window !== 'undefined' ? localStorage.getItem('lang') : null) as Lang | null;
    if (saved && ["es","en","pt"].includes(saved)) setLangState(saved);
    else {
      const nav = typeof navigator !== 'undefined' ? navigator.language : 'es';
      const guess: Lang = nav.startsWith('pt') ? 'pt' : nav.startsWith('en') ? 'en' : 'es';
      setLangState(guess);
    }
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('lang', l); } catch {}
  }, []);

  const t = useCallback<Ctx["t"]>((key, vars) => {
    const base = (dict[lang] ?? dict.es)[key] ?? key;
    if (!vars) return base;
    return Object.keys(vars).reduce((acc, k) => acc.replace(`{${k}}`, String(vars[k]!)), base);
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return (
    <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('LanguageProvider missing');
  return ctx;
};

