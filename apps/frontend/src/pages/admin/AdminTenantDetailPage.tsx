import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../api/admin';

export function AdminTenantDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [diasTrial, setDiasTrial] = useState(7);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [nuevoPlan, setNuevoPlan] = useState('');

  const { data: tenant, isLoading } = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: () => adminApi.getTenant(id!),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: () => adminApi.updateStatus(id!, nuevoEstado, nuevoPlan || undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] });
      queryClient.invalidateQueries({ queryKey: ['admin-tenants'] });
    },
  });

  const trialMutation = useMutation({
    mutationFn: () => adminApi.extenderTrial(id!, diasTrial),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-tenant', id] }),
  });

  if (isLoading) return <div className="p-8 text-slate-400">Cargando...</div>;
  if (!tenant) return <div className="p-8 text-red-400">Tenant no encontrado</div>;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/tenants" className="text-slate-400 hover:text-white">← Tenants</Link>
        <span className="text-slate-600">/</span>
        <h1 className="text-2xl font-bold text-white">{tenant.name}</h1>
      </div>

      {/* Info */}
      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-slate-400 text-sm mb-3">Información</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-400">Slug</dt>
              <dd className="text-white font-mono">{tenant.slug}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Industria</dt>
              <dd className="text-white">{tenant.industry}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Estado</dt>
              <dd className="text-white">{tenant.subscriptionStatus}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Plan</dt>
              <dd className="text-white">{tenant.subscriptionPlan ?? tenant.plan}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-400">Trial vence</dt>
              <dd className="text-white">{tenant.trialEndsAt ? new Date(tenant.trialEndsAt).toLocaleDateString('es-CO') : '—'}</dd>
            </div>
          </dl>
        </div>

        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-slate-400 text-sm mb-3">Métricas del mes</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-slate-400 text-xs">Órdenes</p>
              <p className="text-white text-2xl font-bold">{tenant.metricas?.ordenesMes ?? 0}</p>
            </div>
            <div className="bg-slate-700 rounded-lg p-3">
              <p className="text-slate-400 text-xs">Citas</p>
              <p className="text-white text-2xl font-bold">{tenant.metricas?.citasMes ?? 0}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Usuarios */}
      <div className="bg-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-3">Usuarios ({tenant.users?.length ?? 0})</h2>
        <div className="space-y-2">
          {tenant.users?.map((u: any) => (
            <div key={u.id} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between text-sm">
              <div className="min-w-0">
                <span className="text-white">{u.name}</span>
                <span className="text-slate-400 ml-2 text-xs truncate">{u.email}</span>
              </div>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded self-start sm:self-auto">{u.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3">Cambiar estado / plan</h2>
          <div className="space-y-3">
            <select
              value={nuevoEstado}
              onChange={(e) => setNuevoEstado(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none"
            >
              <option value="">Seleccionar estado...</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="TRIAL">TRIAL</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="CANCELLED">CANCELLED</option>
            </select>
            <select
              value={nuevoPlan}
              onChange={(e) => setNuevoPlan(e.target.value)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none"
            >
              <option value="">Plan (opcional)...</option>
              <option value="STARTER">STARTER</option>
              <option value="PRO">PRO</option>
              <option value="BUSINESS">BUSINESS</option>
            </select>
            <button
              onClick={() => statusMutation.mutate()}
              disabled={!nuevoEstado || statusMutation.isPending}
              className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {statusMutation.isPending ? 'Guardando...' : 'Aplicar cambio'}
            </button>
            {statusMutation.isSuccess && <p className="text-emerald-400 text-sm">✓ Guardado</p>}
          </div>
        </div>

        <div className="bg-slate-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-3">Extender trial</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="number"
                value={diasTrial}
                onChange={(e) => setDiasTrial(Number(e.target.value))}
                min={1}
                max={90}
                className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none w-24"
              />
              <span className="text-slate-400">días adicionales</span>
            </div>
            <button
              onClick={() => trialMutation.mutate()}
              disabled={trialMutation.isPending}
              className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg transition-colors"
            >
              {trialMutation.isPending ? 'Extendiendo...' : 'Extender trial'}
            </button>
            {trialMutation.isSuccess && (
              <p className="text-emerald-400 text-sm">
                ✓ Trial extendido hasta{' '}
                {trialMutation.data?.trialEndsAt
                  ? new Date(trialMutation.data.trialEndsAt).toLocaleDateString('es-CO')
                  : '—'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
