import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdenesPage } from './pages/ordenes/OrdenesPage';
import { ProductosPage } from './pages/productos/ProductosPage';
import { TicketsPage } from './pages/tickets/TicketsPage';
import { CotizacionesPage } from './pages/cotizaciones/CotizacionesPage';
import { InventarioPage } from './pages/inventario/InventarioPage';
import { NotificacionesPage } from './pages/notificaciones/NotificacionesPage';
import { AgendaPage } from './pages/agenda/AgendaPage';
import { PlanesPage } from './pages/planes/PlanesPage';
import { PagoResultadoPage } from './pages/planes/PagoResultadoPage';
import { ConversacionesPage } from './pages/conversaciones/ConversacionesPage';
import { PlanPortalPage } from './pages/plan/PlanPortalPage';
import { MenuDiaPage } from './pages/menu-dia/MenuDiaPage';
import { ContactosPage } from './pages/contactos/ContactosPage';
import { EquipoPage } from './pages/equipo/EquipoPage';
import { ApiKeysPage } from './pages/api-keys/ApiKeysPage';
import { AdminLayout } from './pages/admin/AdminLayout';
import { AdminPage } from './pages/admin/AdminPage';
import { AdminTenantsPage } from './pages/admin/AdminTenantsPage';
import { AdminTenantDetailPage } from './pages/admin/AdminTenantDetailPage';
import { GastosPage } from './pages/gastos/GastosPage';
import { CampañasPage } from './pages/campañas/CampañasPage';
import { GarantiasPage } from './pages/garantias/GarantiasPage';
import { MenuPublicoPage } from './pages/menu-publico/MenuPublicoPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/menu/:slug" element={<MenuPublicoPage />} />
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
          </Route>
          <Route element={<AdminLayout />}>
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/tenants" element={<AdminTenantsPage />} />
            <Route path="/admin/tenants/:id" element={<AdminTenantDetailPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
