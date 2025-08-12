'use client';
import { useState } from 'react';

export const Pay = () => {
  const [amount, setAmount] = useState('');
  const [buttonState, setButtonState] = useState<
    'pending' | 'success' | 'failed' | undefined
  >(undefined);

  const onClickPay = async () => {
    setButtonState('pending');
    setTimeout(() => {
      setButtonState('success');
      setTimeout(() => {
        setButtonState(undefined);
      }, 3000);
    }, 2000);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-dark flex items-center justify-center p-4">
      {/* Contenedor principal con efecto glassmorphism */}
      <div className="w-full max-w-md mx-auto">
        {/* Header con logo y título */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-8 h-8 bg-[#00F068] rounded-full flex items-center justify-center shadow-glow">
            <div className="w-4 h-4 bg-black rounded-full"></div>
          </div>
          <h1 className="text-xl font-bold text-white font-sans">Enviar WLD a Lemon</h1>
        </div>

        {/* Formulario con efecto glassmorphism */}
        <div className="glassmorphism rounded-[20px] p-6 shadow-2xl transition-smooth">
          {/* Campo destinatario */}
          <div className="mb-6">
            <div className="glassmorphism-card rounded-2xl p-4 flex items-center gap-3">
              <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                <div className="w-3 h-3 bg-black rounded-full"></div>
              </div>
              <span className="text-white font-medium">$usuariodelemon</span>
            </div>
          </div>

          {/* Campo monto */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-white mb-3 font-sans">
              $lemontag
            </label>
            <input
              type="text"
              placeholder="Monto en WLD"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="glassmorphism-input w-full p-4 rounded-2xl text-white placeholder-gray-400 focus:outline-none focus:border-[#00F068] focus:ring-2 focus:ring-[#00F068] focus:ring-opacity-20 transition-smooth"
            />
          </div>

          {/* Información de balance */}
          <div className="mb-6">
            <p className="text-gray-300 text-sm font-sans">
              Disponible en tu wallet: —
            </p>
          </div>

          {/* Botón de envío */}
          <button
            onClick={onClickPay}
            disabled={buttonState === 'pending'}
            className="w-full py-4 bg-gradient-to-r from-[#00F068] to-[#00A849] rounded-2xl text-white font-bold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-[#00A849] hover:to-[#00F068] transition-smooth transform hover:scale-[1.02] active:scale-[0.98] shadow-glow shadow-glow-hover"
          >
            {buttonState === 'pending' ? 'Enviando...' : 'Enviar WLD'}
          </button>

          {/* Mensaje de confirmación */}
          <p className="text-center text-gray-300 text-sm mt-4 font-sans">
            El envío se confirma dentro de World App
          </p>
        </div>
      </div>

      {/* Indicador de estado */}
      {buttonState && (
        <div className="fixed top-6 right-6 p-4 rounded-2xl text-white font-semibold z-50 transition-smooth">
          {buttonState === 'success' && (
            <div className="bg-[#00F068] px-6 py-3 rounded-2xl shadow-glow">
              ✓ Envío exitoso
            </div>
          )}
          {buttonState === 'failed' && (
            <div className="bg-[#FF8800] px-6 py-3 rounded-2xl shadow-glow">
              ✗ Error en el envío
            </div>
          )}
        </div>
      )}
    </div>
  );
};