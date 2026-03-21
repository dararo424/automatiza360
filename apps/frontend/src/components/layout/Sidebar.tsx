import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { getNotificaciones } from '../../api/notificaciones';
import { getTrialInfo } from '../../api/subscriptions';
import type { Industry } from '../../types';

interface NavItem {
  to: string;
  label: string;
  emoji: string;
}

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-slate-600',
  PRO: 'bg-indigo-600',
  BUSINESS: 'bg-amber-600',
};

const COMMON_BOTTOM: NavItem[] = [
  { to: '/caja', label: 'Caja', emoji: '💵' },
  { to: '/cupones', label: 'Cupones', emoji: '🏷️' },
  { to: '/resenas', label: 'Reseñas', emoji: '⭐' },
  { to: '/turnos', label: 'Turnos', emoji: '🗓️' },
  { to: '/compras', label: 'Proveedores', emoji: '🚚' },
  { to: '/automaciones', label: 'Automatizaciones', emoji: '⚡' },
  { to: '/configuracion', label: 'Configuración', emoji: '⚙️' },
];

function getNavItems(industry: Industry): NavItem[] {
  const base: NavItem[] = [{ to: '/dashboard', label: 'Dashboard', emoji: '🏠' }];

  if (industry === 'RESTAURANT') {
    return [
      ...base,
      { to: '/ordenes', label: 'Órdenes', emoji: '🍽️' },
      { to: '/productos', label: 'Productos', emoji: '📦' },
      { to: '/menu-dia', label: 'Menú del día', emoji: '🍴' },
      { to: '/conversaciones', label: 'Conversaciones', emoji: '💬' },
      { to: '/contactos', label: 'Contactos', emoji: '👥' },
      { to: '/campañas', label: 'Campañas', emoji: '📢' },
      { to: '/gastos', label: 'Gastos', emoji: '💳' },
      ...COMMON_BOTTOM,
    ];
  }

  if (industry === 'TECH_STORE') {
    return [
      ...base,
      { to: '/tickets', label: 'Tickets', emoji: '🔧' },
      { to: '/cotizaciones', label: 'Cotizaciones', emoji: '📄' },
      { to: '/inventario', label: 'Inventario', emoji: '📦' },
      { to: '/garantias', label: 'Garantías', emoji: '🛡️' },
      { to: '/conversaciones', label: 'Conversaciones', emoji: '💬' },
      { to: '/contactos', label: 'Contactos', emoji: '👥' },
      { to: '/campañas', label: 'Campañas', emoji: '📢' },
      { to: '/gastos', label: 'Gastos', emoji: '💳' },
      ...COMMON_BOTTOM,
    ];
  }

  if (industry === 'CLINIC' || industry === 'BEAUTY') {
    return [
      ...base,
      { to: '/agenda', label: 'Agenda', emoji: '📅' },
      { to: '/conversaciones', label: 'Conversaciones', emoji: '💬' },
      { to: '/contactos', label: 'Contactos', emoji: '👥' },
      { to: '/campañas', label: 'Campañas', emoji: '📢' },
      { to: '/gastos', label: 'Gastos', emoji: '💳' },
      ...COMMON_BOTTOM,
    ];
  }

  return [
    ...base,
    { to: '/conversaciones', label: 'Conversaciones', emoji: '💬' },
    { to: '/contactos', label: 'Contactos', emoji: '👥' },
    { to: '/campañas', label: 'Campañas', emoji: '📢' },
    { to: '/gastos', label: 'Gastos', emoji: '💳' },
    ...COMMON_BOTTOM,
  ];
}

interface SidebarProps {
  isMobileOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isMobileOpen, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const industry = user?.tenant?.industry ?? 'OTHER';

  const { data: notificaciones } = useQuery({
    queryKey: ['notificaciones', false],
    queryFn: () => getNotificaciones(false),
    refetchInterval: 30_000,
    enabled: !!user,
  });

  const { data: trialInfo } = useQuery({
    queryKey: ['trial-info'],
    queryFn: getTrialInfo,
    refetchInterval: 5 * 60_000,
    enabled: !!user,
  });

  const unreadCount = notificaciones?.filter((n) => !n.read).length ?? 0;
  const navItems = getNavItems(industry);
  const planActual = user?.tenant?.subscriptionPlan || user?.tenant?.plan || 'STARTER';
  const planColor = PLAN_COLORS[planActual] ?? 'bg-slate-600';
  const mostrarTrial =
    user?.tenant?.subscriptionStatus !== 'ACTIVE' &&
    !!user?.tenant?.trialEndsAt &&
    new Date(user.tenant.trialEndsAt) > new Date();

  return (
    <aside
      className={[
        'w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 h-full',
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:relative md:translate-x-0 md:z-auto',
      ].join(' ')}
    >
      {/* Header */}
      <div className="p-5 border-b border-slate-700">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl font-black text-white">A360</span>
        </div>
        <p className="text-sm font-medium text-slate-200 truncate">{user?.tenant?.name}</p>
        <span className={`mt-1 inline-block text-xs px-2 py-0.5 rounded-full text-white ${planColor}`}>
          {planActual}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        {/* Notifications */}
        <NavLink
          to="/notificaciones"
          onClick={onClose}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-indigo-600 text-white'
                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
            }`
          }
        >
          <span>🔔</span>
          <span className="flex-1">Notificaciones</span>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </NavLink>

        {/* Separador */}
        <div className="border-t border-slate-700 my-1" />

        {/* Gestión */}
        {[
          { to: '/equipo', label: 'Equipo', emoji: '👤' },
          { to: '/mi-plan', label: 'Mi plan', emoji: '⭐' },
          { to: '/api-keys', label: 'API Keys', emoji: '🔑' },
        ].map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-400 hover:bg-slate-700 hover:text-white'
              }`
            }
          >
            <span>{item.emoji}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Trial banner */}
      {mostrarTrial && trialInfo && (
        <div
          className={`mx-3 mb-3 rounded-lg px-3 py-2.5 text-xs ${
            trialInfo.daysRemaining <= 3
              ? 'bg-red-900/60 text-red-200 border border-red-700'
              : 'bg-indigo-800/60 text-indigo-200 border border-indigo-700'
          }`}
        >
          <p className="font-semibold">
            {trialInfo.daysRemaining <= 3 ? '⚠️' : '🎉'} Trial gratis:{' '}
            {trialInfo.daysRemaining === 0 ? 'último día' : `${trialInfo.daysRemaining} días restantes`}
          </p>
          <NavLink to="/planes" onClick={onClose} className="mt-1 underline hover:no-underline font-medium">Activar plan →</NavLink>
        </div>
      )}

      {/* User footer */}
      <div className="p-4 border-t border-slate-700">
        <p className="text-sm font-medium text-slate-200 truncate">{user?.name}</p>
        <p className="text-xs text-slate-400 truncate">{user?.email}</p>
        {user?.role === 'SUPERADMIN' && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className="mt-2 block text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            ⚙️ Panel Admin →
          </NavLink>
        )}
        <button
          onClick={logout}
          className="mt-3 w-full text-left text-xs text-slate-400 hover:text-red-400 transition-colors"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}
