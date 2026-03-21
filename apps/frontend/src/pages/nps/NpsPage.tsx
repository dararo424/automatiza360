import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { getNpsStats } from '../../api/nps';

function NpsScoreDisplay({ score, total }: { score: number; total: number }) {
  if (total < 5) {
    return (
      <div className="text-center py-8">
        <p className="text-4xl font-bold text-slate-400">—</p>
        <p className="text-slate-500 mt-2">Insuficientes respuestas</p>
        <p className="text-xs text-slate-400 mt-1">Necesitas al menos 5 respuestas</p>
      </div>
    );
  }

  const color = score > 50 ? 'text-green-500' : score >= 0 ? 'text-yellow-500' : 'text-red-500';
  const label = score > 50 ? 'Excelente' : score >= 0 ? 'Bueno' : 'Mejorable';
  const labelColor = score > 50 ? 'bg-green-100 text-green-700' : score >= 0 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700';

  return (
    <div className="text-center py-8">
      <p className={`text-6xl font-black ${color}`}>{score}</p>
      <p className="text-slate-400 text-sm mt-1">NPS Score (-100 a 100)</p>
      <span className={`mt-3 inline-block text-xs font-semibold px-3 py-1 rounded-full ${labelColor}`}>{label}</span>
    </div>
  );
}

export function NpsPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['nps-stats'],
    queryFn: getNpsStats,
    staleTime: 5 * 60_000,
  });

  if (isLoading) return <div className="p-8 text-slate-400">Cargando estadísticas NPS...</div>;
  if (!stats) return null;

  const total = stats.total;
  const promotoresPct = total > 0 ? Math.round((stats.promotores / total) * 100) : 0;
  const neutralesPct = total > 0 ? Math.round((stats.neutrales / total) * 100) : 0;
  const detractoresPct = total > 0 ? Math.round((stats.detractores / total) * 100) : 0;

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-800">NPS — Net Promoter Score</h1>
        <Link to="/dashboard" className="text-sm text-indigo-600 hover:text-indigo-800">← Dashboard</Link>
      </div>

      {/* NPS Score Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Puntuación NPS</h2>
        <NpsScoreDisplay score={stats.npsScore} total={total} />
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-100">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{stats.promotores}</p>
            <p className="text-xs text-slate-500">Promotores</p>
            <p className="text-xs text-slate-400">(≥ 9) {promotoresPct}%</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-500">{stats.neutrales}</p>
            <p className="text-xs text-slate-500">Neutrales</p>
            <p className="text-xs text-slate-400">(7-8) {neutralesPct}%</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{stats.detractores}</p>
            <p className="text-xs text-slate-500">Detractores</p>
            <p className="text-xs text-slate-400">(≤ 6) {detractoresPct}%</p>
          </div>
        </div>
      </div>

      {/* Distribution bar */}
      {total > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <h2 className="text-sm font-semibold text-slate-700 mb-3">Distribución de respuestas</h2>
          <div className="flex h-8 rounded-full overflow-hidden">
            {promotoresPct > 0 && (
              <div
                className="bg-green-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${promotoresPct}%` }}
              >
                {promotoresPct > 10 ? `${promotoresPct}%` : ''}
              </div>
            )}
            {neutralesPct > 0 && (
              <div
                className="bg-yellow-400 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${neutralesPct}%` }}
              >
                {neutralesPct > 10 ? `${neutralesPct}%` : ''}
              </div>
            )}
            {detractoresPct > 0 && (
              <div
                className="bg-red-500 flex items-center justify-center text-white text-xs font-semibold"
                style={{ width: `${detractoresPct}%` }}
              >
                {detractoresPct > 10 ? `${detractoresPct}%` : ''}
              </div>
            )}
            {total === 0 && <div className="flex-1 bg-slate-100" />}
          </div>
          <div className="flex gap-4 mt-3 text-xs text-slate-500">
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Promotores</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" /> Neutrales</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-500 inline-block" /> Detractores</span>
          </div>
          <p className="text-xs text-slate-400 mt-2">Total: {total} respuestas · Promedio: {stats.promedio}/10</p>
        </div>
      )}

      {/* Last 10 responses */}
      {stats.ultimas.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-700">Últimas respuestas</h2>
          </div>
          <div className="divide-y divide-slate-50">
            {stats.ultimas.map((r) => {
              const scoreColor = r.score >= 9 ? 'text-green-600 bg-green-50' : r.score >= 7 ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';
              return (
                <div key={r.id} className="px-6 py-3 flex items-start gap-4">
                  <span className={`text-lg font-black rounded-lg w-10 h-10 flex items-center justify-center flex-shrink-0 ${scoreColor}`}>
                    {r.score}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700">{r.clientPhone}</p>
                    {r.comentario && <p className="text-xs text-slate-500 mt-0.5 truncate">{r.comentario}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString('es-CO')}</p>
                    <p className="text-xs text-slate-400">{r.tipo}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {total === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-4xl mb-3">📊</p>
          <p className="text-slate-600 font-medium">Aún no hay respuestas NPS</p>
          <p className="text-slate-400 text-sm mt-1">El bot preguntará a tus clientes después de cada orden o cita completada</p>
        </div>
      )}
    </div>
  );
}
