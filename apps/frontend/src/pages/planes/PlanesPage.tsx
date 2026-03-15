import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export function PlanesPage() {
  const [cargando, setCargando] = useState<string | null>(null);
  const navigate = useNavigate();

  const iniciarPago = async (plan: 'STARTER' | 'PRO' | 'BUSINESS') => {
    if (cargando) return;
    setCargando(plan);

    try {
      // 1. Obtener datos del backend
      const res = await api.post('/payments/crear-transaccion', { plan });
      const { publicKey, referencia, monto, moneda, firma, redirectUrl } = res.data;

      if (!publicKey) {
        alert('Error: no se pudo obtener la configuración de pago');
        return;
      }

      // 2. Cargar script de Wompi dinámicamente si no existe
      if (!document.getElementById('wompi-script')) {
        await new Promise<void>((resolve) => {
          const script = document.createElement('script');
          script.id = 'wompi-script';
          script.src = 'https://checkout.wompi.co/widget.js';
          script.setAttribute('data-render', 'false');
          script.onload = () => resolve();
          document.body.appendChild(script);
        });
      }

      // 3. Esperar que WidgetCheckout esté disponible
      let intentos = 0;
      while (!(window as any).WidgetCheckout && intentos < 20) {
        await new Promise((r) => setTimeout(r, 200));
        intentos++;
      }

      if (!(window as any).WidgetCheckout) {
        alert('Error cargando el procesador de pagos');
        return;
      }

      // 4. Abrir checkout
      const checkout = new (window as any).WidgetCheckout({
        currency: moneda,
        amountInCents: monto,
        reference: referencia,
        publicKey: publicKey,
        signature: { integrity: firma },
        redirectUrl: redirectUrl,
      });

      checkout.open(async (result: any) => {
        if (!result || !result.transaction) return;
        const { transaction } = result;

        if (transaction.status === 'APPROVED') {
          try {
            await api.post('/payments/activar-por-referencia', {
              referencia: transaction.reference,
            });
          } catch (e) {
            console.log('El webhook se encargará');
          }
          window.location.href = '/pago-resultado?status=approved';
        } else {
          navigate('/pago-resultado?status=declined');
        }
      });
    } catch (error) {
      console.error('Error iniciando pago:', error);
      alert('Error iniciando el pago. Intenta de nuevo.');
    } finally {
      setCargando(null);
    }
  };

  const planes = [
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

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Elige tu plan</h1>
      <p>Activa tu suscripción y sigue usando Automatiza360 sin límites</p>

      <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', flexWrap: 'wrap' }}>
        {planes.map((plan) => (
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
              {cargando === plan.id ? 'Procesando...' : 'Contratar'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
