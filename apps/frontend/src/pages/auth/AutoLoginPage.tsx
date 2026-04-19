import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getPerfil } from '../../api/auth';

export function AutoLoginPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const token = params.get('token');
    if (!token) {
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('token', token);

    getPerfil()
      .then(() => navigate('/dashboard', { replace: true }))
      .catch(() => {
        localStorage.removeItem('token');
        navigate('/login', { replace: true });
      });
  }, [navigate, params]);

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-green-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-white font-semibold text-lg">Configurando tu cuenta...</p>
        <p className="text-slate-400 text-sm mt-1">Serás redirigido en un momento</p>
      </div>
    </div>
  );
}
