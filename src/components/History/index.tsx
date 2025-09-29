'use client';

import { useState, useEffect } from 'react';
import { useToast } from '@/components/lemon/useToast';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/providers/Language';
import { Auth } from '@/components/Auth';
import { Copy, Check } from 'lucide-react';

export interface Transaction {
  id?: string; // on-chain hash
  transaction_id?: string; // World App payment id
  amount: number;
  to: string;
  status: 'success' | 'pending' | 'failed' | 'confirmed' | 'submitted' | 'unknown';
  hash?: string;
  txHash?: string;
  timestamp: number;
  reference?: string;
}

export const History = ({ hideHeader }: { hideHeader?: boolean }) => {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const { showSuccess, showError } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Fetch on-chain transactions: last 10 transfers for the current wallet
  useEffect(() => {
    let stop = false;
    const fetchOnchain = async () => {
      try {
        const addr = session?.user?.walletAddress;
        if (!addr) return;
        const url = `/api/onchain/history?address=${encodeURIComponent(addr)}&limit=10`;
        const r = await fetch(url, { cache: 'no-store' });
        const j = (await r.json()) as { transactions: Transaction[] };
        const arr = (j.transactions || []).sort((a, b) => b.timestamp - a.timestamp);
        if (!stop) {
          setTransactions((prev) => (arr.length > 0 ? arr : prev));
          setLastUpdated(Date.now());
        }
      } catch (e) {
        console.error('onchain history error', e);
        setTransactions([]);
      } finally {
        if (!stop) setLoading(false);
        setRefreshing(false);
      }
    };

    fetchOnchain();
    // Poll up to 6 times (30s) to catch new txs soon after sending
    let attempts = 0;
    const iv = setInterval(() => {
      attempts += 1;
      if (attempts > 6) {
        clearInterval(iv);
      } else {
        fetchOnchain();
      }
    }, 5000);
    return () => { stop = true; clearInterval(iv); };
  }, [session?.user?.walletAddress]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      const addr = session?.user?.walletAddress;
      if (!addr) return;
      const url = `/api/onchain/history?address=${encodeURIComponent(addr)}&limit=10`;
      const r = await fetch(url, { cache: 'no-store' });
      const j = (await r.json()) as { transactions: Transaction[] };
      const arr = (j.transactions || []).sort((a, b) => b.timestamp - a.timestamp);
      setTransactions((prev) => (arr.length > 0 ? arr : prev));
      setLastUpdated(Date.now());
    } catch (e) {
      console.error('manual refresh error', e);
    } finally {
      setRefreshing(false);
    }
  };

  // No event listeners: list is sourced from on-chain each render

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-400 bg-green-400/20';
      case 'confirmed':
        return 'text-green-400 bg-green-400/20';
      case 'pending':
        return 'text-yellow-400 bg-yellow-400/20';
      case 'submitted':
        return 'text-amber-300 bg-amber-500/15 border border-amber-300/30';
      case 'failed':
        return 'text-red-400 bg-red-400/20';
      default:
        return 'text-gray-400 bg-gray-400/20';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'success':
        return t('statusSuccess');
      case 'confirmed':
        return t('statusSuccess');
      case 'pending':
        return t('statusPending');
      case 'submitted':
        // Mostrar simplemente "Confirmado" como pidió el usuario
        return t('statusSuccess');
      case 'failed':
        return t('statusFailed');
      default:
        return status;
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 10)}...${address.slice(-6)}`;
  };

  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 8)}...${hash.slice(-6)}`;
  };

  if (!session) {
    return <Auth onAuthSuccess={() => setLoading(false)} />;
  }

  if (loading) {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 rounded-full border-2 border-white/40 border-t-white animate-spin mb-4" />
            <p className="text-white/60">{t('loading') || 'Cargando historial...'}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-foreground">{t('titleHistory')}</h1>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 disabled:opacity-60"
          >
            {refreshing ? t('refreshing') : t('refresh')}
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
        <div className="flex items-center justify-between text-[11px] text-white/50">
          <div />
          <div>
            {lastUpdated ? (
              <span>{t('lastUpdated')}: {new Date(lastUpdated).toLocaleTimeString()}</span>
            ) : (
              <span>&nbsp;</span>
            )}
          </div>
          <button
            onClick={onRefresh}
            disabled={refreshing}
            className="ml-2 px-2 py-1 rounded bg-white/10 text-white hover:bg-white/20 disabled:opacity-60"
          >
            {refreshing ? t('refreshing') : t('refresh')}
          </button>
        </div>
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
              <span className="text-3xl">📋</span>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">
              {t('noTransactions')}
            </h3>
            <p className="text-white/60 text-sm">
              {t('noTransactionsDesc') || 'Tus transacciones aparecerán aquí'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((tx) => (
              <div
                key={(tx.id || tx.txHash || tx.transaction_id || tx.reference || Math.random().toString(36)).toString()}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
              >
                {/* Header with amount and status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {formatAmount(tx.amount)} WLD
                    </span>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${getStatusColor(tx.status)}`}
                      title={getStatusText(tx.status)}
                    >
                      {getStatusText(tx.status)}
                    </span>
                  </div>
                  <span className="text-right text-[11px] leading-tight text-white/60">
                    <span className="block">{new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date(tx.timestamp))}</span>
                    <span className="block">{new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' }).format(new Date(tx.timestamp))}</span>
                  </span>
                </div>

                {/* Transaction details */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-white/60 min-w-[42px]">{t('transactionTo')}:</span>
                    <span className="text-white font-mono truncate flex-1">
                      {truncateAddress(tx.to)}
                    </span>
                    <button
                      aria-label={t('copyDestination')}
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(tx.to);
                          showSuccess(t('copiedAddress'));
                          const k = `${tx.id || tx.txHash || tx.transaction_id || tx.reference}-to`;
                          setCopiedKey(k);
                          setTimeout(() => setCopiedKey((v) => (v === k ? null : v)), 1500);
                        } catch {
                          showError(t('copyFailed'));
                        }
                      }}
                      className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/80"
                    >
                      {copiedKey === `${tx.id || tx.txHash || tx.transaction_id || tx.reference}-to` ? (
                        <Check size={16} />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  
                  {(tx.hash || tx.txHash) && (
                    <div className="flex justify-between">
                      <span className="text-white/60">{t('transactionHash')}:</span>
                      <span className="text-white font-mono">
                        {truncateHash((tx.hash || tx.txHash) as string)}
                      </span>
                    </div>
                  )}

                  {(tx.transaction_id || tx.reference) && (
                    <div className="flex items-center gap-2">
                      <span className="text-white/60 min-w-[42px]">ID:</span>
                      <span className="text-white font-mono truncate flex-1">
                        {truncateAddress(tx.transaction_id || tx.reference || '')}
                      </span>
                      <button
                        aria-label={t('copyId')}
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(tx.transaction_id || tx.reference || '');
                            showSuccess(t('copiedId'));
                            const k = `${tx.id || tx.txHash || tx.transaction_id || tx.reference}-id`;
                            setCopiedKey(k);
                            setTimeout(() => setCopiedKey((v) => (v === k ? null : v)), 1500);
                          } catch {
                            showError(t('copyFailed'));
                          }
                        }}
                        className="p-1.5 rounded-md bg-white/5 hover:bg-white/10 text-white/80"
                      >
                        {copiedKey === `${tx.id || tx.txHash || tx.transaction_id || tx.reference}-id` ? (
                          <Check size={16} />
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {/* Action area */}
                {(tx.hash || tx.txHash) && (
                  <div className="pt-2">
                    <button
                      onClick={() => {
                        const world = process.env.NEXT_PUBLIC_WORLDCHAIN_EXPLORER_URL || '';
                        const base = process.env.NEXT_PUBLIC_BASE_EXPLORER_URL || 'https://basescan.org';
                        const root = (world || base).replace(/\/$/, '');
                        const explorerUrl = `${root}/tx/${(tx.hash || tx.txHash) as string}`;
                        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="w-full px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                    >
                      {t('viewTx')}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
