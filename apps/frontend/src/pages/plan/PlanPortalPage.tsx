import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getPlanInfo, iniciarUpgrade, cancelarSuscripcion, reactivarSuscripcion } from '../../api/subscriptions';
import { useAuth } from '../../context/AuthContext';
import { getMiCodigo, getReferrals } from '../../api/referidos';
import { getBotMetricas } from '../../api/dashboard';
import { getPagos } from '../../api/billing';
import { getFlujos } from '../../api/flujos';

const PLAN_NAMES: Record<string, string> = {
  STARTER: 'Starter',
  PRO: 'Pro',
  BUSINESS: 'Business',
};

const PLAN_COLORS: Record<string, string> = {
  STARTER: 'bg-slate-600',
  PRO: 'bg-indigo-600',
  BUSINESS: 'bg-amber-600',
};

const STATUS_LABELS: Record<string, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Activo',
  SUSPENDED: 'Suspendido',
  CANCELLED: 'Cancelado',
};

const STATUS_COLORS: Record<string, string> = {
  TRIAL: 'bg-amber-600',
  ACTIVE: 'bg-emerald-600',
  SUSPENDED: 'bg-red-600',
  CANCELLED: 'bg-slate-500',
};

export function PlanPortalPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [upgradeError, setUpgradeError] = useState('');
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const { data: planInfo, isLoading } = useQuery({
    queryKey: ['plan-info'],
    queryFn: getPlanInfo,
  });

  const upgradeMutation = useMutation({
    mutationFn: (plan: string) => iniciarUpgrade(plan),
    onSuccess: (data) => {
      window.open(data.url, '_blank');
    },
    onError: () => {
      setUpgradeError('No se pudo iniciar el proceso de pago. Inténtalo de nuevo.');
    },
  });

  const cancelMutation = useMutation({
    mutationFn: cancelarSuscripcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-info'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
      setShowCancelConfirm(false);
    },
  });

  const reactivarMutation = useMutation({
    mutationFn: reactivarSuscripcion,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['plan-info'] });
      queryClient.invalidateQueries({ queryKey: ['trial-info'] });
    },
  });

  const isOwner = user?.role === 'OWNER';

  const { data: codigo } = useQuery({
    queryKey: ['referral-code'],
    queryFn: getMiCodigo,
    enabled: !!planInfo,
  });

  const { data: referrals = [] } = useQuery({
    queryKey: ['referrals'],
    queryFn: getReferrals,
    enabled: !!planInfo,
  });

  const { data: botMetricas } = useQuery({
    queryKey: ['bot-metricas'],
    queryFn: getBotMetricas,
  });

  const { data: pagos = [] } = useQuery({
    queryKey: ['billing-pagos'],
    queryFn: getPagos,
    enabled: !!planInfo,
  });

  const { data: flujoInfo } = useQuery({
    queryKey: ['flujos'],
    queryFn: getFlujos,
    enabled: !!planInfo,
  });

  if (isLoading) return <div className="p-8 text-slate-400">Cargando...</div>;
  if (!planInfo) return null;

  const usagePercent = planInfo.conversations.limit
    ? Math.min(100, Math.round((planInfo.conversations.used / planInfo.conversations.limit) * 100))
    : 0;

  const usageColor =
    usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Mi Plan</h1>

      {/* Plan actual */}
      <div className="bg-slate-800 rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-slate-400 text-sm mb-1">Plan actual</p>
            <div className="flex items-center gap-2">
              <span className={`text-white font-bold text-2xl`}>{PLAN_NAMES[planInfo.plan] ?? planInfo.plan}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full text-white ${STATUS_COLORS[planInfo.status] ?? PLAN_COLORS[planInfo.plan] ?? 'bg-slate-600'}`}>
                {STATUS_LABELS[planInfo.status] ?? planInfo.status}
              </span>
            </div>
            {planInfo.status === 'TRIAL' && (
              <p className="text-amber-400 text-sm mt-1">
                {planInfo.daysRemaining > 0
                  ? `${planInfo.daysRemaining} días de trial restantes`
                  : 'Trial expirado'}
              </p>
            )}
          </div>
          <Link
            to="/planes"
            className="self-start sm:self-auto bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
          >
            Cambiar plan →
          </Link>
        </div>
      </div>

      {/* Upgrade de plan */}
      {planInfo.plan !== 'BUSINESS' && (
        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-3">Mejorar tu plan</h2>
          {upgradeError && <p className="text-red-400 text-sm mb-3">{upgradeError}</p>}
          <div className="flex flex-col sm:flex-row gap-3">
            {planInfo.plan === 'STARTER' && (
              <button
                onClick={() => upgradeMutation.mutate('PRO')}
                disabled={upgradeMutation.isPending}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors"
              >
                Mejorar a Pro — $242,000/mes
              </button>
            )}
            <button
              onClick={() => upgradeMutation.mutate('BUSINESS')}
              disabled={upgradeMutation.isPending}
              className="flex-1 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors"
            >
              Mejorar a Business — $529,000/mes
            </button>
          </div>
        </div>
      )}

      {/* Uso de conversaciones */}
      <div className="bg-slate-800 rounded-xl p-5 mb-6">
        <h2 className="text-white font-semibold mb-3">Uso del mes — Conversaciones WhatsApp</h2>
        {planInfo.conversations.limit === null ? (
          <p className="text-emerald-400 font-medium">Conversaciones ilimitadas en tu plan</p>
        ) : (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">
                {planInfo.conversations.used.toLocaleString()} de{' '}
                {planInfo.conversations.limit.toLocaleString()} mensajes
              </span>
              <span className={usagePercent >= 90 ? 'text-red-400' : 'text-slate-400'}>
                {usagePercent}%
              </span>
            </div>
            <div className="bg-slate-700 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${usageColor}`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
            {usagePercent >= 80 && (
              <p className="text-amber-400 text-sm mt-2">
                Estás cerca del límite. Considera actualizar al plan Pro.
              </p>
            )}
          </>
        )}
      </div>

      {/* Bot métricas */}
      {botMetricas && (
        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-4">Métricas del bot este mes</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Conversaciones', value: botMetricas.conversacionesMes },
              { label: 'Mensajes totales', value: botMetricas.mensajesMes },
              { label: 'Entrantes', value: botMetricas.mensajesEntrantes },
              { label: 'Tasa respuesta', value: `${botMetricas.tasaRespuesta}%` },
            ].map((m) => (
              <div key={m.label} className="bg-slate-700 rounded-lg p-3 text-center">
                <p className="text-slate-400 text-xs mb-1">{m.label}</p>
                <p className="text-white font-bold text-xl">{m.value}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Flujos activos */}
      {flujoInfo && (
        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white font-semibold">Flujos de WhatsApp activos</h2>
            <Link to="/flujos" className="text-indigo-400 text-sm hover:underline">Gestionar →</Link>
          </div>
          <p className="text-slate-400 text-sm mb-3">
            {flujoInfo.activos.length} de {flujoInfo.limite} flujos activados (Plan {flujoInfo.plan})
          </p>
          <div className="flex flex-wrap gap-2">
            {flujoInfo.disponibles
              .filter((f) => flujoInfo.activos.includes(f.id))
              .map((f) => (
                <span key={f.id} className="bg-indigo-900/50 border border-indigo-700 text-indigo-200 text-xs px-3 py-1 rounded-full">
                  {f.emoji} {f.nombre}
                </span>
              ))}
            {flujoInfo.activos.length === 0 && (
              <span className="text-slate-500 text-sm">No hay flujos activos</span>
            )}
          </div>
        </div>
      )}

      {/* Programa de referidos */}
      <div className="bg-slate-800 rounded-xl p-5 mb-6">
        <div className="flex items-start justify-between gap-3 mb-1">
          <div>
            <h2 className="text-white font-semibold">Programa de referidos</h2>
            <p className="text-slate-400 text-sm">
              Cada amigo que pague te suma <strong className="text-emerald-400">30 días gratis</strong>.
            </p>
          </div>
          {(() => {
            const recompensados = referrals.filter((r) => r.rewardGiven).length;
            if (recompensados === 0) return null;
            return (
              <div className="bg-emerald-950 border border-emerald-700 rounded-lg px-3 py-2 text-center shrink-0">
                <p className="text-emerald-300 text-xs">Días ganados</p>
                <p className="text-emerald-200 font-bold text-xl leading-none mt-0.5">+{recompensados * 30}</p>
              </div>
            );
          })()}
        </div>
        <div className="mt-4" />

        {codigo ? (
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <div className="bg-slate-700 border border-slate-600 rounded-lg px-4 py-3 flex-1">
              <p className="text-slate-400 text-xs mb-0.5">Tu código</p>
              <p className="text-white font-mono text-xl font-bold tracking-widest">{codigo.code}</p>
            </div>
            <button
              onClick={() => navigator.clipboard.writeText(codigo.code)}
              className="shrink-0 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Copiar código
            </button>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">Cargando código...</p>
        )}
        {referrals.length > 0 && (
          <div className="mt-4">
            <p className="text-slate-400 text-sm mb-2">Referidos ({referrals.length})</p>
            <div className="space-y-2">
              {referrals.map((r) => (
                <div key={r.id} className="flex justify-between items-center text-sm bg-slate-700 rounded-lg px-3 py-2">
                  <span className="text-slate-300 font-mono text-xs">{r.referredTenantId.substring(0, 12)}...</span>
                  {r.rewardGiven || r.status === 'REWARDED' ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-700 text-emerald-200">
                      ✓ +30 días
                    </span>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-amber-900 text-amber-200">
                      Esperando pago
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Gestión de suscripción */}
      {isOwner && (
        <div className="bg-slate-800 rounded-xl p-5 mb-6">
          <h2 className="text-white font-semibold mb-3">Gestión de suscripción</h2>
          {cancelMutation.isError && (
            <p className="text-red-400 text-sm mb-3">No se pudo procesar la solicitud. Inténtalo de nuevo.</p>
          )}
          {reactivarMutation.isError && (
            <p className="text-red-400 text-sm mb-3">No se pudo reactivar la suscripción. Inténtalo de nuevo.</p>
          )}
          {reactivarMutation.isSuccess && (
            <p className="text-emerald-400 text-sm mb-3">Suscripción reactivada exitosamente.</p>
          )}

          {planInfo.status === 'CANCELLED' ? (
            <div>
              <p className="text-slate-400 text-sm mb-3">Tu suscripción está cancelada. Puedes reactivarla en cualquier momento.</p>
              <button
                onClick={() => reactivarMutation.mutate()}
                disabled={reactivarMutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-4 py-3 rounded-xl text-sm transition-colors"
              >
                {reactivarMutation.isPending ? 'Reactivando...' : 'Reactivar suscripción'}
              </button>
            </div>
          ) : (
            <div>
              {!showCancelConfirm ? (
                <div>
                  <p className="text-slate-400 text-sm mb-3">Si cancelas, mantendrás acceso hasta fin del período actual.</p>
                  <button
                    onClick={() => setShowCancelConfirm(true)}
                    className="border border-red-500 text-red-400 hover:bg-red-900/30 font-semibold px-4 py-3 rounded-xl text-sm transition-colors"
                  >
                    Cancelar suscripción
                  </button>
                </div>
              ) : (
                <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
                  <p className="text-red-300 font-semibold mb-1">¿Estás seguro?</p>
                  <p className="text-red-400 text-sm mb-4">Perderás acceso al finalizar el período actual. Esta acción se puede revertir.</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => cancelMutation.mutate()}
                      disabled={cancelMutation.isPending}
                      className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      {cancelMutation.isPending ? 'Cancelando...' : 'Sí, cancelar'}
                    </button>
                    <button
                      onClick={() => setShowCancelConfirm(false)}
                      className="border border-slate-600 text-slate-300 hover:bg-slate-700 px-4 py-2 rounded-lg text-sm transition-colors"
                    >
                      No, volver
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Historial de pagos */}
      <div className="bg-slate-800 rounded-xl p-5 mt-6">
        <h2 className="text-white font-semibold mb-4">Historial de pagos</h2>
        {pagos.length === 0 ? (
          <p className="text-slate-500 text-sm">Aún no tienes pagos registrados</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-700">
                  <th className="pb-2 pr-4">Fecha</th>
                  <th className="pb-2 pr-4">Descripción</th>
                  <th className="pb-2 pr-4">Monto</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td className="py-2 pr-4 text-slate-400">
                      {new Date(pago.createdAt).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                    <td className="py-2 pr-4 text-slate-300">
                      {pago.descripcion ?? `Plan ${pago.plan}`}
                    </td>
                    <td className="py-2 pr-4 text-slate-200 font-medium">
                      ${pago.monto.toLocaleString('es-CO')}
                    </td>
                    <td className="py-2">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        pago.status === 'COMPLETADO'
                          ? 'bg-emerald-700 text-emerald-200'
                          : pago.status === 'FALLIDO'
                          ? 'bg-red-800 text-red-200'
                          : 'bg-amber-800 text-amber-200'
                      }`}>
                        {pago.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
