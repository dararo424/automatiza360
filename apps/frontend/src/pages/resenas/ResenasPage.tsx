import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getResenas, getResenasStats } from '../../api/resenas';

function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <span key={s} className={s <= rating ? 'text-yellow-400' : 'text-slate-600'}>
          ★
        </span>
      ))}
    </span>
  );
}

export function ResenasPage() {
  const [filtroRating, setFiltroRating] = useState<number | null>(null);

  const { data: resenas = [], isLoading } = useQuery({
    queryKey: ['resenas'],
    queryFn: getResenas,
  });

  const { data: stats } = useQuery({
    queryKey: ['resenas-stats'],
    queryFn: getResenasStats,
  });

  const filtradas = filtroRating ? resenas.filter((r) => r.rating === filtroRating) : resenas;

  const maxCount = stats ? Math.max(...stats.distribucion.map((d) => d.count), 1) : 1;

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-white mb-6">Reseñas y Valoraciones</h1>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm mb-1">Promedio general</p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-white">{stats.promedio}</span>
              <Stars rating={Math.round(stats.promedio)} />
            </div>
            <p className="text-slate-500 text-sm mt-1">{stats.total} reseña{stats.total !== 1 ? 's' : ''}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-5">
            <p className="text-slate-400 text-sm mb-3">Distribución</p>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((r) => {
                const d = stats.distribucion.find((x) => x.rating === r);
                const count = d?.count ?? 0;
                const pct = maxCount > 0 ? (count / maxCount) * 100 : 0;
                return (
                  <button
                    key={r}
                    onClick={() => setFiltroRating(filtroRating === r ? null : r)}
                    className={`w-full flex items-center gap-2 text-sm hover:opacity-80 transition-opacity ${filtroRating === r ? 'opacity-100' : ''}`}
                  >
                    <span className="text-yellow-400 w-4 text-right">{r}★</span>
                    <div className="flex-1 bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-yellow-400 h-full rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-slate-400 w-6 text-right">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Filter indicator */}
      {filtroRating && (
        <div className="flex items-center gap-2 mb-4">
          <span className="text-slate-400 text-sm">Filtrando por {filtroRating} estrella{filtroRating !== 1 ? 's' : ''}</span>
          <button
            onClick={() => setFiltroRating(null)}
            className="text-indigo-400 text-sm hover:text-indigo-300 underline"
          >
            Limpiar filtro
          </button>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <p className="text-slate-400">Cargando reseñas...</p>
      ) : filtradas.length === 0 ? (
        <div className="bg-slate-800 rounded-xl p-8 text-center">
          <p className="text-slate-400">No hay reseñas{filtroRating ? ` con ${filtroRating} estrellas` : ''}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((resena) => (
            <div key={resena.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Stars rating={resena.rating} />
                    <span className="text-slate-500 text-xs">
                      {new Date(resena.createdAt).toLocaleDateString('es-CO')}
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700 text-slate-300">
                      {resena.tipo === 'ORDER' ? 'Pedido' : 'Cita'}
                    </span>
                  </div>
                  <p className="text-white font-medium text-sm">
                    {resena.clientName ?? resena.clientPhone}
                  </p>
                  {resena.comentario && (
                    <p className="text-slate-300 text-sm mt-1">{resena.comentario}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
