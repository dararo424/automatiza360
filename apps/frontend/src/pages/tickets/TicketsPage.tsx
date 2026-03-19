import { useState, type FormEvent } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTickets, crearTicket, actualizarTicket, cambiarEstadoTicket } from '../../api/tickets';
import { Badge } from '../../components/ui/Badge';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import type { Ticket, TicketStatus } from '../../types';

const ESTADOS: { value: TicketStatus | ''; label: string }[] = [
  { value: '', label: 'Todos los estados' },
  { value: 'RECEIVED', label: 'Recibido' },
  { value: 'DIAGNOSING', label: 'Diagnóstico' },
  { value: 'WAITING_PARTS', label: 'Esperando partes' },
  { value: 'REPAIRING', label: 'Reparando' },
  { value: 'READY', label: 'Listo' },
  { value: 'DELIVERED', label: 'Entregado' },
  { value: 'CANCELLED', label: 'Cancelado' },
];

function TicketModal({ ticket, onClose }: { ticket: Ticket; onClose: () => void }) {
  const qc = useQueryClient();
  const [diagnosis, setDiagnosis] = useState(ticket.diagnosis ?? '');
  const [price, setPrice] = useState(ticket.price?.toString() ?? '');

  const { mutate: actualizar, isPending: actualizando } = useMutation({
    mutationFn: () =>
      actualizarTicket(ticket.id, {
        diagnosis: diagnosis || undefined,
        price: price ? Number(price) : undefined,
      }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['tickets'] }),
  });

  const { mutate: cambiarEstado, isPending: cambiando } = useMutation({
    mutationFn: (estado: TicketStatus) => cambiarEstadoTicket(ticket.id, estado),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-slate-800">Ticket #{ticket.number}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm mb-4">
          <div><span className="text-slate-500">Cliente:</span> <span className="font-medium">{ticket.clientName}</span></div>
          <div><span className="text-slate-500">Teléfono:</span> <span>{ticket.clientPhone}</span></div>
          <div><span className="text-slate-500">Dispositivo:</span> <span className="font-medium">{ticket.device}</span></div>
          <div><span className="text-slate-500">Estado:</span> <Badge status={ticket.status} type="ticket" /></div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3 mb-4">
          <p className="text-xs font-medium text-slate-500 mb-1">Problema reportado</p>
          <p className="text-sm text-slate-700">{ticket.issue}</p>
        </div>

        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Diagnóstico</label>
            <textarea
              value={diagnosis}
              onChange={(e) => setDiagnosis(e.target.value)}
              rows={3}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none"
              placeholder="Escribe el diagnóstico..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Precio de reparación</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 border-t border-slate-200 pt-4">
          <select
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
            defaultValue={ticket.status}
            onChange={(e) => cambiarEstado(e.target.value as TicketStatus)}
            disabled={cambiando}
          >
            {ESTADOS.filter((e) => e.value !== '').map((e) => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
          <button
            onClick={() => actualizar()}
            disabled={actualizando}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium"
          >
            {actualizando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NuevoTicketForm({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({ clientName: '', clientPhone: '', device: '', issue: '' });

  const { mutate, isPending, error } = useMutation({
    mutationFn: () => crearTicket(form),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['tickets'] });
      onClose();
    },
  });

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    mutate();
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-semibold text-slate-800">Nuevo Ticket</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
        </div>
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded p-3 mb-4 text-sm">
            Error al crear el ticket
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente *</label>
              <input required value={form.clientName} onChange={(e) => setForm({ ...form, clientName: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Teléfono *</label>
              <input required value={form.clientPhone} onChange={(e) => setForm({ ...form, clientPhone: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Dispositivo *</label>
            <input required value={form.device} onChange={(e) => setForm({ ...form, device: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm" placeholder="Ej: iPhone 14 Pro" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Problema *</label>
            <textarea required value={form.issue} onChange={(e) => setForm({ ...form, issue: e.target.value })} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none" placeholder="Describe el problema..." />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-slate-600 hover:text-slate-800">Cancelar</button>
            <button type="submit" disabled={isPending} className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg text-sm font-medium">
              {isPending ? 'Guardando...' : 'Crear Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

async function downloadCsv(url: string, filename: string) {
  const token = localStorage.getItem('token');
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const blob = await resp.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

export function TicketsPage() {
  const [estado, setEstado] = useState<TicketStatus | ''>('');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data: tickets = [], isLoading } = useQuery({
    queryKey: ['tickets', estado],
    queryFn: () => getTickets(estado || undefined),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <select
          value={estado}
          onChange={(e) => setEstado(e.target.value as TicketStatus | '')}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white"
        >
          {ESTADOS.map((e) => (
            <option key={e.value} value={e.value}>{e.label}</option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <button
            onClick={() => downloadCsv(`${API_BASE}/tickets/exportar`, 'tickets.csv')}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-sm rounded-lg transition-colors"
          >
            ⬇ Exportar CSV
          </button>
          <button
            onClick={() => setShowForm(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Nuevo Ticket
          </button>
        </div>
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
                  <th className="px-4 py-3 font-medium">Teléfono</th>
                  <th className="px-4 py-3 font-medium">Dispositivo</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {tickets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">No hay tickets</td>
                  </tr>
                ) : (
                  tickets.map((t) => (
                    <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer" onClick={() => setSelected(t)}>
                      <td className="px-4 py-3 font-mono font-medium">#{t.number}</td>
                      <td className="px-4 py-3 font-medium">{t.clientName}</td>
                      <td className="px-4 py-3 text-slate-600">{t.clientPhone}</td>
                      <td className="px-4 py-3 text-slate-600">{t.device}</td>
                      <td className="px-4 py-3"><Badge status={t.status} type="ticket" /></td>
                      <td className="px-4 py-3 text-slate-500">{new Date(t.createdAt).toLocaleDateString('es')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selected && <TicketModal ticket={selected} onClose={() => setSelected(null)} />}
      {showForm && <NuevoTicketForm onClose={() => setShowForm(false)} />}
    </div>
  );
}
