import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getCampañas, createCampaña, enviarCampaña, previewCampaña, type Campaña, type FiltrosCampaña } from '../../api/campañas';
import { usePlanFeatures } from '../../hooks/usePlanFeatures';
import { UpgradePrompt } from '../../components/common/UpgradePrompt';

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

function buildFiltros(state: {
  usarTags: boolean; tagsInput: string;
  usarPuntos: boolean; minPuntos: string;
  usarSinComprar: boolean; diasSinComprar: string;
  usarConComprar: boolean; diasConComprar: string;
}): FiltrosCampaña | undefined {
  const f: FiltrosCampaña = {};
  let hasFilter = false;

  if (state.usarTags && state.tagsInput.trim()) {
    f.tags = state.tagsInput.split(',').map((t) => t.trim()).filter(Boolean);
    if (f.tags.length) hasFilter = true;
  }
  if (state.usarPuntos && Number(state.minPuntos) > 0) {
    f.minPuntos = Number(state.minPuntos);
    hasFilter = true;
  }
  if (state.usarSinComprar && Number(state.diasSinComprar) > 0) {
    f.diasSinComprar = Number(state.diasSinComprar);
    hasFilter = true;
  }
  if (state.usarConComprar && Number(state.diasConComprar) > 0) {
    f.diasDesdeUltimaCompra = Number(state.diasConComprar);
    hasFilter = true;
  }

  return hasFilter ? f : undefined;
}

function NuevaCampañaModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [nombre, setNombre] = useState('');
  const [mensaje, setMensaje] = useState('');

  // Segmentation state
  const [usarTags, setUsarTags] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [usarPuntos, setUsarPuntos] = useState(false);
  const [minPuntos, setMinPuntos] = useState('');
  const [usarSinComprar, setUsarSinComprar] = useState(false);
  const [diasSinComprar, setDiasSinComprar] = useState('30');
  const [usarConComprar, setUsarConComprar] = useState(false);
  const [diasConComprar, setDiasConComprar] = useState('30');

  const filtros = buildFiltros({ usarTags, tagsInput, usarPuntos, minPuntos, usarSinComprar, diasSinComprar, usarConComprar, diasConComprar });

  const { data: preview } = useQuery({
    queryKey: ['campaña-preview', filtros],
    queryFn: () => previewCampaña(filtros),
    staleTime: 5000,
  });

  const mutation = useMutation({
    mutationFn: () => createCampaña({ nombre, mensaje, filtros }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campañas'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-slate-800 rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-white font-bold text-lg mb-4">Nueva Campaña</h2>

        <div className="space-y-3 mb-5">
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
              rows={4}
              className="w-full bg-slate-700 text-white px-3 py-2 rounded-lg border border-slate-600 focus:outline-none text-sm resize-none"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-slate-500">
                Usa <code className="bg-slate-700 px-1 rounded text-indigo-400">{'{nombre}'}</code> para personalizar con el nombre del contacto
              </p>
              <p className="text-xs text-slate-500">{mensaje.length}/{MAX_CHARS}</p>
            </div>
          </div>
        </div>

        {/* Segmentation */}
        <div className="border border-slate-700 rounded-lg p-4 mb-5">
          <p className="text-slate-300 text-sm font-semibold mb-3">Segmentación de audiencia</p>
          <p className="text-slate-500 text-xs mb-4">
            Sin filtros = todos los contactos. Con filtros = solo los que cumplen los criterios.
          </p>

          {/* Tags */}
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-1 cursor-pointer">
              <input type="checkbox" checked={usarTags} onChange={(e) => setUsarTags(e.target.checked)} className="accent-indigo-500" />
              Filtrar por etiqueta (tag)
            </label>
            {usarTags && (
              <input
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="vip, frecuente, zona-norte (separados por coma)"
                className="w-full bg-slate-700 text-white px-3 py-1.5 rounded-lg border border-slate-600 focus:outline-none text-xs mt-1"
              />
            )}
          </div>

          {/* Min puntos */}
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-1 cursor-pointer">
              <input type="checkbox" checked={usarPuntos} onChange={(e) => setUsarPuntos(e.target.checked)} className="accent-indigo-500" />
              Filtrar por puntos de fidelización
            </label>
            {usarPuntos && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Al menos</span>
                <input
                  type="number"
                  value={minPuntos}
                  onChange={(e) => setMinPuntos(e.target.value)}
                  min={1}
                  className="w-20 bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 text-xs"
                />
                <span className="text-xs text-slate-400">puntos</span>
              </div>
            )}
          </div>

          {/* Sin comprar en N días (re-engagement) */}
          <div className="mb-3">
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-1 cursor-pointer">
              <input type="checkbox" checked={usarSinComprar} onChange={(e) => setUsarSinComprar(e.target.checked)} className="accent-indigo-500" />
              Clientes inactivos (sin comprar en)
            </label>
            {usarSinComprar && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Sin compras en últimos</span>
                <input
                  type="number"
                  value={diasSinComprar}
                  onChange={(e) => setDiasSinComprar(e.target.value)}
                  min={1}
                  className="w-16 bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 text-xs"
                />
                <span className="text-xs text-slate-400">días</span>
              </div>
            )}
          </div>

          {/* Con compra reciente (loyal) */}
          <div className="mb-4">
            <label className="flex items-center gap-2 text-sm text-slate-300 mb-1 cursor-pointer">
              <input type="checkbox" checked={usarConComprar} onChange={(e) => setUsarConComprar(e.target.checked)} className="accent-indigo-500" />
              Clientes activos (compraron recientemente)
            </label>
            {usarConComprar && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-slate-400">Con compras en últimos</span>
                <input
                  type="number"
                  value={diasConComprar}
                  onChange={(e) => setDiasConComprar(e.target.value)}
                  min={1}
                  className="w-16 bg-slate-700 text-white px-2 py-1 rounded border border-slate-600 text-xs"
                />
                <span className="text-xs text-slate-400">días</span>
              </div>
            )}
          </div>

          {/* Preview count */}
          <div className={`rounded-lg px-3 py-2 text-sm font-semibold text-center ${preview !== undefined ? 'bg-indigo-900/40 text-indigo-300' : 'bg-slate-700 text-slate-400'}`}>
            {preview !== undefined
              ? `📊 Esta campaña llegaría a ${preview.total} contacto${preview.total !== 1 ? 's' : ''}`
              : 'Calculando alcance...'}
          </div>
        </div>

        <div className="flex gap-3">
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

function filtrosLabel(filtros?: FiltrosCampaña | null): string | null {
  if (!filtros) return null;
  const parts: string[] = [];
  if (filtros.tags?.length) parts.push(`Tags: ${filtros.tags.join(', ')}`);
  if (filtros.minPuntos) parts.push(`≥${filtros.minPuntos} puntos`);
  if (filtros.diasSinComprar) parts.push(`Inactivos +${filtros.diasSinComprar}d`);
  if (filtros.diasDesdeUltimaCompra) parts.push(`Activos -${filtros.diasDesdeUltimaCompra}d`);
  return parts.length ? parts.join(' · ') : null;
}

export function CampañasPage() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const { canUseCampanas, agentLimit, isLoading: planLoading } = usePlanFeatures();

  const { data: campañas = [], isLoading } = useQuery({
    queryKey: ['campañas'],
    queryFn: getCampañas,
  });

  const enviarMutation = useMutation({
    mutationFn: (id: string) => enviarCampaña(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['campañas'] }),
  });

  if (!planLoading && !canUseCampanas) {
    return (
      <UpgradePrompt
        feature="Campañas masivas de WhatsApp"
        requiredPlan="PRO"
        description="Envía mensajes segmentados a todos tus contactos con personalización y filtros avanzados."
      />
    );
  }

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
        Envía mensajes segmentados por WhatsApp. Usa etiquetas, puntos o historial de compras para llegar a la audiencia correcta.
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
          {campañas.map((c: Campaña) => {
            const label = filtrosLabel(c.filtros);
            return (
              <div key={c.id} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <p className="text-white font-semibold">{c.nombre}</p>
                    <p className="text-slate-400 text-xs mt-0.5">
                      {new Date(c.createdAt).toLocaleDateString('es-CO')}
                      {c.enviadaAt && ` · Enviada: ${new Date(c.enviadaAt).toLocaleDateString('es-CO')}`}
                    </p>
                    {label && (
                      <p className="text-indigo-400 text-xs mt-1">🎯 {label}</p>
                    )}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap ${STATUS_COLORS[c.status] ?? 'bg-slate-600 text-slate-200'}`}>
                    {STATUS_LABELS[c.status] ?? c.status}
                  </span>
                </div>
                <p className="text-slate-300 text-sm bg-slate-900/50 rounded p-2 mb-3 whitespace-pre-wrap line-clamp-3">{c.mensaje}</p>
                <div className="flex items-center justify-between">
                  <p className="text-slate-500 text-xs">
                    {c.totalEnviado > 0 ? `${c.totalEnviado} mensajes enviados` : 'Sin envíos'}
                  </p>
                  {(c.status === 'BORRADOR' || c.status === 'ERROR') && (
                    <button
                      onClick={() => {
                        if (confirm(`¿Enviar la campaña "${c.nombre}"?`)) {
                          enviarMutation.mutate(c.id);
                        }
                      }}
                      disabled={enviarMutation.isPending}
                      className="bg-green-700 hover:bg-green-600 disabled:opacity-50 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                    >
                      {enviarMutation.isPending ? 'Enviando...' : 'Enviar campaña'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
