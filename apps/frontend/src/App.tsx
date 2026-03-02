import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { OrdenesPage } from './pages/ordenes/OrdenesPage';
import { ProductosPage } from './pages/productos/ProductosPage';
import { TicketsPage } from './pages/tickets/TicketsPage';
import { CotizacionesPage } from './pages/cotizaciones/CotizacionesPage';
import { InventarioPage } from './pages/inventario/InventarioPage';
import { NotificacionesPage } from './pages/notificaciones/NotificacionesPage';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/ordenes" element={<OrdenesPage />} />
            <Route path="/productos" element={<ProductosPage />} />
            <Route path="/tickets" element={<TicketsPage />} />
            <Route path="/cotizaciones" element={<CotizacionesPage />} />
            <Route path="/inventario" element={<InventarioPage />} />
            <Route path="/notificaciones" element={<NotificacionesPage />} />
          </Route>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
