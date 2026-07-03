import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminApi } from '../../api/admin';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-emerald-600',
  TRIAL: 'bg-amber-500',
  SUSPENDED: 'bg-red-600',
  CANCELLED: 'bg-slate-500',
};

const INDUSTRY_COLORS: Record<string, string> = {
  RESTAURANT: 'bg-orange-500',
  TECH_STORE: 'bg-blue-500',
  CLINIC: 'bg-green-500',
  BEAUTY: 'bg-pink-500',
  JEWELRY: 'bg-amber-500',
  OTHER: 'bg-slate-500',
};

export function AdminTenantsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const queryClient = useQueryClient();

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['admin-tenants', search, statusFilter, industryFilter],
    queryFn: () => adminApi.getTenants({
      search: search || undefined,
      status: statusFilter || undefined,
      industry: industryFilter || undefined,
    }),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenants'] }),
  });

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Tenants ({tenants.length})</h1>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:gap-3 mb-6">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:flex-1 md:min-w-48 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-indigo-500"
        />
        <div className="flex gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 min-w-0 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none"
          >
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activo</option>
            <option value="TRIAL">Trial</option>
            <option value="SUSPENDED">Suspendido</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
          <select
            value={industryFilter}
            onChange={(e) => setIndustryFilter(e.target.value)}
            className="flex-1 min-w-0 bg-slate-800 text-white px-4 py-2 rounded-lg border border-slate-600 focus:outline-none"
          >
            <option value="">Todas las industrias</option>
            <option value="RESTAURANT">Restaurante</option>
            <option value="TECH_STORE">Tech Store</option>
            <option value="CLINIC">Clínica</option>
            <option value="BEAUTY">Belleza</option>
            <option value="CLOTHING_STORE">Tienda de Ropa</option>
            <option value="GYM">Gimnasio</option>
            <option value="PHARMACY">Farmacia</option>
            <option value="VETERINARY">Veterinaria</option>
            <option value="HOTEL">Hotel</option>
            <option value="BAKERY">Panadería</option>
            <option value="WORKSHOP">Taller</option>
            <option value="JEWELRY">Relojería / Joyería</option>
            <option value="OTHER">Otro</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-slate-400">Cargando...</div>
      ) : tenants.length === 0 ? (
        <div className="text-center text-slate-500 py-8">No se encontraron tenants</div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Negocio</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Industria</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Estado</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Plan</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Registro</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {tenants.map((t: any) => (
                  <tr key={t.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{t.name}</p>
                      <p className="text-slate-500 text-xs">{t.slug}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${INDUSTRY_COLORS[t.industry] ?? 'bg-slate-500'}`}>
                        {t.industry}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[t.subscriptionStatus] ?? 'bg-slate-500'}`}>
                        {t.subscriptionStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{t.subscriptionPlan ?? t.plan ?? '—'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {t.subscriptionStatus === 'TRIAL'
                        ? t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString('es-CO') : '—'
                        : t.subscriptionEndsAt ? new Date(t.subscriptionEndsAt).toLocaleDateString('es-CO') : '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(t.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link to={`/admin/tenants/${t.id}`} className="text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded">
                          Ver
                        </Link>
                        {t.subscriptionStatus === 'ACTIVE' ? (
                          <button
                            onClick={() => suspendMutation.mutate({ id: t.id, status: 'SUSPENDED' })}
                            className="text-xs bg-red-700 hover:bg-red-600 text-white px-2 py-1 rounded"
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            onClick={() => suspendMutation.mutate({ id: t.id, status: 'ACTIVE' })}
                            className="text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-2 py-1 rounded"
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {tenants.map((t: any) => (
              <div key={t.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4 space-y-3">
                <div>
                  <p className="text-white font-semibold">{t.name}</p>
                  <p className="text-slate-500 text-xs font-mono">{t.slug}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${INDUSTRY_COLORS[t.industry] ?? 'bg-slate-500'}`}>
                    {t.industry}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[t.subscriptionStatus] ?? 'bg-slate-500'}`}>
                    {t.subscriptionStatus}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                    {t.subscriptionPlan ?? t.plan ?? '—'}
                  </span>
                </div>
                <div className="text-xs text-slate-400 flex justify-between">
                  <span>Vence: {
                    t.subscriptionStatus === 'TRIAL'
                      ? t.trialEndsAt ? new Date(t.trialEndsAt).toLocaleDateString('es-CO') : '—'
                      : t.subscriptionEndsAt ? new Date(t.subscriptionEndsAt).toLocaleDateString('es-CO') : '—'
                  }</span>
                  <span>Reg: {new Date(t.createdAt).toLocaleDateString('es-CO')}</span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Link
                    to={`/admin/tenants/${t.id}`}
                    className="flex-1 text-center text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg"
                  >
                    Ver detalle
                  </Link>
                  {t.subscriptionStatus === 'ACTIVE' ? (
                    <button
                      onClick={() => suspendMutation.mutate({ id: t.id, status: 'SUSPENDED' })}
                      className="flex-1 text-xs bg-red-700 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      Suspender
                    </button>
                  ) : (
                    <button
                      onClick={() => suspendMutation.mutate({ id: t.id, status: 'ACTIVE' })}
                      className="flex-1 text-xs bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg"
                    >
                      Activar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
