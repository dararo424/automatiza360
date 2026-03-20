import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGastos,
  createGasto,
  deleteGasto,
  getResumen,
  type Gasto,
} from '../../api/gastos';

const CATEGORIAS = ['INVENTARIO', 'SERVICIOS', 'NOMINA', 'ARRIENDO', 'MARKETING', 'OTRO'];

function formatCOP(amount: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
}

function NuevoGastoModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [descripcion, setDescripcion] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState('OTRO');
  const [fecha, setFecha] = useState(new Date().toISOString().slice(0, 10));
  const [notas, setNotas] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createGasto({ descripcion, monto: Number(monto), categoria, fecha, notas: notas || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      queryClient.invalidateQueries({ queryKey: ['gastos-resumen'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold text-lg mb-4">Nuevo Gasto</h2>
        <div className="space-y-3">
          <input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Descripción *"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
          <input
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="Monto (COP) *"
            type="number"
            min="0"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
          <select
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <input
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
            type="date"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            placeholder="Notas (opcional)"
            rows={2}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm resize-none"
          />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={!descripcion || !monto || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
        {mutation.isError && (
          <p className="mt-2 text-red-400 text-xs text-center">Error al guardar el gasto</p>
        )}
      </div>
    </div>
  );
}

export function GastosPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: gastos = [], isLoading } = useQuery({
    queryKey: ['gastos'],
    queryFn: getGastos,
  });

  const { data: resumen } = useQuery({
    queryKey: ['gastos-resumen'],
    queryFn: getResumen,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGasto,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gastos'] });
      queryClient.invalidateQueries({ queryKey: ['gastos-resumen'] });
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {showModal && <NuevoGastoModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Gastos y Finanzas</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nuevo Gasto
        </button>
      </div>

      {/* Summary cards */}
      {resumen && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs font-medium mb-1">Ingresos (entregados)</p>
            <p className="text-green-400 text-2xl font-bold">{formatCOP(resumen.totalIngresos)}</p>
          </div>
          <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-xs font-medium mb-1">Gastos / Egresos</p>
            <p className="text-red-400 text-2xl font-bold">{formatCOP(resumen.totalGastos)}</p>
          </div>
          <div className={`bg-slate-800 rounded-xl p-4 border ${resumen.ganancia >= 0 ? 'border-green-700' : 'border-red-700'}`}>
            <p className="text-slate-400 text-xs font-medium mb-1">Ganancia</p>
            <p className={`text-2xl font-bold ${resumen.ganancia >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {formatCOP(resumen.ganancia)}
            </p>
          </div>
        </div>
      )}

      {/* Categories breakdown */}
      {resumen && resumen.porCategoria.length > 0 && (
        <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
          <h2 className="text-white font-semibold text-sm mb-3">Gastos por categoría</h2>
          <div className="flex flex-wrap gap-2">
            {resumen.porCategoria.map((c) => (
              <span
                key={c.categoria}
                className="bg-slate-700 text-slate-300 text-xs px-3 py-1 rounded-full"
              >
                {c.categoria}: <span className="text-red-300 font-semibold">{formatCOP(c.total)}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      {isLoading ? (
        <div className="text-slate-400">Cargando gastos...</div>
      ) : gastos.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">💸</p>
          <p>No hay gastos registrados</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Descripción</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Categoría</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Monto</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Fecha</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g: Gasto) => (
                  <tr key={g.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                    <td className="px-4 py-3 text-white">
                      <p>{g.descripcion}</p>
                      {g.notas && <p className="text-xs text-slate-500 mt-0.5">{g.notas}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{g.categoria}</span>
                    </td>
                    <td className="px-4 py-3 text-red-400 font-semibold">{formatCOP(g.monto)}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">
                      {new Date(g.fecha).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm('¿Eliminar este gasto?')) deleteMutation.mutate(g.id); }}
                        className="text-xs bg-red-800 hover:bg-red-700 text-red-200 px-2 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {gastos.map((g: Gasto) => (
              <div key={g.id} className="bg-slate-800 border border-slate-700 rounded-lg p-4">
                <div className="flex justify-between items-start mb-1">
                  <p className="text-white font-semibold text-sm">{g.descripcion}</p>
                  <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full ml-2">{g.categoria}</span>
                </div>
                <p className="text-red-400 font-bold">{formatCOP(g.monto)}</p>
                <p className="text-slate-500 text-xs mt-1">{new Date(g.fecha).toLocaleDateString('es-CO')}</p>
                {g.notas && <p className="text-slate-500 text-xs mt-1 italic">{g.notas}</p>}
                <button
                  onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(g.id); }}
                  className="mt-2 text-xs bg-red-800 hover:bg-red-700 text-red-200 px-3 py-1 rounded-lg"
                >
                  Eliminar
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
