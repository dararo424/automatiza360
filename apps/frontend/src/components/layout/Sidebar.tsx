import { NavLink } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutGrid, UtensilsCrossed, Package, ChefHat, Wrench, FileText, Boxes,
  ShieldCheck, CalendarDays, ShoppingCart, Ruler, Dumbbell, PawPrint,
  BedDouble, Croissant, MessageCircle, Users, Megaphone, Zap, CreditCard,
  Wallet, Truck, Tag, Star, CalendarClock, Bot, Settings, Bell, TrendingUp,
  UserRound, Crown, KeyRound, Building2, type LucideIcon,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { getNotificaciones } from '../../api/notificaciones';
import { getTrialInfo } from '../../api/subscriptions';
import type { Industry } from '../../types';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

interface NavSection {
  label?: string;
  items: NavItem[];
}

const PLAN_STYLES: Record<string, string> = {
  STARTER: 'bg-white/10 text-bone ring-white/20',
  PRO: 'bg-lima text-ink ring-lima',
  BUSINESS: 'bg-amber-400 text-ink ring-amber-400',
};

const CLIENTES: NavItem[] = [
  { to: '/conversaciones', label: 'Conversaciones', icon: MessageCircle },
  { to: '/contactos', label: 'Contactos', icon: Users },
  { to: '/campañas', label: 'Campañas', icon: Megaphone },
  { to: '/flujos', label: 'Flujos WhatsApp', icon: Zap },
];

const FINANZAS: NavItem[] = [
  { to: '/gastos', label: 'Gastos', icon: CreditCard },
  { to: '/caja', label: 'Caja', icon: Wallet },
  { to: '/compras', label: 'Proveedores', icon: Truck },
];

const HERRAMIENTAS: NavItem[] = [
  { to: '/cupones', label: 'Cupones', icon: Tag },
  { to: '/resenas', label: 'Reseñas', icon: Star },
  { to: '/turnos', label: 'Turnos', icon: CalendarClock },
  { to: '/automaciones', label: 'Automatizaciones', icon: Bot },
  { to: '/configuracion', label: 'Configuración', icon: Settings },
];

function getSections(industry: Industry): NavSection[] {
  const dashboard: NavItem = { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid };

  const operacionesPorIndustria: Record<string, NavItem[]> = {
    RESTAURANT: [
      { to: '/ordenes', label: 'Órdenes', icon: UtensilsCrossed },
      { to: '/productos', label: 'Productos', icon: Package },
      { to: '/menu-dia', label: 'Menú del día', icon: ChefHat },
    ],
    TECH_STORE: [
      { to: '/tickets', label: 'Tickets', icon: Wrench },
      { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
      { to: '/inventario', label: 'Inventario', icon: Boxes },
      { to: '/garantias', label: 'Garantías', icon: ShieldCheck },
    ],
    CLINIC: [
      { to: '/agenda', label: 'Agenda', icon: CalendarDays },
    ],
    BEAUTY: [
      { to: '/agenda', label: 'Agenda', icon: CalendarDays },
    ],
    CLOTHING_STORE: [
      { to: '/productos', label: 'Productos', icon: Package },
      { to: '/inventario', label: 'Inventario', icon: Boxes },
      { to: '/ordenes', label: 'Órdenes', icon: ShoppingCart },
      { to: '/tallas', label: 'Tallas', icon: Ruler },
    ],
    PHARMACY: [
      { to: '/productos', label: 'Productos', icon: Package },
      { to: '/inventario', label: 'Inventario', icon: Boxes },
      { to: '/ordenes', label: 'Órdenes', icon: ShoppingCart },
    ],
    GYM: [
      { to: '/productos', label: 'Membresías', icon: Dumbbell },
      { to: '/agenda', label: 'Clases', icon: CalendarDays },
    ],
    VETERINARY: [
      { to: '/agenda', label: 'Citas', icon: CalendarDays },
      { to: '/tickets', label: 'Historial Mascotas', icon: PawPrint },
    ],
    HOTEL: [
      { to: '/agenda', label: 'Reservas', icon: BedDouble },
    ],
    BAKERY: [
      { to: '/ordenes', label: 'Órdenes', icon: Croissant },
      { to: '/menu-dia', label: 'Menú del día', icon: ChefHat },
      { to: '/productos', label: 'Productos', icon: Package },
    ],
    WORKSHOP: [
      { to: '/tickets', label: 'Tickets', icon: Wrench },
      { to: '/cotizaciones', label: 'Cotizaciones', icon: FileText },
      { to: '/inventario', label: 'Inventario', icon: Boxes },
    ],
  };

  const operaciones = operacionesPorIndustria[industry] ?? [];

  const sections: NavSection[] = [
    { items: [dashboard] },
  ];

  if (operaciones.length > 0) {
    sections.push({ label: 'Operaciones', items: operaciones });
  }

  sections.push({ label: 'Clientes', items: CLIENTES });
  sections.push({ label: 'Finanzas', items: FINANZAS });
  sections.push({ label: 'Herramientas', items: HERRAMIENTAS });

  return sections;
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
  const sections = getSections(industry as Industry);
  const planActual = user?.tenant?.subscriptionPlan || user?.tenant?.plan || 'STARTER';
  const planStyle = PLAN_STYLES[planActual] ?? PLAN_STYLES.STARTER;
  const mostrarTrial =
    user?.tenant?.subscriptionStatus !== 'ACTIVE' &&
    !!user?.tenant?.trialEndsAt &&
    new Date(user.tenant.trialEndsAt) > new Date();

  const linkClass = (isActive: boolean) =>
    `group flex items-center gap-3 px-3 py-2 rounded-lg text-[13.5px] font-medium transition-all ${
      isActive
        ? 'bg-lima text-ink font-semibold shadow-pop-sm'
        : 'text-bone/70 hover:bg-white/5 hover:text-bone'
    }`;

  return (
    <aside
      className={[
        'w-64 bg-ink text-bone flex flex-col flex-shrink-0 h-full',
        'fixed inset-y-0 left-0 z-50 transition-transform duration-300 ease-in-out',
        isMobileOpen ? 'translate-x-0' : '-translate-x-full',
        'md:relative md:translate-x-0 md:z-auto',
      ].join(' ')}
    >
      {/* Header / wordmark */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10">
        <div className="flex items-baseline gap-0.5 mb-3 select-none">
          <span className="font-display text-[22px] font-bold tracking-tight text-bone">automatiza</span>
          <span className="font-display text-[22px] font-bold tracking-tight text-lima">360°</span>
        </div>
        <p className="text-sm font-medium text-bone/90 truncate">{user?.tenant?.name}</p>
        <span className={`mt-1.5 inline-block chip ${planStyle}`}>
          {planActual}
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-5">
        {sections.map((section, i) => (
          <div key={i}>
            {section.label && (
              <p className="px-3 mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-bone/40">
                {section.label}
              </p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={onClose}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  <item.icon size={17} strokeWidth={2} aria-hidden className="flex-shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}

        {/* Cuenta */}
        <div>
          <p className="px-3 mb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-bone/40">
            Cuenta
          </p>
          <div className="space-y-0.5">
            <NavLink
              to="/notificaciones"
              onClick={onClose}
              className={({ isActive }) => linkClass(isActive)}
            >
              <Bell size={17} strokeWidth={2} aria-hidden className="flex-shrink-0" />
              <span className="flex-1">Notificaciones</span>
              {unreadCount > 0 && (
                <span className="bg-lima text-ink font-mono text-[10px] font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </NavLink>

            <NavLink to="/nps" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
              <TrendingUp size={17} strokeWidth={2} aria-hidden className="flex-shrink-0" />
              <span>NPS</span>
            </NavLink>

            <NavLink to="/equipo" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
              <UserRound size={17} strokeWidth={2} aria-hidden className="flex-shrink-0" />
              <span>Equipo</span>
            </NavLink>

            <NavLink to="/mi-plan" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
              <Crown size={17} strokeWidth={2} aria-hidden className="flex-shrink-0" />
              <span>Mi plan</span>
            </NavLink>

            <NavLink to="/api-keys" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
              <KeyRound size={17} strokeWidth={2} aria-hidden className="flex-shrink-0" />
              <span>API Keys</span>
            </NavLink>

            {user?.role === 'OWNER' && (
              <NavLink to="/sucursales" onClick={onClose} className={({ isActive }) => linkClass(isActive)}>
                <Building2 size={17} strokeWidth={2} aria-hidden className="flex-shrink-0" />
                <span>Sucursales</span>
              </NavLink>
            )}
          </div>
        </div>
      </nav>

      {/* Trial banner */}
      {mostrarTrial && trialInfo && (
        <div
          className={`mx-3 mb-3 rounded-xl px-3.5 py-3 text-xs border-2 ${
            trialInfo.daysRemaining <= 3
              ? 'bg-red-950/60 text-red-200 border-red-500/60'
              : 'bg-lima/10 text-lima border-lima/40'
          }`}
        >
          <p className="font-display font-semibold">
            Trial gratis · {trialInfo.daysRemaining === 0 ? 'último día' : `${trialInfo.daysRemaining} días restantes`}
          </p>
          <NavLink to="/planes" onClick={onClose} className="mt-1 inline-block underline underline-offset-2 hover:no-underline font-medium">
            Activar plan →
          </NavLink>
        </div>
      )}

      {/* User footer */}
      <div className="p-4 border-t border-white/10">
        <p className="text-sm font-medium text-bone truncate">{user?.name}</p>
        <p className="text-xs text-bone/50 truncate font-mono">{user?.email}</p>
        {user?.role === 'SUPERADMIN' && (
          <NavLink
            to="/admin"
            onClick={onClose}
            className="mt-2 block text-xs text-amber-400 hover:text-amber-300 transition-colors"
          >
            Panel Admin →
          </NavLink>
        )}
        <button
          onClick={logout}
          className="mt-3 w-full text-left text-xs text-bone/50 hover:text-lima transition-colors"
        >
          Cerrar sesión →
        </button>
      </div>
    </aside>
  );
}
