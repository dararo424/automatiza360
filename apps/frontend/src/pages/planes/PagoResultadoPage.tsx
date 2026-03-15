import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

export function PagoResultadoPage() {
  const { refreshUser } = useAuth();
  const processedRef = useRef(false);
  const [activando, setActivando] = useState(false);

  // Wompi redirige con: ?id=TX_ID&status=APPROVED&reference=A360-xxx
  const params = new URLSearchParams(window.location.search);
  const status = params.get('status');       // APPROVED, DECLINED, VOIDED, ERROR
  const referencia = params.get('reference');
  const approved = status === 'APPROVED';

  useEffect(() => {
    if (!approved || !referencia || processedRef.current) return;
    processedRef.current = true;
    setActivando(true);

    api
      .post('/payments/activar-por-referencia', { referencia })
      .then(() => refreshUser())
      .catch(() => {
        // El webhook activará el plan si falla aquí
        console.log('[Pago] El webhook se encargará de activar el plan');
      })
      .finally(() => setActivando(false));
  }, [approved, referencia, refreshUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{approved ? '✅' : '❌'}</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">
          {approved ? '¡Pago exitoso!' : 'Pago no procesado'}
        </h1>
        <p className="text-slate-500 mb-8">
          {approved
            ? 'Tu plan ya está activo. Puedes seguir usando Automatiza360 sin límites.'
            : 'El pago no fue procesado. Puedes intentarlo de nuevo cuando quieras.'}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => (window.location.href = '/dashboard')}
            disabled={activando}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold rounded-xl transition-colors"
          >
            {activando ? 'Activando plan...' : 'Ir al dashboard'}
          </button>
          {!approved && (
            <button
              onClick={() => (window.location.href = '/planes')}
              className="w-full py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
            >
              Intentar de nuevo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
