import { useRef, useState } from 'react';
import api from '../../api/axios';

interface Plan {
  key: 'STARTER' | 'PRO' | 'BUSINESS';
  nombre: string;
  precio: string;
  precioNum: string;
  descripcion: string;
  features: string[];
  destacado: boolean;
}

const PLANES: Plan[] = [
  {
    key: 'STARTER',
    nombre: 'Starter',
    precio: '$149.000',
    precioNum: '/ mes',
    descripcion: 'Ideal para negocios que empiezan',
    features: [
      '1 usuario',
      'Bot de WhatsApp',
      'Módulos básicos',
      'Soporte por email',
    ],
    destacado: false,
  },
  {
    key: 'PRO',
    nombre: 'Pro',
    precio: '$299.000',
    precioNum: '/ mes',
    descripcion: 'Para negocios en crecimiento',
    features: [
      'Hasta 5 usuarios',
      'Bot de WhatsApp avanzado',
      'Todos los módulos',
      'Reportes y analytics',
      'Soporte prioritario',
    ],
    destacado: true,
  },
  {
    key: 'BUSINESS',
    nombre: 'Business',
    precio: '$599.000',
    precioNum: '/ mes',
    descripcion: 'Solución completa para empresas',
    features: [
      'Usuarios ilimitados',
      'Multi-sucursal',
      'API personalizada',
      'Integraciones avanzadas',
      'Soporte dedicado 24/7',
    ],
    destacado: false,
  },
];

/** Carga el script de Wompi dinámicamente (solo una vez). */
function cargarScriptWompi(): Promise<void> {
  return new Promise((resolve, reject) => {
    if ((window as any).WidgetCheckout) {
      resolve();
      return;
    }
    const existing = document.getElementById('wompi-script');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', reject);
      return;
    }
    const script = document.createElement('script');
    script.id = 'wompi-script';
    script.src = 'https://checkout.wompi.co/widget.js';
    script.setAttribute('data-render', 'false');
    script.onload = () => resolve();
    script.onerror = reject;
    document.body.appendChild(script);
  });
}

export function PlanesPage() {
  const pagandoRef = useRef(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const iniciarPago = async (plan: 'STARTER' | 'PRO' | 'BUSINESS') => {
    if (pagandoRef.current) return;
    pagandoRef.current = true;
    setError(null);
    setLoadingPlan(plan);

    try {
      // 1. Cargar script de Wompi solo cuando el usuario hace clic
      await cargarScriptWompi();

      // 2. Obtener datos del backend (incluye publicKey)
      const res = await api.post('/payments/crear-transaccion', { plan });
      const { publicKey, referencia, monto, moneda, firma, redirectUrl } = res.data;

      console.log('[Wompi] publicKey:', publicKey, 'referencia:', referencia);

      if (!publicKey) {
        setError('No se recibió publicKey del servidor. Verifica WOMPI_PUBLIC_KEY en Railway.');
        return;
      }

      // 3. Abrir widget con publicKey del backend
      const checkout = new (window as any).WidgetCheckout({
        currency: moneda,
        amountInCents: monto,
        reference: referencia,
        publicKey: publicKey,
        signature: { integrity: firma },
        redirectUrl: redirectUrl,
      });

      checkout.open(async (result: any) => {
        if (!result || !result.transaction) {
          // Usuario cerró el widget sin pagar
          pagandoRef.current = false;
          setLoadingPlan(null);
          return;
        }

        const { transaction } = result;
        console.log('[Wompi] Resultado:', transaction.status, transaction.reference);

        if (transaction.status === 'APPROVED') {
          try {
            await api.post('/payments/activar-por-referencia', {
              referencia: transaction.reference,
            });
          } catch (e) {
            console.log('[Wompi] El webhook se encargará de activar el plan');
          }
          window.location.href = '/pago-resultado?status=approved';
        } else {
          window.location.href = '/pago-resultado?status=declined';
        }
      });
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ??
        err?.message ??
        'Error desconocido al iniciar el pago';
      console.error('[Wompi] Error:', err);
      setError(msg);
      pagandoRef.current = false;
      setLoadingPlan(null);
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-slate-800">Elige tu plan</h1>
        <p className="mt-2 text-slate-500">
          Activa tu suscripción y sigue usando Automatiza360 sin límites
        </p>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {PLANES.map((plan) => (
          <div
            key={plan.key}
            className={`rounded-2xl border p-6 flex flex-col ${
              plan.destacado
                ? 'border-indigo-500 bg-indigo-50 shadow-lg ring-2 ring-indigo-500'
                : 'border-slate-200 bg-white shadow-sm'
            }`}
          >
            {plan.destacado && (
              <span className="self-start mb-3 text-xs font-bold bg-indigo-600 text-white px-3 py-1 rounded-full uppercase tracking-wide">
                Más popular
              </span>
            )}

            <h2 className="text-xl font-bold text-slate-800">{plan.nombre}</h2>
            <p className="text-sm text-slate-500 mt-1">{plan.descripcion}</p>

            <div className="mt-4 flex items-end gap-1">
              <span className="text-3xl font-black text-slate-900">
                {plan.precio}
              </span>
              <span className="text-sm text-slate-500 mb-1">{plan.precioNum}</span>
            </div>

            <ul className="mt-5 space-y-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="text-green-500 font-bold mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <button
              onClick={() => iniciarPago(plan.key)}
              disabled={loadingPlan !== null}
              className={`mt-6 w-full py-3 rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                plan.destacado
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  : 'bg-slate-800 hover:bg-slate-900 text-white'
              }`}
            >
              {loadingPlan === plan.key ? 'Procesando...' : 'Contratar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
