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
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PREPARING: 'bg-orange-100 text-orange-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
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
        <h1 className="text-2xl font-bold text-slate-800">Caja / Corte del día</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
        <p className="text-slate-500">Cargando...</p>
      ) : corte ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Ventas</p>
              <p className="text-2xl font-bold text-slate-800">{corte.totalOrdenes}</p>
              <p className="text-xs text-slate-400">órdenes</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Ingresos</p>
              <p className="text-2xl font-bold text-green-600">
                ${corte.totalIngresos.toLocaleString('es-CO')}
              </p>
            </div>
            <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
              <p className="text-xs text-slate-500 mb-1">Total Gastos</p>
              <p className="text-2xl font-bold text-red-600">
                ${corte.totalGastos.toLocaleString('es-CO')}
              </p>
            </div>
            <div
              className={`border rounded-xl p-4 text-center ${
                corte.ganancia >= 0
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-red-50 border-red-200'
              }`}
            >
              <p className="text-xs text-slate-500 mb-1">Ganancia</p>
              <p
                className={`text-2xl font-bold ${
                  corte.ganancia >= 0 ? 'text-emerald-700' : 'text-red-700'
                }`}
              >
                ${corte.ganancia.toLocaleString('es-CO')}
              </p>
            </div>
          </div>

          {/* Orders table */}
          <div>
            <h2 className="text-lg font-bold text-slate-700 mb-3">
              Órdenes del {new Date(corte.fecha + 'T00:00:00').toLocaleDateString('es-CO', { dateStyle: 'long' })}
            </h2>
            {corte.ordenes.length === 0 ? (
              <p className="text-slate-400 text-sm">Sin órdenes para esta fecha.</p>
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-600 font-medium">#</th>
                      <th className="px-4 py-3 text-left text-slate-600 font-medium">Estado</th>
                      <th className="px-4 py-3 text-left text-slate-600 font-medium">Total</th>
                      <th className="px-4 py-3 text-left text-slate-600 font-medium">Cliente</th>
                      <th className="px-4 py-3 text-left text-slate-600 font-medium">Hora</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corte.ordenes.map((o) => (
                      <tr key={o.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="px-4 py-3 font-bold text-slate-800">#{o.number}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${STATUS_COLOR[o.status] ?? 'bg-slate-100 text-slate-700'}`}
                          >
                            {STATUS_LABEL[o.status] ?? o.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-green-700 font-semibold">
                          ${o.total.toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{o.phone ?? '—'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {new Date(o.createdAt).toLocaleTimeString('es-CO', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
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
              <h2 className="text-lg font-bold text-slate-700 mb-3">Gastos del día</h2>
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-slate-600 font-medium">Descripción</th>
                      <th className="px-4 py-3 text-left text-slate-600 font-medium">Categoría</th>
                      <th className="px-4 py-3 text-left text-slate-600 font-medium">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {corte.gastos.map((g) => (
                      <tr key={g.id} className="border-b border-slate-100">
                        <td className="px-4 py-3 text-slate-700">{g.descripcion}</td>
                        <td className="px-4 py-3 text-slate-500 text-xs">{g.categoria}</td>
                        <td className="px-4 py-3 text-red-600 font-semibold">
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
