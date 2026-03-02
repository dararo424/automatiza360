import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getNotificaciones, marcarLeida, marcarTodasLeidas } from '../../api/notificaciones';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

export function NotificacionesPage() {
  const qc = useQueryClient();

  const { data: notificaciones = [], isLoading } = useQuery({
    queryKey: ['notificaciones'],
    queryFn: () => getNotificaciones(),
  });

  const { mutate: marcarTodas, isPending: marcandoTodas } = useMutation({
    mutationFn: marcarTodasLeidas,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const { mutate: marcarUna } = useMutation({
    mutationFn: marcarLeida,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['notificaciones'] }),
  });

  const noLeidas = notificaciones.filter((n) => !n.read).length;

  if (isLoading) return <LoadingSpinner />;

  return (
    <div className="space-y-4 max-w-2xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          {noLeidas > 0 ? `${noLeidas} sin leer` : 'Todas leídas'}
        </p>
        {noLeidas > 0 && (
          <button
            onClick={() => marcarTodas()}
            disabled={marcandoTodas}
            className="text-sm text-indigo-600 hover:text-indigo-800 font-medium disabled:opacity-50"
          >
            {marcandoTodas ? 'Marcando...' : 'Marcar todas como leídas'}
          </button>
        )}
      </div>

      <div className="space-y-2">
        {notificaciones.length === 0 ? (
          <div className="bg-white rounded-lg border border-slate-200 p-10 text-center text-slate-400">
            No hay notificaciones
          </div>
        ) : (
          notificaciones.map((n) => (
            <div
              key={n.id}
              onClick={() => { if (!n.read) marcarUna(n.id); }}
              className={`rounded-lg border p-4 cursor-pointer transition-colors ${
                n.read
                  ? 'bg-white border-slate-200 hover:bg-slate-50'
                  : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${n.read ? 'text-slate-700' : 'text-blue-800'}`}>
                    {n.title}
                  </p>
                  <p className={`text-sm mt-0.5 ${n.read ? 'text-slate-500' : 'text-blue-700'}`}>
                    {n.message}
                  </p>
                </div>
                <div className="flex flex-col items-end gap-1 flex-shrink-0">
                  <span className="text-xs text-slate-400">
                    {new Date(n.createdAt).toLocaleDateString('es')}
                  </span>
                  {!n.read && (
                    <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
