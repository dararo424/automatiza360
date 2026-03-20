import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCampañas, createCampaña, enviarCampaña, type Campaña } from '../../api/campañas';

const STATUS_COLORS: Record<string, string> = {
  BORRADOR: 'bg-slate-600 text-slate-200',
  ENVIANDO: 'bg-yellow-700 text-yellow-200',
  ENVIADA: 'bg-green-700 text-green-200',
  ERROR: 'bg-red-700 text-red-200',
};

const STATUS_LABELS: Record<string, string> = {
  BORRADOR: 'Borrador',
  ENVIANDO: 'Enviando...',
  ENVIADA: 'Enviada',
  ERROR: 'Error',
};

const MAX_CHARS = 1000;

function NuevaCampañaModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');

  const mutation = useMutation({
    mutationFn: () => createCampaña({ nombre, mensaje }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campañas'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg">
        <h2 className="text-white font-bold text-lg mb-4">Nueva Campaña</h2>
        <div className="space-y-3">
          <input
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Nombre de la campaña *"
            className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm"
          />
          <div>
            <textarea
              value={mensaje}
              onChange={(e) => setMensaje(e.target.value.slice(0, MAX_CHARS))}
              placeholder="Mensaje a enviar por WhatsApp *"
              rows={5}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm resize-none"
            />
            <p className="text-right text-xs text-slate-500 mt-1">{mensaje.length}/{MAX_CHARS}</p>
          </div>
        </div>
        <div className="flex gap-3 mt-4">
          <button
            onClick={() => mutation.mutate()}
            disabled={!nombre || !mensaje || mutation.isPending}
            className="flex-1 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold py-2 rounded-lg text-sm transition-colors"
          >
            {mutation.isPending ? 'Guardando...' : 'Guardar borrador'}
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

export function CampañasPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);

  const { data: campañas = [], isLoading } = useQuery({
    queryKey: ['campañas'],
    queryFn: getCampañas,
  });

  const enviarMutation = useMutation({
    mutationFn: (id: string) => enviarCampaña(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campañas'] }),
  });

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      {showModal && <NuevaCampañaModal onClose={() => setShowModal(false)} />}

      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-white">Campañas de WhatsApp</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          + Nueva Campaña
        </button>
      </div>

      <p className="text-slate-400 text-sm mb-6">
        Envía mensajes masivos por WhatsApp a todos tus contactos.
      </p>

      {isLoading ? (
        <div className="text-slate-400">Cargando campañas...</div>
      ) : campañas.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <p className="text-4xl mb-3">📢</p>
          <p>No hay campañas aún. Crea tu primera campaña.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {campañas.map((c: Campaña) => (
            <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="text-white font-semibold">{c.nombre}</p>
                  <p className="text-slate-400 text-xs mt-0.5">
                    {new Date(c.createdAt).toLocaleDateString('es-CO')}
                    {c.enviadaAt && ` · Enviada: ${new Date(c.enviadaAt).toLocaleDateString('es-CO')}`}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[c.status] ?? 'bg-slate-600 text-slate-200'}`}>
                  {STATUS_LABELS[c.status] ?? c.status}
                </span>
              </div>
              <p className="text-slate-300 text-sm bg-slate-900/50 rounded p-2 mb-3 whitespace-pre-wrap line-clamp-3">{c.mensaje}</p>
              <div className="flex items-center justify-between">
                <p className="text-slate-500 text-xs">
                  {c.totalEnviado > 0 ? `${c.totalEnviado} mensajes enviados` : 'Sin envíos'}
                </p>
                {c.status === 'BORRADOR' || c.status === 'ERROR' ? (
                  <button
                    onClick={() => {
                      if (confirm(`¿Enviar la campaña "${c.nombre}" a todos los contactos?`)) {
                        enviarMutation.mutate(c.id);
                      }
                    }}
                    disabled={enviarMutation.isPending}
                    className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {enviarMutation.isPending ? 'Enviando...' : 'Enviar campaña'}
                  </button>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
