import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';

export function PagoResultadoPage() {
  const [status, setStatus] = useState<'loading' | 'approved' | 'declined' | 'error'>('loading');
  const [plan, setPlan] = useState<string | null>(null);
  const navigate = useNavigate();
  const { refreshProfile } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const transactionId = params.get('id');     // Wompi envía "id"
    const statusParam = params.get('status');   // fallback si viene directo

    if (statusParam === 'approved') {
      setStatus('approved');
      setTimeout(() => navigate('/dashboard'), 2000);
      return;
    }

    if (!transactionId) {
      setStatus('error');
      return;
    }

    const verificar = async () => {
      try {
        const res = await api.get(`/payments/verificar/${transactionId}`);
        const { status: txStatus, reference } = res.data;

        if (txStatus === 'APPROVED') {
          try {
            const activar = await api.post('/payments/activar-por-referencia', {
              referencia: reference,
            });
            setPlan(activar.data.plan);
          } catch (e) {
            // El webhook ya lo activó, no es error
          }
          await refreshProfile();
          setStatus('approved');
          setTimeout(() => navigate('/dashboard'), 2000);
        } else {
          setStatus('declined');
        }
      } catch (e) {
        console.error('Error verificando pago:', e);
        setStatus('error');
      }
    };

    void verificar();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (status === 'loading') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div>Verificando tu pago...</div>
      </div>
    );
  }

  if (status === 'approved') {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ fontSize: '4rem' }}>✅</div>
        <h2>¡Pago exitoso!</h2>
        {plan && <p>Plan <strong>{plan}</strong> activado correctamente.</p>}
        <p style={{ color: '#6b7280' }}>Redirigiendo al dashboard en 3 segundos...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ fontSize: '4rem' }}>❌</div>
      <h2>Pago no procesado</h2>
      <p>El pago no fue procesado. Puedes intentarlo de nuevo cuando quieras.</p>
      <button
        onClick={() => navigate('/planes')}
        style={{ padding: '0.75rem 2rem', background: '#6366f1', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
      >
        Intentar de nuevo
      </button>
    </div>
  );
}
