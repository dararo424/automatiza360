import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSucursales,
  crearSucursal,
  actualizarSucursal,
  type Sucursal,
  type CrearSucursalPayload,
} from '../../api/sucursales';

interface SucursalFormData {
  nombre: string;
  direccion: string;
  ciudad: string;
  telefono: string;
  activa: boolean;
}

const emptyForm: SucursalFormData = {
  nombre: '',
  direccion: '',
  ciudad: '',
  telefono: '',
  activa: true,
};

function SucursalModal({
  initial,
  onClose,
  onSave,
  saving,
}: {
  initial?: Sucursal;
  onClose: () => void;
  onSave: (data: CrearSucursalPayload) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState<SucursalFormData>(
    initial
      ? { nombre: initial.nombre, direccion: initial.direccion ?? '', ciudad: initial.ciudad ?? '', telefono: initial.telefono ?? '', activa: initial.activa }
      : emptyForm,
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
        <h2 className="text-lg font-semibold text-slate-800 mb-4">
          {initial ? 'Editar sucursal' : 'Nueva sucursal'}
        </h2>
        <div className="space-y-3 mb-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={form.nombre}
              onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              placeholder="Ej: Sucursal Centro"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dirección</label>
            <input
              type="text"
              value={form.direccion}
              onChange={(e) => setForm({ ...form, direccion: e.target.value })}
              placeholder="Ej: Cra 7 #15-32"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Ciudad</label>
            <input
              type="text"
              value={form.ciudad}
              onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              placeholder="Ej: Bogotá"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono</label>
            <input
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
              placeholder="Ej: +57 300 000 0000"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="activa"
              checked={form.activa}
              onChange={(e) => setForm({ ...form, activa: e.target.checked })}
              className="rounded"
            />
            <label htmlFor="activa" className="text-sm text-slate-700">Sucursal activa</label>
          </div>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => onSave({ nombre: form.nombre, direccion: form.direccion || undefined, ciudad: form.ciudad || undefined, telefono: form.telefono || undefined, activa: form.activa })}
            disabled={saving || !form.nombre}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors"
          >
            {saving ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function SucursalesPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Sucursal | null>(null);

  const { data: sucursales = [], isLoading } = useQuery({
    queryKey: ['sucursales'],
    queryFn: getSucursales,
  });

  const createMutation = useMutation({
    mutationFn: crearSucursal,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
      setShowModal(false);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: CrearSucursalPayload }) =>
      actualizarSucursal(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sucursales'] });
      setEditing(null);
    },
  });

  const toggleActive = (s: Sucursal) => {
    updateMutation.mutate({ id: s.id, data: { nombre: s.nombre, activa: !s.activa } });
  };

  return (
    <div className="p-4 md:p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Sucursales</h1>
          <p className="text-slate-500 text-sm mt-0.5">Administra las ubicaciones de tu negocio</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nueva Sucursal
        </button>
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-medium text-blue-800">Cada sucursal tendrá su propio bot de WhatsApp</p>
        <p className="text-xs text-blue-600 mt-1">
          La configuración independiente por sucursal (inventario, órdenes, bot separado) estará disponible próximamente.
        </p>
      </div>

      {isLoading ? (
        <div className="text-slate-400 py-8 text-center">Cargando sucursales...</div>
      ) : sucursales.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-10 text-center">
          <p className="text-4xl mb-3">🏢</p>
          <p className="text-slate-600 font-medium">No hay sucursales registradas</p>
          <p className="text-slate-400 text-sm mt-1">Agrega tus ubicaciones para gestionarlas desde aquí</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            + Nueva Sucursal
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {sucursales.map((s) => (
            <div key={s.id} className="bg-white rounded-xl border border-slate-200 p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{s.nombre}</h3>
                  {s.ciudad && <p className="text-sm text-slate-500">{s.ciudad}</p>}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.activa ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
                  {s.activa ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              {s.direccion && (
                <p className="text-xs text-slate-400 mb-1">📍 {s.direccion}</p>
              )}
              {s.telefono && (
                <p className="text-xs text-slate-400 mb-3">📞 {s.telefono}</p>
              )}
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setEditing(s)}
                  className="text-xs px-3 py-1.5 border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActive(s)}
                  disabled={updateMutation.isPending}
                  className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${s.activa ? 'border border-red-200 text-red-600 hover:bg-red-50' : 'border border-green-200 text-green-600 hover:bg-green-50'}`}
                >
                  {s.activa ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SucursalModal
          onClose={() => setShowModal(false)}
          onSave={(data) => createMutation.mutate(data)}
          saving={createMutation.isPending}
        />
      )}

      {editing && (
        <SucursalModal
          initial={editing}
          onClose={() => setEditing(null)}
          onSave={(data) => updateMutation.mutate({ id: editing.id, data })}
          saving={updateMutation.isPending}
        />
      )}
    </div>
  );
}
