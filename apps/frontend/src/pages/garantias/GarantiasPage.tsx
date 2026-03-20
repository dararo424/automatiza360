import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGarantias,
  createGarantia,
  deleteGarantia,
  getAlertasGarantia,
  type Garantia,
} from '../../api/garantias';

function getExpiryStatus(fechaVencimiento: string): 'expired' | 'soon' | 'ok' {
  const now = new Date();
  const exp = new Date(fechaVencimiento);
  const diffMs = exp.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'expired';
  if (diffDays <= 30) return 'soon';
  return 'ok';
}

const EXPIRY_COLORS = {
  expired: 'bg-red-900/50 text-red-300 border-red-700',
  soon: 'bg-orange-900/50 text-orange-300 border-orange-700',
  ok: 'bg-green-900/50 text-green-300 border-green-700',
};
const EXPIRY_LABELS = {
  expired: 'Vencida',
  soon: 'Por vencer',
  ok: 'Vigente',
};

function NuevaGarantiaModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [clienteNombre, setClienteNombre] = useState('');
  const [clientePhone, setClientePhone] = useState('');
  const [producto, setProducto] = useState('');
  const [numeroSerie, setNumeroSerie] = useState('');
  const [fechaCompra, setFechaCompra] = useState(new Date().toISOString().slice(0, 10));
  const [mesesGarantia, setMesesGarantia] = useState('12');
  const [notas, setNotas] = useState('');

  const mutation = useMutation({
    mutationFn: () =>
      createGarantia({
        clienteNombre,
        clientePhone,
        producto,
        numeroSerie: numeroSerie || undefined,
        fechaCompra,
        mesesGarantia: Number(mesesGarantia),
        notas: notas || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garantias'] });
      queryClient.invalidateQueries({ queryKey: ['garantias-alertas'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-bold text-lg mb-4">Nueva Garantía</h2>
        <div className="space-y-3">
          <input value={clienteNombre} onChange={(e) => setClienteNombre(e.target.value)} placeholder="Nombre del cliente *" className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm" />
          <input value={clientePhone} onChange={(e) => setClientePhone(e.target.value)} placeholder="Teléfono del cliente *" className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm" />
          <input value={producto} onChange={(e) => setProducto(e.target.value)} placeholder="Producto *" className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm" />
          <input value={numeroSerie} onChange={(e) => setNumeroSerie(e.target.value)} placeholder="Número de serie (opcional)" className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm" />
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Fecha de compra *</label>
            <input value={fechaCompra} onChange={(e) => setFechaCompra(e.target.value)} type="date" className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm" />
          </div>
          <div>
            <label className="text-slate-400 text-xs mb-1 block">Meses de garantía</label>
            <input value={mesesGarantia} onChange={(e) => setMesesGarantia(e.target.value)} type="number" min="1" className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm" />
          </div>
          <textarea value={notas} onChange={(e) => setNotas(e.target.value)} placeholder="Notas (opcional)" rows={2} className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm resize-none" />
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={!clienteNombre || !clientePhone || !producto || !fechaCompra || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar'}
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function GarantiasPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: garantias = [], isLoading } = useQuery({
    queryKey: ['garantias'],
    queryFn: getGarantias,
  });

  const { data: alertas = [] } = useQuery({
    queryKey: ['garantias-alertas'],
    queryFn: getAlertasGarantia,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteGarantia,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['garantias'] });
      queryClient.invalidateQueries({ queryKey: ['garantias-alertas'] });
    },
  });

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      {showModal && <NuevaGarantiaModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Garantías</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nueva Garantía
        </button>
      </div>

      {/* Alerts banner */}
      {alertas.length > 0 && (
        <div className="bg-orange-900/40 border border-orange-700 rounded-xl p-4 mb-6">
          <p className="text-orange-300 font-semibold text-sm mb-1">
            ⚠️ {alertas.length} garantía(s) próximas a vencer o vencidas
          </p>
          <ul className="text-orange-200 text-xs space-y-1">
            {alertas.slice(0, 5).map((a) => (
              <li key={a.id}>• {a.clienteNombre} — {a.producto} (vence: {new Date(a.fechaVencimiento).toLocaleDateString('es-CO')})</li>
            ))}
          </ul>
        </div>
      )}

      {isLoading ? (
        <div className="text-slate-400">Cargando garantías...</div>
      ) : garantias.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">🛡️</p>
          <p>No hay garantías registradas</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-slate-800 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-700">
                <tr>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Cliente</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Producto</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">F. Compra</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Vencimiento</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Estado</th>
                  <th className="px-4 py-3 text-left text-slate-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {garantias.map((g: Garantia) => {
                  const status = getExpiryStatus(g.fechaVencimiento);
                  return (
                    <tr key={g.id} className="border-b border-slate-700/50 hover:bg-slate-700/30">
                      <td className="px-4 py-3">
                        <p className="text-white">{g.clienteNombre}</p>
                        <p className="text-slate-500 text-xs">{g.clientePhone}</p>
                      </td>
                      <td className="px-4 py-3 text-slate-300">
                        <p>{g.producto}</p>
                        {g.numeroSerie && <p className="text-xs text-slate-500">S/N: {g.numeroSerie}</p>}
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(g.fechaCompra).toLocaleDateString('es-CO')}
                        <p className="text-slate-600">{g.mesesGarantia} meses</p>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-xs">
                        {new Date(g.fechaVencimiento).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${EXPIRY_COLORS[status]}`}>
                          {EXPIRY_LABELS[status]}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => { if (confirm('¿Eliminar garantía?')) deleteMutation.mutate(g.id); }}
                          className="text-xs bg-red-800 hover:bg-red-700 text-red-200 px-2 py-1 rounded"
                        >
                          Eliminar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {garantias.map((g: Garantia) => {
              const status = getExpiryStatus(g.fechaVencimiento);
              return (
                <div key={g.id} className={`bg-slate-800 border rounded-lg p-4 ${status === 'expired' ? 'border-red-700' : status === 'soon' ? 'border-orange-700' : 'border-slate-700'}`}>
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="text-white font-semibold">{g.clienteNombre}</p>
                      <p className="text-slate-400 text-xs">{g.clientePhone}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${EXPIRY_COLORS[status]}`}>
                      {EXPIRY_LABELS[status]}
                    </span>
                  </div>
                  <p className="text-slate-300 text-sm">{g.producto}</p>
                  {g.numeroSerie && <p className="text-slate-500 text-xs">S/N: {g.numeroSerie}</p>}
                  <p className="text-slate-500 text-xs mt-1">
                    Compra: {new Date(g.fechaCompra).toLocaleDateString('es-CO')} · Vence: {new Date(g.fechaVencimiento).toLocaleDateString('es-CO')}
                  </p>
                  <button
                    onClick={() => { if (confirm('¿Eliminar?')) deleteMutation.mutate(g.id); }}
                    className="mt-2 text-xs bg-red-800 hover:bg-red-700 text-red-200 px-3 py-1 rounded-lg"
                  >
                    Eliminar
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
