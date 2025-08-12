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
    <div className="w-full max-w-lg mx-auto bg-white text-black p-8 rounded-3xl border border-gray-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <div className="w-6 h-6 bg-white rounded-full"></div>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Enviar WLD a Lemon</h1>
      </div>

      {/* Formulario */}
      <div className="space-y-8">
        {/* Destinatario */}
        <div>
          <div className="flex items-center gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-200">
            <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-white rounded-full"></div>
            </div>
            <span className="text-gray-900 font-semibold text-xl">$nombredeusuario</span>
          </div>
        </div>

        {/* Monto */}
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-4">
            $lemontag
          </label>
          <input
            type="text"
            placeholder="Monto en WLD"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full p-5 bg-gray-50 border border-gray-200 rounded-2xl text-gray-900 placeholder-gray-400 text-lg focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300"
          />
        </div>

        {/* Balance */}
        <div>
          <p className="text-gray-600 text-base">
            Disponible en tu wallet: —
          </p>
        </div>

        {/* Botón */}
        <button
          onClick={onClickPay}
          disabled={buttonState === 'pending'}
          className="w-full py-5 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl text-white font-bold text-xl disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-600 hover:to-green-500 transition-all duration-300 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
        >
          {buttonState === 'pending' ? 'Enviando...' : 'Enviar WLD'}
        </button>

        {/* Mensaje */}
        <p className="text-center text-gray-600 text-base">
          El envío se confirma dentro de World App
        </p>
      </div>

      {/* Toast de estado */}
      {buttonState && (
        <div className="fixed top-6 right-6 p-4 rounded-2xl text-white font-semibold z-50">
          {buttonState === 'success' && (
            <div className="bg-green-500 px-6 py-3 rounded-2xl shadow-lg">
              ✓ Envío exitoso
            </div>
          )}
          {buttonState === 'failed' && (
            <div className="bg-orange-500 px-6 py-3 rounded-2xl shadow-lg">
              ✗ Error en el envío
            </div>
          )}
        </div>
      )}
    </div>
  );
};