import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCotizaciones, crearCotizacion, cambiarEstadoCotizacion, eliminarCotizacion } from '../../api/cotizaciones';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Cotizacion, CotizacionStatus } from '../../types';

const ESTADOS: { value: CotizacionStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'DRAFT', label: 'Borrador' },
  { value: 'SENT', label: 'Enviado' },
  { value: 'ACCEPTED', label: 'Aceptado' },
  { value: 'REJECTED', label: 'Rechazado' },
  { value: 'EXPIRED', label: 'Expirado' },
];

interface ItemForm {
  name: string;
  price: string;
  quantity: string;
}

function NuevaCotizacionForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<ItemForm[]>([{ name: '', price: '', quantity: '1' }]);

  const { mutate, isPending, error } = useMutation({
    mutationFn: () =>
      crearCotizacion({
        clientName,
        clientPhone: clientPhone || undefined,
        notes: notes || undefined,
        items: items.map((i) => ({ name: i.name, price: Number(i.price), quantity: Number(i.quantity) })),
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['cotizaciones'] });
      onClose();
    },
  });

  function addItem() {
    setItems([...items, { name: '', price: '', quantity: '1' }]);
  }

  function updateItem(idx: number, field: keyof ItemForm, value: string) {
    setItems(items.map((item, i) => (i === idx ? { ...item, [field]: value } : item)));
  }

  function removeItem(idx: number) {
    if (items.length > 1) setItems(items.filter((_, i) => i !== idx));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutate();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">Nueva Cotización</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">Error al crear la cotización</div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
              <input required value={clientName} onChange={(e) => setClientName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
              <input value={clientPhone} onChange={(e) => setClientPhone(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Notas</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Items *</label>
              <button type="button" onClick={addItem} className="text-xs text-indigo-600 hover:text-indigo-800">+ Agregar item</button>
            </div>
            <div className="space-y-2">
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    required
                    placeholder="Descripción"
                    value={item.name}
                    onChange={(e) => updateItem(idx, 'name', e.target.value)}
                    className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    required
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Precio"
                    value={item.price}
                    onChange={(e) => updateItem(idx, 'price', e.target.value)}
                    className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <input
                    required
                    type="number"
                    min="1"
                    placeholder="Cant."
                    value={item.quantity}
                    onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                    className="w-16 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                  />
                  {items.length > 1 && (
                    <button type="button" onClick={() => removeItem(idx)} className="text-red-400 hover:text-red-600 mt-2 text-lg">&times;</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
            <button type="submit" disabled={isPending} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium">
              {isPending ? 'Guardando...' : 'Crear Cotización'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EstadoActions({ cotizacion }: { cotizacion: Cotizacion }) {
  const qc = useQueryClient();
  const { mutate } = useMutation({
    mutationFn: (estado: CotizacionStatus) => cambiarEstadoCotizacion(cotizacion.id, estado),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
  });

  if (cotizacion.status === 'DRAFT') {
    return (
      <button onClick={() => mutate('SENT')} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
        Enviar
      </button>
    );
  }
  if (cotizacion.status === 'SENT') {
    return (
      <div className="flex gap-2">
        <button onClick={() => mutate('ACCEPTED')} className="text-xs text-green-600 hover:text-green-800 font-medium">Aceptar</button>
        <button onClick={() => mutate('REJECTED')} className="text-xs text-red-600 hover:text-red-800 font-medium">Rechazar</button>
      </div>
    );
  }
  return null;
}

export function CotizacionesPage() {
  const [estado, setEstado] = useState<CotizacionStatus | ''>('');
  const [showForm, setShowForm] = useState(false);
  const qc = useQueryClient();

  const { data: cotizaciones = [], isLoading } = useQuery({
    queryKey: ['cotizaciones', estado],
    queryFn: () => getCotizaciones(estado || undefined),
  });

  const { mutate: eliminar } = useMutation({
    mutationFn: eliminarCotizacion,
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['cotizaciones'] }),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as CotizacionStatus | '')}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <button
          onClick={() => setShowForm(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          + Nueva Cotización
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {isLoading ? (
          <div className="h-64"><LoadingSpinner /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="px-4 py-3 font-medium">#</th>
                  <th className="px-4 py-3 font-medium">Cliente</th>
                  <th className="px-4 py-3 font-medium">Items</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cotizaciones.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">No hay cotizaciones</td>
                  </tr>
                ) : (
                  cotizaciones.map((c) => (
                    <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="px-4 py-3 font-mono font-medium">#{c.number}</td>
                      <td className="px-4 py-3 font-medium">{c.clientName}</td>
                      <td className="px-4 py-3 text-slate-500">{c.items.length} item(s)</td>
                      <td className="px-4 py-3 font-medium">${c.total.toFixed(2)}</td>
                      <td className="px-4 py-3"><Badge status={c.status} type="cotizacion" /></td>
                      <td className="px-4 py-3 text-slate-500">{new Date(c.createdAt).toLocaleDateString('es')}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <EstadoActions cotizacion={c} />
                          {c.status === 'DRAFT' && (
                            <button
                              onClick={() => { if (confirm('¿Eliminar cotización?')) eliminar(c.id); }}
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              Eliminar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showForm && <NuevaCotizacionForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
