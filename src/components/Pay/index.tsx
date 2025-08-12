'use client';
import { useState } from 'react';

/**
 * Componente rediseñado para enviar WLD siguiendo el diseño de Lemon.me
 * Con tema oscuro y colores oficiales de la marca
 */
export const Pay = () => {
  const [amount, setAmount] = useState('');
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);

  const onClickPay = async () => {
    // Lógica de pago existente
    setButtonState('pending');
    
    // Simulación de pago
    setTimeout(() => {
      setButtonState('success');
      setTimeout(() => {
        setButtonState(undefined);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-lemon-black text-white p-6">
      {/* Header con logo y título */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-10 h-10 bg-lemon-greent rounded-full flex items-center justify-center shadow-lg">
          <div className="w-5 h-5 bg-lemon-black rounded-full"></div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">Enviar WLD a Lemon</h1>
      </div>

      {/* Tarjeta principal */}
      <div className="bg-dark-card bg-opacity-90 backdrop-blur-sm rounded-3xl p-8 border border-white border-opacity-10 shadow-2xl">
        {/* Campo destinatario */}
        <div className="mb-8">
          <div className="flex items-center gap-4 p-5 bg-dark-input rounded-2xl border border-white border-opacity-10">
            <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center shadow-sm">
              <div className="w-4 h-4 bg-dark-card rounded-full"></div>
            </div>
            <span className="text-white font-semibold text-lg">$nombredeusuario</span>
          </div>
        </div>

        {/* Campo monto */}
        <div className="mb-8">
          <label className="block text-base font-semibold text-white mb-4">
            $lemontag
          </label>
          <input
            type="text"
            placeholder="Monto en WLD"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-5 bg-dark-input border border-white border-opacity-20 rounded-2xl text-white placeholder-lemon-moon text-lg focus:outline-none focus:border-lemon-greent focus:ring-2 focus:ring-lemon-greent focus:ring-opacity-20 transition-all duration-300"
          />
        </div>

        {/* Información de balance */}
        <div className="mb-8">
          <p className="text-white text-base opacity-90">
            Disponible en tu wallet: —
          </p>
        </div>

        {/* Botón de envío */}
        <button
          onClick={onClickPay}
          disabled={buttonState === 'pending'}
          className="w-full py-5 bg-gradient-to-r from-lemon-greent to-lemon-evergreent rounded-2xl text-white font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-lemon-evergreent hover:to-lemon-greent transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          {buttonState === 'pending' ? 'Enviando...' : 'Enviar WLD'}
        </button>

        {/* Mensaje de confirmación */}
        <p className="text-center text-white text-base mt-6 opacity-80">
          El envío se confirma dentro de World App
        </p>
      </div>

      {/* Indicador de estado */}
      {buttonState && (
        <div className="fixed top-6 right-6 p-4 rounded-2xl text-white font-semibold z-50 transition-all duration-300 animate-in slide-in-from-top-2">
          {buttonState === 'success' && (
            <div className="bg-lemon-greent px-6 py-3 rounded-2xl shadow-lg">
              ✓ Envío exitoso
            </div>
          )}
          {buttonState === 'failed' && (
            <div className="bg-lemon-solar px-6 py-3 rounded-2xl shadow-lg">
              ✗ Error en el envío
            </div>
          )}
        </div>
      )}
    </div>
  );
};