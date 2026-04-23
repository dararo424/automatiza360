import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';

const INDUSTRY_COLORS: Record<string, string> = {
  RESTAURANT: 'bg-orange-500',
  TECH_STORE: 'bg-blue-500',
  CLINIC: 'bg-green-500',
  BEAUTY: 'bg-pink-500',
  OTHER: 'bg-slate-500',
};

function MetricCard({ title, value, color, href }: { title: string; value: string | number; color: string; href?: string }) {
  const inner = (
    <div className={`rounded-xl p-5 text-white ${color} ${href ? 'hover:opacity-90 transition-opacity cursor-pointer' : ''}`}>
      <p className="text-sm opacity-80">{title}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
    </div>
  );
  return href ? <Link to={href}>{inner}</Link> : inner;
}

export function AdminPage() {
  const { data, isLoading } = useQuery({ queryKey: ['admin-metricas'], queryFn: adminApi.getMetricas });

  if (isLoading) return <div className="p-8 text-slate-400">Cargando métricas...</div>;
  if (!data) return null;

  const maxIndustria = Math.max(...(data.porIndustria?.map((g: any) => g.count) ?? [1]));

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Panel de Administración</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        <MetricCard title="Tenants activos" value={data.activos} color="bg-emerald-600" href="/admin/tenants?status=ACTIVE" />
        <MetricCard title="En trial" value={data.trial} color="bg-amber-500" href="/admin/tenants?status=TRIAL" />
        <MetricCard title="Suspendidos" value={data.suspendidos} color="bg-red-600" href="/admin/tenants?status=SUSPENDED" />
        <MetricCard title="Cancelados" value={data.cancelados} color="bg-slate-600" href="/admin/tenants?status=CANCELLED" />
        <MetricCard title="Nuevos este mes" value={data.nuevosMes} color="bg-indigo-600" />
        <MetricCard
          title="Sin configurar"
          value={data.sinConfigurar ?? 0}
          color={data.sinConfigurar > 0 ? 'bg-orange-500' : 'bg-slate-700'}
          href="/admin/tenants?onboarding=false"
        />
      </div>

      <div className="bg-slate-800 rounded-xl p-5 mb-6">
        <p className="text-slate-400 text-sm mb-1">MRR Estimado</p>
        <p className="text-4xl font-bold text-white">
          ${data.mrr?.toLocaleString('es-CO')} <span className="text-lg text-slate-400 font-normal">COP</span>
        </p>
      </div>

      <div className="bg-slate-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Tenants por industria</h2>
        <div className="space-y-3">
          {data.porIndustria?.map((g: any) => (
            <div key={g.industry} className="flex items-center gap-3">
              <span className="text-slate-400 text-sm w-28">{g.industry}</span>
              <div className="flex-1 bg-slate-700 rounded-full h-5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${INDUSTRY_COLORS[g.industry] ?? 'bg-slate-500'}`}
                  style={{ width: `${(g.count / maxIndustria) * 100}%` }}
                />
              </div>
              <span className="text-white font-bold w-6 text-right">{g.count}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6">
        <Link
          to="/admin/tenants"
          className="inline-block bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Ver todos los tenants →
        </Link>
      </div>
    </div>
  );
}
