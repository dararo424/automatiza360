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
  '/menu-dia': 'Menú del día',
  '/conversaciones': 'Conversaciones',
  '/contactos': 'Contactos',
  '/campañas': 'Campañas',
  '/flujos': 'Flujos WhatsApp',
  '/gastos': 'Gastos',
  '/caja': 'Caja',
  '/compras': 'Proveedores',
  '/cupones': 'Cupones',
  '/resenas': 'Reseñas',
  '/turnos': 'Turnos',
  '/automaciones': 'Automatizaciones',
  '/configuracion': 'Configuración',
  '/nps': 'NPS',
  '/equipo': 'Equipo',
  '/mi-plan': 'Mi plan',
  '/planes': 'Planes',
  '/api-keys': 'API Keys',
  '/sucursales': 'Sucursales',
  '/garantias': 'Garantías',
  '/tallas': 'Tallas',
  '/pago-resultado': 'Resultado del pago',
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
    <header className="bg-bone border-b border-bone-deep h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-ink hover:bg-bone-deep transition-colors"
          aria-label="Menú"
        >
          {isMobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <h1 className="font-display text-xl font-bold text-ink">{title}</h1>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right hidden sm:block">
          <p className="text-sm font-medium text-ink">{user?.name}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate-500">
            {ROL_LABELS[user?.role ?? ''] ?? user?.role}
          </p>
        </div>
        <div className="h-9 w-9 rounded-full bg-lima border-2 border-ink flex items-center justify-center text-ink text-sm font-display font-bold">
          {initials}
        </div>
      </div>
    </header>
  );
}
