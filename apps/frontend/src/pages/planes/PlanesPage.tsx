import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { crearTransaccion } from '../../api/payments';

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

export function PlanesPage() {
  const navigate = useNavigate();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);

  const iniciarPago = async (plan: 'STARTER' | 'PRO' | 'BUSINESS') => {
    setLoadingPlan(plan);
    try {
      const data = await crearTransaccion(plan);

      const checkout = new (window as any).WidgetCheckout({
        currency: data.moneda,
        amountInCents: data.monto,
        reference: data.referencia,
        publicKey: data.publicKey,
        signature: { integrity: data.firma },
        redirectUrl: data.redirectUrl,
        customerData: { email: data.customerEmail },
      });

      checkout.open((result: any) => {
        const status = result?.transaction?.status;
        if (status === 'APPROVED') {
          navigate('/pago-resultado?status=approved');
        } else {
          navigate('/pago-resultado?status=declined');
        }
      });
    } catch (err) {
      console.error('Error iniciando pago:', err);
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
