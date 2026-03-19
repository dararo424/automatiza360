import { useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
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

interface TopBarProps {
  onMenuToggle: () => void;
  isMobileOpen: boolean;
}

export function TopBar({ onMenuToggle, isMobileOpen }: TopBarProps) {
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
    <header className="bg-white border-b border-slate-200 shadow-sm h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          aria-label="Menú"
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <h1 className="text-xl font-semibold text-slate-800">{title}</h1>
      </div>
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
