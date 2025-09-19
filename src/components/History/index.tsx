'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/providers/Language';
import { Auth } from '@/components/Auth';

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  // Fetch on-chain transactions: last 10 transfers for the current wallet
  useEffect(() => {
    let stop = false;
    const fetchOnchain = async () => {
      try {
        const r = await fetch('/api/history', { cache: 'no-store' });
        const j = (await r.json()) as { transactions: Transaction[] };
        if (!stop) {
          setTransactions((j.transactions || []).sort((a, b) => b.timestamp - a.timestamp));
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
      const r = await fetch('/api/history', { cache: 'no-store' });
      const j = (await r.json()) as { transactions: Transaction[] };
      setTransactions((j.transactions || []).sort((a, b) => b.timestamp - a.timestamp));
      setLastUpdated(Date.now());
    } catch (e) {
      console.error('manual refresh error', e);
    } finally {
      setRefreshing(false);
    }
  };

  // No event listeners: list is sourced from on-chain each render

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

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
        return 'text-yellow-400 bg-yellow-400/20';
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
        return 'Confirmado (off-chain)';
      case 'failed':
        return t('statusFailed');
      default:
        return status;
    }
  };

  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
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
            {refreshing ? 'Actualizando...' : 'Actualizar'}
          </button>
        </div>
      )}

      {/* Transactions List */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
        {lastUpdated && (
          <div className="text-right text-[11px] text-white/50">Última actualización: {new Date(lastUpdated).toLocaleTimeString()}</div>
        )}
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
                key={tx.id}
                className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3"
              >
                {/* Header with amount and status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">
                      {formatAmount(tx.amount)} WLD
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(tx.status)}`}
                    >
                      {getStatusText(tx.status)}
                    </span>
                  </div>
                  <span className="text-xs text-white/60">
                    {formatDate(tx.timestamp)}
                  </span>
                </div>

                {/* Transaction details */}
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">{t('transactionTo')}:</span>
                    <span className="text-white font-mono">
                      {truncateAddress(tx.to)}
                    </span>
                  </div>
                  
                  {(tx.hash || tx.txHash) && (
                    <div className="flex justify-between">
                      <span className="text-white/60">{t('transactionHash')}:</span>
                      <span className="text-white font-mono">
                        {truncateHash((tx.hash || tx.txHash) as string)}
                      </span>
                    </div>
                  )}

                  {tx.reference && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Ref:</span>
                      <span className="text-white font-mono">
                        {tx.reference.slice(0, 8)}...
                      </span>
                    </div>
                  )}
                </div>

                {/* Action button */}
                {(tx.hash || tx.txHash) && (
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => {
                        const base = process.env.NEXT_PUBLIC_BASE_EXPLORER_URL || 'https://basescan.org';
                        const explorerUrl = `${base.replace(/\/$/, '')}/tx/${(tx.hash || tx.txHash) as string}`;
                        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                    >
                      Ver transacción
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
