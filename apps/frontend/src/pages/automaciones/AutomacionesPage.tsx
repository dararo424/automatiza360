import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getAutomaciones,
  createAutomacion,
  updateAutomacion,
  deleteAutomacion,
  toggleAutomacion,
} from '../../api/automaciones';
import type { Automacion, AutomacionPaso } from '../../api/automaciones';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

const TRIGGER_LABELS: Record<string, string> = {
  ORDER_DELIVERED: 'Orden entregada',
  APPOINTMENT_COMPLETED: 'Cita completada',
  NEW_CONTACT: 'Nuevo contacto',
};

const TRIGGER_COLORS: Record<string, string> = {
  ORDER_DELIVERED: 'bg-blue-100 text-blue-700',
  APPOINTMENT_COMPLETED: 'bg-purple-100 text-purple-700',
  NEW_CONTACT: 'bg-amber-100 text-amber-700',
};

const TRIGGERS = [
  { value: 'ORDER_DELIVERED', label: 'Orden entregada' },
  { value: 'APPOINTMENT_COMPLETED', label: 'Cita completada' },
  { value: 'NEW_CONTACT', label: 'Nuevo contacto' },
];

function PasoEditor({
  paso,
  index,
  onChange,
  onRemove,
}: {
  paso: AutomacionPaso;
  index: number;
  onChange: (p: AutomacionPaso) => void;
  onRemove: () => void;
}) {
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
          Paso {index + 1}
        </span>
        <button
          onClick={onRemove}
          className="text-red-400 hover:text-red-600 text-sm transition-colors"
        >
          Eliminar
        </button>
      </div>
      <select
        value={paso.tipo}
        onChange={(e) =>
          onChange({
            ...paso,
            tipo: e.target.value as 'WAIT' | 'SEND_WHATSAPP',
            config: {},
          })
        }
        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
      >
        <option value="WAIT">Esperar X dias</option>
        <option value="SEND_WHATSAPP">Enviar WhatsApp</option>
      </select>

      {paso.tipo === 'WAIT' && (
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-600">Esperar</label>
          <input
            type="number"
            min={1}
            value={paso.config.days ?? 1}
            onChange={(e) =>
              onChange({ ...paso, config: { days: Number(e.target.value) } })
            }
            className="w-20 border border-slate-300 rounded-lg px-2 py-1.5 text-sm text-center"
          />
          <span className="text-sm text-slate-600">dias</span>
        </div>
      )}

      {paso.tipo === 'SEND_WHATSAPP' && (
        <div className="space-y-1">
          <textarea
            rows={3}
            value={paso.config.mensaje ?? ''}
            onChange={(e) =>
              onChange({ ...paso, config: { mensaje: e.target.value } })
            }
            placeholder="Hola {nombre}, gracias por tu compra..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
          />
          <p className="text-xs text-slate-400">
            Usa <code className="bg-slate-200 px-1 rounded">{'{nombre}'}</code> para insertar el nombre del contacto
          </p>
        </div>
      )}
    </div>
  );
}

function AutomacionModal({
  automacion,
  onClose,
}: {
  automacion?: Automacion;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const isEditing = !!automacion;

  const [nombre, setNombre] = useState(automacion?.nombre ?? '');
  const [trigger, setTrigger] = useState(automacion?.trigger ?? 'ORDER_DELIVERED');
  const [pasos, setPasos] = useState<AutomacionPaso[]>(
    automacion?.pasos ?? [],
  );

  const { mutate: save, isPending } = useMutation({
    mutationFn: () => {
      const data = {
        nombre,
        trigger,
        pasos: pasos.map((p, i) => ({ ...p, orden: i })),
      };
      if (isEditing) {
        return updateAutomacion(automacion.id, data);
      }
      return createAutomacion(data);
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['automaciones'] });
      onClose();
    },
  });

  const addPaso = () => {
    setPasos((prev) => [
      ...prev,
      { orden: prev.length, tipo: 'WAIT', config: { days: 1 } },
    ]);
  };

  const updatePaso = (index: number, paso: AutomacionPaso) => {
    setPasos((prev) => prev.map((p, i) => (i === index ? paso : p)));
  };

  const removePaso = (index: number) => {
    setPasos((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">
            {isEditing ? 'Editar automatización' : 'Nueva automatización'}
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 text-2xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej: Pedir reseña después de entrega"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Disparador
            </label>
            <select
              value={trigger}
              onChange={(e) => setTrigger(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
            >
              {TRIGGERS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-slate-700">Pasos</label>
              <button
                onClick={addPaso}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Agregar paso
              </button>
            </div>
            {pasos.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-4 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                Sin pasos. Agrega al menos uno.
              </p>
            ) : (
              <div className="space-y-2">
                {pasos.map((paso, i) => (
                  <PasoEditor
                    key={i}
                    paso={paso}
                    index={i}
                    onChange={(p) => updatePaso(i, p)}
                    onRemove={() => removePaso(i)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-200 flex gap-3">
          <button
            onClick={() => save()}
            disabled={isPending || !nombre.trim() || pasos.length === 0}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg transition-colors disabled:opacity-60"
          >
            {isPending ? 'Guardando...' : 'Guardar'}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function AutomacionesPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Automacion | undefined>();

  const { data: automaciones = [], isLoading } = useQuery({
    queryKey: ['automaciones'],
    queryFn: getAutomaciones,
  });

  const { mutate: toggle } = useMutation({
    mutationFn: (id: string) => toggleAutomacion(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['automaciones'] }),
  });

  const { mutate: remove } = useMutation({
    mutationFn: (id: string) => deleteAutomacion(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['automaciones'] }),
  });

  const handleEdit = (a: Automacion) => {
    setEditing(a);
    setModalOpen(true);
  };

  const handleDelete = (a: Automacion) => {
    if (confirm(`Eliminar "${a.nombre}"?`)) {
      remove(a.id);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditing(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Automatizaciones</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Envía mensajes WhatsApp automaticos cuando ocurre un evento
          </p>
        </div>
        <button
          onClick={() => { setEditing(undefined); setModalOpen(true); }}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-2.5 rounded-lg transition-colors text-sm"
        >
          + Nueva automatización
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200">
        {isLoading ? (
          <div className="h-64"><LoadingSpinner /></div>
        ) : automaciones.length === 0 ? (
          <div className="px-4 py-16 text-center">
            <div className="text-5xl mb-3">⚡</div>
            <p className="text-slate-600 font-medium">Sin automatizaciones aun</p>
            <p className="text-sm text-slate-400 mt-1">
              Crea tu primera automatización para enviar mensajes automáticos a tus clientes
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {automaciones.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-4 px-4 py-4"
              >
                {/* Toggle */}
                <button
                  onClick={() => toggle(a.id)}
                  className={`relative w-10 h-5 rounded-full transition-colors shrink-0 ${
                    a.activa ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                      a.activa ? 'translate-x-5' : 'translate-x-0.5'
                    }`}
                  />
                </button>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-medium text-slate-800 truncate">{a.nombre}</p>
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                        TRIGGER_COLORS[a.trigger] ?? 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {TRIGGER_LABELS[a.trigger] ?? a.trigger}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {a.pasos.length} paso{a.pasos.length !== 1 ? 's' : ''}
                    {' · '}
                    {a.activa ? (
                      <span className="text-green-600 font-medium">Activa</span>
                    ) : (
                      <span className="text-slate-400">Inactiva</span>
                    )}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleEdit(a)}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium px-2 py-1 rounded hover:bg-indigo-50 transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(a)}
                    className="text-sm text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {modalOpen && (
        <AutomacionModal
          automacion={editing}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
