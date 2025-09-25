'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useLanguage } from '@/providers/Language';
import { useToast } from '@/components/lemon/useToast';
import { walletAuth } from '@/auth/wallet';

export const Auth = ({ onAuthSuccess }: { onAuthSuccess?: () => void }) => {
  const { data: session, status } = useSession();
  const { isInstalled } = useMiniKit();
  const [isPending, setIsPending] = useState(false);
  const { t } = useLanguage();
  const { showError, showSuccess } = useToast();

  const handleLogin = useCallback(async () => {
    if (!isInstalled || isPending) return;
    setIsPending(true);
    try {
      const res = await walletAuth();
      if (res?.ok) {
        showSuccess(t('authSuccess') || 'Autenticación exitosa');
        onAuthSuccess?.();
      } else {
        showError(t('authFailed') || 'Error en la autenticación');
      }
    } catch (error) {
      console.error('Wallet authentication error', error);
      showError(t('authError') || 'Error durante la verificación');
    } finally {
      setIsPending(false);
    }
  }, [isInstalled, isPending, showSuccess, showError, t, onAuthSuccess]);

  // Auto-login once if unauthenticated and World App is installed
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (status === 'unauthenticated' && isInstalled && !isPending && !attempted) {
      setAttempted(true);
      handleLogin();
    }
  }, [status, isInstalled, isPending, attempted, handleLogin]);

  if (status === 'loading') {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
          <div className="text-center">
            <div className="inline-block h-8 w-8 rounded-full border-2 border-white/40 border-t-white animate-spin mb-4" />
            <p className="text-white/60">{t('loading') || 'Cargando...'}</p>
          </div>
        </div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="w-full space-y-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-500/20 flex items-center justify-center">
              <span className="text-2xl">✓</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">
              {t('welcomeBack') || '¡Bienvenido de vuelta!'}
            </h2>
            <p className="text-white/60 text-sm">
              {session.user?.username || session.user?.walletAddress || 'Usuario autenticado'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-6 space-y-6">
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold text-white mb-2">
            {t('authRequired') || 'Autenticación Requerida'}
          </h2>
          <p className="text-white/60 text-sm">
            {t('authDescription') || 'Verifica tu identidad para acceder a Lemon Planet'}
          </p>
        </div>

        <LiveFeedback
          label={{
            failed: t('authFailed') || 'Error en la autenticación',
            pending: '',
            success: t('authSuccess') || 'Autenticación exitosa',
          }}
          state={undefined}
        >
          <Button
            onClick={handleLogin}
            disabled={!isInstalled || isPending}
            size="lg"
            variant="primary"
            className="w-full h-14 rounded-full text-black font-semibold bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)]"
          >
            {isPending ? (
              <>
                <span className="inline-block h-5 w-5 rounded-full border-2 border-black/40 border-t-black animate-spin mr-2" />
                {t('verifying') || 'Verificando...'}
              </>
            ) : (
              t('verifyIdentity') || 'Verificar Identidad'
            )}
          </Button>
        </LiveFeedback>

        {!isInstalled && (
          <p className="text-center text-yellow-400 text-sm">
            {t('worldAppRequired') || 'Se requiere World App para continuar'}
          </p>
        )}
      </div>
    </div>
  );
};
