'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/providers/Language';
import { Auth } from '@/components/Auth';

export interface Transaction {
  id: string;
  amount: number;
  to: string;
  status: 'success' | 'pending' | 'failed';
  hash?: string;
  timestamp: number;
  reference?: string;
}

export const History = ({ hideHeader }: { hideHeader?: boolean }) => {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  // Load transactions from localStorage
  useEffect(() => {
    const loadTransactions = () => {
      try {
        const stored = localStorage.getItem('lemon-planet-transactions');
        if (stored) {
          const parsed = JSON.parse(stored);
          setTransactions(parsed.sort((a: Transaction, b: Transaction) => b.timestamp - a.timestamp));
        }
      } catch (error) {
        console.error('Error loading transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();

    // Listen for new transactions
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'lemon-planet-transactions') {
        loadTransactions();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Listen for new transactions from the same tab
  useEffect(() => {
    const handleNewTransaction = (e: CustomEvent) => {
      if (e.detail?.type === 'new-transaction') {
        const newTransaction = e.detail.transaction;
        setTransactions(prev => [newTransaction, ...prev]);
      }
    };

    window.addEventListener('new-transaction', handleNewTransaction as EventListener);
    return () => window.removeEventListener('new-transaction', handleNewTransaction as EventListener);
  }, []);

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
      case 'pending':
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
      case 'pending':
        return t('statusPending');
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
        <div className="flex items-center gap-3 justify-center">
          <h1 className="text-xl font-bold text-foreground">{t('titleHistory')}</h1>
        </div>
      )}

      {/* Transactions List */}
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-4">
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
                  
                  {tx.hash && (
                    <div className="flex justify-between">
                      <span className="text-white/60">{t('transactionHash')}:</span>
                      <span className="text-white font-mono">
                        {truncateHash(tx.hash)}
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

                {/* Action buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => {
                      if (tx.hash) {
                        const explorerUrl = `https://basescan.org/tx/${tx.hash}`;
                        window.open(explorerUrl, '_blank', 'noopener,noreferrer');
                      } else {
                        navigator.clipboard.writeText(tx.to);
                      }
                    }}
                    className="flex-1 px-3 py-2 rounded-lg bg-white/10 text-white text-xs font-medium hover:bg-white/20 transition-colors"
                  >
                    {tx.hash ? 'Ver transacción' : 'Copiar Dirección'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
