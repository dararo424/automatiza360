import { useNavigate, useSearchParams } from 'react-router-dom';

export function PagoResultadoPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const status = params.get('status');
  const approved = status === 'approved';

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
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
          >
            Ir al dashboard
          </button>
          {!approved && (
            <button
              onClick={() => navigate('/planes')}
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
