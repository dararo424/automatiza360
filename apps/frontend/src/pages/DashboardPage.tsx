import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getMetricasDashboard } from '../api/dashboard';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const APPOINTMENT_COLORS: Record<string, string> = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
  COMPLETED: 'bg-slate-100 text-slate-800',
  NO_SHOW: 'bg-orange-100 text-orange-800',
};
const APPOINTMENT_LABELS: Record<string, string> = {
  SCHEDULED: 'Agendada',
  CONFIRMED: 'Confirmada',
  CANCELLED: 'Cancelada',
  COMPLETED: 'Completada',
  NO_SHOW: 'No asistió',
};

function AppointmentBadge({ status }: { status: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${APPOINTMENT_COLORS[status] ?? 'bg-gray-100 text-gray-800'}`}>
      {APPOINTMENT_LABELS[status] ?? status}
    </span>
  );
}

function RestaurantDashboard() {
  const { data: m, isLoading } = useQuery({
    queryKey: ['dashboard-metricas'],
    queryFn: getMetricasDashboard,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!m) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Órdenes hoy" value={m.ordenesHoy} colorClass="border-indigo-500" emoji="📦" />
        <StatCard title="Órdenes este mes" value={m.ordenesMes} colorClass="border-blue-500" emoji="📅" />
        <StatCard
          title="Ingresos este mes"
          value={`$${m.ingresosMes.toLocaleString('es-CO')}`}
          colorClass="border-green-500"
          emoji="💰"
        />
        <StatCard title="Conversaciones este mes" value={m.conversacionesMes} colorClass="border-purple-500" emoji="💬" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total productos activos" value={m.totalProductos} colorClass="border-slate-400" emoji="📦" />
        <StatCard title="Stock bajo (< 5 uds)" value={m.productosStockBajo} colorClass="border-red-400" emoji="⚠️" />
      </div>

      <RecentActivity m={m} type="order" linkTo="/ordenes" />
    </div>
  );
}

function TechStoreDashboard() {
  const { data: m, isLoading } = useQuery({
    queryKey: ['dashboard-metricas'],
    queryFn: getMetricasDashboard,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!m) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Órdenes hoy" value={m.ordenesHoy} colorClass="border-indigo-500" emoji="📦" />
        <StatCard title="Órdenes este mes" value={m.ordenesMes} colorClass="border-blue-500" emoji="📅" />
        <StatCard title="Tickets abiertos" value={m.ticketsAbiertos} colorClass="border-yellow-500" emoji="🎫" />
        <StatCard title="Resueltos hoy" value={m.ticketsResueltosHoy} colorClass="border-green-500" emoji="✅" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total productos activos" value={m.totalProductos} colorClass="border-slate-400" emoji="📦" />
        <StatCard title="Conversaciones este mes" value={m.conversacionesMes} colorClass="border-purple-500" emoji="💬" />
      </div>

      <RecentActivity m={m} type="order" linkTo="/ordenes" />
    </div>
  );
}

function ClinicBeautyDashboard() {
  const { data: m, isLoading } = useQuery({
    queryKey: ['dashboard-metricas'],
    queryFn: getMetricasDashboard,
    refetchInterval: 60_000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!m) return null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Citas hoy" value={m.citasHoy} colorClass="border-indigo-500" emoji="📅" />
        <StatCard title="Citas este mes" value={m.citasMes} colorClass="border-blue-500" emoji="📅" />
        <StatCard title="Citas pendientes" value={m.citasPendientes} colorClass="border-yellow-500" emoji="⏳" />
        <StatCard title="Conversaciones este mes" value={m.conversacionesMes} colorClass="border-purple-500" emoji="💬" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard title="Total servicios activos" value={m.totalProductos} colorClass="border-slate-400" emoji="💅" />
        <StatCard
          title="Ingresos este mes"
          value={`$${m.ingresosMes.toLocaleString('es-CO')}`}
          colorClass="border-green-500"
          emoji="💰"
        />
      </div>

      <RecentActivity m={m} type="appointment" linkTo="/agenda" />
    </div>
  );
}

function RecentActivity({
  m,
  type,
  linkTo,
}: {
  m: ReturnType<typeof getMetricasDashboard> extends Promise<infer T> ? T : never;
  type: 'order' | 'appointment';
  linkTo: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200">
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-800">Actividad reciente</h2>
        <Link to={linkTo} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
          Ver todas →
        </Link>
      </div>
      <div className="overflow-x-auto">
        {type === 'order' ? (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {m.ultimasOrdenes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No hay órdenes recientes</td>
                </tr>
              ) : (
                m.ultimasOrdenes.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{o.clienteNombre}</td>
                    <td className="px-4 py-3 font-medium">${o.total.toLocaleString('es-CO')}</td>
                    <td className="px-4 py-3"><Badge status={o.status} type="order" /></td>
                    <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">Paciente / Cliente</th>
                <th className="px-4 py-3 font-medium">Servicio</th>
                <th className="px-4 py-3 font-medium">Fecha / Hora</th>
                <th className="px-4 py-3 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {m.ultimasCitas.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">No hay citas recientes</td>
                </tr>
              ) : (
                m.ultimasCitas.map((c) => (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 text-slate-700">{c.clienteName}</td>
                    <td className="px-4 py-3 text-slate-600">{c.serviceName}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(c.date).toLocaleString('es-CO', {
                        timeZone: 'America/Bogota',
                        day: '2-digit', month: '2-digit',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3"><AppointmentBadge status={c.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const industry = user?.tenant?.industry;

  if (industry === 'RESTAURANT') return <RestaurantDashboard />;
  if (industry === 'TECH_STORE') return <TechStoreDashboard />;
  if (industry === 'CLINIC' || industry === 'BEAUTY') return <ClinicBeautyDashboard />;

  // OTHER / fallback — muestra métricas genéricas
  return <RestaurantDashboard />;
}
