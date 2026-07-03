import { useState } from 'react';
import api from '../../api/axios';

type Periodo = 'MENSUAL' | 'ANUAL';

const MESES_PAGADOS_ANUAL = 10; // 2 meses gratis

const PLANES = [
  {
    id: 'STARTER' as const,
    nombre: 'Starter',
    precioMes: 79000,
    precioUSD: '≈ USD $19',
    descripcion: 'Ideal para comenzar a automatizar',
    features: [
      '1 número de WhatsApp',
      'Bot IA con Google Gemini',
      'Hasta 500 conversaciones/mes',
      'Dashboard básico',
      '1 agente humano',
      'Soporte por email',
    ],
    popular: false,
  },
  {
    id: 'PRO' as const,
    nombre: 'Pro',
    precioMes: 242000,
    precioUSD: '≈ USD $59',
    descripcion: 'Para negocios en crecimiento',
    features: [
      '1 número de WhatsApp',
      'Bot IA con Google Gemini',
      'Hasta 2.000 conversaciones/mes',
      'Dashboard completo + analytics',
      'Hasta 3 agentes humanos',
      'Catálogo de productos/servicios',
      'Soporte prioritario',
    ],
    popular: true,
  },
  {
    id: 'BUSINESS' as const,
    nombre: 'Business',
    precioMes: 529000,
    precioUSD: '≈ USD $129',
    descripcion: 'Solución completa para empresas',
    features: [
      'Hasta 3 números de WhatsApp',
      'Bot IA con Google Gemini',
      'Conversaciones ilimitadas',
      'Dashboard avanzado + reportes',
      'Agentes humanos ilimitados',
      'Multi-sucursal',
      'API personalizada',
      'Soporte dedicado 24/7',
    ],
    popular: false,
  },
];

const fmtCOP = (n: number) => `$${n.toLocaleString('es-CO')}`;

export function PlanesPage() {
  const [cargando, setCargando] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>('MENSUAL');

  const iniciarPago = async (plan: 'STARTER' | 'PRO' | 'BUSINESS') => {
    if (cargando) return;
    setCargando(plan);
    try {
      const res = await api.post('/payments/crear-transaccion', { plan, periodo });
      // Redirigir directamente a Wompi — sin widget, sin scripts
      window.location.href = res.data.checkoutUrl;
    } catch (e) {
      alert('Error iniciando el pago. Intenta de nuevo.');
      setCargando(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="text-center mb-8">
        <p className="label-mono mb-2">Suscripción</p>
        <h1 className="font-display text-3xl font-bold text-ink mb-2">Elige tu plan</h1>
        <p className="text-slate-500">Activa tu suscripción y sigue usando Automatiza360 sin límites</p>

        {/* Toggle mensual / anual */}
        <div className="inline-flex items-center gap-1 mt-6 bg-white border-2 border-ink rounded-full p-1">
          <button
            onClick={() => setPeriodo('MENSUAL')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              periodo === 'MENSUAL' ? 'bg-ink text-lima' : 'text-ink hover:bg-bone-soft'
            }`}
          >
            Mensual
          </button>
          <button
            onClick={() => setPeriodo('ANUAL')}
            className={`px-4 py-1.5 rounded-full text-sm font-semibold transition-colors ${
              periodo === 'ANUAL' ? 'bg-ink text-lima' : 'text-ink hover:bg-bone-soft'
            }`}
          >
            Anual
            <span className={`ml-1.5 chip ${periodo === 'ANUAL' ? 'bg-lima text-ink ring-lima' : 'bg-lima-ghost text-selva-800 ring-selva-300'}`}>
              2 meses gratis
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
        {PLANES.map((plan) => {
          const totalAnual = plan.precioMes * MESES_PAGADOS_ANUAL;
          const mesEquivalente = Math.round(totalAnual / 12);
          return (
            <div
              key={plan.id}
              className={`relative flex flex-col p-6 rounded-2xl bg-white ${
                plan.popular ? 'border-2 border-ink shadow-pop' : 'border border-bone-deep shadow-card'
              }`}
            >
              {plan.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 chip bg-lima text-ink ring-ink whitespace-nowrap">
                  Más popular
                </span>
              )}
              <h2 className="font-display text-xl font-bold text-ink">{plan.nombre}</h2>
              <p className="text-slate-500 text-sm mb-4">{plan.descripcion}</p>

              {periodo === 'MENSUAL' ? (
                <>
                  <p className="font-display text-3xl font-bold text-ink tabular-nums">
                    {fmtCOP(plan.precioMes)}
                    <span className="text-base font-normal text-slate-500">/mes</span>
                  </p>
                  <p className="text-slate-400 text-xs mb-5">{plan.precioUSD}/mes</p>
                </>
              ) : (
                <>
                  <p className="font-display text-3xl font-bold text-ink tabular-nums">
                    {fmtCOP(mesEquivalente)}
                    <span className="text-base font-normal text-slate-500">/mes</span>
                  </p>
                  <p className="text-slate-400 text-xs mb-1">
                    <span className="line-through">{fmtCOP(plan.precioMes)}</span>{' '}
                    <span className="text-selva-600 font-semibold">facturado anual: {fmtCOP(totalAnual)}</span>
                  </p>
                  <p className="text-selva-600 text-xs font-semibold mb-4">
                    Ahorras {fmtCOP(plan.precioMes * 2)} al año
                  </p>
                </>
              )}

              <ul className="space-y-1.5 mb-6 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="text-sm text-ink-soft flex gap-2">
                    <span className="text-selva-600 font-bold" aria-hidden>✓</span> {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => iniciarPago(plan.id)}
                disabled={cargando !== null}
                className={plan.popular ? 'btn-lima w-full !py-3' : 'btn-primary w-full !py-3'}
              >
                {cargando === plan.id ? 'Redirigiendo a Wompi…' : 'Contratar'}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-center text-slate-400 text-xs mt-8">
        Pagos procesados de forma segura por Wompi (Bancolombia). Puedes cancelar cuando quieras.
      </p>
    </div>
  );
}
