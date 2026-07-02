import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoadingSpinner } from './components/ui/LoadingSpinner';
import { LoginPage } from './pages/LoginPage';

// Code-splitting por ruta: cada página se descarga solo cuando se visita
const OnboardingPage = lazy(() => import('./pages/onboarding/OnboardingPage').then((m) => ({ default: m.OnboardingPage })));
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const OrdenesPage = lazy(() => import('./pages/ordenes/OrdenesPage').then((m) => ({ default: m.OrdenesPage })));
const ProductosPage = lazy(() => import('./pages/productos/ProductosPage').then((m) => ({ default: m.ProductosPage })));
const TicketsPage = lazy(() => import('./pages/tickets/TicketsPage').then((m) => ({ default: m.TicketsPage })));
const CotizacionesPage = lazy(() => import('./pages/cotizaciones/CotizacionesPage').then((m) => ({ default: m.CotizacionesPage })));
const InventarioPage = lazy(() => import('./pages/inventario/InventarioPage').then((m) => ({ default: m.InventarioPage })));
const NotificacionesPage = lazy(() => import('./pages/notificaciones/NotificacionesPage').then((m) => ({ default: m.NotificacionesPage })));
const AgendaPage = lazy(() => import('./pages/agenda/AgendaPage').then((m) => ({ default: m.AgendaPage })));
const PlanesPage = lazy(() => import('./pages/planes/PlanesPage').then((m) => ({ default: m.PlanesPage })));
const PagoResultadoPage = lazy(() => import('./pages/planes/PagoResultadoPage').then((m) => ({ default: m.PagoResultadoPage })));
const ConversacionesPage = lazy(() => import('./pages/conversaciones/ConversacionesPage').then((m) => ({ default: m.ConversacionesPage })));
const PlanPortalPage = lazy(() => import('./pages/plan/PlanPortalPage').then((m) => ({ default: m.PlanPortalPage })));
const MenuDiaPage = lazy(() => import('./pages/menu-dia/MenuDiaPage').then((m) => ({ default: m.MenuDiaPage })));
const ContactosPage = lazy(() => import('./pages/contactos/ContactosPage').then((m) => ({ default: m.ContactosPage })));
const EquipoPage = lazy(() => import('./pages/equipo/EquipoPage').then((m) => ({ default: m.EquipoPage })));
const ApiKeysPage = lazy(() => import('./pages/api-keys/ApiKeysPage').then((m) => ({ default: m.ApiKeysPage })));
const AdminLayout = lazy(() => import('./pages/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })));
const AdminPage = lazy(() => import('./pages/admin/AdminPage').then((m) => ({ default: m.AdminPage })));
const AdminTenantsPage = lazy(() => import('./pages/admin/AdminTenantsPage').then((m) => ({ default: m.AdminTenantsPage })));
const AdminTenantDetailPage = lazy(() => import('./pages/admin/AdminTenantDetailPage').then((m) => ({ default: m.AdminTenantDetailPage })));
const GastosPage = lazy(() => import('./pages/gastos/GastosPage').then((m) => ({ default: m.GastosPage })));
const CampañasPage = lazy(() => import('./pages/campañas/CampañasPage').then((m) => ({ default: m.CampañasPage })));
const GarantiasPage = lazy(() => import('./pages/garantias/GarantiasPage').then((m) => ({ default: m.GarantiasPage })));
const MenuPublicoPage = lazy(() => import('./pages/menu-publico/MenuPublicoPage').then((m) => ({ default: m.MenuPublicoPage })));
const PerfilPublicoPage = lazy(() => import('./pages/perfil-publico/PerfilPublicoPage').then((m) => ({ default: m.PerfilPublicoPage })));
const ConfiguracionPage = lazy(() => import('./pages/configuracion/ConfiguracionPage').then((m) => ({ default: m.ConfiguracionPage })));
const AutomacionesPage = lazy(() => import('./pages/automaciones/AutomacionesPage').then((m) => ({ default: m.AutomacionesPage })));
const ResenasPage = lazy(() => import('./pages/resenas/ResenasPage').then((m) => ({ default: m.ResenasPage })));
const ComprasPage = lazy(() => import('./pages/compras/ComprasPage').then((m) => ({ default: m.ComprasPage })));
const TurnosPage = lazy(() => import('./pages/turnos/TurnosPage').then((m) => ({ default: m.TurnosPage })));
const CuponesPage = lazy(() => import('./pages/cupones/CuponesPage').then((m) => ({ default: m.CuponesPage })));
const CajaPage = lazy(() => import('./pages/caja/CajaPage').then((m) => ({ default: m.CajaPage })));
const FlujoPage = lazy(() => import('./pages/flujos/FlujoPage').then((m) => ({ default: m.FlujoPage })));
const NpsPage = lazy(() => import('./pages/nps/NpsPage').then((m) => ({ default: m.NpsPage })));
const SucursalesPage = lazy(() => import('./pages/sucursales/SucursalesPage').then((m) => ({ default: m.SucursalesPage })));
const TallasPage = lazy(() => import('./pages/tallas/TallasPage').then((m) => ({ default: m.TallasPage })));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })));
const AutoLoginPage = lazy(() => import('./pages/auth/AutoLoginPage').then((m) => ({ default: m.AutoLoginPage })));

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-bone flex flex-col items-center justify-center p-8 text-center">
      <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-slate-500 mb-3">Error 404</p>
      <h1 className="font-display text-5xl font-bold text-ink mb-3">Página no encontrada</h1>
      <p className="text-slate-500 mb-8 max-w-sm">
        La página que buscas no existe o fue movida.
      </p>
      <Link to="/dashboard" className="btn-lima">
        Volver al panel →
      </Link>
    </div>
  );
}

function PageFallback() {
  return (
    <div className="h-full min-h-[40vh] w-full flex items-center justify-center">
      <LoadingSpinner />
    </div>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auto-login" element={<AutoLoginPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/menu/:slug" element={<MenuPublicoPage />} />
            <Route path="/negocio/:slug" element={<PerfilPublicoPage />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/ordenes" element={<OrdenesPage />} />
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/tickets" element={<TicketsPage />} />
              <Route path="/cotizaciones" element={<CotizacionesPage />} />
              <Route path="/inventario" element={<InventarioPage />} />
              <Route path="/notificaciones" element={<NotificacionesPage />} />
              <Route path="/agenda" element={<AgendaPage />} />
              <Route path="/planes" element={<PlanesPage />} />
              <Route path="/pago-resultado" element={<PagoResultadoPage />} />
              <Route path="/conversaciones" element={<ConversacionesPage />} />
              <Route path="/mi-plan" element={<PlanPortalPage />} />
              <Route path="/menu-dia" element={<MenuDiaPage />} />
              <Route path="/contactos" element={<ContactosPage />} />
              <Route path="/equipo" element={<EquipoPage />} />
              <Route path="/api-keys" element={<ApiKeysPage />} />
              <Route path="/gastos" element={<GastosPage />} />
              <Route path="/campañas" element={<CampañasPage />} />
              <Route path="/garantias" element={<GarantiasPage />} />
              <Route path="/configuracion" element={<ConfiguracionPage />} />
              <Route path="/automaciones" element={<AutomacionesPage />} />
              <Route path="/resenas" element={<ResenasPage />} />
              <Route path="/compras" element={<ComprasPage />} />
              <Route path="/turnos" element={<TurnosPage />} />
              <Route path="/cupones" element={<CuponesPage />} />
              <Route path="/caja" element={<CajaPage />} />
              <Route path="/flujos" element={<FlujoPage />} />
              <Route path="/nps" element={<NpsPage />} />
              <Route path="/sucursales" element={<SucursalesPage />} />
              <Route path="/tallas" element={<TallasPage />} />
            </Route>
            <Route element={<AdminLayout />}>
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/admin/tenants" element={<AdminTenantsPage />} />
              <Route path="/admin/tenants/:id" element={<AdminTenantDetailPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  );
}
