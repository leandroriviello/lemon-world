'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession, signIn } from 'next-auth/react';
import { MiniKit, VerificationLevel } from '@worldcoin/minikit-js';
import { Button, LiveFeedback } from '@worldcoin/mini-apps-ui-kit-react';
import { useMiniKit } from '@worldcoin/minikit-js/minikit-provider';
import { useLanguage } from '@/providers/Language';
import { useToast } from '@/components/lemon/useToast';

export const Auth = ({ onAuthSuccess }: { onAuthSuccess?: () => void }) => {
  const { data: session, status } = useSession();
  const { isInstalled } = useMiniKit();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationLevel, setVerificationLevel] = useState<VerificationLevel>(VerificationLevel.Device);
  const { t } = useLanguage();
  const { showError, showSuccess } = useToast();

  const handleVerify = useCallback(async () => {
    console.log('handleVerify called:', { isInstalled, isVerifying });
    if (!isInstalled || isVerifying) {
      console.log('handleVerify early return:', { isInstalled, isVerifying });
      return;
    }

    console.log('Starting verification process...');
    setIsVerifying(true);
    try {
      console.log('Calling MiniKit.commandsAsync.verify...');
      const result = await MiniKit.commandsAsync.verify({
        action: 'lemon-planet-auth', // Make sure to create this in the developer portal
        verification_level: verificationLevel,
      });
      console.log('MiniKit verify result:', result);

      // Verify the proof on the server
      console.log('Calling /api/verify-proof...');
      const response = await fetch('/api/verify-proof', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: result.finalPayload,
          action: 'lemon-planet-auth',
        }),
      });

      const data = await response.json();
      console.log('Server verification response:', data);
      if (data.verifyRes?.success) {
        console.log('Verification successful!');
        showSuccess(t('authSuccess') || 'Autenticación exitosa');
        
        // Marcar la verificación como exitosa para evitar bucles
        setVerificationSuccessful(true);
        
        // Actualizar la sesión para que NextAuth reconozca al usuario como autenticado
        console.log('Updating session...');
        await signIn('credentials', {
          redirect: false,
          nonce: 'lemon-planet-nonce',
          signedNonce: 'lemon-planet-signed-nonce',
          finalPayloadJson: JSON.stringify(result.finalPayload),
        });
        
        onAuthSuccess?.();
      } else {
        console.log('Verification failed:', data);
        showError(t('authFailed') || 'Error en la autenticación');
      }
    } catch (error) {
      console.error('Verification error:', error);
      showError(t('authError') || 'Error durante la verificación');
    } finally {
      console.log('Setting isVerifying to false');
      setIsVerifying(false);
    }
  }, [isInstalled, isVerifying, verificationLevel, showSuccess, showError, t, onAuthSuccess]);

  // Auto-verify on mount if not authenticated - SOLO UNA VEZ
  const [hasAttemptedVerification, setHasAttemptedVerification] = useState(false);
  const [verificationSuccessful, setVerificationSuccessful] = useState(false);
  
  useEffect(() => {
    console.log('Auth useEffect triggered:', { status, isInstalled, isVerifying, hasAttemptedVerification, verificationSuccessful });
    
    // Solo ejecutar si no está autenticado, MiniKit está instalado, no está verificando, no ha intentado verificar, y no ha tenido éxito
    if (status === 'unauthenticated' && isInstalled && !isVerifying && !hasAttemptedVerification && !verificationSuccessful) {
      console.log('Starting auto-verification...');
      setHasAttemptedVerification(true);
      handleVerify();
    }
  }, [status, isInstalled, isVerifying, hasAttemptedVerification, verificationSuccessful]);

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

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-white">
              {t('verificationLevel') || 'Nivel de Verificación'}
            </label>
            <select
              value={verificationLevel}
              onChange={(e) => setVerificationLevel(e.target.value as VerificationLevel)}
              className="w-full h-12 px-4 rounded-2xl bg-white/5 border border-white/10 text-white focus:outline-none focus:ring-2 focus:ring-[#FFD100]"
            >
              <option value={VerificationLevel.Device}>
                {t('deviceVerification') || 'Verificación por Dispositivo'}
              </option>
              <option value={VerificationLevel.Orb}>
                {t('orbVerification') || 'Verificación por Orb'}
              </option>
            </select>
          </div>

          <LiveFeedback
            label={{
              failed: t('authFailed') || 'Error en la autenticación',
              pending: '', // Removemos el texto duplicado aquí
              success: t('authSuccess') || 'Autenticación exitosa',
            }}
            state={isVerifying ? 'pending' : undefined}
          >
            <Button
              onClick={handleVerify}
              disabled={!isInstalled || isVerifying}
              size="lg"
              variant="primary"
              className="w-full h-14 rounded-full text-black font-semibold bg-[linear-gradient(180deg,#FFE566_0%,#FFD100_55%,#E6B800_100%)]"
            >
              {isVerifying ? (
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
    </div>
  );
};
