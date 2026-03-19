import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getConversaciones,
  getConversacion,
  marcarLeida,
  escalarConversacion,
  type Conversation,
  type Message,
} from '../../api/conversaciones';

function formatTime(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(iso?: string) {
  if (!iso) return '';
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return formatTime(iso);
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
}

export function ConversacionesPage() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string | null>(null);

  const { data: conversaciones = [], isLoading } = useQuery({
    queryKey: ['conversaciones'],
    queryFn: getConversaciones,
    refetchInterval: 15_000,
  });

  const { data: detalle } = useQuery({
    queryKey: ['conversacion', selected],
    queryFn: () => getConversacion(selected!),
    enabled: !!selected,
    refetchInterval: 10_000,
  });

  const leerMutation = useMutation({
    mutationFn: (id: string) => marcarLeida(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversaciones'] }),
  });

  const escalarMutation = useMutation({
    mutationFn: (id: string) => escalarConversacion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversaciones'] }),
  });

  function handleSelect(conv: Conversation) {
    setSelected(conv.id);
    if (conv.unreadCount > 0) leerMutation.mutate(conv.id);
  }

  const selectedConv = conversaciones.find((c) => c.id === selected);

  return (
    <div className="flex h-full">
      {/* Lista conversaciones */}
      <div className={`${selected ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 border-r border-slate-700 bg-slate-900`}>
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-lg font-bold text-white">Conversaciones</h1>
        </div>
        {isLoading ? (
          <div className="p-4 text-slate-400 text-sm">Cargando...</div>
        ) : conversaciones.length === 0 ? (
          <div className="p-4 text-slate-500 text-sm text-center">No hay conversaciones aún</div>
        ) : (
          <div className="flex-1 overflow-y-auto divide-y divide-slate-700/50">
            {conversaciones.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors ${
                  selected === c.id ? 'bg-slate-800' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <p className="text-white font-medium text-sm truncate">
                        {c.clientName || c.clientPhone}
                      </p>
                      {c.needsAttention && (
                        <span className="shrink-0 w-2 h-2 rounded-full bg-red-500" title="Necesita atención" />
                      )}
                    </div>
                    <p className="text-slate-500 text-xs truncate mt-0.5">{c.lastMessage || '—'}</p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-slate-500 text-xs">{formatDate(c.lastMessageAt)}</span>
                    {c.unreadCount > 0 && (
                      <span className="bg-green-500 text-white text-xs font-bold rounded-full h-5 min-w-5 flex items-center justify-center px-1">
                        {c.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Detalle conversación */}
      {selected ? (
        <div className={`${selected ? 'flex' : 'hidden md:flex'} flex-col flex-1 min-w-0`}>
          <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700 bg-slate-900">
            <button
              onClick={() => setSelected(null)}
              className="md:hidden text-slate-400 hover:text-white text-sm"
            >
              ←
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-white font-semibold">
                {detalle?.clientName || detalle?.clientPhone}
              </p>
              <p className="text-slate-400 text-xs">{detalle?.clientPhone}</p>
            </div>
            {selectedConv && !selectedConv.needsAttention && (
              <button
                onClick={() => escalarMutation.mutate(selected)}
                disabled={escalarMutation.isPending}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white text-xs font-medium rounded-lg transition-colors shrink-0"
              >
                ⚡ Escalar
              </button>
            )}
            {selectedConv?.needsAttention && (
              <span className="px-2.5 py-1 bg-red-900/50 text-red-400 text-xs font-medium rounded-lg border border-red-700 shrink-0">
                Escalado
              </span>
            )}
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {detalle?.messages.map((m: Message) => (
              <div
                key={m.id}
                className={`flex ${m.direction === 'OUTBOUND' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl text-sm ${
                    m.direction === 'OUTBOUND'
                      ? 'bg-green-600 text-white rounded-br-sm'
                      : 'bg-slate-700 text-slate-100 rounded-bl-sm'
                  }`}
                >
                  <p>{m.body}</p>
                  <p className={`text-xs mt-1 ${m.direction === 'OUTBOUND' ? 'text-green-200' : 'text-slate-400'}`}>
                    {formatTime(m.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="hidden md:flex flex-col flex-1 items-center justify-center text-slate-500">
          <p className="text-4xl mb-2">💬</p>
          <p>Selecciona una conversación</p>
        </div>
      )}
    </div>
  );
}
