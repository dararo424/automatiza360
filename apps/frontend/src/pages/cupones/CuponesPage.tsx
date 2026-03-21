import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCupones,
  createCupon,
  toggleCupon,
  deleteCupon,
  type Cupon,
  type CrearCuponPayload,
} from '../../api/cupones';

function NuevoCuponModal({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState<CrearCuponPayload>({
    codigo: '',
    tipo: 'PORCENTAJE',
    valor: 10,
    minCompra: 0,
    maxUsos: undefined,
    fechaVencimiento: '',
  });

  const mutation = useMutation({
    mutationFn: () => createCupon(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cupones'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md space-y-3">
        <h2 className="text-white font-bold text-lg">Nuevo Cupón</h2>

        <div>
          <label className="text-slate-400 text-xs mb-1 block">Código</label>
          <input
            value={form.codigo}
            onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value.toUpperCase() }))}
            placeholder="EJ: BIENVENIDO10"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm font-mono"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Tipo</label>
            <select
              value={form.tipo}
              onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value as 'PORCENTAJE' | 'VALOR_FIJO' }))}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            >
              <option value="PORCENTAJE">Porcentaje (%)</option>
              <option value="VALOR_FIJO">Valor fijo ($)</option>
            </select>
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">
              Valor {form.tipo === 'PORCENTAJE' ? '(%)' : '($)'}
            </label>
            <input
              type="number"
              min="0"
              value={form.valor}
              onChange={(e) => setForm((f) => ({ ...f, valor: Number(e.target.value) }))}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Compra mínima ($)</label>
            <input
              type="number"
              min="0"
              value={form.minCompra ?? 0}
              onChange={(e) => setForm((f) => ({ ...f, minCompra: Number(e.target.value) }))}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Máx. usos (vacío = ilimitado)</label>
            <input
              type="number"
              min="1"
              value={form.maxUsos ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, maxUsos: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            />
          </div>
        </div>

        <div>
          <label className="text-slate-400 text-xs mb-1 block">Fecha vencimiento (opcional)</label>
          <input
            type="date"
            value={form.fechaVencimiento ?? ''}
            onChange={(e) => setForm((f) => ({ ...f, fechaVencimiento: e.target.value }))}
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
        </div>

        {mutation.isError && (
          <p className="text-red-400 text-xs">Error al crear el cupón.</p>
        )}

        <div className="flex gap-3 pt-1">
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.codigo || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm"
          >
            {mutation.isPending ? 'Creando...' : 'Crear cupón'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CuponesPage() {
  const qc = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: cupones = [], isLoading } = useQuery({
    queryKey: ['cupones'],
    queryFn: getCupones,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => toggleCupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cupones'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteCupon(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cupones'] }),
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {showModal && <NuevoCuponModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-slate-800">Cupones de descuento</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm"
        >
          + Nuevo Cupón
        </button>
      </div>

      {isLoading ? (
        <p className="text-slate-500">Cargando...</p>
      ) : cupones.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-4xl mb-3">🏷️</p>
          <p>No hay cupones aún. Crea el primero.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Código</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Tipo</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Valor</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Usos</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Vencimiento</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Estado</th>
                <th className="px-4 py-3 text-left text-slate-600 font-medium">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cupones.map((c: Cupon) => (
                <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 font-mono font-bold text-slate-800">{c.codigo}</td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.tipo === 'PORCENTAJE' ? 'Porcentaje' : 'Valor fijo'}
                  </td>
                  <td className="px-4 py-3 text-green-700 font-semibold">
                    {c.tipo === 'PORCENTAJE' ? `${c.valor}%` : `$${c.valor.toLocaleString('es-CO')}`}
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {c.usosActuales}{c.maxUsos != null ? ` / ${c.maxUsos}` : ''}
                  </td>
                  <td className="px-4 py-3 text-slate-500 text-xs">
                    {c.fechaVencimiento
                      ? new Date(c.fechaVencimiento).toLocaleDateString('es-CO')
                      : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${
                        c.activo
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-200 text-slate-500'
                      }`}
                    >
                      {c.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleMutation.mutate(c.id)}
                        className="text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 px-2 py-1 rounded"
                      >
                        {c.activo ? 'Desactivar' : 'Activar'}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('¿Eliminar cupón?')) deleteMutation.mutate(c.id);
                        }}
                        className="text-xs bg-red-100 hover:bg-red-200 text-red-700 px-2 py-1 rounded"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
