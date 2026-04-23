import { useState } from 'react';
import { Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { SupportChat } from '../support/SupportChat';
import { getTrialInfo } from '../../api/subscriptions';
import { usePushNotifications } from '../../hooks/usePushNotifications';
import { getOnboardingStatus } from '../../api/onboarding';
import { OnboardingWizard } from '../onboarding/OnboardingWizard';
import { InstallBanner } from '../common/InstallBanner';

const PLANES = [
  { key: 'STARTER', nombre: 'Starter', precio: '$79.000', desc: '500 conversaciones/mes · 1 agente', color: 'border-slate-300' },
  { key: 'PRO', nombre: 'Pro', precio: '$242.000', desc: '2.000 conversaciones/mes · 3 agentes', color: 'border-indigo-500', popular: true },
  { key: 'BUSINESS', nombre: 'Business', precio: '$529.000', desc: 'Ilimitado · multi-sucursal', color: 'border-amber-400' },
];

function SuspendedModal({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full text-center shadow-2xl">
        <div className="text-5xl mb-3">⏰</div>
        <h2 className="text-2xl font-bold text-white mb-2">Tu trial ha expirado</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Elige un plan para seguir usando Automatiza360. Todos incluyen los mismos datos que ya configuraste.
        </p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {PLANES.map((p) => (
            <button
              key={p.key}
              onClick={() => navigate(`/planes?plan=${p.key}`)}
              className={`relative border-2 ${p.color} rounded-xl p-3 text-left hover:bg-slate-800 transition-colors`}
            >
              {p.popular && (
                <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-2 py-0.5 rounded-full whitespace-nowrap">
                  Más popular
                </span>
              )}
              <p className="text-white font-bold text-sm">{p.nombre}</p>
              <p className="text-indigo-400 font-semibold text-sm mt-0.5">{p.precio}<span className="text-slate-500 font-normal text-xs">/mes</span></p>
              <p className="text-slate-500 text-xs mt-1">{p.desc}</p>
            </button>
          ))}
        </div>

        <button
          onClick={() => navigate('/planes')}
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-lg transition-colors mb-3"
        >
          Ver todos los planes y activar →
        </button>
        <button
          onClick={onLogout}
          className="w-full text-slate-500 hover:text-slate-300 text-sm py-2 transition-colors"
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export function AppLayout() {
  const { user, isLoading, logout } = useAuth();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [onboardingDismissed, setOnboardingDismissed] = useState(false);
  usePushNotifications();

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: getTrialInfo,
    enabled: !!user,
    staleTime: 5 * 60_000,
  });

  const { data: onboardingStatus } = useQuery({
    queryKey: ['onboarding-status'],
    queryFn: getOnboardingStatus,
    enabled: !!user && user.role !== 'SUPERADMIN',
    staleTime: 5 * 60_000,
  });

  const showOnboarding =
    !onboardingDismissed &&
    !!onboardingStatus &&
    !onboardingStatus.done &&
    user?.role !== 'SUPERADMIN';

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
      {showOnboarding && (
        <OnboardingWizard
          initialStep={onboardingStatus?.step ?? 0}
          onComplete={() => setOnboardingDismissed(true)}
        />
      )}

      {/* Mobile overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      <Sidebar isMobileOpen={isMobileOpen} onClose={() => setIsMobileOpen(false)} />

      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <TopBar onMenuToggle={() => setIsMobileOpen((v) => !v)} isMobileOpen={isMobileOpen} />
        <main className="flex-1 overflow-y-auto bg-slate-50 p-6">
          <Outlet />
        </main>
      </div>

      <SupportChat />
      <InstallBanner />
    </div>
  );
}
