import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  actualizarNotificadoVentas,
  crearNotificadoVentas,
  eliminarNotificadoVentas,
  listNotificadosVentas,
  probarNotificadoVentas,
  type NotificadoVentas,
  type RolNotificado,
} from '../../api/notificados-ventas';

const ROLES: { value: RolNotificado; label: string }[] = [
  { value: 'VENDEDOR', label: 'Vendedor' },
  { value: 'OWNER', label: 'Dueño' },
  { value: 'MANAGER', label: 'Manager' },
];

function NuevoNotificadoForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rol, setRol] = useState<RolNotificado>('VENDEDOR');
  const [resumenMatinal, setResumenMatinal] = useState(true);
  const [resumenCierre, setResumenCierre] = useState(false);
  const [notifInstantanea, setNotifInstantanea] = useState(false);

  const { mutate, isPending } = useMutation({
    mutationFn: () =>
      crearNotificadoVentas({
        name,
        phone,
        rol,
        resumenMatinal,
        resumenCierre,
        notifInstantanea,
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['notificados-ventas'] });
      onClose();
    },
  });

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-xl p-4 space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="text"
          placeholder="Nombre (ej: Carlos vendedor)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2"
        />
        <input
          type="tel"
          placeholder="WhatsApp (ej: +573001234567)"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2"
        />
      </div>

      <select
        value={rol}
        onChange={(e) => setRol(e.target.value as RolNotificado)}
        className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 w-full sm:w-48"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <div className="space-y-1.5">
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={resumenMatinal}
            onChange={(e) => setResumenMatinal(e.target.checked)}
            className="rounded"
          />
          Resumen matinal (8am)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={resumenCierre}
            onChange={(e) => setResumenCierre(e.target.checked)}
            className="rounded"
          />
          Cierre del día (8pm)
        </label>
        <label className="flex items-center gap-2 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={notifInstantanea}
            onChange={(e) => setNotifInstantanea(e.target.checked)}
            className="rounded"
          />
          Notificación instantánea (cada cotización)
        </label>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => mutate()}
          disabled={isPending || !name || !phone}
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {isPending ? 'Guardando...' : 'Agregar'}
        </button>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-slate-200 text-sm px-4 py-2"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

function NotificadoRow({ persona }: { persona: NotificadoVentas }) {
  const qc = useQueryClient();
  const [feedback, setFeedback] = useState<string | null>(null);

  const toggleField = useMutation({
    mutationFn: (patch: Partial<NotificadoVentas>) =>
      actualizarNotificadoVentas(persona.id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificados-ventas'] }),
  });

  const eliminar = useMutation({
    mutationFn: () => eliminarNotificadoVentas(persona.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificados-ventas'] }),
  });

  const probar = useMutation({
    mutationFn: () => probarNotificadoVentas(persona.id),
    onSuccess: (res) => {
      setFeedback(res.ok ? '✓ WhatsApp enviado' : `✗ ${res.reason ?? 'Error'}`);
      setTimeout(() => setFeedback(null), 3000);
    },
  });

  return (
    <div className="bg-slate-700 border border-slate-600 rounded-lg p-3">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm">{persona.name}</p>
          <p className="text-slate-400 text-xs">{persona.phone} · {persona.rol}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => probar.mutate()}
            disabled={probar.isPending}
            className="text-xs text-indigo-300 hover:text-indigo-200 underline disabled:opacity-50"
          >
            {probar.isPending ? '...' : 'Probar'}
          </button>
          <button
            onClick={() => {
              if (confirm(`¿Eliminar a ${persona.name}?`)) eliminar.mutate();
            }}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Eliminar
          </button>
        </div>
      </div>

      {feedback && (
        <p className={`text-xs mb-2 ${feedback.startsWith('✓') ? 'text-green-300' : 'text-red-300'}`}>
          {feedback}
        </p>
      )}

      <div className="flex flex-wrap gap-3 text-xs text-slate-300">
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={persona.resumenMatinal}
            onChange={(e) => toggleField.mutate({ resumenMatinal: e.target.checked })}
            className="rounded"
          />
          Matinal
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={persona.resumenCierre}
            onChange={(e) => toggleField.mutate({ resumenCierre: e.target.checked })}
            className="rounded"
          />
          Cierre
        </label>
        <label className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={persona.notifInstantanea}
            onChange={(e) => toggleField.mutate({ notifInstantanea: e.target.checked })}
            className="rounded"
          />
          Instantáneo
        </label>
        <label className="flex items-center gap-1.5 ml-auto">
          <input
            type="checkbox"
            checked={persona.active}
            onChange={(e) => toggleField.mutate({ active: e.target.checked })}
            className="rounded"
          />
          Activo
        </label>
      </div>
    </div>
  );
}

export function NotificadosVentasSection() {
  const [showForm, setShowForm] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ['notificados-ventas'],
    queryFn: listNotificadosVentas,
  });

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between gap-3 mb-1">
        <div>
          <h2 className="text-lg font-bold text-white">Notificaciones de ventas</h2>
          <p className="text-slate-400 text-sm">
            Personas que reciben WhatsApp con resumen de cotizaciones, ventas y reparaciones.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold px-3 py-1.5 rounded-lg shrink-0"
          >
            + Agregar
          </button>
        )}
      </div>

      <div className="bg-slate-900/40 border border-slate-700 rounded-lg p-3 my-4 text-xs text-slate-400 leading-relaxed">
        💡 <strong className="text-slate-300">Matinal (8am):</strong> resumen de la noche.{' '}
        <strong className="text-slate-300">Cierre (8pm):</strong> resumen del día.{' '}
        <strong className="text-slate-300">Instantáneo:</strong> WhatsApp en el momento de cada cotización.
      </div>

      {showForm && (
        <div className="mb-4">
          <NuevoNotificadoForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {isLoading ? (
        <p className="text-slate-500 text-sm py-4">Cargando...</p>
      ) : data.length === 0 ? (
        <p className="text-slate-500 text-sm py-4">
          Aún no has agregado a nadie. Agrega al dueño y los vendedores que deben enterarse de las ventas.
        </p>
      ) : (
        <div className="space-y-2">
          {data.map((p) => (
            <NotificadoRow key={p.id} persona={p} />
          ))}
        </div>
      )}
    </div>
  );
}
