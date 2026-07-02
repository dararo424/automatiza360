import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { OnboardingChecklist } from '../components/onboarding/OnboardingChecklist';
import { getDatosEjemplo, eliminarDatosEjemplo } from '../api/onboarding';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getMetricasDashboard, getTendencias, getRoi } from '../api/dashboard';
import { QrCard } from '../components/ui/QrCard';
import { StatCard } from '../components/ui/StatCard';
import { Badge } from '../components/ui/Badge';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { getResenasStats } from '../api/resenas';
import { getNpsStats } from '../api/nps';

function TendenciasChart({ showCitas = false, showOrdenes = true }: { showCitas?: boolean; showOrdenes?: boolean }) {
  const { data: tendencias = [], isLoading } = useQuery({
    queryKey: ['dashboard-tendencias'],
    queryFn: () => getTendencias(30),
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <div className="h-48 flex items-center justify-center text-slate-400 text-sm">Cargando tendencias...</div>;
  if (!tendencias.length) return null;

  const chartData = tendencias.map((d) => ({
    ...d,
    fecha: new Date(d.date).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' }),
    ingresosK: Math.round(d.ingresos / 1000),
  }));

  return (
    <div className="card p-4">
      <p className="label-mono mb-1">Últimos 30 días</p>
      <h2 className="font-display text-base font-bold text-ink mb-4">Tendencias</h2>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eceae2" />
          <XAxis
            dataKey="fecha"
            tick={{ fontSize: 11, fill: '#94927f' }}
            interval={4}
            tickLine={false}
            axisLine={false}
          />
          <YAxis tick={{ fontSize: 11, fill: '#94927f' }} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 12, border: '1px solid #101b10', boxShadow: '3px 3px 0 0 #101b10' }}
            formatter={(value) => {
              const num = typeof value === 'number' ? value : 0;
              if (String(value).includes('.')) return [`$${num}k`, ''];
              return [num, ''];
            }}
          />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          {showOrdenes && (
            <Line
              type="monotone"
              dataKey="ordenes"
              name="Órdenes"
              stroke="#2c7229"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
          {showCitas && (
            <Line
              type="monotone"
              dataKey="citas"
              name="Citas"
              stroke="#1e7864"
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4 }}
            />
          )}
          <Line
            type="monotone"
            dataKey="ingresosK"
            name="Ingresos (k)"
            stroke="#d97706"
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
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
        <StatCard title="Órdenes hoy" value={m.ordenesHoy} colorClass="border-selva-600" emoji="📦"
          trend={{ current: m.ordenesHoy, previous: m.ordenesAyer, label: 'vs ayer' }} />
        <StatCard title="Órdenes este mes" value={m.ordenesMes} colorClass="border-rio-500" emoji="📅" />
        <StatCard
          title="Ingresos este mes"
          value={`$${m.ingresosMes.toLocaleString('es-CO')}`}
          colorClass="border-lima-dim"
          emoji="💰"
          trend={{ current: m.ingresosMes, previous: m.ingresosAyer * 30, label: 'est.' }}
        />
        <StatCard title="Conversaciones este mes" value={m.conversacionesMes} colorClass="border-amber-500" emoji="💬" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total productos activos" value={m.totalProductos} colorClass="border-slate-400" emoji="📦" />
        <StatCard title="Stock bajo (< 5 uds)" value={m.productosStockBajo} colorClass="border-red-400" emoji="⚠️" />
        <StatCard title="Contactos nuevos (7 días)" value={m.contactosNuevosSemana} colorClass="border-rio-400" emoji="👥"
          subtitle={`${m.contactosTotales} total`} />
      </div>

      <TendenciasChart showOrdenes showCitas={false} />
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
        <StatCard title="Órdenes hoy" value={m.ordenesHoy} colorClass="border-selva-600" emoji="📦"
          trend={{ current: m.ordenesHoy, previous: m.ordenesAyer, label: 'vs ayer' }} />
        <StatCard title="Órdenes este mes" value={m.ordenesMes} colorClass="border-rio-500" emoji="📅" />
        <StatCard title="Tickets abiertos" value={m.ticketsAbiertos} colorClass="border-amber-500" emoji="🎫" />
        <StatCard title="Resueltos hoy" value={m.ticketsResueltosHoy} colorClass="border-lima-dim" emoji="✅" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total productos activos" value={m.totalProductos} colorClass="border-slate-400" emoji="📦" />
        <StatCard title="Conversaciones este mes" value={m.conversacionesMes} colorClass="border-amber-500" emoji="💬" />
        <StatCard title="Contactos nuevos (7 días)" value={m.contactosNuevosSemana} colorClass="border-rio-400" emoji="👥"
          subtitle={`${m.contactosTotales} total`} />
      </div>

      <TendenciasChart showOrdenes showCitas={false} />
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
        <StatCard title="Citas hoy" value={m.citasHoy} colorClass="border-selva-600" emoji="📅"
          trend={{ current: m.citasHoy, previous: m.citasAyer, label: 'vs ayer' }} />
        <StatCard title="Citas este mes" value={m.citasMes} colorClass="border-rio-500" emoji="📅" />
        <StatCard title="Citas pendientes" value={m.citasPendientes} colorClass="border-amber-500" emoji="⏳" />
        <StatCard title="Conversaciones este mes" value={m.conversacionesMes} colorClass="border-amber-500" emoji="💬" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total servicios activos" value={m.totalProductos} colorClass="border-slate-400" emoji="💅" />
        <StatCard
          title="Ingresos este mes"
          value={`$${m.ingresosMes.toLocaleString('es-CO')}`}
          colorClass="border-lima-dim"
          emoji="💰"
          trend={{ current: m.ingresosMes, previous: m.ingresosAyer * 30, label: 'est.' }}
        />
        <StatCard title="Contactos nuevos (7 días)" value={m.contactosNuevosSemana} colorClass="border-rio-400" emoji="👥"
          subtitle={`${m.contactosTotales} total`} />
      </div>

      <TendenciasChart showOrdenes={false} showCitas />
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
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-bone-deep flex items-center justify-between">
        <h2 className="font-display text-base font-bold text-ink">Actividad reciente</h2>
        <Link to={linkTo} className="text-sm text-selva-600 hover:text-selva-800 font-semibold">
          Ver todas →
        </Link>
      </div>
      {type === 'order' ? (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-bone-deep">
                  <th className="px-4 py-3 label-mono font-medium">Cliente</th>
                  <th className="px-4 py-3 label-mono font-medium">Total</th>
                  <th className="px-4 py-3 label-mono font-medium">Estado</th>
                  <th className="px-4 py-3 label-mono font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {m.ultimasOrdenes.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No hay órdenes recientes</td></tr>
                ) : (
                  m.ultimasOrdenes.map((o) => (
                    <tr key={o.id} className="border-b border-bone-soft hover:bg-bone-soft">
                      <td className="px-4 py-3 text-ink-soft">{o.clienteNombre}</td>
                      <td className="px-4 py-3 font-mono font-medium tabular-nums">${o.total.toLocaleString('es-CO')}</td>
                      <td className="px-4 py-3"><Badge status={o.status} type="order" /></td>
                      <td className="px-4 py-3 text-slate-500">{new Date(o.createdAt).toLocaleDateString('es-CO')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-bone-deep">
            {m.ultimasOrdenes.length === 0 ? (
              <p className="px-4 py-8 text-center text-slate-400 text-sm">No hay órdenes recientes</p>
            ) : (
              m.ultimasOrdenes.map((o) => (
                <div key={o.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink text-sm">{o.clienteNombre}</span>
                    <Badge status={o.status} type="order" />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-mono tabular-nums">${o.total.toLocaleString('es-CO')}</span>
                    <span>{new Date(o.createdAt).toLocaleDateString('es-CO')}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left border-b border-bone-deep">
                  <th className="px-4 py-3 label-mono font-medium">Paciente / Cliente</th>
                  <th className="px-4 py-3 label-mono font-medium">Servicio</th>
                  <th className="px-4 py-3 label-mono font-medium">Fecha / Hora</th>
                  <th className="px-4 py-3 label-mono font-medium">Estado</th>
                </tr>
              </thead>
              <tbody>
                {m.ultimasCitas.length === 0 ? (
                  <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-400">No hay citas recientes</td></tr>
                ) : (
                  m.ultimasCitas.map((c) => (
                    <tr key={c.id} className="border-b border-bone-soft hover:bg-bone-soft">
                      <td className="px-4 py-3 text-ink-soft">{c.clienteName}</td>
                      <td className="px-4 py-3 text-slate-600">{c.serviceName}</td>
                      <td className="px-4 py-3 text-slate-500">
                        {new Date(c.date).toLocaleString('es-CO', {
                          timeZone: 'America/Bogota',
                          day: '2-digit', month: '2-digit',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="px-4 py-3"><Badge status={c.status} type="appointment" /></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="md:hidden divide-y divide-bone-deep">
            {m.ultimasCitas.length === 0 ? (
              <p className="px-4 py-8 text-center text-slate-400 text-sm">No hay citas recientes</p>
            ) : (
              m.ultimasCitas.map((c) => (
                <div key={c.id} className="px-4 py-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink text-sm">{c.clienteName}</span>
                    <Badge status={c.status} type="appointment" />
                  </div>
                  <p className="text-xs text-slate-500">{c.serviceName}</p>
                  <p className="text-xs text-slate-400">
                    {new Date(c.date).toLocaleString('es-CO', {
                      timeZone: 'America/Bogota',
                      day: '2-digit', month: '2-digit',
                      hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function NpsCard() {
  const { data: stats } = useQuery({
    queryKey: ['nps-stats'],
    queryFn: getNpsStats,
    staleTime: 5 * 60_000,
  });

  if (!stats || stats.total === 0) return null;

  const color =
    stats.total < 5
      ? 'text-slate-400'
      : stats.npsScore > 50
      ? 'text-selva-600'
      : stats.npsScore >= 0
      ? 'text-amber-600'
      : 'text-red-500';

  const label =
    stats.total < 5
      ? 'Insuficientes respuestas'
      : stats.npsScore > 50
      ? 'Excelente'
      : stats.npsScore >= 0
      ? 'Bueno'
      : 'Mejorable';

  return (
    <Link to="/nps" className="card block p-4 transition-all hover:shadow-pop-sm hover:border-ink">
      <p className="label-mono mb-1">NPS — Net Promoter Score</p>
      <div className="flex items-end gap-3">
        <span className={`font-display font-bold text-3xl tabular-nums ${color}`}>
          {stats.total < 5 ? '—' : stats.npsScore}
        </span>
        <span className="text-slate-500 text-sm pb-0.5">{label}</span>
      </div>
      {stats.total >= 5 && (
        <div className="flex gap-3 mt-2 font-mono text-[11px]">
          <span className="text-selva-600">{stats.promotores} promotores</span>
          <span className="text-amber-600">{stats.neutrales} neutrales</span>
          <span className="text-red-500">{stats.detractores} detractores</span>
        </div>
      )}
    </Link>
  );
}

function ResenasCard() {
  const { data: stats } = useQuery({
    queryKey: ['resenas-stats'],
    queryFn: getResenasStats,
  });

  if (!stats || stats.total === 0) return null;

  return (
    <Link to="/resenas" className="card block p-4 transition-all hover:shadow-pop-sm hover:border-ink">
      <p className="label-mono mb-1">Reseñas de clientes</p>
      <div className="flex items-center gap-2">
        <span className="font-display text-ink font-bold text-2xl tabular-nums">{stats.promedio}</span>
        <span className="text-amber-500 text-lg" aria-hidden>★</span>
        <span className="text-slate-500 text-sm">({stats.total} reseña{stats.total !== 1 ? 's' : ''})</span>
      </div>
    </Link>
  );
}

function MiEnlaceCard() {
  const { user } = useAuth();
  const slug = user?.tenant?.slug;
  const frontendUrl = window.location.origin;
  const url = slug ? `${frontendUrl}/negocio/${slug}` : null;
  const [copied, setCopied] = useState(false);

  if (!url) return null;

  function copy() {
    navigator.clipboard.writeText(url!).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="card p-4">
      <p className="label-mono mb-1">Tu enlace público</p>
      <p className="text-slate-500 text-xs mb-3">Compártelo en tu bio de Instagram, stories o tarjeta de presentación</p>
      <div className="flex items-center gap-2">
        <code className="flex-1 bg-ink text-lima font-mono text-xs px-3 py-2 rounded-lg truncate">{url}</code>
        <button
          onClick={copy}
          className="shrink-0 bg-ink hover:bg-selva-900 text-lima text-xs font-semibold px-3 py-2 rounded-lg border border-ink transition-colors"
        >
          {copied ? '✓ Copiado' : 'Copiar'}
        </button>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 bg-white hover:bg-bone-soft text-ink text-xs font-semibold px-3 py-2 rounded-lg border border-bone-deep hover:border-ink transition-colors"
        >
          Ver
        </a>
      </div>
    </div>
  );
}

function RoiWidget() {
  const { data: roi, isLoading } = useQuery({
    queryKey: ['dashboard-roi'],
    queryFn: getRoi,
    staleTime: 10 * 60_000,
  });

  if (isLoading || !roi) return null;
  if (roi.mensajesAutomatizados === 0) return null;

  const fmt = (n: number) =>
    `$${n.toLocaleString('es-CO')} COP`;

  return (
    <div className="relative bg-ink border-2 border-ink rounded-2xl p-5 shadow-pop-lima overflow-hidden">
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            'linear-gradient(#c9f24b 1px, transparent 1px), linear-gradient(90deg, #c9f24b 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="relative flex items-center gap-2 mb-4">
        <div>
          <p className="label-mono !text-lima/70">Automatiza360 este mes</p>
          <p className="font-display text-bone font-bold text-lg">Tiempo y dinero que ahorraste</p>
        </div>
      </div>
      <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white/5 border border-lima/20 rounded-xl p-3 text-center">
          <p className="label-mono !text-bone/50 !text-[10px] mb-1">Mensajes enviados</p>
          <p className="font-mono text-bone text-xl font-bold tabular-nums">{roi.mensajesAutomatizados.toLocaleString('es-CO')}</p>
        </div>
        <div className="bg-white/5 border border-lima/20 rounded-xl p-3 text-center">
          <p className="label-mono !text-bone/50 !text-[10px] mb-1">Horas ahorradas</p>
          <p className="font-mono text-bone text-xl font-bold tabular-nums">{roi.horasAhorradas}</p>
        </div>
        <div className="bg-white/5 border border-lima/20 rounded-xl p-3 text-center">
          <p className="label-mono !text-bone/50 !text-[10px] mb-1">Ahorro estimado</p>
          <p className="font-mono text-lima text-lg font-bold tabular-nums">{fmt(roi.ahorroEstimadoCOP)}</p>
        </div>
        <div className="bg-white/5 border border-lima/20 rounded-xl p-3 text-center">
          <p className="label-mono !text-bone/50 !text-[10px] mb-1">Órdenes via bot</p>
          <p className="font-mono text-bone text-xl font-bold tabular-nums">{roi.ordenesViaBot}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const industry = user?.tenant?.industry;

  if (industry === 'RESTAURANT') return <RestaurantDashboard />;
  if (industry === 'TECH_STORE') return <TechStoreDashboard />;
  if (industry === 'CLINIC' || industry === 'BEAUTY') return <ClinicBeautyDashboard />;

  // OTHER / fallback — muestra métricas genéricas
  return <RestaurantDashboard />;
}

function DemoDataBanner() {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: ['datos-ejemplo'],
    queryFn: getDatosEjemplo,
    staleTime: 5 * 60_000,
  });

  const eliminar = useMutation({
    mutationFn: eliminarDatosEjemplo,
    onSuccess: () => queryClient.invalidateQueries(),
  });

  if (!data || data.total === 0) return null;

  return (
    <div className="card border-lima-dim bg-lima-ghost/60 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
      <div className="flex-1">
        <p className="font-display font-bold text-ink text-sm">Estás viendo datos de ejemplo</p>
        <p className="text-slate-600 text-xs mt-0.5">
          Sembramos órdenes, contactos y conversaciones de muestra para que veas la plataforma en acción.
          Cuando quieras empezar de cero, elimínalos con un clic.
        </p>
      </div>
      <button
        onClick={() => eliminar.mutate()}
        disabled={eliminar.isPending}
        className="btn-ghost !border-ink text-sm shrink-0 disabled:opacity-50"
      >
        {eliminar.isPending ? 'Eliminando…' : 'Eliminar ejemplos'}
      </button>
    </div>
  );
}

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <OnboardingChecklist />
      <DemoDataBanner />
      <DashboardContent />
      <RoiWidget />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <NpsCard />
        <ResenasCard />
      </div>
      <MiEnlaceCard />
      <QrSection />
    </div>
  );
}

function QrSection() {
  const { user } = useAuth();
  const slug = user?.tenant?.slug;
  const frontendUrl = window.location.origin;
  const url = slug ? `${frontendUrl}/negocio/${slug}` : null;

  if (!url) return null;

  return <QrCard url={url} label={url} />;
}
