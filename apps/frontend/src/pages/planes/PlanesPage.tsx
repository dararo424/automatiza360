import { useState } from 'react';
import api from '../../api/axios';

const PLANES = [
  {
    id: 'STARTER' as const,
    nombre: 'Starter',
    precio: '$149.000',
    descripcion: 'Ideal para negocios que empiezan',
    features: ['1 usuario', 'Bot de WhatsApp', 'Módulos básicos', 'Soporte por email'],
    popular: false,
  },
  {
    id: 'PRO' as const,
    nombre: 'Pro',
    precio: '$299.000',
    descripcion: 'Para negocios en crecimiento',
    features: ['Hasta 5 usuarios', 'Bot de WhatsApp avanzado', 'Todos los módulos', 'Reportes y analytics', 'Soporte prioritario'],
    popular: true,
  },
  {
    id: 'BUSINESS' as const,
    nombre: 'Business',
    precio: '$599.000',
    descripcion: 'Solución completa para empresas',
    features: ['Usuarios ilimitados', 'Multi-sucursal', 'API personalizada', 'Integraciones avanzadas', 'Soporte dedicado 24/7'],
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
            <h3 style={{ fontSize: '2rem', margin: '1rem 0' }}>
              {plan.precio}
              <span style={{ fontSize: '1rem', fontWeight: 'normal' }}>/mes</span>
            </h3>
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
