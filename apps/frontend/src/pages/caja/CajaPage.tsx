import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getCorteDiario } from '../../api/caja';

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Listo',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const STATUS_COLOR: Record<string, string> = {
  PENDING: 'bg-yellow-900/40 text-yellow-300',
  CONFIRMED: 'bg-blue-900/40 text-blue-300',
  PREPARING: 'bg-orange-900/40 text-orange-300',
  READY: 'bg-green-900/40 text-green-300',
  DELIVERED: 'bg-emerald-900/40 text-emerald-300',
  CANCELLED: 'bg-red-900/40 text-red-300',
};

function todayStr() {
  return new Date().toISOString().substring(0, 10);
}

export function CajaPage() {
  const [fecha, setFecha] = useState(todayStr());

  const { data: corte, isLoading } = useQuery({
    queryKey: ['caja-corte', fecha],
    queryFn: () => getCorteDiario(fecha),
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Caja / Corte del día</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="bg-slate-700 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={() => window.print()}
            className="bg-slate-700 hover:bg-slate-600 text-white font-semibold px-4 py-2 rounded-lg text-sm"
          >
            Imprimir
          </button>
        </div>
      </div>

      {isLoading ? (
        <p className="text-slate-400">Cargando...</p>
      ) : corte ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Ventas</p>
              <p className="text-2xl font-bold text-white">{corte.totalOrdenes}</p>
              <p className="text-xs text-slate-500">órdenes</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-400">
                ${corte.totalIngresos.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-400 mb-1">Total Gastos</p>
              <p className="text-2xl font-bold text-red-400">
                ${corte.totalGastos.toLocaleString('es-CO')}
              </p>
            </div>
            <div
              className={`border rounded-xl p-4 text-center ${
                corte.ganancia >= 0
                  ? 'bg-emerald-900/30 border-emerald-700'
                  : 'bg-red-900/30 border-red-700'
              }`}
            >
              <p className="text-xs text-slate-400 mb-1">Ganancia</p>
              <p className={`text-2xl font-bold ${corte.ganancia >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                ${corte.ganancia.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {/* Orders table */}
          <div>
            <h2 className="text-lg font-bold text-slate-200 mb-3">
              Órdenes del {new Date(corte.fecha + 'T00:00:00').toLocaleDateString('es-CO', { dateStyle: 'long' })}
            </h2>
            {corte.ordenes.length === 0 ? (
              <p className="text-slate-500 text-sm">Sin órdenes para esta fecha.</p>
            ) : (
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">#</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Estado</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Total</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corte.ordenes.map((o) => (
                      <tr key={o.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-bold text-white">#{o.number}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[o.status] ?? 'bg-slate-700 text-slate-300'}`}>
                            {STATUS_LABEL[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-green-400 font-semibold">
                          ${o.total.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{o.phone ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">
                          {new Date(o.createdAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Gastos */}
          {corte.gastos.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-slate-200 mb-3">Gastos del día</h2>
              <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50 border-b border-slate-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Descripción</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Categoría</th>
                      <th className="px-4 py-3 text-left text-slate-400 font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corte.gastos.map((g) => (
                      <tr key={g.id} className="border-b border-slate-700">
                        <td className="px-4 py-3 text-slate-200">{g.descripcion}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{g.categoria}</td>
                        <td className="px-4 py-3 text-red-400 font-semibold">
                          ${g.monto.toLocaleString('es-CO')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  );
}
