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
    availableBalance: "Disponible en tu wallet: {n} WLD",
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
    history: "HISTORIAL",
    titleHistory: "Historial de Transacciones",
    noTransactions: "No hay transacciones aún",
    transactionDate: "Fecha",
    transactionAmount: "Monto",
    transactionTo: "Para",
    transactionStatus: "Estado",
    transactionHash: "Hash",
    statusSuccess: "Exitoso",
    statusPending: "Pendiente",
    statusFailed: "Fallido",
    authRequired: "Autenticación Requerida",
    authDescription: "Verifica tu identidad para acceder a Lemon Planet",
    verificationLevel: "Nivel de Verificación",
    deviceVerification: "Verificación por Dispositivo",
    orbVerification: "Verificación por Orb",
    verifyIdentity: "Verificar Identidad",
    authSuccess: "Autenticación exitosa",
    authFailed: "Error en la autenticación",
    authError: "Error durante la verificación",
    welcomeBack: "¡Bienvenido de vuelta!",
    worldAppRequired: "Se requiere World App para continuar",
    loading: "Cargando...",
    noTransactionsDesc: "Tus transacciones aparecerán aquí",
    viewTx: "Ver transacción",
    copyDestination: "Copiar destino",
    copyId: "Copiar ID",
    copiedAddress: "Dirección copiada",
    copiedId: "ID copiado",
    copyFailed: "No se pudo copiar",
    lastUpdated: "Última actualización",
    refresh: "Actualizar",
    refreshing: "Actualizando...",
    offchainConfirmed: "Confirmado (off-chain)",
    footer: "Lemon Planet no tiene relación ni con Lemon ni con Worldcoin",
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
    availableBalance: "Available in your wallet: {n} WLD",
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
    history: "HISTORY",
    titleHistory: "Transaction History",
    noTransactions: "No transactions yet",
    transactionDate: "Date",
    transactionAmount: "Amount",
    transactionTo: "To",
    transactionStatus: "Status",
    transactionHash: "Hash",
    statusSuccess: "Success",
    statusPending: "Pending",
    statusFailed: "Failed",
    authRequired: "Authentication Required",
    authDescription: "Verify your identity to access Lemon Planet",
    verificationLevel: "Verification Level",
    deviceVerification: "Device Verification",
    orbVerification: "Orb Verification",
    verifyIdentity: "Verify Identity",
    authSuccess: "Authentication successful",
    authFailed: "Authentication failed",
    authError: "Error during verification",
    welcomeBack: "Welcome back!",
    worldAppRequired: "World App is required to continue",
    loading: "Loading...",
    noTransactionsDesc: "Your transactions will appear here",
    viewTx: "View transaction",
    copyDestination: "Copy destination",
    copyId: "Copy ID",
    copiedAddress: "Address copied",
    copiedId: "ID copied",
    copyFailed: "Copy failed",
    lastUpdated: "Last updated",
    refresh: "Refresh",
    refreshing: "Refreshing...",
    offchainConfirmed: "Confirmed (off-chain)",
    footer: "Lemon Planet is not affiliated with Lemon or Worldcoin",
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
    availableBalance: "Disponível na sua carteira: {n} WLD",
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
    history: "HISTÓRICO",
    titleHistory: "Histórico de Transações",
    noTransactions: "Nenhuma transação ainda",
    transactionDate: "Data",
    transactionAmount: "Valor",
    transactionTo: "Para",
    transactionStatus: "Status",
    transactionHash: "Hash",
    statusSuccess: "Sucesso",
    statusPending: "Pendente",
    statusFailed: "Falhou",
    authRequired: "Autenticação Necessária",
    authDescription: "Verifique sua identidade para acessar o Lemon Planet",
    verificationLevel: "Nível de Verificação",
    deviceVerification: "Verificação por Dispositivo",
    orbVerification: "Verificação por Orb",
    verifyIdentity: "Verificar Identidade",
    authSuccess: "Autenticação bem-sucedida",
    authFailed: "Falha na autenticação",
    authError: "Erro durante a verificação",
    welcomeBack: "Bem-vindo de volta!",
    worldAppRequired: "World App é necessário para continuar",
    loading: "Carregando...",
    noTransactionsDesc: "Suas transações aparecerão aqui",
    viewTx: "Ver transação",
    copyDestination: "Copiar endereço",
    copyId: "Copiar ID",
    copiedAddress: "Endereço copiado",
    copiedId: "ID copiado",
    copyFailed: "Falha ao copiar",
    lastUpdated: "Última atualização",
    refresh: "Atualizar",
    refreshing: "Atualizando...",
    offchainConfirmed: "Confirmado (off-chain)",
    footer: "Lemon Planet não tem relação com Lemon nem com Worldcoin",
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
