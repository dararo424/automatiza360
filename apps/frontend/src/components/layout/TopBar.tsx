import { useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/ordenes': 'Órdenes',
  '/productos': 'Productos',
  '/tickets': 'Tickets',
  '/cotizaciones': 'Cotizaciones',
  '/inventario': 'Inventario',
  '/notificaciones': 'Notificaciones',
  '/agenda': 'Agenda',
};

const ROL_LABELS: Record<string, string> = {
  OWNER: 'Propietario',
  ADMIN: 'Administrador',
  STAFF: 'Personal',
};

export function TopBar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const title = PAGE_TITLES[pathname] ?? 'Automatiza360';
  const initials = user?.name
    ? user.name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <header className="bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-6 flex-shrink-0">
      <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-slate-700">{user?.name}</p>
          <p className="text-xs text-slate-500">{ROL_LABELS[user?.role ?? ''] ?? user?.role}</p>
        </div>
        <div className="h-9 w-9 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
