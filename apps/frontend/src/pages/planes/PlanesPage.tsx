import { useState } from 'react';
import api from '../../api/axios';

const PLANES = [
  {
    id: 'STARTER' as const,
    nombre: 'Starter',
    precio: '$79.000',
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
    precio: '$242.000',
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
    precio: '$529.000',
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

export function PlanesPage() {
  const [cargando, setCargando] = useState<string | null>(null);

  const iniciarPago = async (plan: 'STARTER' | 'PRO' | 'BUSINESS') => {
    if (cargando) return;
    setCargando(plan);
    try {
      const res = await api.post('/payments/crear-transaccion', { plan });
      // Redirigir directamente a Wompi — sin widget, sin scripts
      window.location.href = res.data.checkoutUrl;
    } catch (e) {
      alert('Error iniciando el pago. Intenta de nuevo.');
      setCargando(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Elige tu plan</h1>
      <p>Activa tu suscripción y sigue usando Automatiza360 sin límites</p>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        {PLANES.map((plan) => (
          <div
            key={plan.id}
            style={{
              border: plan.popular ? '2px solid #6366f1' : '1px solid #e5e7eb',
              borderRadius: '12px',
              padding: '1.5rem',
              flex: '1',
              minWidth: '250px',
            }}
          >
            {plan.popular && (
              <span style={{ background: '#6366f1', color: 'white', padding: '2px 10px', borderRadius: '20px', fontSize: '12px' }}>
                MÁS POPULAR
              </span>
            )}
            <h2>{plan.nombre}</h2>
            <p style={{ color: '#6b7280' }}>{plan.descripcion}</p>
            <h3 style={{ fontSize: '2rem', margin: '0.5rem 0 0' }}>
              {plan.precio}
              <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mes</span>
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', margin: '0 0 1rem' }}>{plan.precioUSD}/mes</p>
            <ul style={{ listStyle: 'none', padding: 0, marginBottom: '1.5rem' }}>
              {plan.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <button
              onClick={() => iniciarPago(plan.id)}
              disabled={cargando !== null}
              style={{
                width: '100%',
                padding: '0.75rem',
                background: plan.popular ? '#6366f1' : '#1f2937',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: cargando ? 'wait' : 'pointer',
                fontSize: '1rem',
              }}
            >
              {cargando === plan.id ? 'Redirigiendo a Wompi...' : 'Contratar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
