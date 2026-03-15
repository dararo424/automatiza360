import { useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';

type PagoStatus = 'verificando' | 'approved' | 'declined' | 'error';

export function PagoResultadoPage() {
  const { refreshUser } = useAuth();
  const processedRef = useRef(false);
  const [pagoStatus, setPagoStatus] = useState<PagoStatus>('verificando');

  // Wompi redirige con: ?id=12053958-1773582262-21520&env=test
  const params = new URLSearchParams(window.location.search);
  const transactionId = params.get('id');

  useEffect(() => {
    if (!transactionId || processedRef.current) return;
    processedRef.current = true;

    const verificarPago = async () => {
      try {
        const res = await api.get(`/payments/verificar/${transactionId}`);
        const { status, reference } = res.data;

        if (status === 'APPROVED') {
          try {
            await api.post('/payments/activar-por-referencia', { referencia: reference });
          } catch (e) {
            console.log('[Pago] Webhook ya activó el plan');
          }
          await refreshUser();
          setPagoStatus('approved');
          setTimeout(() => { window.location.href = '/dashboard'; }, 3000);
        } else {
          setPagoStatus('declined');
        }
      } catch (e) {
        console.error('[Pago] Error verificando transacción:', e);
        setPagoStatus('error');
      }
    };

    void verificarPago();
  }, [transactionId, refreshUser]);

  const UI: Record<PagoStatus, { icon: string; title: string; msg: string }> = {
    verificando: {
      icon: '⏳',
      title: 'Verificando tu pago...',
      msg: 'Estamos confirmando la transacción con Wompi.',
    },
    approved: {
      icon: '✅',
      title: '¡Pago exitoso!',
      msg: 'Tu plan ya está activo. Redirigiendo al dashboard...',
    },
    declined: {
      icon: '❌',
      title: 'Pago no procesado',
      msg: 'El pago no fue aprobado. Puedes intentarlo de nuevo.',
    },
    error: {
      icon: '⚠️',
      title: 'Error al verificar',
      msg: 'No pudimos verificar el pago. Revisa tu historial de Wompi o contacta soporte.',
    },
  };

  const { icon, title, msg } = UI[pagoStatus];

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-10 max-w-md w-full text-center">
        <div className="text-6xl mb-4">{icon}</div>
        <h1 className="text-2xl font-bold text-slate-800 mb-2">{title}</h1>
        <p className="text-slate-500 mb-8">{msg}</p>

        {pagoStatus !== 'verificando' && (
          <div className="flex flex-col gap-3">
            <button
              onClick={() => (window.location.href = '/dashboard')}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
            >
              Ir al dashboard
            </button>
            {(pagoStatus === 'declined' || pagoStatus === 'error') && (
              <button
                onClick={() => (window.location.href = '/planes')}
                className="w-full py-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-xl transition-colors"
              >
                Intentar de nuevo
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
