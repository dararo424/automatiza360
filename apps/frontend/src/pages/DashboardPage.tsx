import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { getOrdenes } from '../api/ordenes';
import { getProductos } from '../api/productos';
import { getTickets } from '../api/tickets';
import { getAlertas } from '../api/inventario';
import { getCotizaciones } from '../api/cotizaciones';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

function RestaurantDashboard() {
  const { data: ordenes = [], isLoading: loadingOrdenes } = useQuery({
    queryKey: ['ordenes'],
    queryFn: () => getOrdenes(),
  });
  const { data: productos = [], isLoading: loadingProductos } = useQuery({
    queryKey: ['productos'],
    queryFn: getProductos,
  });

  if (loadingOrdenes || loadingProductos) return <LoadingSpinner />;

  const pendientes = ordenes.filter((o) => o.status === 'PENDING').length;
  const activos = productos.filter((p) => p.active).length;
  const recientes = ordenes.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Órdenes" value={ordenes.length} colorClass="border-indigo-500" emoji="🍽️" />
        <StatCard title="Órdenes Pendientes" value={pendientes} colorClass="border-yellow-500" emoji="⏳" />
        <StatCard title="Total Productos" value={productos.length} colorClass="border-blue-500" emoji="📦" />
        <StatCard title="Productos Activos" value={activos} colorClass="border-green-500" emoji="✅" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">Órdenes recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    No hay órdenes
                  </td>
                </tr>
              ) : (
                recientes.map((o) => (
                  <tr key={o.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium">#{o.number}</td>
                    <td className="px-4 py-3">
                      <Badge status={o.status} type="order" />
                    </td>
                    <td className="px-4 py-3 font-medium">${o.total.toFixed(2)}</td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(o.createdAt).toLocaleDateString('es')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function TechStoreDashboard() {
  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['tickets'],
    queryFn: () => getTickets(),
  });
  const { data: alertas = [], isLoading: loadingAlertas } = useQuery({
    queryKey: ['inventario-alertas'],
    queryFn: getAlertas,
  });
  const { data: cotizaciones = [], isLoading: loadingCot } = useQuery({
    queryKey: ['cotizaciones'],
    queryFn: () => getCotizaciones(),
  });

  if (loadingTickets || loadingAlertas || loadingCot) return <LoadingSpinner />;

  const abiertos = tickets.filter(
    (t) => t.status !== 'DELIVERED' && t.status !== 'CANCELLED',
  ).length;
  const pendientesCot = cotizaciones.filter(
    (c) => c.status === 'SENT' || c.status === 'DRAFT',
  ).length;
  const recientes = tickets.slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Total Tickets" value={tickets.length} colorClass="border-indigo-500" emoji="🔧" />
        <StatCard title="Tickets Abiertos" value={abiertos} colorClass="border-yellow-500" emoji="⏳" />
        <StatCard title="Alertas de Stock" value={alertas.length} colorClass="border-red-500" emoji="⚠️" />
        <StatCard title="Cotizaciones Pendientes" value={pendientesCot} colorClass="border-blue-500" emoji="📄" />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        <div className="p-4 border-b border-slate-200">
          <h2 className="text-base font-semibold text-slate-800">Tickets recientes</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500 border-b border-slate-100">
                <th className="px-4 py-3 font-medium">#</th>
                <th className="px-4 py-3 font-medium">Cliente</th>
                <th className="px-4 py-3 font-medium">Dispositivo</th>
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {recientes.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                    No hay tickets
                  </td>
                </tr>
              ) : (
                recientes.map((t) => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-medium">#{t.number}</td>
                    <td className="px-4 py-3">{t.clientName}</td>
                    <td className="px-4 py-3 text-slate-600">{t.device}</td>
                    <td className="px-4 py-3">
                      <Badge status={t.status} type="ticket" />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {new Date(t.createdAt).toLocaleDateString('es')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function DashboardPage() {
  const { user } = useAuth();
  const industry = user?.tenant?.industry;

  if (industry === 'RESTAURANT') return <RestaurantDashboard />;
  if (industry === 'TECH_STORE') return <TechStoreDashboard />;

  return (
    <div className="flex items-center justify-center h-64">
      <p className="text-slate-500">Bienvenido a Automatiza360</p>
    </div>
  );
}
