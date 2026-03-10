import { Navigate, Outlet } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { getTrialInfo } from '../../api/subscriptions';

function SuspendedModal({ onLogout }: { onLogout: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-2xl">
        <div className="text-5xl mb-4">⏰</div>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tu trial ha expirado</h2>
        <p className="text-slate-500 mb-6">
          El período de prueba gratuito de 14 días ha terminado. Activa tu plan para seguir usando Automatiza360.
        </p>
        <button
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
          onClick={() => alert('Redirigiendo a planes...')}
        >
          Activar plan ahora
        </button>
        <button
          onClick={onLogout}
          className="w-full text-slate-500 hover:text-slate-700 text-sm py-2 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, isLoading, logout } = useAuth();

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: getTrialInfo,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {trialInfo?.status === 'SUSPENDED' && <SuspendedModal onLogout={logout} />}
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
