import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProveedores,
  crearProveedor,
  eliminarProveedor,
  getOrdenesCompra,
  crearOrdenCompra,
  recibirOrdenCompra,
  type Proveedor,
} from '../../api/compras';

function ModalProveedor({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ nombre: '', contacto: '', telefono: '', email: '', notas: '' });

  const mutation = useMutation({
    mutationFn: () => crearProveedor(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['proveedores'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-md">
        <h2 className="text-white font-bold mb-4">Nuevo proveedor</h2>
        <div className="space-y-3">
          {(['nombre', 'contacto', 'telefono', 'email', 'notas'] as const).map((k) => (
            <input
              key={k}
              value={form[k]}
              onChange={(e) => setForm({ ...form, [k]: e.target.value })}
              placeholder={k.charAt(0).toUpperCase() + k.slice(1)}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
            />
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={!form.nombre || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold transition-colors"
          >
            Guardar
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

function ModalOrden({ proveedores, onClose }: { proveedores: Proveedor[]; onClose: () => void }) {
  const qc = useQueryClient();
  const [proveedorId, setProveedorId] = useState('');
  const [notas, setNotas] = useState('');
  const [esperadaAt, setEsperadaAt] = useState('');
  const [items, setItems] = useState([{ nombre: '', cantidad: 1, precioUnitario: 0 }]);

  const mutation = useMutation({
    mutationFn: () => crearOrdenCompra({ proveedorId, notas, esperadaAt, items }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['ordenes-compra'] });
      onClose();
    },
  });

  const addItem = () => setItems([...items, { nombre: '', cantidad: 1, precioUnitario: 0 }]);
  const removeItem = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: string, value: string | number) =>
    setItems(items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));

  const total = items.reduce((s, it) => s + it.cantidad * it.precioUnitario, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 overflow-y-auto">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-2xl my-4">
        <h2 className="text-white font-bold mb-4">Nueva orden de compra</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <select
            value={proveedorId}
            onChange={(e) => setProveedorId(e.target.value)}
            className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm"
          >
            <option value="">Seleccionar proveedor</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre}</option>
            ))}
          </select>
          <input
            type="date"
            value={esperadaAt}
            onChange={(e) => setEsperadaAt(e.target.value)}
            className="bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm"
            placeholder="Fecha esperada"
          />
        </div>
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-slate-300 text-sm font-medium">Items</p>
            <button onClick={addItem} className="text-indigo-400 text-sm hover:text-indigo-300">+ Agregar item</button>
          </div>
          {items.map((item, i) => (
            <div key={i} className="grid grid-cols-12 gap-2 mb-2">
              <input
                value={item.nombre}
                onChange={(e) => updateItem(i, 'nombre', e.target.value)}
                placeholder="Nombre del producto"
                className="col-span-5 bg-slate-700 text-white px-2 py-1.5 rounded text-sm border border-slate-600"
              />
              <input
                type="number"
                value={item.cantidad}
                onChange={(e) => updateItem(i, 'cantidad', parseInt(e.target.value) || 1)}
                min="1"
                placeholder="Cant."
                className="col-span-2 bg-slate-700 text-white px-2 py-1.5 rounded text-sm border border-slate-600"
              />
              <input
                type="number"
                value={item.precioUnitario}
                onChange={(e) => updateItem(i, 'precioUnitario', parseFloat(e.target.value) || 0)}
                placeholder="Precio unit."
                className="col-span-4 bg-slate-700 text-white px-2 py-1.5 rounded text-sm border border-slate-600"
              />
              <button onClick={() => removeItem(i)} className="col-span-1 text-red-400 hover:text-red-300">✕</button>
            </div>
          ))}
        </div>
        <p className="text-white text-sm font-semibold mb-4">
          Total: <span className="text-emerald-400">${total.toLocaleString('es-CO')} COP</span>
        </p>
        <textarea
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
          placeholder="Notas (opcional)"
          className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 text-sm mb-4 h-16 resize-none"
        />
        <div className="flex gap-2">
          <button
            onClick={() => mutation.mutate()}
            disabled={!proveedorId || items.some((i) => !i.nombre) || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-semibold"
          >
            Crear orden
          </button>
          <button onClick={onClose} className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function ComprasPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<'proveedores' | 'ordenes'>('proveedores');
  const [showModalProveedor, setShowModalProveedor] = useState(false);
  const [showModalOrden, setShowModalOrden] = useState(false);

  const { data: proveedores = [] } = useQuery({ queryKey: ['proveedores'], queryFn: getProveedores });
  const { data: ordenes = [] } = useQuery({ queryKey: ['ordenes-compra'], queryFn: getOrdenesCompra });

  const eliminarMutation = useMutation({
    mutationFn: (id: string) => eliminarProveedor(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['proveedores'] }),
  });

  const recibirMutation = useMutation({
    mutationFn: (id: string) => recibirOrdenCompra(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['ordenes-compra'] }),
  });

  const STATUS_LABELS: Record<string, string> = { PENDIENTE: 'Pendiente', RECIBIDA: 'Recibida', CANCELADA: 'Cancelada' };
  const STATUS_COLORS: Record<string, string> = {
    PENDIENTE: 'bg-amber-700 text-amber-200',
    RECIBIDA: 'bg-emerald-700 text-emerald-200',
    CANCELADA: 'bg-red-800 text-red-200',
  };

  return (
    <div className="p-4 md:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Proveedores y Compras</h1>
        <button
          onClick={() => (tab === 'proveedores' ? setShowModalProveedor(true) : setShowModalOrden(true))}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
        >
          {tab === 'proveedores' ? '+ Proveedor' : '+ Orden de compra'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-800 rounded-lg p-1 mb-6 w-fit">
        {(['proveedores', 'ordenes'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              tab === t ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            {t === 'proveedores' ? 'Proveedores' : 'Ordenes de compra'}
          </button>
        ))}
      </div>

      {tab === 'proveedores' && (
        <div className="space-y-3">
          {proveedores.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-400">
              No hay proveedores registrados
            </div>
          ) : proveedores.map((p) => (
            <div key={p.id} className="bg-slate-800 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-white font-semibold">{p.nombre}</p>
                <div className="flex gap-3 text-slate-400 text-xs mt-0.5">
                  {p.contacto && <span>{p.contacto}</span>}
                  {p.telefono && <span>{p.telefono}</span>}
                  {p.email && <span>{p.email}</span>}
                </div>
              </div>
              <button
                onClick={() => eliminarMutation.mutate(p.id)}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'ordenes' && (
        <div className="space-y-3">
          {ordenes.length === 0 ? (
            <div className="bg-slate-800 rounded-xl p-8 text-center text-slate-400">
              No hay ordenes de compra
            </div>
          ) : ordenes.map((o) => (
            <div key={o.id} className="bg-slate-800 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div>
                  <p className="text-white font-semibold">{o.proveedor?.nombre ?? '—'}</p>
                  <p className="text-slate-400 text-xs">
                    {new Date(o.createdAt).toLocaleDateString('es-CO')}
                    {o.esperadaAt && ` · Esperada: ${new Date(o.esperadaAt).toLocaleDateString('es-CO')}`}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[o.status] ?? 'bg-slate-700 text-slate-300'}`}>
                    {STATUS_LABELS[o.status] ?? o.status}
                  </span>
                  <p className="text-white font-bold text-sm">${o.total.toLocaleString('es-CO')}</p>
                </div>
              </div>
              <div className="space-y-1 mb-3">
                {o.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-xs text-slate-400">
                    <span>{item.nombre} x{item.cantidad}</span>
                    <span>${(item.cantidad * item.precioUnitario).toLocaleString('es-CO')}</span>
                  </div>
                ))}
              </div>
              {o.status === 'PENDIENTE' && (
                <button
                  onClick={() => recibirMutation.mutate(o.id)}
                  disabled={recibirMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
                >
                  Marcar como recibida
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showModalProveedor && <ModalProveedor onClose={() => setShowModalProveedor(false)} />}
      {showModalOrden && <ModalOrden proveedores={proveedores} onClose={() => setShowModalOrden(false)} />}
    </div>
  );
}
